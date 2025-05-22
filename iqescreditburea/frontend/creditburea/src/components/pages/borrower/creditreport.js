import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/CreditReport.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileAlt,
  faUser,
  faBirthdayCake,
  faHome,
  faMapMarkerAlt,
  faCreditCard,
  faMoneyBill,
  faCheckCircle,
  faGavel,
  faSearch,
  faFileExport,
  faSpinner,
  faRedo,
  faChevronRight,
  faExclamationTriangle,
  faUserTie,
  faWallet,
  faChartLine,
  faClock,
  faListAlt,
} from '@fortawesome/free-solid-svg-icons';

function CreditReport() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    address: '',
    region: '',
    accounts: '',
    creditLimit: '',
    currentBalance: '',
    onTimePayments: '',
    latePayments: '',
    oldestAccountAge: '',
    accountTypes: '',
    inquiries: '',
    publicRecords: '',
  });

  const [reportGenerated, setReportGenerated] = useState(false);
  const [savedReport, setSavedReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(''); // Clear error on input change
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return false;
    }
    if (!formData.dob.trim()) {
      setError('Please enter your date of birth');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Please enter your address');
      return false;
    }
    if (!formData.region.trim()) {
      setError('Please enter your region');
      return false;
    }
    if (!formData.accounts.trim()) {
      setError('Please enter at least one financial account');
      return false;
    }
    if (formData.accounts.split(',').map(acc => acc.trim()).filter(acc => acc).length === 0) {
      setError('Please provide valid financial accounts');
      return false;
    }
    if (formData.creditLimit === '' || isNaN(formData.creditLimit) || parseFloat(formData.creditLimit) < 0) {
      setError('Please enter a valid credit limit');
      return false;
    }
    if (formData.currentBalance === '' || isNaN(formData.currentBalance) || parseFloat(formData.currentBalance) < 0) {
      setError('Please enter a valid current balance');
      return false;
    }
    if (formData.onTimePayments === '' || isNaN(formData.onTimePayments) || parseInt(formData.onTimePayments) < 0) {
      setError('Please enter a valid number of on-time payments');
      return false;
    }
    if (formData.latePayments === '' || isNaN(formData.latePayments) || parseInt(formData.latePayments) < 0) {
      setError('Please enter a valid number of late payments');
      return false;
    }
    if (formData.oldestAccountAge === '' || isNaN(formData.oldestAccountAge) || parseInt(formData.oldestAccountAge) < 0) {
      setError('Please enter a valid age for your oldest account');
      return false;
    }
    if (formData.accountTypes === '' || isNaN(formData.accountTypes) || parseInt(formData.accountTypes) < 0) {
      setError('Please enter a valid number of account types');
      return false;
    }
    if (formData.inquiries === '' || isNaN(formData.inquiries) || parseInt(formData.inquiries) < 0) {
      setError('Please enter a valid number of credit inquiries');
      return false;
    }
    if (!formData.publicRecords.trim()) {
      setError('Please specify public records or enter "None"');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to generate a credit report');
        setIsLoading(false);
        return;
      }

      const payload = {
        name: formData.name,
        dob: formData.dob,
        address: formData.address,
        region: formData.region,
        accounts: formData.accounts.split(',').map(acc => acc.trim()).filter(acc => acc),
        creditLimit: parseFloat(formData.creditLimit),
        currentBalance: parseFloat(formData.currentBalance),
        onTimePayments: parseInt(formData.onTimePayments),
        latePayments: parseInt(formData.latePayments),
        oldestAccountAge: parseInt(formData.oldestAccountAge),
        accountTypes: parseInt(formData.accountTypes),
        inquiries: parseInt(formData.inquiries),
        publicRecords: formData.publicRecords,
      };

      const response = await fetch('http://localhost:5000/api/credit-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setSavedReport(data.report);
        setReportGenerated(true);
      } else {
        const errorMessages = {
          'Invalid or expired token': 'Your session has expired. Please log in again.',
          'All fields are required': 'Please fill in all required fields.',
        };
        setError(errorMessages[data.message] || data.message || 'Failed to save credit report.');
      }
    } catch (error) {
      console.error('Error saving credit report:', error);
      setError('An error occurred while saving the credit report.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      dob: '',
      address: '',
      region: '',
      accounts: '',
      creditLimit: '',
      currentBalance: '',
      onTimePayments: '',
      latePayments: '',
      oldestAccountAge: '',
      accountTypes: '',
      inquiries: '',
      publicRecords: '',
    });
    setReportGenerated(false);
    setSavedReport(null);
    setError('');
  };

  const goToDashboard = () => {
    navigate('/borrower-dashboard');
  };

  return (
    <div className="credit-report-container">
      <div className="credit-report-card">
        <h2 className="report-title">
          <FontAwesomeIcon icon={faFileAlt} /> Generate Credit Report
        </h2>

        {error && (
          <div className="error-message" role="alert" aria-live="assertive">
            <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
          </div>
        )}

        {!reportGenerated ? (
          <form onSubmit={handleSubmit} className="report-form">
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                <FontAwesomeIcon icon={faUser} /> Full Name:
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="Thabo Lefoka"
                aria-label="Full Name"
                aria-describedby={error && error.includes('name') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dob">
                <FontAwesomeIcon icon={faBirthdayCake} /> Date of Birth:
              </label>
              <input
                id="dob"
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="form-input"
                aria-label="Date of Birth"
                aria-describedby={error && error.includes('date of birth') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">
                <FontAwesomeIcon icon={faHome} /> Address:
              </label>
              <input
                id="address"
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="form-input"
                placeholder="Moshoeshoe 2 main St, City, Country"
                aria-label="Address"
                aria-describedby={error && error.includes('address') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="region">
                <FontAwesomeIcon icon={faMapMarkerAlt} /> Region:
              </label>
              <input
                id="region"
                type="text"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className="form-input"
                placeholder="Gauteng, South Africa"
                aria-label="Region"
                aria-describedby={error && error.includes('region') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="accounts">
                <FontAwesomeIcon icon={faCreditCard} /> Financial Accounts (comma-separated):
              </label>
              <input
                id="accounts"
                type="text"
                name="accounts"
                value={formData.accounts}
                onChange={handleChange}
                className="form-input"
                placeholder="Bank Account, Credit Card, Loan"
                aria-label="Financial Accounts"
                aria-describedby={error && error.includes('accounts') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="creditLimit">
                <FontAwesomeIcon icon={faMoneyBill} /> Credit Limit (Total):
              </label>
              <input
                id="creditLimit"
                type="number"
                name="creditLimit"
                value={formData.creditLimit}
                onChange={handleChange}
                className="form-input"
                placeholder="10000"
                min="0"
                step="0.01"
                aria-label="Total Credit Limit"
                aria-describedby={error && error.includes('credit limit') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="currentBalance">
                <FontAwesomeIcon icon={faMoneyBill} /> Current Balance (Total):
              </label>
              <input
                id="currentBalance"
                type="number"
                name="currentBalance"
                value={formData.currentBalance}
                onChange={handleChange}
                className="form-input"
                placeholder="5000"
                min="0"
                step="0.01"
                aria-label="Total Current Balance"
                aria-describedby={error && error.includes('current balance') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="onTimePayments">
                <FontAwesomeIcon icon={faCheckCircle} /> On-Time Payments:
              </label>
              <input
                id="onTimePayments"
                type="number"
                name="onTimePayments"
                value={formData.onTimePayments}
                onChange={handleChange}
                className="form-input"
                placeholder="50"
                min="0"
                aria-label="Number of On-Time Payments"
                aria-describedby={error && error.includes('on-time payments') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="latePayments">
                <FontAwesomeIcon icon={faExclamationTriangle} /> Late Payments:
              </label>
              <input
                id="latePayments"
                type="number"
                name="latePayments"
                value={formData.latePayments}
                onChange={handleChange}
                className="form-input"
                placeholder="5"
                min="0"
                aria-label="Number of Late Payments"
                aria-describedby={error && error.includes('late payments') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="oldestAccountAge">
                <FontAwesomeIcon icon={faClock} /> Oldest Account Age (Years):
              </label>
              <input
                id="oldestAccountAge"
                type="number"
                name="oldestAccountAge"
                value={formData.oldestAccountAge}
                onChange={handleChange}
                className="form-input"
                placeholder="10"
                min="0"
                aria-label="Age of Oldest Account in Years"
                aria-describedby={error && error.includes('oldest account') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="accountTypes">
                <FontAwesomeIcon icon={faListAlt} /> Number of Account Types:
              </label>
              <input
                id="accountTypes"
                type="number"
                name="accountTypes"
                value={formData.accountTypes}
                onChange={handleChange}
                className="form-input"
                placeholder="3"
                min="0"
                aria-label="Number of Account Types"
                aria-describedby={error && error.includes('account types') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="inquiries">
                <FontAwesomeIcon icon={faSearch} /> Number of Credit Inquiries (Last 2 Years):
              </label>
              <input
                id="inquiries"
                type="number"
                name="inquiries"
                value={formData.inquiries}
                onChange={handleChange}
                className="form-input"
                placeholder="2"
                min="0"
                aria-label="Number of Credit Inquiries in Last 2 Years"
                aria-describedby={error && error.includes('inquiries') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="publicRecords">
                <FontAwesomeIcon icon={faGavel} /> Public Records:
              </label>
              <input
                id="publicRecords"
                type="text"
                name="publicRecords"
                value={formData.publicRecords}
                onChange={handleChange}
                className="form-input"
                placeholder="None, Bankruptcy, Tax Lien"
                aria-label="Public Records"
                aria-describedby={error && error.includes('public records') ? 'error-message' : undefined}
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
                aria-label="Generate Credit Report"
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin /> Processing...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFileExport} /> Generate Report
                  </>
                )}
              </button>

              <button
                type="button"
                className="back-button-inline"
                onClick={goToDashboard}
                aria-label="Back to Dashboard"
              >
                ← Back to Dashboard
              </button>
            </div>
          </form>
        ) : (
          <div className="report-summary">
            <div className="summary-header">
              <h3>
                <FontAwesomeIcon icon={faCheckCircle} className="success-icon" /> Credit Report Summary
              </h3>
              <button onClick={handleReset} className="reset-button" aria-label="Generate New Report">
                <FontAwesomeIcon icon={faRedo} /> Generate New Report
              </button>
            </div>

            <div className="summary-content">
              <div className="summary-section">
                <h4><FontAwesomeIcon icon={faUserTie} /> Personal Information</h4>
                <p><strong>Name:</strong> {savedReport.name}</p>
                <p><strong>Date of Birth:</strong> {savedReport.dob}</p>
                <p><strong>Address:</strong> {savedReport.address}</p>
                <p><strong>Region:</strong> {savedReport.region}</p>
              </div>

              <div className="summary-section">
                <h4><FontAwesomeIcon icon={faWallet} /> Financial Accounts</h4>
                <ul className="accounts-list">
                  {savedReport.accounts.map((acc, idx) => (
                    <li key={idx}>
                      <FontAwesomeIcon icon={faChevronRight} /> {acc}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="summary-section">
                <h4><FontAwesomeIcon icon={faMoneyBill} /> Credit Limits and Balances</h4>
                <p><strong>Total Credit Limit:</strong> ${savedReport.creditLimit.toLocaleString()}</p>
                <p><strong>Current Balance:</strong> ${savedReport.currentBalance.toLocaleString()}</p>
              </div>

              <div className="summary-section">
                <h4><FontAwesomeIcon icon={faChartLine} /> Credit Metrics</h4>
                <div className="credit-score-display">
                  <span className="score-value">{savedReport.creditScore}</span>
                  <span className="score-label">Credit Score</span>
                </div>
                <p><strong>On-Time Payments:</strong> {savedReport.onTimePayments}</p>
                <p><strong>Late Payments:</strong> {savedReport.latePayments}</p>
                <p><strong>Oldest Account Age:</strong> {savedReport.oldestAccountAge} years</p>
                <p><strong>Number of Account Types:</strong> {savedReport.accountTypes}</p>
                <p><strong>Credit Inquiries (Last 2 Years):</strong> {savedReport.inquiries}</p>
                <p><strong>Public Records:</strong> {savedReport.publicRecords || 'None'}</p>
              </div>
            </div>

            <div className="summary-footer">
              <p className="disclaimer">
                <FontAwesomeIcon icon={faExclamationTriangle} /> This report is generated for informational purposes only and may not reflect your complete credit history.
              </p>
              <button
                className="back-button"
                onClick={goToDashboard}
                aria-label="Back to Dashboard"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreditReport;