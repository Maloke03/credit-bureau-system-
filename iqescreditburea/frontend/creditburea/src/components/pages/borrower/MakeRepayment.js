import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/MakeRepayment.css';

// Define status enums to align with backend
const LOAN_STATUSES = {
  ALL: 'all',
  PENDING: 'pending',
  APPROVED: 'approved',
};

function MakeRepayment() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [filter, setFilter] = useState(LOAN_STATUSES.APPROVED); // Default to approved
  const [loading, setLoading] = useState(false);
  const [repaymentAmounts, setRepaymentAmounts] = useState({});
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  // Centralized token check
  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setGlobalError('You must be logged in to make repayments');
      return null;
    }
    return token;
  };

  const fetchLoans = async (page = 1) => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);
      setGlobalError('');
      const response = await fetch('http://localhost:5000/api/active-loans', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok) {
        setUser(data.user || { fullName: localStorage.getItem('userName') || 'User' });
        const allLoans = data.activeLoans || [];
        const filteredLoans = filter === LOAN_STATUSES.ALL
          ? allLoans
          : allLoans.filter(loan => loan.status === filter);
        // Client-side pagination
        const start = (page - 1) * pagination.limit;
        const paginatedLoans = filteredLoans.slice(start, start + pagination.limit);
        setLoans(paginatedLoans);
        setPagination({
          page,
          limit: pagination.limit,
          total: filteredLoans.length,
          pages: Math.ceil(filteredLoans.length / pagination.limit),
        });
        // Initialize repayment amounts for current page
        const initialAmounts = {};
        paginatedLoans.forEach(loan => {
          initialAmounts[loan._id] = repaymentAmounts[loan._id] || '';
        });
        setRepaymentAmounts(initialAmounts);
      } else {
        setGlobalError(data.message || 'Failed to fetch loans');
      }
    } catch (error) {
      console.error('Fetch Loans Error:', error);
      setGlobalError('Error fetching loans');
    } finally {
      setLoading(false);
    }
  };

  const handleRepayment = async (loanId) => {
    const token = getToken();
    if (!token) return;

    try {
      const amount = parseFloat(repaymentAmounts[loanId]);
      if (!amount || amount <= 0) {
        setErrors(prev => ({ ...prev, [loanId]: 'Please enter a valid repayment amount' }));
        return;
      }

      const loan = loans.find(l => l._id === loanId);
      if (amount > loan.remainingBalance) {
        setErrors(prev => ({
          ...prev,
          [loanId]: `Amount cannot exceed remaining balance of $${loan.remainingBalance.toLocaleString()}`,
        }));
        return;
      }

      setGlobalError('');
      const response = await fetch(`http://localhost:5000/api/repay-loan/${loanId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (response.ok) {
        setGlobalError(`Successfully repaid $${amount.toLocaleString()}!`);
        setRepaymentAmounts(prev => ({ ...prev, [loanId]: '' }));
        setErrors(prev => ({ ...prev, [loanId]: '' }));
        await fetchLoans(pagination.page); // Refresh loans
      } else {
        const errorMessages = {
          INVALID_AMOUNT: 'Please enter a valid repayment amount.',
          LOAN_NOT_FOUND: 'Loan not found.',
          UNAUTHORIZED: 'You are not authorized to repay this loan.',
          INVALID_LOAN_STATUS: 'Only approved loans can be repaid.',
          ALREADY_REPAID: 'Loan already fully repaid.',
          EXCEEDS_BALANCE: data.message, // Use backend message for precision
          SERVER_ERROR: 'An error occurred while processing repayment.',
        };
        if (response.status === 429) {
          setErrors(prev => ({
            ...prev,
            [loanId]: 'Too many repayment attempts. Please try again later.',
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            [loanId]: errorMessages[data.errorCode] || data.message || 'Failed to process repayment',
          }));
        }
      }
    } catch (error) {
      console.error('Repayment Error:', error);
      setErrors(prev => ({ ...prev, [loanId]: 'Error processing repayment' }));
    }
  };

  const handleAmountChange = (loanId, value) => {
    setRepaymentAmounts(prev => ({ ...prev, [loanId]: value }));
    setErrors(prev => ({ ...prev, [loanId]: '' }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
      fetchLoans(newPage);
    }
  };

  useEffect(() => {
    fetchLoans(pagination.page);
  }, [filter]);

  return (
    <div className="repayment-container">
      <div className="repayment-header">
        <h2>💳 Make a Repayment</h2>
        {user && (
          <div className="user-info">
            <div className="avatar">{user.fullName?.charAt(0) || 'U'}</div>
            <div className="user-greeting">
              <h3>Hello, {user.fullName}</h3>
              <p>Repay your active loans below 👇</p>
            </div>
          </div>
        )}
      </div>

      {globalError && (
        <p className={`global-message ${globalError.includes('Successfully') ? 'success' : 'error'}`} role="alert">
          {globalError}
        </p>
      )}

      {loading ? (
        <p className="loading-text">Loading your loans...</p>
      ) : (
        <>
          <div className="loan-stats">
            <div className="stat-box total">Total Loans: {pagination.total}</div>
            <div className="stat-box pending">
              Pending: {loans.filter(l => l.status === LOAN_STATUSES.PENDING).length}
            </div>
            <div className="stat-box approved">
              Approved: {loans.filter(l => l.status === LOAN_STATUSES.APPROVED).length}
            </div>
          </div>

          <div className="filter-tabs">
            {Object.values(LOAN_STATUSES).map(stat => (
              <button
                key={stat}
                className={`filter-btn ${filter === stat ? 'active' : ''}`}
                onClick={() => setFilter(stat)}
                aria-label={`Filter by ${stat} loans`}
                aria-pressed={filter === stat}
              >
                {stat.charAt(0).toUpperCase() + stat.slice(1)}
              </button>
            ))}
          </div>

          {loans.length > 0 ? (
            <>
              <div className="loan-cards-wrapper">
                {loans.map((loan) => (
                  <div key={loan._id} className="loan-card">
                    <h4>💵 ${loan.amount.toLocaleString()}</h4>
                    <p><strong>Remaining Balance:</strong> ${loan.remainingBalance.toLocaleString()}</p>
                    <p><strong>Purpose:</strong> {loan.purpose}</p>
                    <p><strong>Term:</strong> {loan.term} months</p>
                    <p><strong>Status:</strong> {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}</p>
                    {loan.status === LOAN_STATUSES.APPROVED && (
                      <div className="repayment-input">
                        <input
                          type="number"
                          placeholder="Enter repayment amount"
                          value={repaymentAmounts[loan._id] || ''}
                          onChange={(e) => handleAmountChange(loan._id, e.target.value)}
                          className="amount-input"
                          min="0"
                          step="0.01"
                          aria-label={`Enter repayment amount for ${loan.purpose} loan`}
                        />
                        <button
                          onClick={() => handleRepayment(loan._id)}
                          className="repay-btn"
                          disabled={!repaymentAmounts[loan._id] || parseFloat(repaymentAmounts[loan._id]) <= 0}
                          aria-label={`Submit repayment for ${loan.purpose} loan`}
                        >
                          Repay
                        </button>
                        {errors[loan._id] && (
                          <p className="error-text" role="alert">
                            {errors[loan._id]}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <span>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="no-loans-text">You have no loans to repay 🎉</p>
          )}
        </>
      )}

      <div className="dashboard-nav">
        <button onClick={() => navigate('/borrower-dashboard')} className="dashboard-btn">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default MakeRepayment;