import { useEffect, useState } from 'react';
import '../css/Lenderborrows.css';

function Lenderborrows() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/borrower/profiles', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setProfiles(data.profiles);
        } else {
          setError(data.message);
        }
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError('Failed to fetch borrower profiles.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  if (loading) return <p className="loading">Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (profiles.length === 0) return <p className="no-profiles">No borrower profiles found.</p>;

  return (
    <div className="lender-borrows-container">
      <h2>Borrower Profiles</h2>
      <table className="profiles-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>Email</th>
            <th>Addresses</th>
            <th>Phone</th>
            <th>Joined On</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr key={profile._id}>
              <td>{profile.fullName || 'N/A'}</td>
              <td>{profile.email || 'N/A'}</td>
              <td>
                {profile.address && profile.address.length > 0 ? (
                  <ul>
                    {profile.address.map((addr, index) => (
                      <li key={index}>{addr}</li>
                    ))}
                  </ul>
                ) : (
                  'No addresses'
                )}
              </td>
              <td>{profile.phone || 'N/A'}</td>
              <td>{new Date(profile.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Lenderborrows;