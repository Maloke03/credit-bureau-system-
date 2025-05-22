// src/components/pages/LenderDashboard.js
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/LenderDashboard.css';

// Centralized Axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.config.url);
    return Promise.reject(error);
  }
);

function LenderDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [activities, setActivities] = useState([]);
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    totalDisbursed: 0,
    avgLoanAmount: 0,
    growthPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format currency for Lesotho Loti (M)
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-LS', { style: 'currency', currency: 'LSL' }).format(amount);

  // Fetch dashboard data with retry logic
  const fetchDashboardData = useCallback(async ({ signal } = {}, retries = 2) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Fetching dashboard data from:', api.defaults.baseURL);

      const requests = [
        api.get('/api/loans/disbursed', { headers: { Authorization: `Bearer ${token}` }, signal }).catch((err) => {
          console.error('Loans error:', err.message, 'URL:', '/api/loans/disbursed');
          return { data: { loans: [] } };
        }),
        api.get('/api/repayments', { headers: { Authorization: `Bearer ${token}` }, signal }).catch((err) => {
          console.error('Repayments error:', err.message, 'URL:', '/api/repayments');
          return { data: { repayments: [] } };
        }),
        api.get('/api/loan-applications', { headers: { Authorization: `Bearer ${token}` }, signal }).catch((err) => {
          console.error('Applications error:', err.message, 'URL:', '/api/loan-applications');
          return { data: { applications: [] } };
        }),
        api.get('/api/lender/reports', { headers: { Authorization: `Bearer ${token}` }, signal }).catch((err) => {
          console.error('Reports error:', err.message, 'URL:', '/api/lender/reports');
          return { data: { data: {} } };
        }),
        api.get('/api/lender/portfolio', { headers: { Authorization: `Bearer ${token}` }, signal }).catch((err) => {
          console.error('Portfolio error:', err.message, 'URL:', '/api/lender/portfolio');
          return { data: { totalDisbursed: 0, avgLoanAmount: 0, growthPercentage: 0 } };
        }),
      ];

      const [loansRes, repaymentsRes, applicationsRes, reportsRes, portfolioRes] = await Promise.all(requests);

      const activeLoans = loansRes.data.loans?.filter((loan) => loan.status === 'disbursed').length || 0;
      const pendingApplications = applicationsRes.data.applications?.filter((app) => app.status === 'pending').length || 0;
      const totalRepaid = reportsRes.data.data?.totalRepaid || 0;
      const successRate = reportsRes.data.data?.successRate || 100;
      const defaultRate = (100 - successRate).toFixed(1) + '%';

      setStats([
        { id: 1, title: 'Active Loans', value: activeLoans, icon: '💵', color: '#06b6d4' },
        { id: 2, title: 'Pending Applications', value: pendingApplications, icon: '📋', color: '#f59e0b' },
        { id: 3, title: 'Total Repayments', value: formatCurrency(totalRepaid), icon: '💰', color: '#22c55e' },
        { id: 4, title: 'Default Rate', value: defaultRate, icon: '⚠️', color: '#ef4444' },
      ]);

      setPortfolioMetrics({
        totalDisbursed: portfolioRes.data.totalDisbursed || 0,
        avgLoanAmount: portfolioRes.data.avgLoanAmount || 0,
        growthPercentage: portfolioRes.data.growthPercentage || 0,
      });

      const recentRepayments = (repaymentsRes.data.repayments || [])
        .slice(0, 2)
        .map((repayment) => ({
          id: `repay-${repayment._id || Math.random()}`,
          action: 'Repayment Received',
          details: `${formatCurrency(repayment.amountPaid || 0)} for Loan #${(repayment.loanId?._id || '').slice(-4)}`,
          time: repayment.repaymentDate ? new Date(repayment.repaymentDate).toLocaleString() : 'Recently',
          icon: '💳',
        }));

      const recentApplications = (applicationsRes.data.applications || [])
        .filter((app) => app.status === 'approved')
        .slice(0, 1)
        .map((app) => ({
          id: `app-${app._id || Math.random()}`,
          action: 'Loan Approved',
          details: `Loan #${(app._id || '').slice(-4)} for ${formatCurrency(app.amount || 0)}`,
          time: app.updatedAt ? new Date(app.updatedAt).toLocaleString() : 'Recently',
          icon: '✅',
        }));

      const recentLoans = (loansRes.data.loans || [])
        .slice(0, 1)
        .map((loan) => ({
          id: `loan-${loan._id || Math.random()}`,
          action: 'Loan Disbursed',
          details: `${formatCurrency(loan.amount || 0)} to ${loan.userId?.name || 'a borrower'}`,
          time: loan.updatedAt ? new Date(loan.updatedAt).toLocaleString() : 'Recently',
          icon: '💸',
        }));

      setActivities([...recentLoans, ...recentApplications, ...recentRepayments]);

      setLoading(false);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Dashboard data fetch error:', err);
        if (retries > 0) {
          console.log(`Retrying... (${retries} attempts left)`);
          setTimeout(() => fetchDashboardData({ signal }, retries - 1), 1000);
        } else {
          setError(`Failed to load dashboard: ${err.message || 'Server error'}`);
          setLoading(false);
        }
      }
    }
  }, []);

  // Check authentication and role on mount
  useEffect(() => {
    const controller = new AbortController();
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Debugging: Log token and role
    console.log('Token:', token);
    console.log('Role:', role);

    if (!token || role !== 'lender') {
      console.log('Invalid token or role, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.exp * 1000 < Date.now()) {
        console.log('Token expired, clearing storage and redirecting');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
      } else {
        fetchDashboardData({ signal: controller.signal });
      }
    } catch (err) {
      console.error('Invalid token:', err);
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/login');
    }

    return () => controller.abort();
  }, [navigate, fetchDashboardData]);

  // Handle navigation to different routes
  const handleNavigation = (path) => {
    console.log('Navigating to:', path); // Debugging
    navigate(path);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="lender-dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lender-dashboard-container">
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={() => fetchDashboardData()}>
            Retry
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lender-dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Lender Portal</h2>
        </div>
        <div className="nav-menu">
          <button onClick={() => handleNavigation('/loan-applications')} className="nav-item">
            <span className="nav-icon">📄</span>
            <span className="nav-label">Applications</span>
          </button>
          <button onClick={() => handleNavigation('/borrower-profiles')} className="nav-item">
            <span className="nav-icon">👥</span>
            <span className="nav-label">Borrowers</span>
          </button>
          <button onClick={() => handleNavigation('/disbursed-loans')} className="nav-item">
            <span className="nav-icon">💸</span>
            <span className="nav-label">Loans</span>
          </button>
          <button onClick={() => handleNavigation('/repayments')} className="nav-item">
            <span className="nav-icon">📊</span>
            <span className="nav-label">Repayments</span>
          </button>
          <button onClick={() => handleNavigation('/reports')} className="nav-item">
            <span className="nav-icon">📈</span>
            <span className="nav-label">Reports</span>
          </button>
          <button onClick={handleLogout} className="nav-item logout-item">
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        <h1>Lender Dashboard</h1>
        <p>Manage your lending portfolio with real-time insights.</p>

        <div className="quick-stats">
          {stats.map((stat) => (
            <div className="stat-item" key={stat.id}>
              <div className="stat-icon" style={{ backgroundColor: stat.color }}>
                {stat.icon}
              </div>
              <div className="stat-info">
                <h4>{stat.title}</h4>
                <p>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-cards">
          <div className="card">
            <h3>Portfolio Overview</h3>
            <p>Key metrics for your lending portfolio.</p>
            <div className="portfolio-metrics">
              <div className="metric">
                <span>Total Disbursed</span>
                <span className="stat">{formatCurrency(portfolioMetrics.totalDisbursed)}</span>
              </div>
              <div className="metric">
                <span>Average Loan</span>
                <span className="stat">{formatCurrency(portfolioMetrics.avgLoanAmount)}</span>
              </div>
              <div className="metric">
                <span>Growth</span>
                <span className="stat">{portfolioMetrics.growthPercentage}%</span>
              </div>
            </div>
            <button className="view-btn" onClick={() => handleNavigation('/reports')}>
              View Details
            </button>
          </div>

          <div className="card">
            <h3>Quick Actions</h3>
            <p>Review and manage pending applications.</p>
            <button className="action-btn" onClick={() => handleNavigation('/loan-applications')}>
              Review Applications
            </button>
          </div>

          <div className="card">
            <h3>Loan Performance</h3>
            <p>Track repayment trends and success metrics.</p>
            <div className="stat">{stats[3]?.value ? (100 - parseFloat(stats[3].value)).toFixed(1) + '%' : 'N/A'}</div>
            <p>On-Time Repayment Rate</p>
            <button className="view-btn" onClick={() => handleNavigation('/reports')}>
              View Report
            </button>
          </div>
        </div>

        <div className="activity-feed">
          <h2>Recent Activity</h2>
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div className="activity-item" key={activity.id}>
                <div className="activity-icon">{activity.icon}</div>
                <div className="activity-content">
                  <h4>{activity.action}</h4>
                  <p>{activity.details}</p>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))
          ) : (
            <p>No recent activities found.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default LenderDashboard;