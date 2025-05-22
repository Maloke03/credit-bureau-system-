// src/components/pages/borrower/BorrowerProfileDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../css/BorrowerProfileDetails.css';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000',
  timeout: 10000,
});

function BorrowerProfileDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        const response = await api.get(`/api/borrower/profiles/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data.profile);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile: ' + (err.message || 'Server error'));
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="borrower-profile-details-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="borrower-profile-details-container">
        <div className="error-message">
          <p>{error}</p>
          <button className="back-button" onClick={() => navigate('/borrower-profiles')}>
            Back to Profiles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="borrower-profile-details-container">
      <div className="header">
        <h1>Borrower Profile</h1>
        <button className="back-button" onClick={() => navigate('/borrower-profiles')}>
          Back to Profiles
        </button>
      </div>
      {profile && (
        <div className="profile-details">
          <div className="detail-card">
            <h2>Personal Information</h2>
            <p><strong>Name:</strong> {profile.fullName || 'N/A'}</p>
            <p><strong>Email:</strong> {profile.email || 'N/A'}</p>
            <p><strong>Phone:</strong> {profile.phone || 'N/A'}</p>
            <p><strong>Addresses:</strong> {profile.address?.length > 0 ? profile.address.join(', ') : 'N/A'}</p>
          </div>
          <div className="detail-card">
            <h2>Credit Information</h2>
            <p><strong>Credit Score:</strong> {profile.creditScore || 'N/A'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default BorrowerProfileDetails;