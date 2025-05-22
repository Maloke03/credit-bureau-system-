// src/components/pages/RepaymentTracker.js
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Added import
import axios from 'axios';
import '../css/RepaymentTracker.css';

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

const RepaymentTracker = () => {
  const navigate = useNavigate(); // Added for navigation
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [amountFilter, setAmountFilter] = useState({ min: '', max: '' });
  const [purposeFilter, setPurposeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [sortField, setSortField] = useState('borrowerName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedRepayment, setSelectedRepayment] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const repaymentsPerPage = 10;

  // Format currency for Lesotho Loti (M)
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-LS', { style: 'currency', currency: 'LSL' }).format(amount);

  useEffect(() => {
    fetchRepayments();
  }, []);

  const fetchRepayments = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      setLoading(true);
      const res = await api.get('/api/repayments', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRepayments(res.data.repayments || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load repayments: ' + (err.message || 'Server error'));
      setLoading(false);
    }
  };

  // Search and filter repayments
  const filteredRepayments = useMemo(() => {
    let result = [...repayments];

    // Search by borrower name or email
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (entry) =>
          entry.borrowerName?.toLowerCase().includes(query) ||
          entry.borrowerEmail?.toLowerCase().includes(query)
      );
    }

    // Filter by amount
    if (amountFilter.min !== '' || amountFilter.max !== '') {
      result = result.filter((entry) => {
        const amount = entry.amountPaid || 0;
        const min = amountFilter.min !== '' ? Number(amountFilter.min) : -Infinity;
        const max = amountFilter.max !== '' ? Number(amountFilter.max) : Infinity;
        return amount >= min && amount <= max;
      });
    }

    // Filter by purpose
    if (purposeFilter) {
      result = result.filter((entry) => entry.purpose?.toLowerCase().includes(purposeFilter.toLowerCase()));
    }

    // Filter by date range
    if (dateFilter.start || dateFilter.end) {
      result = result.filter((entry) => {
        const repaymentDate = new Date(entry.repaymentDate);
        const start = dateFilter.start ? new Date(dateFilter.start) : new Date(-8640000000000000);
        const end = dateFilter.end ? new Date(dateFilter.end) : new Date(8640000000000000);
        return repaymentDate >= start && repaymentDate <= end;
      });
    }

    // Sort repayments
    result.sort((a, b) => {
      const fieldA = a[sortField] || '';
      const fieldB = b[sortField] || '';
      if (sortField === 'amountPaid') {
        const amountA = fieldA || 0;
        const amountB = fieldB || 0;
        return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
      } else if (sortField === 'repaymentDate') {
        const dateA = new Date(fieldA) || new Date(0);
        const dateB = new Date(fieldB) || new Date(0);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
      const comparison = fieldA.toString().localeCompare(fieldB.toString());
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [repayments, searchQuery, amountFilter, purposeFilter, dateFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredRepayments.length / repaymentsPerPage);
  const paginatedRepayments = filteredRepayments.slice(
    (currentPage - 1) * repaymentsPerPage,
    currentPage * repaymentsPerPage
  );

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle amount filter
  const handleAmountChange = (e) => {
    setAmountFilter({ ...amountFilter, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  // Handle purpose filter
  const handlePurposeChange = (e) => {
    setPurposeFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle date filter
  const handleDateChange = (e) => {
    setDateFilter({ ...dateFilter, [e.target.name]: e.target.value });
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

  // Export repayments
  const exportRepayments = (format) => {
    if (!filteredRepayments.length) {
      showToast('No repayments to export', 'error');
      return;
    }

    if (format === 'csv') {
      const headers = [
        'Borrower',
        'Email',
        'Loan ID',
        'Purpose',
        'Loan Term',
        'Amount Paid',
        'Repayment Date',
      ];
      const rows = filteredRepayments.map((entry) => [
        entry.borrowerName || 'Unknown',
        entry.borrowerEmail || 'N/A',
        entry.loanId || 'N/A',
        entry.purpose || 'N/A',
        entry.term ? `${entry.term} months` : 'N/A',
        formatCurrency(entry.amountPaid || 0), // Updated to use formatCurrency
        entry.repaymentDate ? new Date(entry.repaymentDate).toLocaleDateString() : 'N/A',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'repayments.csv';
      link.click();
      showToast('Repayments exported as CSV', 'success');
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(filteredRepayments, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'repayments.json';
      link.click();
      showToast('Repayments exported as JSON', 'success');
    }
  };

  // Show toast notification
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Open repayment modal
  const openRepaymentModal = (repayment) => {
    setSelectedRepayment(repayment);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="repayment-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading repayments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="repayment-container">
        <div className="error-message">
          <p>{error}</p>
          <div className="error-actions">
            <button className="retry-button" onClick={fetchRepayments}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="repayment-container">
      <div className="header">
        <h2>Repayment Tracker</h2>
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
          <input
            type="text"
            placeholder="Loan Purpose"
            value={purposeFilter}
            onChange={handlePurposeChange}
          />
          <div className="date-filter">
            <input
              type="date"
              name="start"
              value={dateFilter.start}
              onChange={handleDateChange}
            />
            <input
              type="date"
              name="end"
              value={dateFilter.end}
              onChange={handleDateChange}
            />
          </div>
        </div>
        <div className="export-buttons">
          <button className="export-button" onClick={() => exportRepayments('csv')}>
            Export CSV
          </button>
          <button className="export-button" onClick={() => exportRepayments('json')}>
            Export JSON
          </button>
        </div>
      </div>

      {filteredRepayments.length === 0 ? (
        <p className="no-data">No repayments found.</p>
      ) : (
        <table className="repayment-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('borrowerName')}>
                Borrower {sortField === 'borrowerName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Email</th>
              <th>Loan ID</th>
              <th onClick={() => handleSort('purpose')}>
                Purpose {sortField === 'purpose' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('term')}>
                Loan Term {sortField === 'term' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('amountPaid')}>
                Amount Paid {sortField === 'amountPaid' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('repaymentDate')}>
                Repayment Date {sortField === 'repaymentDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRepayments.map((entry) => (
              <tr key={entry._id}>
                <td>{entry.borrowerName || 'Unknown'}</td>
                <td>{entry.borrowerEmail || 'N/A'}</td>
                <td>{entry.loanId || 'N/A'}</td>
                <td>{entry.purpose || 'N/A'}</td>
                <td>{entry.term ? `${entry.term} months` : 'N/A'}</td>
                <td>{formatCurrency(entry.amountPaid || 0)}</td>
                <td>
                  {entry.repaymentDate
                    ? new Date(entry.repaymentDate).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td>
                  <button
                    className="view-details-button"
                    onClick={() => openRepaymentModal(entry)}
                  >
                    Preview
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

      {showModal && selectedRepayment && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedRepayment.borrowerName || 'Unknown'}</h2>
            <p><strong>Email:</strong> {selectedRepayment.borrowerEmail || 'N/A'}</p>
            <p><strong>Loan ID:</strong> {selectedRepayment.loanId || 'N/A'}</p>
            <p><strong>Purpose:</strong> {selectedRepayment.purpose || 'N/A'}</p>
            <p><strong>Loan Term:</strong> {selectedRepayment.term ? `${selectedRepayment.term} months` : 'N/A'}</p>
            <p><strong>Amount Paid:</strong> {formatCurrency(selectedRepayment.amountPaid || 0)}</p>
            <p><strong>Repayment Date:</strong> {selectedRepayment.repaymentDate ? new Date(selectedRepayment.repaymentDate).toLocaleDateString() : 'N/A'}</p>
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
    </div>
  );
};

export default RepaymentTracker;