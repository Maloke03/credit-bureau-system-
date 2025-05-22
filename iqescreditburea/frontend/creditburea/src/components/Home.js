import React from 'react';
import { Link } from 'react-router-dom'; // For navigation
import Navbar from '../components/Navbar';
import '../components/css/Home.css';
import loansImage from '../components/images/loans.jpg';
import partnerLogo1 from '../components/images/myloans.jpg'; // Placeholder for partner logos
import partnerLogo2 from '../components/images/myloans2.jpg';
import partnerLogo3 from '../components/images/myloans3.jpg';

const Home = () => {
  return (
    <div className="home-container">
      <Navbar />

      <main className=" гриhome-main">
        {/* Hero Section - Enhanced with stronger CTA and dynamic text */}
        <section className="hero-section">
          <div className="hero-text-wrapper">
            <div className="hero-content">
              <h1>Empower Your Financial Future</h1>
              <p>
                Access trusted credit reporting, loan management, and monitoring services designed for Lesotho’s financial ecosystem. Make informed decisions with confidence.
              </p>
              <div className="hero-buttons">
                <Link to="/register" className="primary-btn hero-btn">
                  Get Started
                </Link>
                <Link to="/login" className="secondary-btn hero-btn">
                  Log In
                </Link>
              </div>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <img
              src={loansImage}
              alt="Credit management solutions"
              className="hero-image"
            />
          </div>
        </section>

        {/* Features Section - Expanded with more details */}
        <section className="features-section">
          <h2>Why Choose Our Credit Bureau?</h2>
          <p className="features-intro">
            Our services empower borrowers, lenders, and administrators with tools to manage credit efficiently and securely.
          </p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Comprehensive Credit Reports</h3>
              <p>
                Access detailed credit histories, scores, and analytics to evaluate creditworthiness with precision.
              </p>
              <Link to="/learn-more/credit-reports" className="feature-link">
                Learn More
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💰</div>
              <h3>Streamlined Loan Management</h3>
              <p>
                Simplify loan applications, disbursements, and repayments with our integrated platform.
              </p>
              <Link to="/learn-more/loan-management" className="feature-link">
                Learn More
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👁️</div>
              <h3>Real-Time Credit Monitoring</h3>
              <p>
                Stay informed with instant alerts on credit profile changes and potential fraud risks.
              </p>
              <Link to="/learn-more/credit-monitoring" className="feature-link">
                Learn More
              </Link>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Data Security & Compliance</h3>
              <p>
                Protect your data with industry-standard encryption and compliance with Lesotho’s regulations.
              </p>
              <Link to="/learn-more/security" className="feature-link">
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* How It Works Section - New */}
        <section className="how-it-works-section">
          <h2>How It Works</h2>
          <p className="section-subtitle">
            Simple steps to unlock the power of our credit bureau system.
          </p>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>Sign Up</h3>
              <p>Create an account as a borrower, lender, or admin in minutes.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Access Services</h3>
              <p>Explore credit reports, loan tools, or admin dashboards tailored to your role.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>Make Decisions</h3>
              <p>Use real-time data to make informed financial decisions with confidence.</p>
            </div>
          </div>
        </section>

        {/* Trust Indicators Section - Enhanced with visuals */}
        <section className="trust-section">
          <div className="trust-content">
            <div className="trust-text">
              <h2>Trusted by Lesotho’s Financial Community</h2>
              <p>
                Since 2024, we’ve been the backbone of Lesotho’s credit ecosystem, delivering reliable and secure services.
              </p>
              <ul className="trust-stats">
                <li><strong>100+</strong> Partner Institutions</li>
                <li><strong>95%</strong> Data Accuracy</li>
                <li><strong>24/7</strong> System Availability</li>
                <li><strong>10K+</strong> Active Users</li>
              </ul>
            </div>
            <div className="trust-partners">
              <h3>Our Partners</h3>
              <div className="partner-logos">
                <img src={partnerLogo1} alt="Partner 1" className="partner-logo" />
                <img src={partnerLogo2} alt="Partner 2" className="partner-logo" />
                <img src={partnerLogo3} alt="Partner 3" className="partner-logo" />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section - New */}
        <section className="testimonials-section">
          <h2>What Our Users Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p>
                “This platform has transformed how we assess borrower creditworthiness. The reports are accurate and easy to use.”
              </p>
              <h4>— Thabo M., Bank Manager</h4>
            </div>
            <div className="testimonial-card">
              <p>
                “As a borrower, I love the real-time credit monitoring. It helps me stay on top of my financial health.”
              </p>
              <h4>— Lerato K., Small Business Owner</h4>
            </div>
            <div className="testimonial-card">
              <p>
                “The admin dashboard makes user management seamless. It’s a game-changer for our operations.”
              </p>
              <h4>— Mpho S., System Administrator</h4>
            </div>
          </div>
        </section>

        {/* Call-to-Action Section - Enhanced */}
        <section className="cta-section">
          <h2>Ready to Transform Your Credit Experience?</h2>
          <p>Join thousands of users leveraging our platform to make smarter financial decisions.</p>
          <div className="cta-buttons">
            <Link to="/register" className="primary-btn cta-button">
              Get Started Today
            </Link>
            <Link to="/contact" className="secondary-btn cta-button">
              Contact Us
            </Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>About Us</h3>
            <p>
              Lesotho’s leading credit bureau, providing innovative solutions for credit reporting and financial management.
            </p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Contact</h3>
            <p>Email: support@creditbureau.ls</p>
            <p>Phone: +266 1234 5678</p>
            <p>Address: Maseru, Lesotho</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Credit Bureau System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;