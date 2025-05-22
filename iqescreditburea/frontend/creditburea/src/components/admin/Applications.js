import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/Applications.css';

function Applications() {
  const [loanApplications, setLoanApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoanApplications = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get('http://localhost:5000/api/loan-applications', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setLoanApplications(response.data.applications);
      } catch (err) {
        console.error('Error fetching loan applications:', err);
        setError('Failed to fetch loan applications.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoanApplications();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="loan-applications-container">
      <div className="header-container">
        <h2>All Loan Applications</h2>
        <button className="back-button" onClick={() => navigate('/admin-dashboard')}>
          ← Back to Dashboard
        </button>
      </div>
      {loanApplications.length === 0 ? (
        <p>No applications found.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Borrower Name</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loanApplications.map(app => (
                <tr key={app._id}>
                  <td>{app.userId?.name || 'N/A'}</td>
                  <td>{app.userId?.email || 'N/A'}</td>
                  <td>${app.amount}</td>
                  <td>{app.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Applications;