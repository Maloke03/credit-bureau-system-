import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/LoanHistory.css';

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

const LoanHistory = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const loansPerPage = 10;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-LS', { style: 'currency', currency: 'LSL' }).format(amount);

  const fetchLoans = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      setLoading(true);
      const res = await api.get('/api/my-loan-applications', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: loansPerPage,
          status: statusFilter || undefined,
        },
      });

      if (!res.data.success) {
        throw new Error(res.data.message || 'Failed to fetch loans');
      }

      setLoans(Array.isArray(res.data.applications) ? res.data.applications : []);
      setTotalPages(res.data.pagination?.pages || 1);
      setLoading(false);
    } catch (err) {
      console.error('Fetch error:', err.response?.status, err.response?.data);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load loans: Server error'
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    const interval = setInterval(fetchLoans, 30000); // Poll every 30 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, [currentPage, statusFilter]);

  const getStatusCount = (loans, status) => {
    return loans.filter((loan) =>
      loan.status && typeof loan.status === 'string'
        ? loan.status.toLowerCase() === status.toLowerCase()
        : false
    ).length;
  };

  const filteredLoans = useMemo(() => {
    let result = [...loans];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (loan) =>
          (loan._id && loan._id.toLowerCase().includes(query)) ||
          (loan.purpose && loan.purpose.toLowerCase().includes(query))
      );
    }

    if (amountFilter.min !== '' || amountFilter.max !== '') {
      result = result.filter((loan) => {
        const amount = loan.amount || 0;
        const min = amountFilter.min !== '' ? Number(amountFilter.min) : -Infinity;
        const max = amountFilter.max !== '' ? Number(amountFilter.max) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    result.sort((a, b) => {
      const fieldA = a[sortField] || '';
      const fieldB = b[sortField] || '';
      if (sortField === 'amount') {
        const amountA = fieldA || 0;
        const amountB = fieldB || 0;
        return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
      } else if (sortField === 'createdAt') {
        const dateA = new Date(fieldA) || new Date(0);
        const dateB = new Date(fieldB) || new Date(0);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      const comparison = fieldA.toString().localeCompare(fieldB.toString());
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [loans, searchQuery, amountFilter, sortField, sortOrder]);

  const paginatedLoans = filteredLoans.slice(
    (currentPage - 1) * loansPerPage,
    currentPage * loansPerPage
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleAmountChange = (e) => {
    setAmountFilter({ ...amountFilter, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const openLoanModal = (loan) => {
    setSelectedLoan(loan);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="loan-history-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading loan history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loan-history-container">
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-button" onClick={fetchLoans}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="loan-history-container">
      <div className="header">
        <h2>Loan History</h2>
        <div className="header-actions">
          <button className="refresh-button" onClick={fetchLoans}>
            Refresh
          </button>
          <button
            className="back-button"
            onClick={() => navigate('/borrower-dashboard')}
            aria-label="Back to borrower dashboard"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="stats">
        <div className="stat-item">
          <h4>Approved</h4>
          <p>{getStatusCount(loans, 'approved')}</p>
        </div>
        <div className="stat-item">
          <h4>Pending</h4>
          <p>{getStatusCount(loans, 'pending')}</p>
        </div>
        <div className="stat-item">
          <h4>Rejected</h4>
          <p>{getStatusCount(loans, 'rejected')}</p>
        </div>
        <div className="stat-item">
          <h4>Repaid</h4>
          <p>{getStatusCount(loans, 'repaid')}</p>
        </div>
        <div className="stat-item">
          <h4>Defaulted</h4>
          <p>{getStatusCount(loans, 'defaulted')}</p>
        </div>
      </div>

      <div className="controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by Loan ID or Purpose..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="filters">
          <select value={statusFilter} onChange={handleStatusFilter}>
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
            <option value="repaid">Repaid</option>
            <option value="defaulted">Defaulted</option>
          </select>
          <div className="amount-filter">
            <input
              type="number"
              name="min"
              placeholder="Min Amount"
              value={amountFilter.min}
              onChange={handleAmountChange}
              min="0"
            />
            <input
              type="number"
              name="max"
              placeholder="Max Amount"
              value={amountFilter.max}
              onChange={handleAmountChange}
              min="0"
            />
          </div>
        </div>
      </div>

      {filteredLoans.length === 0 ? (
        <p className="no-data">No loans found.</p>
      ) : (
        <table className="loan-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('_id')}>
                Loan ID {sortField === '_id' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('amount')}>
                Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')}>
                Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('createdAt')}>
                Date {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLoans.map((loan) => (
              <tr key={loan._id || Math.random()}>
                <td>{loan._id ? loan._id.slice(-6) : 'N/A'}</td>
                <td>{loan.amount ? formatCurrency(loan.amount) : 'N/A'}</td>
                <td>
                  <span className={`status-badge status-${loan.status?.toLowerCase()}`}>
                    {loan.status ? loan.status.charAt(0).toUpperCase() + loan.status.slice(1) : 'N/A'}
                  </span>
                </td>
                <td>
                  {loan.createdAt
                    ? new Date(loan.createdAt).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td>
                  <button
                    className="view-details-button"
                    onClick={() => openLoanModal(loan)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      {showModal && selectedLoan && (
        <div className="modal">
          <div className="modal-content">
            <h2>Loan Details</h2>
            <p><strong>Loan ID:</strong> {selectedLoan._id || 'N/A'}</p>
            <p><strong>Amount:</strong> {selectedLoan.amount ? formatCurrency(selectedLoan.amount) : 'N/A'}</p>
            <p><strong>Remaining Balance:</strong> {selectedLoan.remainingBalance ? formatCurrency(selectedLoan.remainingBalance) : 'N/A'}</p>
            <p><strong>Status:</strong> 
              <span className={`status-badge status-${selectedLoan.status?.toLowerCase()}`}>
                {selectedLoan.status ? selectedLoan.status.charAt(0).toUpperCase() + selectedLoan.status.slice(1) : 'N/A'}
              </span>
            </p>
            <p><strong>Purpose:</strong> {selectedLoan.purpose || 'N/A'}</p>
            <p><strong>Term:</strong> {selectedLoan.term ? `${selectedLoan.term} months` : 'N/A'}</p>
            <p><strong>Date Applied:</strong> {selectedLoan.createdAt ? new Date(selectedLoan.createdAt).toLocaleString() : 'N/A'}</p>
            <p><strong>Last Updated:</strong> {selectedLoan.updatedAt ? new Date(selectedLoan.updatedAt).toLocaleString() : 'N/A'}</p>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanHistory;