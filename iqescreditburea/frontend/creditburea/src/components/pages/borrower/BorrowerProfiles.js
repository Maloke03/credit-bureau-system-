// src/components/pages/borrower/BorrowerProfiles.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/BorrowerProfiles.css';

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

function BorrowerProfiles() {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [creditScoreFilter, setCreditScoreFilter] = useState({ min: '', max: '' });
  const [statusFilter, setStatusFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [sortField, setSortField] = useState('fullName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const profilesPerPage = 10;

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      setLoading(true);
      const response = await api.get('/api/borrower/profiles', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProfiles(response.data.profiles || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load borrower profiles: ' + (err.message || 'Server error'));
      setLoading(false);
    }
  };

  // Search and filter profiles
  const filteredProfiles = useMemo(() => {
    let result = [...profiles];

    // Search by name, email, or phone
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (profile) =>
          profile.fullName?.toLowerCase().includes(query) ||
          profile.email?.toLowerCase().includes(query) ||
          profile.phone?.toLowerCase().includes(query)
      );
    }

    // Filter by credit score
    if (creditScoreFilter.min !== '' || creditScoreFilter.max !== '') {
      result = result.filter((profile) => {
        const score = profile.creditScore || 0;
        const min = creditScoreFilter.min !== '' ? Number(creditScoreFilter.min) : -Infinity;
        const max = creditScoreFilter.max !== '' ? Number(creditScoreFilter.max) : Infinity;
        return score >= min && score <= max;
      });
    }

    // Filter by status
    if (statusFilter) {
      result = result.filter((profile) => profile.status === statusFilter);
    }

    // Filter by phone presence
    if (phoneFilter) {
      result = result.filter((profile) => (phoneFilter === 'hasPhone' ? profile.phone : !profile.phone));
    }

    // Sort profiles
    result.sort((a, b) => {
      const fieldA = a[sortField] || '';
      const fieldB = b[sortField] || '';
      if (sortField === 'creditScore') {
        const scoreA = fieldA || 0;
        const scoreB = fieldB || 0;
        return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
      }
      const comparison = fieldA.toString().localeCompare(fieldB.toString());
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [profiles, searchQuery, creditScoreFilter, statusFilter, phoneFilter, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredProfiles.length / profilesPerPage);
  const paginatedProfiles = filteredProfiles.slice(
    (currentPage - 1) * profilesPerPage,
    currentPage * profilesPerPage
  );

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  // Handle credit score filter
  const handleCreditScoreChange = (e) => {
    setCreditScoreFilter({ ...creditScoreFilter, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle phone filter
  const handlePhoneFilterChange = (e) => {
    setPhoneFilter(e.target.value);
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

  // Handle profile selection
  const handleSelectProfile = (profileId) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProfiles.length === paginatedProfiles.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(paginatedProfiles.map((profile) => profile._id));
    }
  };

  // Bulk archive profiles
  const handleBulkArchive = async () => {
    if (!selectedProfiles.length) {
      showToast('Please select at least one profile', 'error');
      return;
    }

    try {
      setActionLoading(true);
      await api.post(
        '/api/borrower/profiles/archive',
        { profileIds: selectedProfiles },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setProfiles((prev) =>
        prev.map((profile) =>
          selectedProfiles.includes(profile._id)
            ? { ...profile, status: 'Inactive' }
            : profile
        )
      );
      setSelectedProfiles([]);
      showToast('Selected profiles archived successfully', 'success');
    } catch (err) {
      showToast('Failed to archive profiles', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Export profiles
  const exportProfiles = (format) => {
    if (!filteredProfiles.length) {
      showToast('No profiles to export', 'error');
      return;
    }

    if (format === 'csv') {
      const headers = ['Full Name', 'Email', 'Credit Score', 'Phone', 'Addresses', 'Status'];
      const rows = filteredProfiles.map((profile) => [
        profile.fullName || 'Unknown',
        profile.email || 'N/A',
        profile.creditScore || 'N/A',
        profile.phone || 'N/A',
        profile.address?.length > 0 ? profile.address.join('; ') : 'N/A',
        profile.status || 'N/A',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'borrower-profiles.csv';
      link.click();
      showToast('Profiles exported as CSV', 'success');
    } else if (format === 'json') {
      const jsonContent = JSON.stringify(filteredProfiles, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'borrower-profiles.json';
      link.click();
      showToast('Profiles exported as JSON', 'success');
    }
  };

  // Show toast notification
  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Open profile modal
  const openProfileModal = (profile) => {
    setSelectedProfile(profile);
    setShowModal(true);
  };

  // Get credit score badge class
  const getCreditScoreClass = (score) => {
    if (!score) return 'badge-neutral';
    if (score >= 700) return 'badge-excellent';
    if (score >= 600) return 'badge-good';
    return 'badge-poor';
  };

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Active':
        return 'badge-active';
      case 'Inactive':
        return 'badge-inactive';
      case 'Pending':
        return 'badge-pending';
      default:
        return 'badge-neutral';
    }
  };

  if (loading) {
    return (
      <div className="borrower-profiles-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="borrower-profiles-container">
        <div className="error-message">
          <p>{error}</p>
          <div className="error-actions">
            <button className="retry-button" onClick={fetchProfiles}>
              Retry
            </button>
            <button className="back-button" onClick={() => navigate('/lender-dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="borrower-profiles-container">
      <div className="header">
        <h1>Borrower Profiles</h1>
        <button className="back-button" onClick={() => navigate('/lender-dashboard')}>
          Back to Dashboard
        </button>
      </div>

      <div className="controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <div className="filters">
          <div className="credit-score-filter">
            <input
              type="number"
              name="min"
              placeholder="Min Credit Score"
              value={creditScoreFilter.min}
              onChange={handleCreditScoreChange}
              min="300"
              max="850"
            />
            <input
              type="number"
              name="max"
              placeholder="Max Credit Score"
              value={creditScoreFilter.max}
              onChange={handleCreditScoreChange}
              min="300"
              max="850"
            />
          </div>
          <select value={statusFilter} onChange={handleStatusChange}>
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Pending">Pending</option>
          </select>
          <select value={phoneFilter} onChange={handlePhoneFilterChange}>
            <option value="">All Phone Status</option>
            <option value="hasPhone">Has Phone</option>
            <option value="noPhone">No Phone</option>
          </select>
        </div>
        <div className="export-buttons">
          <button className="export-button" onClick={() => exportProfiles('csv')}>
            Export CSV
          </button>
          <button className="export-button" onClick={() => exportProfiles('json')}>
            Export JSON
          </button>
        </div>
      </div>

      {selectedProfiles.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedProfiles.length} selected</span>
          <button
            className="bulk-action-button"
            onClick={handleBulkArchive}
            disabled={actionLoading}
          >
            {actionLoading ? 'Archiving...' : 'Archive Selected'}
          </button>
        </div>
      )}

      <div className="profiles-table">
        <div className="table-header">
          <div className="table-cell">
            <input
              type="checkbox"
              checked={selectedProfiles.length === paginatedProfiles.length}
              onChange={handleSelectAll}
            />
          </div>
          <div className="table-cell" onClick={() => handleSort('fullName')}>
            Name {sortField === 'fullName' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-cell" onClick={() => handleSort('email')}>
            Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-cell" onClick={() => handleSort('creditScore')}>
            Credit Score {sortField === 'creditScore' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-cell">Phone</div>
          <div className="table-cell" onClick={() => handleSort('status')}>
            Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
          </div>
          <div className="table-cell">Addresses</div>
          <div className="table-cell">Actions</div>
        </div>
        {paginatedProfiles.length > 0 ? (
          paginatedProfiles.map((profile) => (
            <div key={profile._id} className="table-row">
              <div className="table-cell">
                <input
                  type="checkbox"
                  checked={selectedProfiles.includes(profile._id)}
                  onChange={() => handleSelectProfile(profile._id)}
                />
              </div>
              <div className="table-cell">{profile.fullName || 'Unknown'}</div>
              <div className="table-cell">{profile.email || 'N/A'}</div>
              <div className="table-cell">
                <span className={`badge ${getCreditScoreClass(profile.creditScore)}`}>
                  {profile.creditScore || 'N/A'}
                </span>
              </div>
              <div className="table-cell">{profile.phone || 'N/A'}</div>
              <div className="table-cell">
                <span className={`badge ${getStatusClass(profile.status)}`}>
                  {profile.status || 'N/A'}
                </span>
              </div>
              <div className="table-cell">
                {profile.address?.length > 0 ? profile.address.join(', ') : 'N/A'}
              </div>
              <div className="table-cell actions">
                <button
                  className="view-details-button"
                  onClick={() => openProfileModal(profile)}
                >
                  Preview
                </button>
                <button
                  className="view-details-button"
                  onClick={() => navigate(`/borrower-profiles/${profile._id}`)}
                >
                  Details
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-profiles">
            <p>No borrower profiles match the criteria.</p>
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

      {showModal && selectedProfile && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedProfile.fullName || 'Unknown'}</h2>
            <p><strong>Email:</strong> {selectedProfile.email || 'N/A'}</p>
            <p><strong>Credit Score:</strong> {selectedProfile.creditScore || 'N/A'}</p>
            <p><strong>Phone:</strong> {selectedProfile.phone || 'N/A'}</p>
            <p><strong>Status:</strong> {selectedProfile.status || 'N/A'}</p>
            <p><strong>Addresses:</strong> {selectedProfile.address?.join(', ') || 'N/A'}</p>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)}>Close</button>
              <button onClick={() => navigate(`/borrower-profiles/${selectedProfile._id}`)}>
                View Full Details
              </button>
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
}

export default BorrowerProfiles;