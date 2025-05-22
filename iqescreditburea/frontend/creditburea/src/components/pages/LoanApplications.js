import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import '../css/LoanApplications.css';

Chart.register(...registerables);

function LoanApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    withdrawn: 0,
    totalAmount: 0,
    avgAmount: 0,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    amountRange: [0, 100000],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activityLog, setActivityLog] = useState([]);
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'USD');
  const applicationsPerPage = 5;

  // Currency formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Save currency to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  // Fetch all loan applications from the server
  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      setLoading(true);
      const response = await fetch('http://localhost:5000/api/loan-applications', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON, got ${contentType || 'no content-type'}: ${text.slice(0, 100)}`);
      }

      const data = await response.json();
      if (response.ok) {
        const sanitizedApplications = data.applications.map((app) => ({
          ...app,
          status: ['pending', 'approved', 'rejected', 'withdrawn'].includes(app.status?.toLowerCase())
            ? app.status.toLowerCase()
            : 'pending',
        }));
        setApplications(sanitizedApplications);
        calculateStats(sanitizedApplications);
        generateActivityLog(sanitizedApplications);
      } else {
        console.error('Fetch error:', data.message);
        alert(data.message || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      alert(`Error fetching applications: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  // Check the status of a specific application on the server
  const checkApplicationStatus = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token provided');
      }

      const response = await fetch(`http://localhost:5000/api/loan-applications/${id}/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return { error: 'Unauthorized: Please log in again' };
      }

      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON, got ${contentType || 'no content-type'}: ${text.slice(0, 100)}`);
      }

      const data = await response.json();
      if (response.ok && data.success) {
        return data.status;
      } else {
        throw new Error(data.message || 'Failed to fetch application status');
      }
    } catch (error) {
      console.error('Status check error:', error.message);
      return { error: error.message };
    }
  };

  // Calculate statistics based on applications
  const calculateStats = (apps) => {
    const pending = apps.filter((app) => app.status === 'pending').length;
    const approved = apps.filter((app) => app.status === 'approved').length;
    const rejected = apps.filter((app) => app.status === 'rejected').length;
    const withdrawn = apps.filter((app) => app.status === 'withdrawn').length;
    const totalAmount = apps.reduce((sum, app) => sum + (app.amount || 0), 0);
    const avgAmount = apps.length > 0 ? totalAmount / apps.length : 0;

    setStats({
      total: apps.length,
      pending,
      approved,
      rejected,
      withdrawn,
      totalAmount,
      avgAmount: Math.round(avgAmount),
    });
  };

  // Generate activity log for recent actions
  const generateActivityLog = (apps) => {
    const sortedApps = [...apps].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    const log = sortedApps.slice(0, 5).map((app) => {
      let message = '';
      let icon = '📝';
      switch (app.status) {
        case 'approved':
          message = `${app.fullName}'s loan (${formatCurrency(app.amount)}) was approved`;
          icon = '✅';
          break;
        case 'rejected':
          message = `${app.fullName}'s loan (${formatCurrency(app.amount)}) was rejected`;
          icon = '❌';
          break;
        case 'withdrawn':
          message = `${app.fullName}'s loan (${formatCurrency(app.amount)}) was withdrawn`;
          icon = '↩️';
          break;
        default:
          message = `${app.fullName} applied for a ${formatCurrency(app.amount)} loan`;
          icon = '📋';
      }
      return {
        id: app._id,
        icon,
        message,
        time: new Date(app.updatedAt).toLocaleString(),
      };
    });
    setActivityLog(log);
  };

  // Approve an application
  const approveApplication = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/loan-applications/${id}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        alert('Application approved!');
        fetchApplications();
      } else {
        alert(data.message || 'Failed to approve application');
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('Error approving application: Please try again.');
    }
  };

  // Reject an application
  const rejectApplication = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/loan-applications/${id}/reject`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        alert('Application rejected!');
        fetchApplications();
      } else {
        alert(data.message || 'Failed to reject application');
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert('Error rejecting application: Please try again.');
    }
  };

  // View application details in a modal
  const viewApplicationDetails = (id) => {
    const application = applications.find((app) => app._id === id);
    setSelectedApplication(application);
    setShowModal(true);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  // Handle amount range filter changes
  const handleAmountRangeChange = (e, index) => {
    const newRange = [...filters.amountRange];
    newRange[index] = parseInt(e.target.value);
    setFilters((prev) => ({
      ...prev,
      amountRange: newRange,
    }));
    setCurrentPage(1);
  };

  // Filter applications based on current filters
  const filteredApplications = applications.filter((app) => {
    const matchesStatus = filters.status === 'all' || app.status === filters.status;
    const matchesSearch =
      app.fullName.toLowerCase().includes(filters.search.toLowerCase()) ||
      app.purpose.toLowerCase().includes(filters.search.toLowerCase());
    const matchesAmount =
      app.amount >= filters.amountRange[0] && app.amount <= filters.amountRange[1];
    return matchesStatus && matchesSearch && matchesAmount;
  });

  // Pagination logic
  const indexOfLastApp = currentPage * applicationsPerPage;
  const indexOfFirstApp = indexOfLastApp - applicationsPerPage;
  const currentApplications = filteredApplications.slice(indexOfFirstApp, indexOfLastApp);
  const totalPages = Math.ceil(filteredApplications.length / applicationsPerPage);

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return 'Pending';
    const validStatuses = ['pending', 'approved', 'rejected', 'withdrawn'];
    const formatted = validStatuses.includes(status.toLowerCase())
      ? status.toLowerCase()
      : 'pending';
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  // Chart data for status distribution
  const statusChartData = {
    labels: ['Pending', 'Approved', 'Rejected', 'Withdrawn'],
    datasets: [
      {
        data: [stats.pending, stats.approved, stats.rejected, stats.withdrawn],
        backgroundColor: ['#e67e22', '#27ae60', '#e74c3c', '#7f8c8d'],
        borderWidth: 1,
      },
    ],
  };

  // Chart data for loan amounts
  const amountChartData = {
    labels: applications.slice(0, 5).map((app) => app.fullName),
    datasets: [
      {
        label: `Loan Amount (${currency})`,
        data: applications.slice(0, 5).map((app) => app.amount),
        backgroundColor: '#3498db',
        borderWidth: 1,
      },
    ],
  };

  // Fetch applications on component mount
  useEffect(() => {
    fetchApplications();
  }, []);

  if (loading) return <p className="loading-text">Loading applications...</p>;

  return (
    <div className="loan-container">
      <header className="loan-header">
        <h1>Loan Applications Dashboard</h1>
        <Link to="/lender-dashboard" className="action-btn back-btn">
          Back to Dashboard
        </Link>
      </header>

      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Applications</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Pending</h3>
          <p>{stats.pending}</p>
        </div>
        <div className="stat-card">
          <h3>Approved</h3>
          <p>{stats.approved}</p>
        </div>
        <div className="stat-card">
          <h3>Rejected</h3>
          <p>{stats.rejected}</p>
        </div>
        <div className="stat-card">
          <h3>Total Amount</h3>
          <p>{formatCurrency(stats.totalAmount)}</p>
        </div>
        <div className="stat-card">
          <h3>Avg Amount</h3>
          <p>{formatCurrency(stats.avgAmount)}</p>
        </div>
      </div>

      <div className="charts-container">
        <div className="chart-wrapper">
          <h3>Application Status Distribution</h3>
          <div className="chart">
            <Pie
              data={statusChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' },
                },
              }}
            />
          </div>
        </div>
        <div className="chart-wrapper">
          <h3>Recent Loan Amounts</h3>
          <div className="chart">
            <Bar
              data={amountChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } },
              }}
            />
          </div>
        </div>
      </div>

      <div className="activity-container">
        <h3>Recent Activity</h3>
        <div className="activity-log">
          {activityLog.map((activity) => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">{activity.icon}</div>
              <div className="activity-details">
                <p className="activity-message">{activity.message}</p>
                <p className="activity-time">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="currency-filter">Currency:</label>
          <select
            id="currency-filter"
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="search">Search:</label>
          <input
            type="text"
            id="search"
            name="search"
            placeholder="Search name or purpose..."
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
        <div className="filter-group">
          <label>Amount Range:</label>
          <div className="range-inputs">
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={filters.amountRange[0]}
              onChange={(e) => handleAmountRangeChange(e, 0)}
            />
            <input
              type="range"
              min="0"
              max="100000"
              step="1000"
              value={filters.amountRange[1]}
              onChange={(e) => handleAmountRangeChange(e, 1)}
            />
            <span>
              {formatCurrency(filters.amountRange[0])} - {formatCurrency(filters.amountRange[1])}
            </span>
          </div>
        </div>
        <button
          onClick={fetchApplications}
          disabled={loading || actionLoading}
          className="action-btn refresh-btn"
        >
          {loading ? 'Refreshing...' : 'Refresh Applications'}
        </button>
      </div>

      <table className="loan-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Amount</th>
            <th>Purpose</th>
            <th>Status</th>
            <th>Date Applied</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentApplications.map((app) => (
            <tr key={app._id}>
              <td>{app.fullName}</td>
              <td>{formatCurrency(app.amount)}</td>
              <td>{app.purpose}</td>
              <td>
                <span className={`status-badge status-${app.status}`}>
                  {formatStatus(app.status)}
                </span>
              </td>
              <td>{new Date(app.createdAt).toLocaleDateString()}</td>
              <td>{new Date(app.updatedAt).toLocaleDateString()}</td>
              <td>
                <button
                  className="action-btn view-btn"
                  onClick={() => viewApplicationDetails(app._id)}
                  disabled={actionLoading}
                >
                  View
                </button>
                {app.status === 'pending' && (
                  <>
                    <button
                      className="action-btn approve-btn"
                      onClick={() => approveApplication(app._id)}
                      disabled={actionLoading}
                    >
                      Approve
                    </button>
                    <button
                      className="action-btn reject-btn"
                      onClick={() => rejectApplication(app._id)}
                      disabled={actionLoading}
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || actionLoading}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
            <button
              key={number}
              onClick={() => setCurrentPage(number)}
              className={currentPage === number ? 'active' : ''}
              disabled={actionLoading}
            >
              {number}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || actionLoading}
          >
            Next
          </button>
        </div>
      )}

      {showModal && selectedApplication && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Application Details</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="detail-row">
              <div className="detail-label">Applicant Name:</div>
              <div className="detail-value">{selectedApplication.fullName}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Loan Amount:</div>
              <div className="detail-value">{formatCurrency(selectedApplication.amount)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Purpose:</div>
              <div className="detail-value">{selectedApplication.purpose}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Term:</div>
              <div className="detail-value">{selectedApplication.term} months</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Monthly Income:</div>
              <div className="detail-value">{formatCurrency(selectedApplication.income)}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Status:</div>
              <div className="detail-value">
                <span className={`status-badge status-${selectedApplication.status}`}>
                  {formatStatus(selectedApplication.status)}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Applied On:</div>
              <div className="detail-value">
                {new Date(selectedApplication.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Last Updated:</div>
              <div className="detail-value">
                {new Date(selectedApplication.updatedAt).toLocaleString()}
              </div>
            </div>
            {selectedApplication.notes && (
              <div className="detail-row">
                <div className="detail-label">Notes:</div>
                <div className="detail-value">{selectedApplication.notes}</div>
              </div>
            )}
            <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
              {selectedApplication.status === 'pending' && (
                <>
                  <button
                    className="action-btn approve-btn"
                    onClick={() => {
                      approveApplication(selectedApplication._id);
                      setShowModal(false);
                    }}
                    disabled={actionLoading}
                  >
                    Approve
                  </button>
                  <button
                    className="action-btn reject-btn"
                    onClick={() => {
                      rejectApplication(selectedApplication._id);
                      setShowModal(false);
                    }}
                    disabled={actionLoading}
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                className="action-btn view-btn"
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoanApplications;