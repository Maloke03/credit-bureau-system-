import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import "../css/UserManagement.css"; 

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (index, field, value) => {
    setUsers(prev =>
      prev.map((user, i) =>
        i === index ? { ...user, [field]: value } : user
      )
    );
  };

  const handleUpdate = async (id, name, email) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${id}`, { name, email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      await axios.put(`http://localhost:5000/api/users/${id}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error('Role change failed:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="user-management-container">
      <h1>User Management</h1>
      {/* Back to Dashboard button */}
      <button
        onClick={() => navigate('/admin-dashboard')}
        className="back-to-dashboard-btn"
        aria-label="Back to Admin Dashboard"
      >
        🏠 Back to Dashboard
      </button>
      {error && <p className="error-text">{error}</p>}
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user._id}>
              <td>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="email"
                  value={user.email}
                  onChange={(e) => handleInputChange(index, 'email', e.target.value)}
                />
              </td>
              <td>
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user._id, e.target.value)}
                >
                  <option value="borrower">Borrower</option>
                  <option value="lender">Lender</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td>
                <button
                  onClick={() => handleUpdate(user._id, user.name, user.email)}
                >
                  Save
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;