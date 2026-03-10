import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import logo from '../assets/image.png';
import api from '../api/axios';
import './AdminLogin.css';

export default function AdminLogin() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/admin/login', {
        email: employeeId,
        password,
      });

      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('adminToken', data.token);
      storage.setItem('adminUser', JSON.stringify(data.user));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
      >
        <div className="brand-header">
          <motion.div
            className="brand-logo"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <img src={logo} alt="SITELINK Logo" />
          </motion.div>
          <motion.h1
            className="brand-title"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            SITELINK
          </motion.h1>
          <motion.p
            className="brand-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            ADMIN MANAGEMENT PORTAL
          </motion.p>
        </div>

        <motion.div
          className="welcome"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          <h2>Welcome Back</h2>
          <p>Enter your credentials to access the job site portal</p>
        </motion.div>

        {error && (
          <motion.div
            className="error-alert"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <AlertCircle size={20} />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit}>
          <motion.div
            className="input-group"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <User className="input-icon" size={20} />
            <input
              type="text"
              placeholder="ID-000000"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            />
          </motion.div>

          <motion.div
            className="input-group"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </motion.div>

          <motion.div
            className="options"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <label className="checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Stay logged in for this shift
            </label>
            <button type="button" className="forgot-link">
              Forgot Password?
            </button>
          </motion.div>

          <motion.button
            type="submit"
            className="login-btn"
            disabled={loading}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Signing in...
              </motion.span>
            ) : (
              <>
                <ArrowRight size={18} style={{ marginRight: 8 }} />
                AUTHORIZE ACCESS
              </>
            )}
          </motion.button>
        </form>

        {/* <div className="support">
          Need technical support? <span className="support-ext">ext404</span>
        </div> */}


      </motion.div>
    </div>
  );
}
