import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import '../css/Admindashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation(); // Get current route

  // Check if the current route is ConsumerCreditProfiles, Applications, or DataIntegrity
  const hideSidebar = location.pathname === '/admin-dashboard/consumer-credit-profiles' ||
    location.pathname === '/admin-dashboard/applications' ||
    location.pathname === '/admin-dashboard/data-integrity';

  const handleNavigation = (path) => {
    navigate(`/admin-dashboard/${path}`);
  };

  return (
    <div className="admin-dashboard-container">
      {!hideSidebar && ( // Conditionally render sidebar
        <aside className="sidebar">
          <div className="nav-section">
            <button onClick={() => handleNavigation('user-management')}>
              👥 User Management
            </button>
            <button onClick={() => handleNavigation('consumer-credit-profiles')}>
              📋 Consumer Credit Profiles
            </button>
            <button onClick={() => handleNavigation('data-integrity')}>
              🛡️ Data Integrity
            </button>
            <button onClick={() => handleNavigation('system-maintenance')}>
              🔧 System Maintenance
            </button>
            <button onClick={() => handleNavigation('notifications-alerts')}>
              🔔 Notifications & Alerts
            </button>
            <button onClick={() => handleNavigation('applications')}>
              💰 Loan Applications
            </button>
          </div>
        </aside>
      )}
      <div className={`main-content ${hideSidebar ? 'full-width' : ''}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default AdminDashboard;