import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/ApplyLoan.css';

function ApplyLoan() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    amount: '',
    purpose: '',
    term: '',
    income: '',
    agree: false,
  });
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tokenValid, setTokenValid] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setTokenValid(false);
      navigate('/login');
    } else {
      fetchApplicationStatus();
    }
  }, [navigate]);

  // Log applications state for debugging
  useEffect(() => {
    console.log('Current applications state:', applications);
  }, [applications]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateStep = () => {
    if (step === 1 && (!formData.fullName || !formData.amount)) {
      setMessage('Please fill in all required fields.');
      return false;
    }
    if (step === 2 && (!formData.purpose || !formData.term || !formData.income)) {
      setMessage('Please fill in all required fields.');
      return false;
    }
    setMessage('');
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/borrower-dashboard');
    }
  };

  const handleTokenError = () => {
    localStorage.removeItem('token');
    setTokenValid(false);
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agree) {
      setMessage('You must agree to the terms and conditions.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        handleTokenError();
        return;
      }

      setLoading(true);
      const response = await fetch('http://localhost:5000/api/loan-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        handleTokenError();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit loan application');
      }

      alert('Loan application submitted successfully!');
      setFormData({
        fullName: '',
        amount: '',
        purpose: '',
        term: '',
        income: '',
        agree: false,
      });
      setStep(1);
      await fetchApplicationStatus();
    } catch (error) {
      console.error('Application Error:', error);
      setMessage(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        handleTokenError();
        return;
      }

      setLoading(true);
      const response = await fetch('http://localhost:5000/api/my-loan-application', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleTokenError();
        return;
      }

      const data = await response.json();
      console.log('Fetched applications:', data); // Debug log

      if (data.success && Array.isArray(data.applications)) {
        // Sanitize applications to ensure valid status
        const sanitizedApplications = data.applications.map((app) => ({
          ...app,
          status: ['pending', 'approved', 'rejected', 'withdrawn', 'repaid'].includes(app.status)
            ? app.status
            : 'pending', // Fallback to 'pending' if status is invalid
        }));
        setApplications(sanitizedApplications);
        setMessage('');
      } else {
        console.warn('No valid applications found in response:', data);
        setApplications([]);
        setMessage(data.message || 'No loan applications found.');
      }
    } catch (error) {
      console.error('Status Check Error:', error);
      setMessage('Failed to fetch applications. Please try again.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const withdrawApplication = async (id) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      handleTokenError();
      return;
    }

    if (!id || typeof id !== 'string') {
      throw new Error('Invalid application ID');
    }

    console.log('Withdrawing application with ID:', id);
    console.log('Token:', token);
    console.log('Request URL:', `http://localhost:5000/api/loan-applications/${id}/withdraw`);

    setLoading(true);
    const response = await fetch(`http://localhost:5000/api/loan-applications/${id}/withdraw`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:', Object.fromEntries(response.headers));

    const contentType = response.headers.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error(`Expected JSON, got ${contentType || 'no content-type'}: ${text.slice(0, 100)}`);
    }

    const data = await response.json();
    console.log('Withdraw response:', data);

    if (response.status === 401 || response.status === 403) {
      console.warn('Unauthorized or forbidden response');
      handleTokenError();
      return;
    }

    if (response.ok && data.success) {
      alert('Application withdrawn successfully!');
      await fetchApplicationStatus();
    } else {
      throw new Error(data.message || 'Failed to withdraw application');
    }
  } catch (error) {
    console.error('Withdraw error:', error);
    alert(`Error withdrawing application: ${error.message || 'Please try again.'}`);
  } finally {
    setLoading(false);
  }
};

  // Helper function to format status for display
  const formatStatus = (status) => {
    if (!status) return 'Pending'; // Default to 'Pending' if status is falsy
    const validStatuses = ['pending', 'approved', 'rejected', 'withdrawn', 'repaid'];
    const formatted = validStatuses.includes(status.toLowerCase()) ? status.toLowerCase() : 'pending';
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  const viewApplicationDetails = (app) => {
    setSelectedApplication(app);
    setShowModal(true);
  };

  if (!tokenValid) {
    return (
      <div className="apply-loan-container">
        <p>Please login to access this page.</p>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="apply-loan-container">
      <h2>Apply for a Loan</h2>
      <div className="stepper">
        <div className={`step ${step === 1 ? 'active' : ''}`}>Step 1</div>
        <div className={`step ${step === 2 ? 'active' : ''}`}>Step 2</div>
        <div className={`step ${step === 3 ? 'active' : ''}`}>Review</div>
      </div>

      {message && <div className="message">{message}</div>}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="form-step">
            <label>
              Full Name:
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Loan Amount ($):
              <input
                type="number"
                name="amount"
                min="100"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <label>
              Purpose of Loan:
              <select
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
              >
                <option value="">Select purpose</option>
                <option value="Home Improvement">Home Improvement</option>
                <option value="Debt Consolidation">Debt Consolidation</option>
                <option value="Business">Business</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label>
              Loan Term (months):
              <input
                type="number"
                name="term"
                min="1"
                max="60"
                value={formData.term}
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Monthly Income ($):
              <input
                type="number"
                name="income"
                min="0"
                step="100"
                value={formData.income}
                onChange={handleChange}
                required
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="review-step">
            <h3>Review Your Application</h3>
            <div className="review-details">
              <p><strong>Full Name:</strong> {formData.fullName}</p>
              <p><strong>Loan Amount:</strong> ${formData.amount}</p>
              <p><strong>Purpose:</strong> {formData.purpose}</p>
              <p><strong>Term:</strong> {formData.term} months</p>
              <p><strong>Monthly Income:</strong> ${formData.income}</p>
            </div>
            <label className="agree-checkbox">
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                required
              />
              I agree to the terms and conditions
            </label>
          </div>
        )}

        <div className="button-group">
          <button type="button" onClick={handleBack} disabled={loading}>
            {step > 1 ? 'Back' : 'Back to Dashboard'}
          </button>
          {step < 3 ? (
            <button type="button" onClick={handleNext} disabled={loading}>
              Next
            </button>
          ) : (
            <button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>

      <div className="applications-section">
        <h3>My Loan Applications</h3>
        <button onClick={fetchApplicationStatus} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Status'}
        </button>
        {loading ? (
          <p>Loading applications...</p>
        ) : applications.length > 0 ? (
          <table className="loan-table">
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Amount</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Date Applied</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id}>
                  <td>{app._id ? app._id.slice(-6) : 'N/A'}</td>
                  <td>${app.amount?.toLocaleString() || '0'}</td>
                  <td>{app.purpose || 'N/A'}</td>
                  <td>
                    <span className={`status-badge status-${formatStatus(app.status).toLowerCase()}`}>
                      {formatStatus(app.status)}
                    </span>
                  </td>
                  <td>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>{app.updatedAt ? new Date(app.updatedAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <button
                      className="action-btn view-btn"
                      onClick={() => viewApplicationDetails(app)}
                    >
                      View Details
                    </button>
                    {app.status === 'pending' && (
                      <button
                        className="action-btn withdraw-btn"
                        onClick={() => withdrawApplication(app._id)}
                        disabled={loading}
                      >
                        Withdraw
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No loan applications found.</p>
        )}
      </div>

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
              <div className="detail-label">Loan ID:</div>
              <div className="detail-value">{selectedApplication._id || 'N/A'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Applicant Name:</div>
              <div className="detail-value">{selectedApplication.fullName || 'N/A'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Loan Amount:</div>
              <div className="detail-value">
                ${selectedApplication.amount?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Purpose:</div>
              <div className="detail-value">{selectedApplication.purpose || 'N/A'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Term:</div>
              <div className="detail-value">{selectedApplication.term || 'N/A'} months</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Monthly Income:</div>
              <div className="detail-value">
                ${selectedApplication.income?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Status:</div>
              <div className="detail-value">
                <span className={`status-badge status-${formatStatus(selectedApplication.status).toLowerCase()}`}>
                  {formatStatus(selectedApplication.status)}
                </span>
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Applied On:</div>
              <div className="detail-value">
                {selectedApplication.createdAt
                  ? new Date(selectedApplication.createdAt).toLocaleString()
                  : 'N/A'}
              </div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Last Updated:</div>
              <div className="detail-value">
                {selectedApplication.updatedAt
                  ? new Date(selectedApplication.updatedAt).toLocaleString()
                  : 'N/A'}
              </div>
            </div>
            <div className="modal-actions">
              {selectedApplication.status === 'pending' && (
                <button
                  className="action-btn withdraw-btn"
                  onClick={() => {
                    withdrawApplication(selectedApplication._id);
                    setShowModal(false);
                  }}
                  disabled={loading}
                >
                  Withdraw Application
                </button>
              )}
              <button className="action-btn view-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplyLoan;