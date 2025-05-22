// src/components/pages/LenderReports.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import '../css/LenderReports.css';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.config.url);
    return Promise.reject(error);
  }
);

function LenderReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [purposeFilter, setPurposeFilter] = useState('');
  const [successRateFilter, setSuccessRateFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [customReportMetrics, setCustomReportMetrics] = useState({
    totalDisbursed: true,
    totalRepaid: true,
    successRate: true,
    activeLoans: true,
    totalLoans: true,
    loanPurposeCounts: true,
    monthlyDisbursement: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token || role !== 'lender') {
      navigate('/login');
      return;
    }

    fetchReports();
  }, [navigate]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      const response = await api.get('/api/lender/reports', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateFilter.start,
          endDate: dateFilter.end,
          purpose: purposeFilter,
          minSuccessRate: successRateFilter || undefined,
        },
      });
      setReports(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(`Failed to load reports: ${err.response?.data?.message || err.message}`);
      setReports({
        totalDisbursed: 0,
        totalRepaid: 0,
        successRate: 0,
        activeLoans: 0,
        loanPurposeCounts: {},
        monthlyDisbursement: {},
        totalLoans: 0,
      });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // Filter reports
  const filteredReports = useMemo(() => {
    if (!reports) return reports;
    let result = { ...reports };

    if (purposeFilter) {
      result.loanPurposeCounts = Object.fromEntries(
        Object.entries(result.loanPurposeCounts).filter(([purpose]) =>
          purpose.toLowerCase().includes(purposeFilter.toLowerCase())
        )
      );
    }

    return result;
  }, [reports, purposeFilter]);

  // Chart data
  const purposeChartData = {
    labels: Object.keys(filteredReports?.loanPurposeCounts || {}),
    datasets: [
      {
        data: Object.values(filteredReports?.loanPurposeCounts || {}),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'],
      },
    ],
  };

  const monthlyDisbursementChartData = {
    labels: Object.keys(filteredReports?.monthlyDisbursement || {}).sort(),
    datasets: [
      {
        label: 'Disbursement ($)',
        data: Object.values(filteredReports?.monthlyDisbursement || {}),
        backgroundColor: '#36A2EB',
      },
    ],
  };

  // Handle filters
  const handleDateChange = (e) => {
    setDateFilter({ ...dateFilter, [e.target.name]: e.target.value });
  };

  const handlePurposeChange = (e) => {
    setPurposeFilter(e.target.value);
  };

  const handleSuccessRateChange = (e) => {
    setSuccessRateFilter(e.target.value);
  };

  const applyFilters = () => {
    fetchReports();
    showToast('Filters applied successfully', 'success');
  };

  // Export reports
  const exportReports = (format) => {
    if (!filteredReports) {
      showToast('No data to export', 'error');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    if (format === 'csv') {
      const headers = [
        'Total Disbursed',
        'Total Repaid',
        'Success Rate',
        'Active Loans',
        'Total Loans',
      ];
      const rows = [
        [
          filteredReports.totalDisbursed.toLocaleString(),
          filteredReports.totalRepaid.toLocaleString(),
          filteredReports.successRate,
          filteredReports.activeLoans,
          filteredReports.totalLoans,
        ],
      ];

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `lender-reports_${timestamp}.csv`;
      link.click();
      showToast('Reports exported as CSV', 'success');
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(filteredReports, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `lender-reports_${timestamp}.json`;
      link.click();
      showToast('Reports exported as JSON', 'success');
    }
  };

  // Custom report generation
  const handleCustomReportChange = (metric) => {
    setCustomReportMetrics((prev) => ({ ...prev, [metric]: !prev[metric] }));
  };

  const generateCustomReport = () => {
    const selectedMetrics = Object.entries(customReportMetrics)
      .filter(([_, selected]) => selected)
      .map(([metric]) => metric);
    if (selectedMetrics.length === 0) {
      showToast('Please select at least one metric', 'error');
      return;
    }

    const customReport = {};
    selectedMetrics.forEach((metric) => {
      customReport[metric] = filteredReports[metric];
    });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonContent = JSON.stringify(customReport, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `custom-report_${timestamp}.json`;
    link.click();
    showToast('Custom report generated', 'success');
  };

  // Show toast notification
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Open modal for detailed view
  const openModal = (type, data) => {
    setModalContent({ type, data });
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="lender-dashboard-container lender-reports">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lender-dashboard-container lender-reports">
        <div className="error-message">
          <p>{error}</p>
          <div className="error-actions">
            <button className="retry-button" onClick={fetchReports}>
              Retry
            </button>
            <button className="logout-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lender-dashboard-container lender-reports">
      <main className="dashboard-content">
        <div className="header">
          <h1>Reports & Analytics</h1>
          <button
            className="back-button"
            onClick={() => {
              console.log('Navigating to /lender-dashboard');
              navigate('/lender-dashboard');
            }}
            aria-label="Back to lender dashboard"
          >
            Back to Dashboard
          </button>
        </div>
        <p>Analyze your lending performance.</p>

        <div className="controls">
          <div className="filters">
            <div className="date-filter">
              <input
                type="date"
                name="start"
                value={dateFilter.start}
                onChange={handleDateChange}
              />
              <input
                type="date"
                name="end"
                value={dateFilter.end}
                onChange={handleDateChange}
              />
            </div>
            <input
              type="text"
              placeholder="Loan Purpose"
              value={purposeFilter}
              onChange={handlePurposeChange}
            />
            <input
              type="number"
              placeholder="Min Success Rate"
              value={successRateFilter}
              onChange={handleSuccessRateChange}
              min="0"
              max="100"
            />
            <button className="apply-filters-button" onClick={applyFilters}>
              Apply Filters
            </button>
          </div>
          <div className="export-buttons">
            <button className="export-button" onClick={() => exportReports('csv')}>
              Export CSV
            </button>
            <button className="export-button" onClick={() => exportReports('json')}>
              Export JSON
            </button>
          </div>
        </div>

        <div className="dashboard-cards">
          <div className="card">
            <h3>Loan Metrics</h3>
            <p>
              Total Disbursed:{' '}
              <span
                className="clickable"
                onClick={() =>
                  openModal('totalDisbursed', { value: filteredReports.totalDisbursed })
                }
              >
                ${filteredReports.totalDisbursed.toLocaleString()}
              </span>
            </p>
            <p>Total Repaid: ${filteredReports.totalRepaid.toLocaleString()}</p>
            <p>Success Rate: {filteredReports.successRate}%</p>
            <p>
              Active Loans:{' '}
              <span
                className="clickable"
                onClick={() =>
                  openModal('activeLoans', { value: filteredReports.activeLoans })
                }
              >
                {filteredReports.activeLoans}
              </span>
            </p>
            <p>Total Loans: {filteredReports.totalLoans}</p>
          </div>
          <div className="card">
            <h3>Loan Purposes</h3>
            <Pie
              data={purposeChartData}
              options={{
                plugins: { legend: { position: 'bottom' } },
                onClick: (e, elements) => {
                  if (elements.length) {
                    const index = elements[0].index;
                    const purpose = purposeChartData.labels[index];
                    openModal('loanPurpose', {
                      purpose,
                      count: filteredReports.loanPurposeCounts[purpose],
                    });
                  }
                },
              }}
            />
          </div>
          <div className="card">
            <h3>Monthly Disbursement</h3>
            <Bar
              data={monthlyDisbursementChartData}
              options={{
                plugins: { legend: { display: false } },
                scales: {
                  y: { beginAtZero: true, title: { display: true, text: 'Amount ($)' } },
                },
              }}
            />
          </div>
        </div>

        <div className="custom-report-section">
          <h3>Generate Custom Report</h3>
          <div className="custom-report-options">
            {Object.keys(customReportMetrics).map((metric) => (
              <label key={metric}>
                <input
                  type="checkbox"
                  checked={customReportMetrics[metric]}
                  onChange={() => handleCustomReportChange(metric)}
                />
                {metric.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </label>
            ))}
          </div>
          <button className="generate-report-button" onClick={generateCustomReport}>
            Generate Custom Report
          </button>
        </div>
      </main>

      {showModal && modalContent && (
        <div className="modal">
          <div className="modal-content">
            <h2>
              {modalContent.type.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            </h2>
            {modalContent.type === 'totalDisbursed' && (
              <p>Total Amount Disbursed: ${modalContent.data.value.toLocaleString()}</p>
            )}
            {modalContent.type === 'activeLoans' && (
              <p>Number of Active Loans: {modalContent.data.value}</p>
            )}
            {modalContent.type === 'loanPurpose' && (
              <>
                <p>Purpose: {modalContent.data.purpose}</p>
                <p>Number of Loans: {modalContent.data.count}</p>
              </>
            )}
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default LenderReports;