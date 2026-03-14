import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  UserPlus,
  Store,
  Clock,
  Briefcase,
  DollarSign,
  Bell,
  Search,
  LogOut,
  Shield,
  Settings,
  HelpCircle,
  Calendar,
  Wrench,
} from 'lucide-react';
import api from '../api/axios';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('1M');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/stats/overview');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  if (loading) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Wrench size={24} />
          </div>
          <div className="logo-text">
            <h3>SiteLink</h3>
            <p>ADMIN CONSOLE</p>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="section-label">MAIN</p>
          <nav className="sidebar-nav">
            <button className="nav-item active">
              <div className="nav-icon"><Calendar size={20} /></div>
              <span>Dashboard</span>
            </button>
            <button className="nav-item" onClick={() => navigate('/admin/workers')}>
              <div className="nav-icon"><Users size={20} /></div>
              <span>Workers</span>
            </button>
            <button className="nav-item">
              <div className="nav-icon"><Store size={20} /></div>
              <span>Vendors</span>
            </button>
            <button className="nav-item">
              <div className="nav-icon"><Shield size={20} /></div>
              <span>Verifications</span>
            </button>
            <button className="nav-item">
              <div className="nav-icon"><Briefcase size={20} /></div>
              <span>Jobs</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-section">
          <p className="section-label">FINANCE</p>
          <nav className="sidebar-nav">
            <button className="nav-item">
              <div className="nav-icon"><DollarSign size={20} /></div>
              <span>Revenue</span>
            </button>
            <button className="nav-item">
              <div className="nav-icon"><Briefcase size={20} /></div>
              <span>Subscriptions</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="nav-item">
            <div className="nav-icon"><Settings size={20} /></div>
            <span>Settings</span>
          </button>
          <button className="nav-item">
            <div className="nav-icon"><HelpCircle size={20} /></div>
            <span>Support</span>
          </button>
          <button className="nav-item nav-item-logout" onClick={handleLogout}>
            <div className="nav-icon"><LogOut size={20} /></div>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Top Bar */}
        <header className="dashboard-topbar">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search analytics, users, or jobs..." />
          </div>

          <div className="topbar-actions">
            <button className="action-btn primary">
              <UserPlus size={18} />
              Invite User
            </button>
            <button className="icon-btn">
              <Bell size={20} />
              <span className="notification-badge"></span>
            </button>
            <div className="user-menu">
              <div className="user-avatar">
                <img src="https://ui-avatars.com/api/?name=Alex+Rivera&background=3b82f6&color=fff" alt="Admin" />
              </div>
              <div className="user-info">
                <p className="user-name">{adminUser.name || 'Alex Rivera'}</p>
                <p className="user-role">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="dashboard-content">
          {/* Page Header */}
          <div className="content-header">
            <div>
              <h1>Platform Overview</h1>
              <p className="subtitle">Real-time analytics and activity across SiteLink network.</p>
            </div>
            <div className="time-filters">
              {['1D', '5D', '1M', '1Y'].map((filter) => (
                <button
                  key={filter}
                  className={`filter-btn ${timeFilter === filter ? 'active' : ''}`}
                  onClick={() => setTimeFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            <motion.div
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="stat-header">
                <p className="stat-label">TOTAL<br />WORKERS</p>
                <span className="stat-badge success">↑8%</span>
              </div>
              <div className="stat-value">{stats?.totalWorkers?.toLocaleString() || '12,540'}</div>
            </motion.div>

            <motion.div
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="stat-header">
                <p className="stat-label">TOTAL<br />VENDORS</p>
                <span className="stat-badge success">↑3%</span>
              </div>
              <div className="stat-value">{stats?.totalVendors?.toLocaleString() || '1,240'}</div>
            </motion.div>

            <motion.div
              className="stat-card highlight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="stat-header">
                <p className="stat-label">PENDING<br />VERIFICATIONS</p>
                <span className="stat-badge warning">Action<br/>Needed</span>
              </div>
              <div className="stat-value">{stats?.pendingWorkers || '45'}</div>
            </motion.div>

            <motion.div
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="stat-header">
                <p className="stat-label">ACTIVE JOBS</p>
              </div>
              <div className="stat-value">{stats?.activeJobs || '82'} <span className="stat-sub">Stable</span></div>
            </motion.div>

            <motion.div
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="stat-header">
                <p className="stat-label">SUBSCRIPTIONS</p>
              </div>
              <div className="stat-value">{stats?.subscriptions || '912'} <span className="stat-sub">Stable</span></div>
            </motion.div>

            <motion.div
              className="stat-card highlight-revenue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="stat-header">
                <p className="stat-label">TOTAL<br />REVENUE</p>
                <span className="stat-badge success">↑12</span>
              </div>
              <div className="stat-value">${stats?.totalRevenue?.toLocaleString() || '124,000'}</div>
            </motion.div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            <motion.div
              className="chart-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="chart-header">
                <h3>Worker Growth</h3>
                <button className="options-btn">⋯</button>
              </div>
              <div className="chart-placeholder">
                <svg viewBox="0 0 600 250" className="line-chart">
                  <defs>
                    <linearGradient id="workerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
                      <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 200 Q 100 180, 150 160 T 300 120 T 450 80 T 600 40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  <path
                    d="M 0 200 Q 100 180, 150 160 T 300 120 T 450 80 T 600 40 L 600 250 L 0 250 Z"
                    fill="url(#workerGradient)"
                  />
                </svg>
                <div className="chart-labels">
                  <span>JAN</span>
                  <span>MAR</span>
                  <span>MAY</span>
                  <span>JUL</span>
                  <span>SEP</span>
                  <span>NOV</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="chart-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
            >
              <div className="chart-header">
                <h3>Vendor Registrations</h3>
              </div>
              <div className="chart-placeholder bar-chart">
                <div className="bar-group">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <div key={i} className="bar-column">
                      <div
                        className="bar"
                        style={{
                          height: `${[40, 30, 55, 35, 80, 25, 20][i]}%`,
                          background: i === 4 ? '#3b82f6' : '#e5e7eb',
                        }}
                      ></div>
                      <span className="bar-label">{day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Charts */}
          <div className="bottom-charts">
            <motion.div
              className="chart-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="chart-header">
                <h3>Monthly Revenue</h3>
              </div>
              <div className="chart-placeholder line-chart-small">
                <svg viewBox="0 0 400 120" className="revenue-chart">
                  <path
                    d="M 0 80 L 100 90 L 200 40 L 300 50 L 400 10"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />
                  <circle cx="400" cy="10" r="5" fill="#3b82f6" />
                  <path d="M 390 20 L 400 10 L 410 20" fill="none" stroke="#3b82f6" strokeWidth="2" />
                </svg>
              </div>
            </motion.div>

            <motion.div
              className="chart-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <div className="chart-header">
                <h3>User Distribution</h3>
              </div>
              <div className="chart-placeholder">
                <div className="donut-chart">
                  <svg viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="20"
                      strokeDasharray="420 502"
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="20"
                      strokeDasharray="82 502"
                      strokeDashoffset="-420"
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                  <div className="donut-center">
                    <div className="donut-value">14.7k</div>
                    <div className="donut-label">Total Users</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
