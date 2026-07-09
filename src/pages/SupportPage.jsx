import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Linkedin, Clock, MessageSquare, ChevronDown, ChevronUp, Shield, Zap, HeartHandshake } from 'lucide-react';
import { useState } from 'react';
import './SupportPage.css';

const faqs = [
  {
    q: 'How do I reset an admin password?',
    a: 'Go to Admin Settings → Security, then use the "Reset Password" option. A temporary password will be sent to the registered email address.',
  },
  {
    q: 'How do I verify a worker or vendor?',
    a: 'Navigate to Verifications in the sidebar. Select the pending profile, review the submitted documents, and click Approve or Reject.',
  },
  {
    q: 'Where can I view revenue and subscription data?',
    a: 'The Finance → Revenue section gives a full breakdown of active subscriptions, transactions, and monthly revenue trends.',
  },
  {
    q: 'How do I manage platform-wide settings?',
    a: 'Platform Settings under the System section lets you configure app-wide toggles, subscription plans, and feature flags.',
  },
  {
    q: 'What should I do if the system shows an error?',
    a: 'Check System Monitoring for live health metrics. If the issue persists, contact Smartnex support via email or phone with the error details.',
  },
];

export default function SupportPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div className="dashboard-page">
      <Sidebar onLogout={handleLogout} />
      <div className="support-content">

        {/* HERO */}
        <div className="support-hero">
          <div className="support-hero-text">
            <h1>How can we help you?</h1>
            <p>Reach out to the Smartnex team through any channel below. We're always ready to assist with your project.</p>
          </div>
          <div className="support-hero-badges">
            <span className="support-badge"><Zap size={13} /> Fast Response</span>
            <span className="support-badge"><Shield size={13} /> Dedicated Support</span>
            <span className="support-badge"><HeartHandshake size={13} /> Always Here</span>
          </div>
        </div>

        {/* CONTACT CARDS */}
        <div className="support-section-label">Contact Information</div>
        <div className="support-grid">
          <a href="mailto:contact@smartnex.tech" className="support-card">
            <div className="support-card-icon-wrap" style={{ background: '#eef2ff' }}>
              <Mail size={22} color="#4f46e5" />
            </div>
            <div className="support-card-body">
              <p className="support-card-label">Email</p>
              <p className="support-card-value">contact@smartnex.tech</p>
              <span className="support-card-action indigo">Send an email →</span>
            </div>
          </a>

          <a href="tel:+918260805119" className="support-card">
            <div className="support-card-icon-wrap" style={{ background: '#ecfdf5' }}>
              <Phone size={22} color="#059669" />
            </div>
            <div className="support-card-body">
              <p className="support-card-label">Phone</p>
              <p className="support-card-value">+91 82608 05119</p>
              <span className="support-card-action green">Call us →</span>
            </div>
          </a>

          <a href="https://www.linkedin.com/company/smartnex-technologies" target="_blank" rel="noreferrer" className="support-card">
            <div className="support-card-icon-wrap" style={{ background: '#eff6ff' }}>
              <Linkedin size={22} color="#0a66c2" />
            </div>
            <div className="support-card-body">
              <p className="support-card-label">LinkedIn</p>
              <p className="support-card-value">Smartnex Technologies</p>
              <span className="support-card-action blue">Connect with us →</span>
            </div>
          </a>
        </div>

        {/* RESPONSE TIMES + TIPS */}
        <div className="support-two-col">
          <div className="support-panel">
            <div className="support-panel-header">
              <Clock size={17} color="#7c3aed" />
              <h2>Response Times</h2>
            </div>
            <div className="support-response-list">
              <div className="support-response-item">
                <div className="support-response-dot" style={{ background: '#4f46e5' }} />
                <div>
                  <strong>Email</strong>
                  <p>Within 24 hours</p>
                </div>
              </div>
              <div className="support-response-item">
                <div className="support-response-dot" style={{ background: '#059669' }} />
                <div>
                  <strong>Phone</strong>
                  <p>Within 1 hour (business hours)</p>
                </div>
              </div>
              <div className="support-response-item">
                <div className="support-response-dot" style={{ background: '#0a66c2' }} />
                <div>
                  <strong>LinkedIn</strong>
                  <p>Within 2 hours</p>
                </div>
              </div>
            </div>
          </div>

          <div className="support-panel">
            <div className="support-panel-header">
              <MessageSquare size={17} color="#0ea5e9" />
              <h2>Before You Reach Out</h2>
            </div>
            <ul className="support-tips-list">
              <li>Check the FAQ section below for quick answers</li>
              <li>Include your admin email when contacting support</li>
              <li>Describe the issue with steps to reproduce it</li>
              <li>Attach screenshots if the issue is visual</li>
              <li>Mention the affected section (e.g. Verifications, Revenue)</li>
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="support-section-label" style={{ marginTop: 28 }}>Frequently Asked Questions</div>
        <div className="support-faq">
          {faqs.map((item, i) => (
            <div key={i} className={`faq-item ${openFaq === i ? 'open' : ''}`}>
              <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{item.q}</span>
                {openFaq === i ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
              </button>
              {openFaq === i && <div className="faq-answer">{item.a}</div>}
            </div>
          ))}
        </div>

        {/* POWERED BY SMARTNEX */}
        <div className="support-smartnex-footer">
          <img src="/smartnexLogo.png" alt="Smartnex Technologies" className="smartnex-footer-logo" />
          <div className="smartnex-footer-text">
            <span className="smartnex-powered-label">Powered by</span>
            <span className="smartnex-company-name">Smartnex Technologies Pvt Ltd</span>
          </div>
        </div>

      </div>
    </div>
  );
}
