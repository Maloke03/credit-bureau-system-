// src/App.js
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import './App.css';

// Main Components
import Home from './components/Home';
import About from './components/About';
import Services from './components/Services';
import Contact from './components/Contact';

// Auth Components
import Register from './components/auth/Register';
import Login from './components/auth/Login';

// Dashboard Components
import BorrowerDashboard from './components/dashboard/BorrowerDashboard';
import LenderDashboard from './components/dashboard/LenderDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';

// Lender Pages
import LoanApplications from './components/pages/LoanApplications';
import DisbursedLoans from './components/pages/DisbursedLoans';
import RepaymentTracker from './components/pages/RepaymentTracker';
import LenderReports from './components/pages/LenderReports';
import BorrowerProfiles from './components/pages/borrower/BorrowerProfiles';

// Borrower Pages
import CreditReport from './components/pages/borrower/creditreport';
import ApplyLoan from './components/pages/borrower/ApplyLoan';
import LoanHistory from './components/pages/borrower/LoanHistory';
import MakeRepayment from './components/pages/borrower/MakeRepayment';
import ProfileManagement from './components/pages/borrower/ProfileManagement'; // Import the new component

// Admin Pages
import UserManagement from './components/admin/UserManagement';
import ConsumerCreditProfiles from './components/admin/ConsumerCreditProfiles';
import DataIntegrity from './components/admin/DataIntegrity';
import SystemMaintenance from './components/admin/SystemMaintenance';
import Notifications from './components/admin/Notifications';
import Applications from './components/admin/Applications';

// Utility to check authentication
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

// Utility to get current role
const getCurrentRole = () => {
  return localStorage.getItem('role');
};

// ProtectedRoute wrapper
const ProtectedRoute = ({ requiredRole, element }) => {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requiredRole && getCurrentRole() !== requiredRole) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return element;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Borrower Routes */}
          <Route
            path="/borrower-dashboard"
            element={<ProtectedRoute requiredRole="borrower" element={<BorrowerDashboard />} />}
          />
          <Route
            path="/borrower/creditreport"
            element={<ProtectedRoute requiredRole="borrower" element={<CreditReport />} />}
          />
          <Route
            path="/borrower/applyloan"
            element={<ProtectedRoute requiredRole="borrower" element={<ApplyLoan />} />}
          />
          <Route
            path="/borrower/loanhistory"
            element={<ProtectedRoute requiredRole="borrower" element={<LoanHistory />} />}
          />
          <Route
            path="/borrower/makerepayment"
            element={<ProtectedRoute requiredRole="borrower" element={<MakeRepayment />} />}
          />
          <Route
            path="/borrower/profile"
            element={<ProtectedRoute requiredRole="borrower" element={<ProfileManagement />} />}
          />

          {/* Lender Routes */}
          <Route
            path="/lender-dashboard"
            element={<ProtectedRoute requiredRole="lender" element={<LenderDashboard />} />}
          />
          <Route
            path="/loan-applications"
            element={<ProtectedRoute requiredRole="lender" element={<LoanApplications />} />}
          />
          <Route
            path="/disbursed-loans"
            element={<ProtectedRoute requiredRole="lender" element={<DisbursedLoans />} />}
          />
          <Route
            path="/repayments"
            element={<ProtectedRoute requiredRole="lender" element={<RepaymentTracker />} />}
          />
          <Route
            path="/reports"
            element={<ProtectedRoute requiredRole="lender" element={<LenderReports />} />}
          />
          <Route
            path="/borrower-profiles"
            element={<ProtectedRoute requiredRole="lender" element={<BorrowerProfiles />} />}
          />

          {/* Admin Routes */}
          <Route
            path="/admin-dashboard"
            element={<ProtectedRoute requiredRole="admin" element={<AdminDashboard />} />}
          >
            <Route path="user-management" element={<UserManagement />} />
            <Route path="consumer-credit-profiles" element={<ConsumerCreditProfiles />} />
            <Route path="data-integrity" element={<DataIntegrity />} />
            <Route path="system-maintenance" element={<SystemMaintenance />} />
            <Route path="notifications-alerts" element={<Notifications />} />
            <Route path="applications" element={<Applications />} />
            <Route index element={<Navigate to="user-management" replace />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;