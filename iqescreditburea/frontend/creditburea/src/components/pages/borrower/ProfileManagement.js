import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/ProfileManagement.css'; // Corrected path

function ProfileManagement() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    address: [],
    phone: ''
  });
  const [formData, setFormData] = useState({
    fullName: '',
    addAddress: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setTokenValid(false);
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/borrower/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setTokenValid(false);
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (response.ok && data.profile) {
        setProfile(data.profile);
        setFormData({
          fullName: data.profile.fullName || '',
          addAddress: '',
          phone: data.profile.phone || ''
        });
      } else {
        setMessage(data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Fetch Profile Error:', error);
      setMessage('An error occurred while fetching your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName && !formData.addAddress && !formData.phone) {
      setMessage('Please provide at least one field to update');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/borrower/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        setTokenValid(false);
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setProfile(data.profile);
        setFormData({
          fullName: data.profile.fullName || '',
          addAddress: '',
          phone: data.profile.phone || ''
        });
        setMessage('Profile updated successfully');
      } else {
        setMessage(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update Profile Error:', error);
      setMessage('An error occurred while updating your profile');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="profile-management-container">
        <p>Please login to access this page.</p>
        <button onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="profile-management-container">
      <h2>Profile Management</h2>
      {message && <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>{message}</div>}
      {loading ? (
        <p>Loading profile...</p>
      ) : (
        <>
          <div className="profile-details">
            <h3>Current Profile</h3>
            <p><strong>Full Name:</strong> {profile.fullName || 'Not set'}</p>
            <p><strong>Email:</strong> {profile.email || 'Not set'}</p>
            <p><strong>Phone:</strong> {profile.phone || 'Not set'}</p>
            <p><strong>Addresses:</strong>
              {profile.address && profile.address.length > 0 ? (
                <ul>
                  {profile.address.map((addr, index) => (
                    <li key={index}>{addr}</li>
                  ))}
                </ul>
              ) : (
                ' No addresses set'
              )}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="profile-form">
            <h3>Update Profile</h3>
            <label>
              Full Name:
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Enter full name"
              />
            </label>
            <label>
              Phone Number:
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </label>
            <label>
              Add Address:
              <input
                type="text"
                name="addAddress"
                value={formData.addAddress}
                onChange={handleChange}
                placeholder="Enter new address"
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </>
      )}
      <button className="back-button" onClick={() => navigate('/borrower-dashboard')} disabled={loading}>
        Back to Dashboard
      </button>
    </div>
  );
}

export default ProfileManagement;