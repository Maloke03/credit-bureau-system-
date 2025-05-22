import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Borrowerdashboard.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Create Axios instance for consistent API calls
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

function BorrowerDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    creditScore: null,
    activeLoans: 0,
    totalRepaid: 0,
    pendingApplications: 0,
    recentActivity: [],
    notifications: [],
    profile: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('BorrowerDashboard: useEffect started');
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'borrower') {
      console.log('Invalid token or role, redirecting to login', { token, role });
      navigate('/login');
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      console.log('Token decoded:', decoded);
      if (decoded.exp * 1000 < Date.now()) {
        console.log('Token expired, clearing storage and redirecting');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
        return;
      }

      const fetchDashboardData = async () => {
        try {
          console.log('Fetching dashboard data...');
          const headers = { Authorization: `Bearer ${token}` };

          // Fetch APIs with individual error handling
          const creditPromise = api.get('/api/credit-report', { headers }).catch(() => ({
            data: { success: false, report: null },
          }));
          const loansPromise = api.get('/api/active-loans', { headers }).catch(() => ({
            data: { success: false, activeLoans: [] },
          }));
          const notificationsPromise = api.get('/api/notifications', { headers }).catch(() => ({
            data: { success: false, notifications: [] },
          }));
          const profilePromise = api.get('/api/borrower/profile', { headers }).catch(() => ({
            data: { success: false, profile: null },
          }));

          const [creditResponse, loansResponse, notificationsResponse, profileResponse] = await Promise.all([
            creditPromise,
            loansPromise,
            notificationsPromise,
            profilePromise,
          ]);

          console.log('API responses:', {
            credit: creditResponse.data,
            loans: loansResponse.data,
            notifications: notificationsResponse.data,
            profile: profileResponse.data,
          });

          const recentActivity = (loansResponse.data.activeLoans || []).slice(0, 5).map((loan) => ({
            id: loan._id || 'unknown',
            type: 'Loan Application',
            description: `Applied for ${loan.purpose || 'N/A'} loan of L${loan.amount || 0}`,
            date: loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'N/A',
          }));

          setDashboardData({
            creditScore: creditResponse.data.success ? creditResponse.data.report?.creditScore || null : null,
            activeLoans: (loansResponse.data.activeLoans || []).filter((loan) => loan.status === 'approved').length,
            totalRepaid: (loansResponse.data.activeLoans || [])
              .filter((loan) => loan.status === 'repaid')
              .reduce((sum, loan) => sum + (loan.amount || 0), 0),
            pendingApplications: (loansResponse.data.activeLoans || []).filter((loan) => loan.status === 'pending').length,
            recentActivity,
            notifications: notificationsResponse.data.notifications || [],
            profile: profileResponse.data.success ? profileResponse.data.profile || null : null,
          });
          setLoading(false);
          console.log('Dashboard data set:', dashboardData);
        } catch (err) {
          console.error('Error fetching dashboard data:', err);
          setError('Failed to load some dashboard data. Please try again.');
          setLoading(false);
        }
      };

      fetchDashboardData();
    } catch (err) {
      console.error('Invalid token:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/login');
    }
  }, [navigate]);

  const handleNavigation = (path) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  const handleLogout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  console.log('Rendering BorrowerDashboard', { loading, error, dashboardData });

  if (loading) {
    return (
      <div className="borrower-dashboard-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="borrower-dashboard-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const chartData = {
    labels: ['Active Loans', 'Pending Applications', 'Total Repaid'],
    datasets: [
      {
        label: 'Loan Metrics',
        data: [
          dashboardData.activeLoans,
          dashboardData.pendingApplications,
          dashboardData.totalRepaid / 1000 || 0,
        ],
        backgroundColor: ['#3498db', '#f1c40f', '#2ecc71'],
        borderColor: ['#2980b9', '#f39c12', '#27ae60'],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Loan Overview' },
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Count / Amount (L thousands)' } },
    },
  };

  return (
    <div className="borrower-dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Borrower Portal</h2>
          {dashboardData.profile && (
            <div className="profile-summary">
              <p>Welcome, {dashboardData.profile.fullName || 'Borrower'}</p>
              <p>{dashboardData.profile.email || 'No Email'}</p>
            </div>
          )}
        </div>
        <nav className="nav-menu">
          <button className="nav-item" onClick={() => handleNavigation('/borrower/creditreport')}>
            <span className="nav-icon">📊</span> View Credit Report
          </button>
          <button className="nav-item" onClick={() => handleNavigation('/borrower/LoanHistory')}>
            <span className="nav-icon">📄</span> Loan History
          </button>
          <button className="nav-item" onClick={() => handleNavigation('/borrower/MakeRepayment')}>
            <span className="nav-icon">💸</span> Make Repayment
          </button>
          <button className="nav-item" onClick={() => handleNavigation('/borrower/Applyloan')}>
            <span className="nav-icon">📝</span> Apply for Loan
          </button>
          <button className="nav-item" onClick={() => handleNavigation('/borrower/profile')}>
            <span className="nav-icon">👤</span> Profile Management
          </button>
          <button className="nav-item logout-item" onClick={handleLogout}>
            <span className="nav-icon">🚪</span> Logout
          </button>
        </nav>
      </aside>

      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Borrower Dashboard</h1>
          <div className="quick-actions">
            <button className="action-btn" onClick={() => handleNavigation('/borrower/Applyloan')}>
              Apply for Loan
            </button>
            <button className="action-btn" onClick={() => handleNavigation('/borrower/MakeRepayment')}>
              Make Repayment
            </button>
          </div>
        </header>

        <section className="overview-section">
          <h2>Overview</h2>
          <div className="overview-cards">
            <div className="card">
              <h3>Credit Score</h3>
              <p>{dashboardData.creditScore || 'N/A'}</p>
            </div>
            <div className="card">
              <h3>Active Loans</h3>
              <p>{dashboardData.activeLoans}</p>
            </div>
            <div className="card">
              <h3>Pending Applications</h3>
              <p>{dashboardData.pendingApplications}</p>
            </div>
            <div className="card">
              <h3>Total Repaid</h3>
              <p>L{dashboardData.totalRepaid.toFixed(2)}</p>
            </div>
          </div>
        </section>

        <section className="notifications-section">
          <h2>Notifications</h2>
          {dashboardData.notifications.length === 0 ? (
            <p>No new notifications.</p>
          ) : (
            <ul className="notifications-list">
              {dashboardData.notifications.map((notification, index) => (
                <li key={index} className={`notification ${notification.type || ''}`}>
                  <span className="notification-icon">
                    {notification.type === 'delinquent' ? '⚠' : notification.type === 'approval' ? '✅' : 'ℹ'}
                  </span>
                  <span>{notification.message || 'No message'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {dashboardData.activeLoans > 0 || dashboardData.pendingApplications > 0 || dashboardData.totalRepaid > 0 ? (
          <section className="chart-section">
            <h2>Loan Metrics</h2>
            <div className="chart-container">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </section>
        ) : null}

        <section className="recent-activity-section">
          <h2>Recent Activity</h2>
          {dashboardData.recentActivity.length === 0 ? (
            <p>No recent activity.</p>
          ) : (
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentActivity.map((activity) => (
                  <tr key={activity.id}>
                    <td>{activity.type}</td>
                    <td>{activity.description}</td>
                    <td>{activity.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default BorrowerDashboard;