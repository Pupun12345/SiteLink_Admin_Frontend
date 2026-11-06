import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Lock, Mail, X } from 'lucide-react';
import api from '../api/axios';
import './AdminLogin.css';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // First, try Super Admin login.
    try {
      const response = await api.post('/auth/admin/login', {
        email,
        password,
      });

      if (response.data.success && response.data.token) {
        localStorage.setItem('adminToken', response.data.token);
        navigate('/admin/dashboard', { replace: true });
        return;
      }
    } catch (superAdminErr) {
      // If Super Admin login fails, try Admin User login.
      try {
        const response = await api.post('/admin-users/login', {
          email,
          password,
        });

        if (response.data.success && response.data.token) {
          localStorage.setItem('adminUser', response.data.token);
          navigate('/admin/dashboard', { replace: true });
          return;
        }
      } catch (adminUserErr) {
        setError(adminUserErr.response?.data?.message || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setForgotMessage('');
    setForgotLoading(true);

    try {
      const response = await api.post('/auth/admin-forgot-password', {
        email: forgotEmail,
      });

      setForgotMessage(
        response.data.message || 'Temporary password sent to your email'
      );

      // Close the modal after 2 seconds on success.
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotEmail('');
        setForgotMessage('');
      }, 2000);
    } catch (err) {
      setForgotMessage(
        err.response?.data?.message || 'Failed to send temporary password'
      );
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotPassword(false);
    setForgotStep(1);
    setForgotEmail('');
    setForgotMessage('');
  };

  return (
    <main className="login-container">
      <motion.section
        className="login-shell"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <section className="login-welcome-panel">
          <div className="welcome-decoration welcome-decoration-one" />
          <div className="welcome-decoration welcome-decoration-two" />
          <div className="welcome-decoration welcome-decoration-three" />

          <div className="welcome-brand">
            <img src="/SiteLinkIcon.png" alt="SiteLink logo" />
          </div>

          <div className="welcome-copy">
            <span className="welcome-hello">Hello</span>
            <h1>Sitelink!</h1>
            <p>
              Manage your workforce, streamline operations, and keep your
              projects moving forward — all from one place.
            </p>
          </div>

          <div className="welcome-footer">
            © {new Date().getFullYear()} Sitelink. All rights reserved.
          </div>
        </section>

        <section className="login-form-panel">
          <div className="form-panel-content">
            <header className="form-brand">
              <img src="/SiteLinkIcon.png" alt="SiteLink logo" />
              <span>Sitelink</span>
            </header>

            <div className="login-header">
              <h2>Welcome Back!</h2>
              <p>Sign in to access your admin dashboard.</p>
            </div>

            {error && (
              <motion.div
                className="error-alert"
                role="alert"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </motion.div>
            )}

            <form className="login-form" onSubmit={handleSignIn}>
              <div className="form-field">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={17} />
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={17} />
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="login-loading">
                    <span className="login-spinner" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Login Now
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              <div className="forgot-row">
                <span>Forgot password?</span>
                <button
                  type="button"
                  className="forgot-password"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Click here
                </button>
              </div>
            </form>

            <div className="login-bottom">
              <div className="status-footer">
                <span className="status-indicator" />
                <span>ALL SYSTEMS OPERATIONAL</span>
              </div>

              <div className="support-footer">
                Need help?{' '}
                <a href="/admin/direct-access-support">Contact Support</a>
              </div>

              <footer className="login-smartnex-footer">
                <span className="login-powered-label">POWERED BY</span>
                <img
                  src="/smartnexLogo.png"
                  alt="Smartnex Technologies"
                  className="login-smartnex-logo"
                />
                <span className="login-smartnex-name">
                  Smartnex Technologies Pvt Ltd
                </span>
              </footer>
            </div>
          </div>
        </section>
      </motion.section>

      {showForgotPassword && (
        <div className="forgot-modal-overlay">
          <motion.div
            className="forgot-modal"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <button
              type="button"
              className="forgot-close-btn"
              onClick={closeForgotModal}
              aria-label="Close"
            >
              <X size={19} />
            </button>

            {forgotStep === 1 ? (
              <>
                <div className="forgot-modal-icon">
                  <Lock size={22} />
                </div>
                <h3>Forgot Password?</h3>
                <p className="forgot-modal-description">
                  Enter your registered email address to receive your
                  temporary password.
                </p>

                {forgotMessage && (
                  <div
                    className={`forgot-message ${
                      forgotMessage.includes('Failed')
                        ? 'forgot-message-error'
                        : 'forgot-message-success'
                    }`}
                    role="status"
                  >
                    {forgotMessage}
                  </div>
                )}

                <form onSubmit={handleSendOTP}>
                  <div className="form-field">
                    <label htmlFor="forgot-email">Email Address</label>
                    <div className="input-wrapper">
                      <Mail className="input-icon" size={17} />
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="forgot-submit-btn"
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Sending...' : 'Send Password'}
                  </button>
                </form>
              </>
            ) : null}
          </motion.div>
        </div>
      )}
    </main>
  );
}
