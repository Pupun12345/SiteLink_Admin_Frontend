import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, AlertCircle, ArrowRight, X } from 'lucide-react';
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
  const [forgotPhone, setForgotPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/admin/login', {
        email,
        password,
      });
      
      localStorage.setItem('adminToken', response.data.token);
      window.location.href = '/admin/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

const handleSendOTP = async (e) => {
  e.preventDefault();
  setForgotMessage('');
  setForgotLoading(true);

  try {
    const { data } = await api.post('/auth/forgot-password', {
      email: forgotEmail,
      phone: forgotPhone,
    });
    setForgotMessage(data.message || 'OTP sent to your email');
    setForgotStep(2);
  } catch (err) {
    setForgotMessage(err.response?.data?.message || 'Failed to send OTP');
  } finally {
    setForgotLoading(false);
  }
};

const handleResetPassword = async (e) => {
  e.preventDefault();
  setForgotMessage('');

  if (newPassword !== confirmPassword) {
    setForgotMessage('Passwords do not match');
    return;
  }

  if (newPassword.length < 6) {
    setForgotMessage('Password must be at least 6 characters');
    return;
  }

  setForgotLoading(true);

  try {
    const { data } = await api.post('/auth/reset-password', {
      email: forgotEmail,
      phone: forgotPhone,
      otp: otp,
      newPassword: newPassword,
    });
    setForgotMessage(data.message || 'Password reset successfully');
    setTimeout(() => {
      setShowForgotPassword(false);
      setForgotStep(1);
      setForgotEmail('');
      setForgotPhone('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setForgotMessage('');
    }, 2000);
  } catch (err) {
    setForgotMessage(err.response?.data?.message || 'Failed to reset password');
  } finally {
    setForgotLoading(false);
  }
};

const closeForgotModal = () => {
  setShowForgotPassword(false);
  setForgotStep(1);
  setForgotEmail('');
  setForgotPhone('');
  setOtp('');
  setNewPassword('');
  setConfirmPassword('');
  setForgotMessage('');
};

return (
  <div className="login-container">
    <motion.div
      className="login-card"
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="brand-header" style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
        <motion.div
          className="brand-logo"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="logo-icon">
            <img src="../SiteLinkIcon.png" alt="" style={{ height: "32px", width: "32px" }} />
          </div>
        </motion.div>
        <motion.h1
          className="brand-title"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
        >
          SiteLink
        </motion.h1>
        <motion.p
          className="brand-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          Workforce Management Platform
        </motion.p>
      </div>

      <motion.div
        className="login-header"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <h2>Admin Login</h2>
        <p>Enter your credentials to access the dashboard</p>
      </motion.div>

      {error && (
        <motion.div
          className="error-alert"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </motion.div>
      )}

      <form onSubmit={handleSubmit}>
        <motion.div
          className="form-field"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <label htmlFor="email">Email Address</label>
          <div className="input-wrapper">
            <Mail className="input-icon" size={18} />
            <input
              id="email"
              type="email"
              placeholder="admin@sitelink.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </motion.div>

        <motion.div
          className="form-field"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="field-header">
            <label htmlFor="password">Password</label>
            <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); }}>Forgot Password?</a>
          </div>
          <div className="input-wrapper">
            <Lock className="input-icon" size={18} />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </motion.div>

        <motion.button
          type="submit"
          className="login-btn"
          disabled={loading}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              Sign In to Dashboard
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </form>

      <motion.div
        className="support-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Need help? <a href="#" className="support-link">Contact Support</a>
      </motion.div>

      <motion.div
        className="status-footer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
      >
        <div className="status-indicator"></div>
        ALL SYSTEMS OPERATIONAL
      </motion.div>
    </motion.div>

    {showForgotPassword && (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            position: 'relative'
          }}
        >
          <button
            onClick={closeForgotModal}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <X size={20} />
          </button>

          {forgotStep === 1 ? (
            <>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>Forgot Password</h3>
              <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>Enter your email and phone number to receive an OTP</p>

              {forgotMessage && (
                <div style={{
                  padding: '12px',
                  background: forgotMessage.includes('Failed') ? '#fee2e2' : '#d1fae5',
                  color: forgotMessage.includes('Failed') ? '#991b1b' : '#065f46',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  {forgotMessage}
                </div>
              )}

              <form onSubmit={handleSendOTP}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Email Address</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="admin@sitelink.com"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Phone Number</label>
                  <input
                    type="tel"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    placeholder="Enter phone number"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                    opacity: forgotLoading ? 0.6 : 1
                  }}
                >
                  {forgotLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600' }}>Reset Password</h3>
              <p style={{ margin: '0 0 24px 0', color: '#6b7280', fontSize: '14px' }}>Enter OTP and your new password</p>

              {forgotMessage && (
                <div style={{
                  padding: '12px',
                  background: forgotMessage.includes('Failed') || forgotMessage.includes('not match') || forgotMessage.includes('at least') ? '#fee2e2' : '#d1fae5',
                  color: forgotMessage.includes('Failed') || forgotMessage.includes('not match') || forgotMessage.includes('at least') ? '#991b1b' : '#065f46',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  {forgotMessage}
                </div>
              )}

              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>OTP</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: forgotLoading ? 'not-allowed' : 'pointer',
                    opacity: forgotLoading ? 0.6 : 1
                  }}
                >
                  {forgotLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    )}
  </div>
);
}
