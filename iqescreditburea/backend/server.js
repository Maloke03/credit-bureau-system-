require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter for repayment endpoint
const repaymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many repayment attempts, please try again later' },
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema and Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['borrower', 'lender', 'admin'], required: true },
  createdAt: { type: Date, default: Date.now },
});
userSchema.index({ email: 1 });
const User = mongoose.model('User', userSchema);

// Credit Report Schema and Model
const creditReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  dob: { type: String, required: true },
  address: { type: String, required: true },
  region: { type: String, required: true },
  accounts: [{ type: String }],
  creditLimit: { type: Number, required: true },
  currentBalance: { type: Number, required: true },
  onTimePayments: { type: Number, required: true },
  latePayments: { type: Number, required: true },
  oldestAccountAge: { type: Number, required: true },
  accountTypes: { type: Number, required: true },
  inquiries: { type: Number, required: true },
  publicRecords: { type: String, required: true },
  creditScore: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});
const CreditReport = mongoose.model('CreditReport', creditReportSchema);

// Loan Application Schema and Model
const loanApplicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  amount: { type: Number, required: true },
  remainingBalance: { type: Number, default: 0 },
  purpose: { type: String, required: true },
  term: { type: Number, required: true },
  income: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'repaid', 'defaulted'], 
    default: 'pending' 
  },
  repaymentDate: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: { updatedAt: 'updatedAt' },
});
loanApplicationSchema.index({ userId: 1, createdAt: 1 });
const LoanApplication = mongoose.model('LoanApplication', loanApplicationSchema);

// Repayment Schema and Model
const repaymentSchema = new mongoose.Schema({
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanApplication', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  repaymentDate: { type: Date, default: Date.now },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  transactionId: { type: String },
});
repaymentSchema.index({ loanId: 1, repaymentDate: 1 });
const Repayment = mongoose.model('Repayment', repaymentSchema);

// Borrower Profile Schema and Model
const borrowerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: String,
  email: String,
  address: [{ type: String }],
  phone: String,
  createdAt: { type: Date, default: Date.now },
});
const BorrowerProfile = mongoose.model('BorrowerProfile', borrowerProfileSchema);

// Fraud Alert Schema and Model
const fraudAlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  alertType: { type: String, required: true },
  details: { type: String, required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  status: { type: String, enum: ['open', 'resolved', 'escalated'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
});
fraudAlertSchema.index({ userId: 1, status: 1 });
const FraudAlert = mongoose.model('FraudAlert', fraudAlertSchema);

// Transaction Log Schema and Model
const transactionLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  loanId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoanApplication' },
  action: { type: String, required: true },
  amount: { type: Number },
  status: { type: String, enum: ['success', 'failed', 'pending'], default: 'pending' },
  details: { type: String },
  createdAt: { type: Date, default: Date.now },
});
const TransactionLog = mongoose.model('TransactionLog', transactionLogSchema);

// Utility Functions
const hashPassword = async (password) => await bcrypt.hash(password, 10);
const comparePasswords = async (inputPassword, hashedPassword) => await bcrypt.compare(inputPassword, hashedPassword);
const generateToken = (userId, role) => jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '1h' });

// Credit Score Calculation Function
const calculateCreditScore = ({
  onTimePayments,
  latePayments,
  creditLimit,
  currentBalance,
  oldestAccountAge,
  accountTypes,
  inquiries,
  publicRecords,
}) => {
  let score = 300;
  const totalPayments = onTimePayments + latePayments;
  const paymentScore = totalPayments > 0 ? (onTimePayments / totalPayments) * 100 : 100;
  score += (paymentScore / 100) * 0.35 * 550;
  const utilization = creditLimit > 0 ? (currentBalance / creditLimit) * 100 : 0;
  const utilizationScore = utilization <= 30 ? 100 : utilization <= 50 ? 75 : utilization <= 75 ? 50 : 25;
  score += (utilizationScore / 100) * 0.30 * 550;
  const ageScore = oldestAccountAge >= 10 ? 100 : oldestAccountAge >= 5 ? 75 : oldestAccountAge >= 2 ? 50 : 25;
  score += (ageScore / 100) * 0.15 * 550;
  const typesScore = accountTypes >= 5 ? 100 : accountTypes >= 3 ? 75 : accountTypes >= 1 ? 50 : 25;
  score += (typesScore / 100) * 0.10 * 550;
  const inquiriesScore = inquiries <= 1 ? 100 : inquiries <= 3 ? 75 : inquiries <= 5 ? 50 : 25;
  score += (inquiriesScore / 100) * 0.10 * 550;
  if (publicRecords.toLowerCase().includes('bankruptcy') || publicRecords.toLowerCase().includes('lien')) {
    score -= 100;
  }
  return Math.max(300, Math.min(850, Math.round(score)));
};

// Authentication Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization header missing or malformed' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId || decoded.id,
      role: decoded.role,
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Get User's Loans Endpoint
app.get('/api/loans', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'borrower') {
      return res.status(403).json({ success: false, message: 'Access denied. Only borrowers can view their loan history.' });
    }
    const loans = await LoanApplication.find({ userId: req.user.userId }).select('_id amount status purpose createdAt updatedAt remainingBalance term');
    res.json({ success: true, loans });
  } catch (error) {
    console.error('Fetch Loans Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching loans' });
  }
});

// Get Borrower Profile
app.get('/api/borrower/profile', authenticate, async (req, res) => {
  try {
    const profile = await BorrowerProfile.findOne({ userId: req.user.userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});

// Get All Borrower Profiles (Lender/Admin Only)
app.get('/api/borrower/profiles', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only lenders or admins can view all profiles.' });
    }
    const profiles = await BorrowerProfile.find().select('-userId').lean();
    const profilesWithCredit = await Promise.all(profiles.map(async (profile) => {
      const creditReport = await CreditReport.findOne({ userId: profile.userId }).select('creditScore');
      return {
        ...profile,
        creditScore: creditReport ? creditReport.creditScore : null,
      };
    }));
    res.json({ success: true, profiles: profilesWithCredit });
  } catch (error) {
    console.error('Fetch All Profiles Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profiles' });
  }
});

// Get Specific Borrower Profile (Lender/Admin Only)
app.get('/api/borrower/profiles/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only lenders or admins can view profiles.' });
    }
    const profile = await BorrowerProfile.findById(req.params.id).select('-userId');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    const creditReport = await CreditReport.findOne({ userId: profile.userId }).select('creditScore');
    res.json({
      success: true,
      profile: {
        ...profile.toObject(),
        creditScore: creditReport ? creditReport.creditScore : null,
      },
    });
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching profile' });
  }
});
// Update Borrower Profile
app.put('/api/borrower/profile', authenticate, async (req, res) => {
  try {
    const { fullName, addAddress, phone } = req.body;
    if (!fullName && !addAddress && !phone) {
      return res.status(400).json({ success: false, message: 'At least one field (fullName, address, or phone) is required' });
    }
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (phone) updateData.phone = phone;
    if (addAddress) updateData.$push = { address: addAddress };
    const profile = await BorrowerProfile.findOneAndUpdate(
      { userId: req.user.userId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    res.json({ success: true, message: 'Profile updated successfully', profile });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

// Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const hashedPassword = await hashPassword(password);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();
    const token = generateToken(user._id, user.role);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (user.role !== role) {
      return res.status(401).json({ success: false, message: 'Invalid role for this user' });
    }
    const isMatch = await comparePasswords(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = generateToken(user._id, user.role);
    if (user.role === 'borrower') {
      const existingProfile = await BorrowerProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await BorrowerProfile.create({
          userId: user._id,
          fullName: user.name || '',
          email: user.email,
          address: [],
        });
      }
    }
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// Save Credit Report Endpoint
app.post('/api/credit-report', authenticate, async (req, res) => {
  try {
    const {
      name,
      dob,
      address,
      region,
      accounts,
      creditLimit,
      currentBalance,
      onTimePayments,
      latePayments,
      oldestAccountAge,
      accountTypes,
      inquiries,
      publicRecords,
    } = req.body;

    if (
      !name ||
      !dob ||
      !address ||
      !region ||
      !accounts ||
      creditLimit === undefined ||
      currentBalance === undefined ||
      onTimePayments === undefined ||
      latePayments === undefined ||
      oldestAccountAge === undefined ||
      accountTypes === undefined ||
      inquiries === undefined ||
      !publicRecords
    ) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const creditScore = calculateCreditScore({
      onTimePayments,
      latePayments,
      creditLimit,
      currentBalance,
      oldestAccountAge,
      accountTypes,
      inquiries,
      publicRecords,
    });

    const newReport = new CreditReport({
      userId: req.user.userId,
      name,
      dob,
      address,
      region,
      accounts,
      creditLimit,
      currentBalance,
      onTimePayments,
      latePayments,
      oldestAccountAge,
      accountTypes,
      inquiries,
      publicRecords,
      creditScore,
    });

    await newReport.save();
    res.status(201).json({ success: true, message: 'Credit report saved successfully', report: newReport });
  } catch (error) {
    console.error('Save Credit Report Error:', error);
    res.status(500).json({ success: false, message: 'Server error while saving credit report' });
  }
});

// Get Current User's Credit Report
app.get('/api/credit-report', authenticate, async (req, res) => {
  try {
    const report = await CreditReport.findOne({ userId: req.user.userId });
    if (!report) {
      return res.status(404).json({ success: false, message: 'No credit report found' });
    }
    res.json({ success: true, report });
  } catch (error) {
    console.error('Fetch Credit Report Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching credit report' });
  }
});

// Get All Credit Reports (Lender/Admin Only)
app.get('/api/credit-reports', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only lenders or admins can view all credit reports.' });
    }
    const reports = await CreditReport.find().populate('userId', 'name email');
    res.json({ success: true, reports });
  } catch (error) {
    console.error('Fetch All Credit Reports Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching credit reports' });
  }
});

// Submit Loan Application Endpoint
app.post('/api/loan-application', authenticate, async (req, res) => {
  try {
    const { fullName, amount, purpose, term, income } = req.body;
    if (!fullName || !amount || !purpose || !term || !income) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (amount <= 0 || term <= 0 || income < 0) {
      return res.status(400).json({ success: false, message: 'Invalid input values' });
    }
    const newApplication = new LoanApplication({
      userId: req.user.userId,
      fullName,
      amount,
      purpose,
      term,
      income,
      status: 'pending'
    });
    await newApplication.save();
    res.status(201).json({ success: true, message: 'Loan application submitted successfully', application: newApplication });
  } catch (error) {
    console.error('Loan Application Error:', error);
    res.status(500).json({ success: false, message: 'Server error while submitting loan application' });
  }
});

// Get All Loan Applications
app.get('/api/loan-applications', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'lender' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Only lenders or admins can view all applications.' });
    }
    const applications = await LoanApplication.find().populate('userId', 'name email');
    res.json({ success: true, applications });
  } catch (error) {
    console.error('Get Applications Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching loan applications' });
  }
});

// Approve Loan Application
app.put('/api/loan-applications/:id/approve', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'lender') {
      return res.status(403).json({ success: false, message: 'Access denied. Only admin or lender can approve.' });
    }
    const { id } = req.params;
    const application = await LoanApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (application.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be approved' });
    }
    application.status = 'approved';
    application.remainingBalance = application.amount;
    await application.save();
    res.json({ success: true, message: 'Application approved successfully', application });
  } catch (error) {
    console.error('Approve Application Error:', error);
    res.status(500).json({ success: false, message: 'Server error approving application' });
  }
});

// Reject Loan Application
app.put('/api/loan-applications/:id/reject', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'lender') {
      return res.status(403).json({ success: false, message: 'Access denied. Only admin or lender can reject.' });
    }
    const { id } = req.params;
    const application = await LoanApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (application.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Only pending applications can be rejected' });
    }
    application.status = 'rejected';
    await application.save();
    res.json({ success: true, message: 'Application rejected successfully', application });
  } catch (error) {
    console.error('Reject Application Error:', error);
    res.status(500).json({ success: false, message: 'Server error rejecting application' });
  }
});

// Mark Loan as Defaulted
app.put('/api/loan-applications/:id/default', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'lender') {
      return res.status(403).json({ success: false, message: 'Access denied. Only admin or lender can mark as defaulted.' });
    }
    const { id } = req.params;
    const application = await LoanApplication.findById(id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }
    if (application.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Only approved loans can be marked as defaulted' });
    }
    application.status = 'defaulted';
    await application.save();
    res.json({ success: true, message: 'Loan marked as defaulted', application });
  } catch (error) {
    console.error('Mark Default Error:', error);
    res.status(500).json({ success: false, message: 'Server error marking loan as defaulted' });
  }
});

// Get My Loan Applications (Fixed and Enhanced)
app.get('/api/my-loan-applications', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { userId: req.user.userId };

    // Optional status filter
    if (status) {
      if (!['pending', 'approved', 'rejected', 'repaid', 'defaulted'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status filter',
          errorCode: 'INVALID_STATUS',
        });
      }
      query.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const applications = await LoanApplication.find(query)
      .select('_id amount status purpose term remainingBalance createdAt updatedAt')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await LoanApplication.countDocuments(query);

    if (applications.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No loan applications found',
        errorCode: 'NO_APPLICATIONS',
      });
    }

    res.json({
      success: true,
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get My Applications Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching your loan applications',
      errorCode: 'SERVER_ERROR',
    });
  }
});

// Repay Loan Endpoint
app.post('/api/repay-loan/:id', authenticate, repaymentLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    const transactionLog = new TransactionLog({
      userId: req.user.userId,
      loanId: id,
      action: 'repayment_attempt',
      amount,
      status: 'pending',
      details: `Attempting repayment of $${amount} for loan ${id}`,
    });
    await transactionLog.save();

    if (!amount || amount <= 0 || isNaN(amount)) {
      await TransactionLog.findByIdAndUpdate(transactionLog._id, {
        status: 'failed',
        details: 'Invalid repayment amount',
      });
      return res.status(400).json({ success: false, message: 'Valid repayment amount is required', errorCode: 'INVALID_AMOUNT' });
    }

    const loan = await LoanApplication.findById(id);
    if (!loan) {
      await TransactionLog.findByIdAndUpdate(transactionLog._id, {
        status: 'failed',
        details: 'Loan not found',
      });
      return res.status(404).json({ success: false, message: 'Loan not found', errorCode: 'LOAN_NOT_FOUND' });
    }
    if (loan.userId.toString() !== req.user.userId) {
      await TransactionLog.findByIdAndUpdate(transactionLog._id, {
        status: 'failed',
        details: 'Unauthorized repayment attempt',
      });
      return res.status(403).json({ success: false, message: 'You are not authorized to repay this loan', errorCode: 'UNAUTHORIZED' });
    }
    if (loan.status !== 'approved') {
      await TransactionLog.findByIdAndUpdate(transactionLog._id, {
        status: 'failed',
        details: `Loan status is ${loan.status}`,
      });
      return res.status(400).json({ success: false, message: 'Only approved loans can be repaid', errorCode: 'INVALID_LOAN_STATUS' });
    }
    if (loan.status === 'repaid') {
      await TransactionLog.findByIdAndUpdate(transactionLog._id, {
        status: 'failed',
        details: 'Loan already fully repaid',
      });
      return res.status(400).json({ success: false, message: 'Loan already fully repaid', errorCode: 'ALREADY_REPAID' });
    }
    if (amount > loan.remainingBalance) {
      await TransactionLog.findByIdAndUpdate(transactionLog._id, {
        status: 'failed',
        details: `Amount exceeds remaining balance of $${loan.remainingBalance}`,
      });
      return res.status(400).json({
        success: false,
        message: `Repayment amount cannot exceed remaining balance of $${loan.remainingBalance}`,
        errorCode: 'EXCEEDS_BALANCE',
      });
    }

    const repayment = new Repayment({
      loanId: loan._id,
      userId: req.user.userId,
      amount,
      repaymentDate: new Date(),
      paymentStatus: 'completed',
      transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });
    await repayment.save();

    loan.remainingBalance -= amount;
    if (loan.remainingBalance <= 0) {
      loan.status = 'repaid';
      loan.repaymentDate = new Date();
    }
    await loan.save();

    await TransactionLog.findByIdAndUpdate(transactionLog._id, {
      status: 'success',
      details: `Repayment of $${amount} processed successfully for loan ${id}`,
    });

    res.json({ success: true, message: 'Repayment processed successfully', loan });
  } catch (error) {
    console.error('Repay Loan Error:', error);
    await TransactionLog.findByIdAndUpdate(transactionLog._id, {
      status: 'failed',
      details: `Error: ${error.message}`,
    });
    res.status(500).json({ success: false, message: 'Server error while repaying loan', errorCode: 'SERVER_ERROR' });
  }
});

// Webhook for Payment Confirmation
app.post('/api/payment/webhook', async (req, res) => {
  try {
    const { transactionId, status, amount, loanId } = req.body;

    if (!transactionId || !status || !amount || !loanId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const repayment = await Repayment.findOne({ transactionId, loanId });
    if (!repayment) {
      return res.status(404).json({ success: false, message: 'Repayment record not found' });
    }

    repayment.paymentStatus = status === 'success' ? 'completed' : 'failed';
    await repayment.save();

    if (status === 'success') {
      const loan = await LoanApplication.findById(loanId);
      if (loan) {
        loan.remainingBalance -= amount;
        if (loan.remainingBalance <= 0) {
          loan.status = 'repaid';
          loan.repaymentDate = new Date();
        }
        await loan.save();
      }
    }

    await TransactionLog.create({
      userId: repayment.userId,
      loanId,
      action: 'webhook_received',
      amount,
      status: status === 'success' ? 'success' : 'failed',
      details: `Webhook for transaction ${transactionId}: ${status}`,
    });

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Payment Webhook Error:', error);
    res.status(500).json({ success: false, message: 'Server error processing webhook' });
  }
});

// Get Active Loans Endpoint
app.get('/api/active-loans', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const activeLoans = await LoanApplication.find({
      userId: req.user.userId,
      status: { $in: ['pending', 'approved'] },
    });
    res.json({ success: true, user: { fullName: user.name, username: user.email }, activeLoans });
  } catch (error) {
    console.error('Get Active Loans Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching active loans' });
  }
});

// Get Repayments Endpoint
app.get('/api/repayments', authenticate, async (req, res) => {
  try {
    const { loanId } = req.query;
    let query = req.user.role === 'borrower'
      ? { userId: new mongoose.Types.ObjectId(req.user.userId), status: { $in: ['approved', 'repaid'] } }
      : { status: { $in: ['approved', 'repaid'] } };

    if (loanId) {
      query._id = new mongoose.Types.ObjectId(loanId);
    }

    const loans = await LoanApplication.find(query)
      .populate('userId', 'name email')
      .sort({ repaymentDate: -1, createdAt: -1 });

    const loanIds = loans.map(loan => loan._id);
    const repayments = await Repayment.find({ loanId: { $in: loanIds } })
      .select('loanId amount repaymentDate paymentStatus transactionId')
      .sort({ repaymentDate: -1 });

    const repaymentMap = loans.reduce((acc, loan) => {
      acc[loan._id.toString()] = {
        totalPaid: 0,
        latestRepaymentDate: null,
        repaymentHistory: [],
      };
      return acc;
    }, {});

    repayments.forEach(repayment => {
      const loanIdStr = repayment.loanId.toString();
      if (repaymentMap[loanIdStr]) {
        repaymentMap[loanIdStr].totalPaid += repayment.amount;
        repaymentMap[loanIdStr].repaymentHistory.push({
          amount: repayment.amount,
          repaymentDate: repayment.repaymentDate,
          paymentStatus: repayment.paymentStatus,
          transactionId: repayment.transactionId,
        });
        if (!repaymentMap[loanIdStr].latestRepaymentDate || repayment.repaymentDate > repaymentMap[loanIdStr].latestRepaymentDate) {
          repaymentMap[loanIdStr].latestRepaymentDate = repayment.repaymentDate;
        }
      }
    });

    const formattedRepayments = loans.map(loan => ({
      _id: loan._id,
      borrowerName: loan.userId?.name || 'Unknown',
      borrowerEmail: loan.userId?.email || 'Unknown',
      loanId: loan._id,
      status: loan.status,
      amountPaid: repaymentMap[loan._id.toString()]?.totalPaid || 0,
      remainingBalance: loan.remainingBalance || 0,
      repaymentDate: loan.status === 'repaid' ? loan.repaymentDate : repaymentMap[loan._id.toString()]?.latestRepaymentDate,
      purpose: loan.purpose,
      term: loan.term,
      repaymentHistory: repaymentMap[loan._id.toString()]?.repaymentHistory || [],
    }));

    res.json({ success: true, repayments: formattedRepayments });
  } catch (error) {
    console.error('Fetch Repayments Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching repayments' });
  }
});

// Loan Info Schema and Model
const loanInfoSchema = new mongoose.Schema({
  loanTypes: [{ type: String }],
  eligibilityCriteria: [{ type: String }],
  disbursementProcess: [{ type: String }],
  faqs: [{
    question: { type: String },
    answer: { type: String },
  }],
  contactInfo: { type: String },
});
const LoanInfo = mongoose.model('LoanInfo', loanInfoSchema);

// Get Loan Info Endpoint
app.get('/api/loan-info', authenticate, async (req, res) => {
  try {
    let info = await LoanInfo.findOne();
    if (!info) {
      info = new LoanInfo({
        loanTypes: [
          'Personal Loan',
          'Student Loan',
          'Business Loan',
          'Home Loan',
        ],
        eligibilityCriteria: [
          'Minimum credit score of 650',
          'Stable monthly income',
          'Valid ID proof and address proof',
          'Minimum age 21 years',
        ],
        disbursementProcess: [
          'Submit application',
          'Verification of documents',
          'Credit evaluation',
          'Loan approval',
          'Disbursement within 3-5 working days',
        ],
        faqs: [
          { question: 'How long does disbursement take?', answer: 'Typically 3-5 working days after approval.' },
          { question: 'What are the disbursement methods?', answer: 'Direct holdebank transfer or cheque.' },
          { question: 'Can I change the disbursement account?', answer: 'Yes, contact support before final approval.' },
        ],
        contactInfo: 'For assistance, contact us at support@bank.com or call +1-800-123-4567.',
      });
      await info.save();
    }
    res.json({ success: true, info });
  } catch (error) {
    console.error('Fetch Loan Info Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching loan info' });
  }
});

// Get Disbursed Loans Endpoint
app.get('/api/loans/disbursed', authenticate, async (req, res) => {
  try {
    const loans = await LoanApplication.find({ status: 'approved' }).populate('userId', 'name email');
    res.json({ success: true, loans });
  } catch (error) {
    console.error('Fetch Disbursed Loans Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching disbursed loans' });
  }
});

// Reports and Analytics for Lender
app.get('/api/lender/reports', authenticate, async (req, res) => {
  try {
    const loans = await LoanApplication.find();
    let totalDisbursed = 0;
    let totalRepaid = 0;
    let activeLoans = 0;
    const loanPurposeCounts = {};
    const monthlyDisbursement = {};
    loans.forEach(loan => {
      if (loan.status === 'approved' || loan.status === 'repaid') {
        totalDisbursed += loan.amount;
      }
      if (loan.status === 'repaid') {
        totalRepaid += loan.amount;
      }
      if (loan.status === 'approved') {
        activeLoans += 1;
      }
      loanPurposeCounts[loan.purpose] = (loanPurposeCounts[loan.purpose] || 0) + 1;
      const monthYear = `${loan.createdAt.getMonth() + 1}-${loan.createdAt.getFullYear()}`;
      monthlyDisbursement[monthYear] = (monthlyDisbursement[monthYear] || 0) + loan.amount;
    });
    const successRate = loans.length > 0 ? ((totalRepaid / totalDisbursed) * 100).toFixed(2) : 0;
    res.json({
      success: true,
      data: {
        totalDisbursed,
        totalRepaid,
        successRate,
        activeLoans,
        loanPurposeCounts,
        monthlyDisbursement,
        totalLoans: loans.length,
      },
    });
  } catch (error) {
    console.error('Fetch Reports Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating report' });
  }
});

// Get Notifications Endpoint
app.get('/api/notifications', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = [];
    const delinquentLoans = await LoanApplication.find({
      userId,
      status: 'approved',
      createdAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    if (delinquentLoans.length > 0) {
      notifications.push({
        type: 'delinquent',
        message: `You have ${delinquentLoans.length} loan(s) that may be overdue.`,
      });
    }
    const repaidLoans = await LoanApplication.find({
      userId,
      status: 'repaid',
    }).sort({ repaymentDate: -1 }).limit(1);
    if (repaidLoans.length > 0) {
      const latest = repaidLoans[0];
      notifications.push({
        type: 'repayment',
        message: `Loan for ${latest.purpose} repaid on ${new Date(latest.repaymentDate).toLocaleDateString()}.`,
      });
    }
    const approvedLoans = await LoanApplication.find({
      userId,
      status: 'approved',
    }).sort({ createdAt: -1 }).limit(1);
    if (approvedLoans.length > 0) {
      const latest = approvedLoans[0];
      notifications.push({
        type: 'approval',
        message: `Loan for ${latest.purpose} approved for amount $${latest.amount}.`,
      });
    }
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
});

// Health Check for MongoDB
app.get('/api/system/health', authenticate, async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const stateMap = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({ success: true, status: stateMap[dbState] });
  } catch (error) {
    console.error('Health Check Error:', error);
    res.status(500).json({ success: false, message: 'Error checking MongoDB health' });
  }
});

// Perform Backup
app.post('/api/system/backup', authenticate, (req, res) => {
  const backupDir = path.join(__dirname, 'backups');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(backupDir, `backup-${timestamp}`);
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const command = `mongodump --uri="${process.env.MONGODB_URI}" --out="${backupPath}"`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Backup error:', error);
      return res.status(500).json({
        success: false,
        message: 'Backup failed',
        error: error.message,
      });
    }
    res.json({
      success: true,
      message: `Backup completed at ${timestamp}`,
      path: backupPath,
    });
  });
});

// Update System Config
let systemConfig = {
  maintenanceWindow: '02:00 - 03:00',
  maxLoginAttempts: 5,
};

app.get('/api/system/config', authenticate, (req, res) => {
  res.json({ success: true, config: systemConfig });
});

app.post('/api/system/config', authenticate, (req, res) => {
  const { maintenanceWindow, maxLoginAttempts } = req.body;
  if (maintenanceWindow) systemConfig.maintenanceWindow = maintenanceWindow;
  if (maxLoginAttempts !== undefined) systemConfig.maxLoginAttempts = maxLoginAttempts;
  res.json({ success: true, message: 'Configuration updated', config: systemConfig });
});

// Get All Users (Admin Only)
app.get('/api/users', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    const users = await User.find({}, '-password');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
});

// Update User Info
app.put('/api/users/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User updated', user });
  } catch (err) {
    console.error('Update User Error:', err);
    res.status(500).json({ success: false, message: 'Server error updating user' });
  }
});

// Update User Role
app.put('/api/users/:id/role', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const { role } = req.body;
    if (!['borrower', 'lender', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role provided' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User role updated', user });
  } catch (err) {
    console.error('Role Update Error:', err);
    res.status(500).json({ success: false, message: 'Server error updating role' });
  }
});

// Delete User
app.delete('/api/users/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete User Error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
});

// Reports: Average Credit Score by Region
app.get('/api/reports/credit-score-by-region', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    const scoresByRegion = await CreditReport.aggregate([
      {
        $group: {
          _id: '$region',
          averageScore: { $avg: '$creditScore' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: scoresByRegion });
  } catch (error) {
    console.error('Credit Score by Region Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching credit score by region' });
  }
});

// Reports: Loan Default Rates Over Time
app.get('/api/reports/loan-default-rates', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    const defaultRates = await LoanApplication.aggregate([
      {
        $match: { status: { $in: ['defaulted', 'repaid'] } },
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' },
          },
          total: { $sum: 1 },
          defaults: {
            $sum: { $cond: [{ $eq: ['$status', 'defaulted'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          period: {
            $concat: [
              { $toString: '$_id.month' },
              '/',
              { $toString: '$_id.year' },
            ],
          },
          defaultRate: {
            $multiply: [{ $divide: ['$defaults', '$total'] }, 100],
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    res.json({ success: true, data: defaultRates });
  } catch (error) {
    console.error('Loan Default Rates Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching loan default rates' });
  }
});

// Reports: Loan Amount Distribution by Status
app.get('/api/reports/loan-amount-distribution', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    const distribution = await LoanApplication.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, data: distribution });
  } catch (error) {
    console.error('Loan Amount Distribution Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching loan amount distribution' });
  }
});

// Fraud Alerts: Fetch All Alerts
app.get('/api/fraud-alerts', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    const alerts = await FraudAlert.find().populate('userId', 'name email');
    res.json({ success: true, alerts });
  } catch (error) {
    console.error('Fetch Fraud Alerts Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching fraud alerts' });
  }
});

// Fraud Alerts: Generate Alerts for Multiple Applications
app.post('/api/fraud-alerts/generate', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    const thresholdDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const multipleApps = await LoanApplication.aggregate([
      {
        $match: { createdAt: { $gte: thresholdDate } },
      },
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          applications: { $push: { id: '$_id', amount: '$amount', createdAt: '$createdAt' } },
        },
      },
      {
        $match: { count: { $gt: 1 } },
      },
    ]);

    const alerts = [];
    for (const group of multipleApps) {
      const existingAlert = await FraudAlert.findOne({
        userId: group._id,
        alertType: 'Multiple Applications',
        status: 'open',
      });
      if (!existingAlert) {
        const alert = new FraudAlert({
          userId: group._id,
          alertType: 'Multiple Applications',
          details: `User submitted ${group.count} applications in the last 7 days.`,
          severity: group.count > 3 ? 'high' : 'medium',
        });
        await alert.save();
        alerts.push(alert);
      }
    }

    res.json({
      success: true,
      message: alerts.length > 0 ? 'Fraud alerts generated' : 'No fraud alerts detected',
      alerts,
    });
  } catch (error) {
    console.error('Generate Fraud Alerts Error:', error);
    res.status(500).json({ success: false, message: 'Server error generating fraud alerts' });
  }
});

// Fraud Alerts: Update Alert Status
app.put('/api/fraud-alerts/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    const { status } = req.body;
    if (!['open', 'resolved', 'escalated'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const alert = await FraudAlert.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('userId', 'name email');
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    res.json({ success: true, message: 'Alert updated', alert });
  } catch (error) {
    console.error('Update Fraud Alert Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating fraud alert' });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});