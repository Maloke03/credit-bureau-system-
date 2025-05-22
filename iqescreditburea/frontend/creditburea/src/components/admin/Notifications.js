import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token'); // or from your auth context
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div>
      <h1>Notifications and Alerts</h1>
      <p>Set up and manage alerts for delinquent accounts, disputes, downtime, and reminders.</p>

      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <p>No new notifications</p>
      ) : (
        <ul>
          {notifications.map((n, idx) => (
            <li key={idx}>
              <strong>{n.type.toUpperCase()}:</strong> {n.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;
