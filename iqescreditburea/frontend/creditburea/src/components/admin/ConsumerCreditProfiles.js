import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import '../css/ConsumerCreditProfiles.css';

const ConsumerCreditProfiles = () => {
  const [creditReports, setCreditReports] = useState([]);
  const [error, setError] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Initialize navigate

  const fetchCreditReports = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoading(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/credit-reports', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setCreditReports(response.data.reports);
        setError('');
      } else {
        setError(response.data.message || 'Failed to fetch credit reports.');
      }
    } catch (err) {
      console.error('Fetch credit reports error:', err);
      setError(err.response?.data?.message || 'Failed to fetch credit reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.role === 'lender' || decoded.role === 'admin') {
          setIsAuthorized(true);
          fetchCreditReports();
          // Set up polling every 30 seconds
          const interval = setInterval(fetchCreditReports, 30000);
          return () => clearInterval(interval); // Cleanup on unmount
        } else {
          setError('Access denied. Only lenders or admins can view all credit reports.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Token decode error:', err);
        setError('Invalid authentication token. Please log in again.');
        setLoading(false);
      }
    } else {
      setError('Please log in to view credit reports.');
      setLoading(false);
    }
  }, []);

  return (
    <div className="consumer-credit-profiles-container">
      <div className="header-container">
        <h1>Consumer Credit Profiles</h1>
        <button className="back-button" onClick={() => navigate('/admin-dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
      <p>View all consumer credit reports (Lender/Admin access only).</p>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading credit reports...</p>
      ) : !isAuthorized ? (
        <p className="error">You are not authorized to view this page.</p>
      ) : creditReports.length === 0 ? (
        <p>No credit reports available.</p>
      ) : (
        <div className="table-container">
          <table className="credit-reports-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Credit Score</th>
                <th>Credit Limit</th>
                <th>Current Balance</th>
                <th>On-Time Payments</th>
                <th>Late Payments</th>
                <th>Oldest Account (Years)</th>
                <th>Account Types</th>
                <th>Inquiries</th>
                <th>Public Records</th>
                <th>Accounts</th>
                <th>Address</th>
                <th>Date of Birth</th>
              </tr>
            </thead>
            <tbody>
              {creditReports.map((report) => (
                <tr key={report._id}>
                  <td>{report.name || 'N/A'}</td>
                  <td>{report.userId?.email || 'N/A'}</td>
                  <td>{report.creditScore ?? 'N/A'}</td>
                  <td>${(report.creditLimit ?? 0).toLocaleString()}</td>
                  <td>${(report.currentBalance ?? 0).toLocaleString()}</td>
                  <td>{report.onTimePayments ?? 'N/A'}</td>
                  <td>{report.latePayments ?? 'N/A'}</td>
                  <td>{report.oldestAccountAge ?? 'N/A'}</td>
                  <td>{report.accountTypes ?? 'N/A'}</td>
                  <td>{report.inquiries ?? 'N/A'}</td>
                  <td>{report.publicRecords || 'None'}</td>
                  <td>{report.accounts?.join(', ') || 'None'}</td>
                  <td>{report.address || 'N/A'}</td>
                  <td>{report.dob || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ConsumerCreditProfiles;