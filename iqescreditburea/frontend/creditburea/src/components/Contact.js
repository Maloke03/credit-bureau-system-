import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../components/css/Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    subject: ''
  });

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000);
    setFormData({ name: '', email: '', phone: '', message: '', subject: '' });
  };

  return (
    <div className="contact-container">
      <Navbar />

      <main className="contact-main">
        <section className="contact-overview-section">
          <h1>Contact Us</h1>
          <p className="overview-subtitle">
            We’re here to assist you with all your credit-related inquiries in Lesotho. Reach out to our dedicated team for support, feedback, or partnership opportunities.
          </p>
        </section>

        <section className="contact-section">
          <div className="contact-content">
            <div className="contact-info">
              <h2>Get in Touch</h2>
              <p>
                <strong>Email:</strong> info@creditbureausystem.com<br />
                <strong>Phone:</strong> +266 2231 2656<br />
                <strong>Toll-Free:</strong> 0800 123 456 (within Lesotho)<br />
                <strong>Address:</strong> Pioneer Road, Maseru West, Lesotho
              </p>

              <div className="support-channels">
                <h3>Support Channels</h3>
                <ul>
                  <li><span role="img" aria-label="Email icon">📧</span> Email Support: 24/7 response time</li>
                  <li><span role="img" aria-label="Phone icon">📞</span> Phone Support: Mon-Fri, 8 AM - 5 PM</li>
                  <li><span role="img" aria-label="Chat icon">💬</span> Live Chat: Available on our website</li>
                </ul>
              </div>

              <div className="office-hours">
                <h3>Office Hours</h3>
                <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                <p>Saturday: 9:00 AM - 12:00 PM</p>
                <p>Sunday & Public Holidays: Closed</p>
              </div>

              <div className="map-container">
                <h3>Our Location</h3>
                <iframe
                  title="Lesotho Pioneer Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3487.122169380806!2d27.4762773150942!3d-29.14204198224126!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e8e5788a8c6c5d5%3A0x8c4e8e8e8e8e8e8e!2sPioneer%20Road%2C%20Maseru%2C%20Lesotho!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                ></iframe>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+266 ..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                Send Message
              </button>
              {isSubmitted && (
                <p className="success-message">
                  Thank you for your message! We will contact you soon.
                </p>
              )}
            </form>
          </div>
        </section>

        <section className="faq-snippet-section">
          <h2>Quick Help</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How do I check my credit report?</h3>
              <p>Log in to your account or visit our <Link to="/services">Services</Link> page for more details.</p>
            </div>
            <div className="faq-item">
              <h3>What if I don’t receive a response?</h3>
              <p>Please call us at +266 2231 2656 or email info@creditbureausystem.com for immediate assistance.</p>
            </div>
          </div>
          <Link to="/faq" className="faq-link">
            View All FAQs
          </Link>
        </section>

        <section className="cta-section">
          <h2>Need Immediate Assistance?</h2>
          <p>
            Contact our support team or schedule a consultation to discuss your credit needs in Lesotho.
          </p>
          <div className="cta-buttons">
            <Link to="/support" className="primary-btn cta-button">
              Live Support
            </Link>
            <Link to="/appointment" className="secondary-btn cta-button">
              Schedule Consultation
            </Link>
          </div>
        </section>
      </main>

      <footer className="contact-footer">
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
            <p>Email: info@creditbureausystem.com</p>
            <p>Phone: +266 2231 2656</p>
            <p>Address: Pioneer Road, Maseru West, Lesotho</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Lesotho Credit Bureau System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Contact;