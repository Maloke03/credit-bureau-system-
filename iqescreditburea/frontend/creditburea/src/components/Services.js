import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../components/css/Services.css';

const Services = () => {
  const services = [
    {
      title: "Credit Reporting",
      description: "Access comprehensive credit reports with detailed analysis of credit history and scoring to make informed financial decisions.",
      features: [
        "Personal credit scores with actionable insights",
        "Business credit reports for enterprise lending",
        "Real-time credit monitoring alerts"
      ],
      sticker: "📊", // Emoji as a "sticker"
      link: "/learn-more/credit-reporting"
    },
    {
      title: "Loan Services",
      description: "Streamlined end-to-end loan management solutions for lenders and borrowers in Lesotho’s financial ecosystem.",
      features: [
        "Loan application processing with quick approvals",
        "Credit risk assessment for safer lending",
        "Payment tracking and repayment reminders"
      ],
      sticker: "💸",
      link: "/learn-more/loan-services"
    },
    {
      title: "Fraud Prevention",
      description: "Protect your financial data with advanced tools to detect and prevent credit fraud and identity theft.",
      features: [
        "Identity verification with secure protocols",
        "Fraud detection alerts for suspicious activity",
        "Continuous security monitoring for peace of mind"
      ],
      sticker: "🛡️",
      link: "/learn-more/fraud-prevention"
    },
    {
      title: "Data Analytics & Insights",
      description: "Leverage powerful analytics to gain insights into credit trends and financial behaviors specific to Lesotho.",
      features: [
        "Customized credit trend reports",
        "Predictive analytics for loan approvals",
        "Data-driven decision-making tools"
      ],
      sticker: "📈",
      link: "/learn-more/data-analytics"
    },
    {
      title: "Customer Support & Education",
      description: "Empowering users with dedicated support and resources to navigate credit management effectively.",
      features: [
        "24/7 customer support via phone and email",
        "Financial literacy workshops and guides",
        "Personalized credit improvement plans"
      ],
      sticker: "📞",
      link: "/learn-more/customer-support"
    }
  ];

  const faqs = [
    {
      question: "How often are credit reports updated?",
      answer: "Our credit reports are updated in real-time as new data is received from our partner institutions."
    },
    {
      question: "Can I dispute incorrect information on my credit report?",
      answer: "Yes, you can file a dispute through our platform, and our team will investigate within 30 days."
    },
    {
      question: "What measures do you take to ensure data security?",
      answer: "We use industry-standard encryption, secure servers, and comply with Lesotho’s data protection regulations."
    }
  ];

  return (
    <div className="services-container">
      <Navbar />

      <main className="services-main">
        {/* Hero Section */}
        <section className="services-hero-section">
          <h1>Our Services</h1>
          <p className="hero-subtitle">
            Discover the tools and solutions we offer to empower Lesotho’s financial community with trusted credit management.
          </p>
        </section>

        {/* Services Grid */}
        <section className="services-section">
          <div className="services-grid">
            {services.map((service, index) => (
              <div className="service-card" key={index}>
                <div className="service-sticker">{service.sticker}</div>
                <h2>{service.title}</h2>
                <p>{service.description}</p>
                <ul className="service-features">
                  {service.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
                <Link to={service.link} className="service-link">
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonials-section">
          <h2>What Our Clients Say About Our Services</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <p>
                “The credit reporting service has been a game-changer for our bank. We can now assess risks more accurately.”
              </p>
              <h4>— Nthabeleng M., Bank Manager</h4>
            </div>
            <div className="testimonial-card">
              <p>
                “Thanks to the loan services, I got my business loan approved in just a few days. The process was seamless!”
              </p>
              <h4>— Khotso L., Entrepreneur</h4>
            </div>
            <div className="testimonial-card">
              <p>
                “The fraud prevention tools gave me peace of mind. I was alerted to suspicious activity instantly.”
              </p>
              <h4>— Mamello T., Individual Borrower</h4>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            {faqs.map((faq, index) => (
              <div className="faq-item" key={index}>
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
          <Link to="/faq" className="faq-link">
            See All FAQs
          </Link>
        </section>

        {/* Call-to-Action Section */}
        <section className="cta-section">
          <h2>Ready to Explore Our Services?</h2>
          <p>
            Join Lesotho’s leading credit bureau and take control of your financial future today.
          </p>
          <div className="cta-buttons">
            <Link to="/register" className="primary-btn cta-button">
              Get Started
            </Link>
            <Link to="/contact" className="secondary-btn cta-button">
              Contact Us
            </Link>
          </div>
        </section>
      </main>

      <footer className="services-footer">
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

export default Services;