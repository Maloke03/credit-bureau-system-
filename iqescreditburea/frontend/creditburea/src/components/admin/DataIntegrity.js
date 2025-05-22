import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../css/DataIntegrity.css';

const DataIntegrity = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [creditScores, setCreditScores] = useState([]);
  const [defaultRates, setDefaultRates] = useState([]);
  const [loanDistribution, setLoanDistribution] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Fetch Reports Data
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [scoresRes, defaultRes, distRes] = await Promise.all([
          axios.get('http://localhost:5000/api/reports/credit-score-by-region', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/reports/loan-default-rates', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get('http://localhost:5000/api/reports/loan-amount-distribution', {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setCreditScores(scoresRes.data.data);
        setDefaultRates(defaultRes.data.data);
        setLoanDistribution(distRes.data.data);
      } catch (err) {
        setError('Failed to fetch reports data');
        console.error(err);
      }
    };

    const fetchFraudAlerts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/fraud-alerts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFraudAlerts(res.data.alerts);
      } catch (err) {
        setError('Failed to fetch fraud alerts');
        console.error(err);
      }
    };

    if (activeTab === 'reports') {
      fetchReports();
    } else {
      fetchFraudAlerts();
    }
  }, [activeTab, token]);

  // Generate Fraud Alerts
  const generateFraudAlerts = async () => {
    try {
      const res = await axios.post(
        'http://localhost:5000/api/fraud-alerts/generate',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFraudAlerts(res.data.alerts);
    } catch (err) {
      setError('Failed to generate fraud alerts');
      console.error(err);
    }
  };

  // Update Fraud Alert Status
  const updateAlertStatus = async (id, status) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/fraud-alerts/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFraudAlerts(fraudAlerts.map(alert => (alert._id === id ? res.data.alert : alert)));
    } catch (err) {
      setError('Failed to update fraud alert');
      console.error(err);
    }
  };

  // Export Reports as CSV
  const exportToCSV = () => {
    const csvContent = [
      'Average Credit Score by Region\nRegion,Average Score,Count',
      ...creditScores.map(item => `${item._id},${item.averageScore.toFixed(2)},${item.count}`),
      '\nLoan Default Rates Over Time\nPeriod,Default Rate (%)',
      ...defaultRates.map(item => `${item.period},${item.defaultRate.toFixed(2)}`),
      '\nLoan Amount Distribution by Status\nStatus,Total Amount,Count',
      ...loanDistribution.map(item => `${item._id},${item.totalAmount},${item.count}`),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'credit_bureau_reports.csv';
    link.click();
  };

  // Export Reports as PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Credit Bureau Reports', 10, 10);

    // Credit Scores
    doc.autoTable({
      startY: 20,
      head: [['Region', 'Average Score', 'Count']],
      body: creditScores.map(item => [item._id, item.averageScore.toFixed(2), item.count]),
    });

    // Default Rates
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Period', 'Default Rate (%)']],
      body: defaultRates.map(item => [item.period, item.defaultRate.toFixed(2)]),
    });

    // Loan Distribution
    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Status', 'Total Amount', 'Count']],
      body: loanDistribution.map(item => [item._id, item.totalAmount, item.count]),
    });

    doc.save('credit_bureau_reports.pdf');
  };

  // Pie Chart Colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Custom Tooltip for PieChart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = loanDistribution.reduce((sum, item) => sum + item.totalAmount, 0);
      const percentage = ((data.totalAmount / total) * 100).toFixed(1);
      return (
        <div className="custom-tooltip">
          <p><strong>Status:</strong> {data._id}</p>
          <p><strong>Total Amount:</strong> ${data.totalAmount.toLocaleString()}</p>
          <p><strong>Loans:</strong> {data.count}</p>
          <p><strong>Percentage:</strong> {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  // Calculate total for percentages
  const totalAmount = loanDistribution.reduce((sum, item) => sum + item.totalAmount, 0);

  return (
    <div className="data-integrity-container">
      <button className="back-button" onClick={() => navigate('/admin-dashboard')}>
        ← Back to Dashboard
      </button>
      <h1>Data Integrity and Validation</h1>
      <div className="tab-container">
        <button
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports & Analytics
        </button>
        <button
          className={`tab-button ${activeTab === 'fraud' ? 'active' : ''}`}
          onClick={() => setActiveTab('fraud')}
        >
          Fraud Detection
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {activeTab === 'reports' && (
        <div>
          <div className="export-buttons">
            <button onClick={exportToCSV}>Export as CSV</button>
            <button onClick={exportToPDF}>Export as PDF</button>
          </div>
          <div className="chart-container">
            <h3>Average Credit Score by Region</h3>
            <BarChart
              width={600}
              height={300}
              data={creditScores}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageScore" fill="#8884d8" />
            </BarChart>
          </div>
          <div className="chart-container">
            <h3>Loan Default Rates Over Time</h3>
            <LineChart
              width={600}
              height={300}
              data={defaultRates}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="defaultRate" stroke="#82ca9d" />
            </LineChart>
          </div>
          <div className="chart-container">
            <h3>Loan Amount Distribution by Status</h3>
            <p className="chart-description">
              This chart shows the distribution of total loan amounts across different application statuses (Pending, Approved, Rejected, Repaid).
            </p>
            <PieChart width={500} height={400}>
              <Pie
                data={loanDistribution}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ _id, totalAmount }) => {
                  const percentage = ((totalAmount / totalAmount) * 100).toFixed(1);
                  return `${_id}: ${percentage}%`;
                }}
                outerRadius={120}
                dataKey="totalAmount"
                nameKey="_id"
              >
                {loanDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Total Amount</th>
                  <th>Loan Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {loanDistribution.length === 0 ? (
                  <tr>
                    <td colSpan="4">No data available</td>
                  </tr>
                ) : (
                  loanDistribution.map(item => (
                    <tr key={item._id}>
                      <td>{item._id}</td>
                      <td>${item.totalAmount.toLocaleString()}</td>
                      <td>{item.count}</td>
                      <td>{((item.totalAmount / totalAmount) * 100).toFixed(1)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'fraud' && (
        <div>
          <button onClick={generateFraudAlerts} style={{ marginBottom: '20px' }}>
            Generate Fraud Alerts
          </button>
          <table className="fraud-table">
            <thead>
              <tr>
                <th>Consumer Name</th>
                <th>Alert Type</th>
                <th>Details</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fraudAlerts.length === 0 ? (
                <tr>
                  <td colSpan="6">No fraud alerts found</td>
                </tr>
              ) : (
                fraudAlerts.map(alert => (
                  <tr key={alert._id}>
                    <td>{alert.userId?.name || 'N/A'}</td>
                    <td>{alert.alertType}</td>
                    <td>{alert.details}</td>
                    <td>{alert.severity}</td>
                    <td>{alert.status}</td>
                    <td>
                      {alert.status === 'open' && (
                        <>
                          <button
                            className="resolve-btn"
                            onClick={() => updateAlertStatus(alert._id, 'resolved')}
                          >
                            Resolve
                          </button>
                          <button
                            className="escalate-btn"
                            onClick={() => updateAlertStatus(alert._id, 'escalated')}
                          >
                            Escalate
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataIntegrity;