import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/LenderDashboard.css';

function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState({ name: '', email: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    console.log('Settings useEffect - Token:', token, 'Role:', role); // Debug log
    if (!token || role !== 'lender') {
      console.log('Redirecting to login due to invalid token or role'); // Debug log
      navigate('/login');
    } else {
      fetchUserProfile();
    }
  }, [navigate]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

      console.log('Fetching profile from:', `${baseURL}/api/user/profile`, 'with token:', token); // Debug log
      const response = await axios.get(`${baseURL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Profile response:', response.data); // Debug log
      const { name, email } = response.data.user;
      setUser({ name, email });
      setFormData((prev) => ({ ...prev, name, email }));
      setLoading(false);
    } catch (err) {
      console.error('Fetch profile error:', err.response || err); // Debug log
      const errorMessage = err.response?.data?.message || err.message;
      const status = err.response?.status || 'Unknown';
      setError(`Failed to load profile: ${errorMessage} (Status: ${status})`);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (!formData.name && !formData.email && !formData.password) {
      setError('Please provide at least one field to update');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

      const updateData = {};
      if (formData.name && formData.name !== user.name) updateData.name = formData.name;
      if (formData.email && formData.email !== user.email) updateData.email = formData.email;
      if (formData.password) updateData.password = formData.password;

      console.log('Updating profile with data:', updateData); // Debug log
      const response = await axios.put(`${baseURL}/api/user/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Update response:', response.data); // Debug log
      setUser({ name: response.data.user.name, email: response.data.user.email });
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      setSuccess('Profile updated successfully');
    } catch (err) {
      console.error('Update profile error:', err.response || err); // Debug log
      const errorMessage = err.response?.data?.message || err.message;
      const status = err.response?.status || 'Unknown';
      setError(`Failed to update profile: ${errorMessage} (Status: ${status})`);
    }
  };

  const handleLogout = () => {
    console.log('Logging out'); // Debug log
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="lender-dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="lender-dashboard-container">
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={fetchUserProfile}>
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
        <h2>Lender Dashboard</h2>
        <div className="nav-section">
          <button onClick={() => navigate('/loan-applications')}>
            <span className="icon">📄</span> Loan Applications
          </button>
          <button onClick={() => navigate('/borrower-profiles')}>
            <span className="icon">👥</span> Borrower Profiles
          </button>
          <button onClick={() => navigate('/disbursed-loans')}>
            <span className="icon">💸</span> Disbursed Loans
          </button>
          <button onClick={() => navigate('/repayments')}>
            <span className="icon">📊</span> Repayment Tracker
          </button>
          <button onClick={() => navigate('/reports')}>
            <span className="icon">📈</span> Reports & Analytics
          </button>
          <button onClick={() => navigate('/settings')} className="active">
            <span className="icon">⚙️</span> Account Settings
          </button>
          <button onClick={handleLogout} className="logout-button">
            <span className="icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        <h1>Account Settings</h1>
        <p>Manage your account details and security settings.</p>

        <div className="dashboard-cards">
          <div className="card">
            <h3>Update Profile</h3>
            {success && <p className="success-message">{success}</p>}
            {error && <p className="error-message-text">{error}</p>}
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter new password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm new password"
                />
              </div>
              <button type="submit" className="action-btn">
                Save Changes
              </button>
            </form>
            <button
              className="view-btn"
              onClick={() => navigate('/lender-dashboard')}
              style={{ marginTop: '10px' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;