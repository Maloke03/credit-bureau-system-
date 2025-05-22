// src/components/pages/DisbursedLoans.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Added import
import axios from 'axios';
import '../css/DisbursedLoans.css';

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

const DisbursedLoans = () => {
  const navigate = useNavigate(); // Added for navigation
  const [loans, setLoans] = useState([]);
  const [loanInfo, setLoanInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [sortField, setSortField] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLoans, setSelectedLoans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const loansPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      setLoading(true);
      const [loansRes, infoRes] = await Promise.all([
        api.get('/api/loans/disbursed', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/api/loan-info', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setLoans(loansRes.data.loans || []);
      setLoanInfo(infoRes.data.info);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data: ' + (err.message || 'Server error'));
      setLoading(false);
    }
  };

  // Search and filter loans
  const filteredLoans = useMemo(() => {
    let result = [...loans];

    // Search by borrower name or email
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (loan) =>
          loan.fullName?.toLowerCase().includes(query) ||
          loan.email?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (statusFilter) {
      result = result.filter((loan) => loan.status === statusFilter);
    }

    // Filter by amount
    if (amountFilter.min !== '' || amountFilter.max !== '') {
      result = result.filter((loan) => {
        const amount = loan.amount || 0;
        const min = amountFilter.min !== '' ? Number(amountFilter.min) : -Infinity;
        const max = amountFilter.max !== '' ? Number(amountFilter.max) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    // Sort loans
    result.sort((a, b) => {
      const fieldA = a[sortField] || '';
      const fieldB = b[sortField] || '';
      if (sortField === 'amount') {
        const amountA = fieldA || 0;
        const amountB = fieldB || 0;
        return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
      }
      const comparison = fieldA.toString().localeCompare(fieldB.toString());
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [loans, searchQuery, statusFilter, amountFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredLoans.length / loansPerPage);
  const paginatedLoans = filteredLoans.slice(
    (currentPage - 1) * loansPerPage,
    currentPage * loansPerPage
  );

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle amount filter
  const handleAmountChange = (e) => {
    setAmountFilter({ ...amountFilter, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle loan selection
  const handleSelectLoan = (loanId) => {
    setSelectedLoans((prev) =>
      prev.includes(loanId) ? prev.filter((id) => id !== loanId) : [...prev, loanId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedLoans.length === paginatedLoans.length) {
      setSelectedLoans([]);
    } else {
      setSelectedLoans(paginatedLoans.map((loan) => loan._id));
    }
  };

  // Handle update status
  const handleUpdateStatus = async (loanId, status) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await api.patch(
        `/api/loans/${loanId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLoans((prev) =>
        prev.map((loan) => (loan._id === loanId ? { ...loan, status } : loan))
      );
      showToast(`Loan status updated to ${status}`, 'success');
    } catch (err) {
      showToast('Failed to update loan status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk update status
  const handleBulkUpdate = async (status) => {
    if (!selectedLoans.length) {
      showToast('Please select at least one loan', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      await api.patch(
        '/api/loans/bulk-status',
        { loanIds: selectedLoans, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLoans((prev) =>
        prev.map((loan) =>
          selectedLoans.includes(loan._id) ? { ...loan, status } : loan
        )
      );
      setSelectedLoans([]);
      showToast(`Selected loans updated to ${status}`, 'success');
    } catch (err) {
      showToast('Failed to update loans', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Export loans
  const exportLoans = (format) => {
    if (!filteredLoans.length) {
      showToast('No loans to export', 'error');
      return;
    }

    if (format === 'csv') {
      const headers = ['Borrower', 'Email', 'Amount', 'Status'];
      const rows = filteredLoans.map((loan) => [
        loan.fullName || 'Unknown',
        loan.email || 'N/A',
        loan.amount || 'N/A',
        loan.status || 'N/A',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'disbursed-loans.csv';
      link.click();
      showToast('Loans exported as CSV', 'success');
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(filteredLoans, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'disbursed-loans.json';
      link.click();
      showToast('Loans exported as JSON', 'success');
    }
  };

  // Show toast notification
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Open loan modal
  const openLoanModal = (loan) => {
    setSelectedLoan(loan);
    setShowModal(true);
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'badge-approved';
      case 'rejected':
        return 'badge-rejected';
      case 'pending':
        return 'badge-pending';
      default:
        return 'badge-neutral';
    }
  };

  if (loading) {
    return (
      <div className="disbursed-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="disbursed-container">
        <div className="error-message">
          <p>{error}</p>
          <div className="error-actions">
            <button className="retry-button" onClick={fetchData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="disbursed-container">
      {loanInfo && (
        <div className="loan-types-bar">
          {loanInfo.loanTypes.map((type, idx) => (
            <span key={idx} className="loan-type-item">{type}</span>
          ))}
        </div>
      )}

      <div className="header">
        <h2>Disbursed Loans</h2>
        <button
          className="back-button"
          onClick={() => {
            console.log('Navigating to /lender-dashboard');
            navigate('/lender-dashboard');
          }}
          aria-label="Back to lender dashboard"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by borrower name or email..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="filters">
          <select value={statusFilter} onChange={handleStatusChange}>
            <option value="">All Statuses</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
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
        <div className="export-buttons">
          <button className="export-button" onClick={() => exportLoans('csv')}>
            Export CSV
          </button>
          <button className="export-button" onClick={() => exportLoans('json')}>
            Export JSON
          </button>
        </div>
      </div>

      {selectedLoans.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedLoans.length} selected</span>
          <button
            className="bulk-action-button approve"
            onClick={() => handleBulkUpdate('approved')}
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : 'Approve Selected'}
          </button>
          <button
            className="bulk-action-button reject"
            onClick={() => handleBulkUpdate('rejected')}
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : 'Reject Selected'}
          </button>
        </div>
      )}

      <div className="loans-table">
        <div className="table-header">
          <div className="table-cell">
            <input
              type="checkbox"
              checked={selectedLoans.length === paginatedLoans.length}
              onChange={handleSelectAll}
            />
          </div>
          <div className="table-cell" onClick={() => handleSort('fullName')}>
            Borrower {sortField === 'fullName' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-cell">Email</div>
          <div className="table-cell" onClick={() => handleSort('amount')}>
            Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-cell" onClick={() => handleSort('status')}>
            Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-cell">Actions</div>
        </div>
        {paginatedLoans.length > 0 ? (
          paginatedLoans.map((loan) => (
            <div key={loan._id} className="table-row">
              <div className="table-cell">
                <input
                  type="checkbox"
                  checked={selectedLoans.includes(loan._id)}
                  onChange={() => handleSelectLoan(loan._id)}
                />
              </div>
              <div className="table-cell">{loan.fullName || 'Unknown'}</div>
              <div className="table-cell">{loan.email || 'N/A'}</div>
              <div className="table-cell">${loan.amount || 'N/A'}</div>
              <div className="table-cell">
                <span className={`badge ${getStatusClass(loan.status)}`}>
                  {loan.status || 'N/A'}
                </span>
              </div>
              <div className="table-cell actions">
                <button
                  className="view-details-button"
                  onClick={() => openLoanModal(loan)}
                  disabled={actionLoading}
                >
                  Preview
                </button>
                <button
                  className="btn approve"
                  onClick={() => handleUpdateStatus(loan._id, 'approved')}
                  disabled={actionLoading}
                >
                  Approve
                </button>
                <button
                  className="btn reject"
                  onClick={() => handleUpdateStatus(loan._id, 'rejected')}
                  disabled={actionLoading}
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-loans">
            <p>No loans match the criteria.</p>
          </div>
        )}
      </div>

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
            <h2>{selectedLoan.fullName || 'Unknown'}</h2>
            <p><strong>Email:</strong> {selectedLoan.email || 'N/A'}</p>
            <p><strong>Amount:</strong> ${selectedLoan.amount || 'N/A'}</p>
            <p><strong>Status:</strong> {selectedLoan.status || 'N/A'}</p>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {loanInfo && (
        <div className="two-column-info">
          <div className="info-section">
            <h3>Eligibility Criteria</h3>
            <ul>
              {loanInfo.eligibilityCriteria.map((criteria, idx) => (
                <li key={idx}>{criteria}</li>
              ))}
            </ul>
          </div>
          <div className="info-section">
            <h3>Disbursement Process</h3>
            <ol>
              {loanInfo.disbursementProcess.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
      {loanInfo && (
        <div className="loan-footer">
          <div className="faq-section">
            <h3>FAQs</h3>
            <ul>
              {loanInfo.faqs.map((faq, idx) => (
                <li key={idx}>
                  <strong>Q: {faq.question}</strong><br />
                  A: {faq.answer}
                </li>
              ))}
            </ul>
          </div>
          <div className="contact-section">
            <h3>Contact Information</h3>
            <p>{loanInfo.contactInfo}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisbursedLoans;