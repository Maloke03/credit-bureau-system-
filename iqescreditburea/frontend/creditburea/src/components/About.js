import React from 'react';
import { Link } from 'react-router-dom'; // For navigation
import Navbar from '../components/Navbar';
import '../components/css/About.css';
import teamImage from '../components/images/loans7.jpg'; // Placeholder for team or company image
import founderImage from '../components/images/myloans.jpg'; // Placeholder for founder/leader image

const About = () => {
  return (
    <div className="about-container">
      <Navbar />

      <main className="about-main">
        {/* Hero Section */}
        <section className="about-hero-section">
          <h1>About Lesotho Credit Bureau System</h1>
          <p className="hero-subtitle">
            Empowering Lesotho’s financial future with trusted credit information and innovative solutions since 2024.
          </p>
          <img
            src={teamImage}
            alt="Our team at Credit Bureau System"
            className="hero-image"
          />
        </section>

        {/* Introduction Section */}
        <section className="about-intro-section">
          <div className="about-content">
            <h2>Who We Are</h2>
            <p>
              Founded in 2024, the Lesotho Credit Bureau System is a cornerstone of the nation’s financial ecosystem. 
              We provide accurate, reliable, and secure credit information to empower individuals, lenders, and financial 
              institutions to make informed decisions. Our cutting-edge platform supports borrowers, lenders, and 
              administrators with tools for credit reporting, loan management, and data integrity.
            </p>
            <p>
              Headquartered in Maseru, we are committed to fostering financial inclusion and transparency across Lesotho, 
              helping build a stronger, more equitable economy.
            </p>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="mission-vision-section">
          <div className="mission-vision-grid">
            <div className="mission-card">
              <h3>Our Mission</h3>
              <p>
                To deliver comprehensive credit data and financial tools that enable smarter decisions, promote financial 
                inclusion, and drive economic growth in Lesotho.
              </p>
            </div>
            <div className="vision-card">
              <h3>Our Vision</h3>
              <p>
                To be Lesotho’s most trusted credit bureau, transforming the financial landscape through innovation, 
                transparency, and accessibility.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="values-section">
          <h2>Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🔒</div>
              <h3>Integrity</h3>
              <p>We uphold the highest standards of accuracy and ethics in all our services.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🚀</div>
              <h3>Innovation</h3>
              <p>We leverage technology to deliver cutting-edge financial solutions.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Trust</h3>
              <p>We build lasting relationships with our partners and clients through reliability.</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌍</div>
              <h3>Inclusion</h3>
              <p>We strive to make financial services accessible to all in Lesotho.</p>
            </div>
          </div>
        </section>

        {/* History & Milestones Section */}
        <section className="history-section">
          <h2>Our Journey</h2>
          <div className="timeline">
            <div className="timeline-item">
              <h4>2024</h4>
              <p>Lesotho Credit Bureau System founded in Maseru, launching our core credit reporting platform.</p>
            </div>
            <div className="timeline-item">
              <h4>Early 2025</h4>
              <p>Partnered with over 50 financial institutions, expanding our reach across Lesotho.</p>
            </div>
            <div className="timeline-item">
              <h4>Mid 2025</h4>
              <p>Introduced real-time credit monitoring and loan management tools, serving 10,000+ users.</p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-section">
          <h2>Meet Our Leadership</h2>
          <div className="team-grid">
            <div className="team-card">
              <img
                src={founderImage}
                alt="Founder"
                className="team-image"
              />
              <h3>Dr. Mpho Lerato</h3>
              <p>Founder & CEO</p>
              <p>
                With 15 years in financial services, Dr. Lerato leads our mission to revolutionize credit management.
              </p>
            </div>
            <div className="team-card">
              <img
                src={founderImage}
                alt="CTO"
                className="team-image"
              />
              <h3>Thabo Mokone</h3>
              <p>Chief Technology Officer</p>
              <p>
                Thabo drives our technology strategy, ensuring a secure and innovative platform.
              </p>
            </div>
          </div>
          <Link to="/contact" className="team-cta">
            Connect with Our Team
          </Link>
        </section>

        {/* Call-to-Action Section */}
        <section className="cta-section">
          <h2>Join Our Mission</h2>
          <p>
            Partner with us to transform Lesotho’s financial landscape with trusted credit solutions.
          </p>
          <div className="cta-buttons">
            <Link to="/contact" className="primary-btn cta-button">
              Get in Touch
            </Link>
            <Link to="/register" className="secondary-btn cta-button">
              Sign Up Now
            </Link>
          </div>
        </section>
      </main>

      <footer className="about-footer">
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
          <p>© 2025 Lesotho Credit Bureau System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;