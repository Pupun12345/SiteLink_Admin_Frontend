import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  Clock,
  XCircle,
  LogOut,
  Menu,
  X,
  Bell,
  MapPin,
  BarChart2,
  Wrench,
} from 'lucide-react';
import api from '../api/axios';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const { data } = await api.get('/stats/overview');
      setOverview(data.data);
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

  const statCards = [
    {
      title: 'Total Workers',
      value: overview?.totalWorkers ?? 0,
      delta: `${overview?.verifiedWorkers ?? 0} verified`,
      icon: Users,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.15)',
    },
    {
      title: 'Verified Workers',
      value: overview?.verifiedWorkers ?? 0,
      delta: 'Active and approved',
      icon: UserCheck,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
    },
    {
      title: 'Pending Review',
      value: overview?.pendingWorkers ?? 0,
      delta: 'Awaiting verification',
      icon: Clock,
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
    },
    {
      title: 'Rejected',
      value: overview?.rejectedWorkers ?? 0,
      delta: 'Documents rejected',
      icon: XCircle,
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
    },
  ];

  const formatStatValue = (card) => {
    return typeof card.value === 'number'
      ? card.value.toLocaleString()
      : card.value;
  };

  const adminUser = localStorage.getItem('adminUser');
  const adminName = adminUser ? JSON.parse(adminUser)?.name : 'Admin';

  return (
    <div className="dashboard-container">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>SITELINK</h2>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          <button className="nav-item active">
            <BarChart2 size={20} />
            {sidebarOpen && <span>Dashboard</span>}
          </button>
          <button className="nav-item" onClick={() => navigate('/admin/workers')}>
            <Clock size={20} />
            {sidebarOpen && <span>Pending Workers</span>}
          </button>
          <button className="nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="dashboard-header">
          <div className="brand">
            <div className="brand-logo">
              <Wrench size={22} />
            </div>
            <div>
              <h1>SITELINK</h1>
              <p className="role">Admin</p>
            </div>
          </div>

          <div className="header-actions">
            <button className="icon-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="admin-info">
              <span>{adminName || 'Admin'}</span>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="loading">Loading dashboard…</div>
        ) : (
          <div className="dashboard-grid">
            <div className="stats-grid">
              {statCards.map((card, index) => (
                <motion.div
                  key={card.title}
                  className="stat-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                    <card.icon size={18} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-title">{card.title}</p>
                    <div className="stat-number">
                      {formatStatValue(card)}
                    </div>
                    <p className="stat-delta">{card.delta}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="widgets-grid">
              <motion.div
                className="widget card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="widget-header">
                  <div className="widget-header-left">
                    <div className="widget-icon" style={{ background: 'rgba(245, 158, 11, 0.18)' }}>
                      <Clock size={18} />
                    </div>
                    <div>
                      <h2>Pending Verifications</h2>
                      <p className="widget-subtitle">
                        {overview?.pendingWorkers ?? 0} worker{(overview?.pendingWorkers ?? 0) !== 1 ? 's' : ''} awaiting document review
                      </p>
                    </div>
                  </div>
                </div>

                <button className="action-btn" onClick={() => navigate('/admin/workers')}>
                  Review Now
                </button>
              </motion.div>

              <motion.div
                className="widget card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="widget-header">
                  <h2>Worker Statistics</h2>
                </div>

                <div className="project-list">
                  <div className="project-row">
                    <div className="project-meta">
                      <span className="project-name">Verified Workers</span>
                      <span className="project-progress">{overview?.verifiedWorkers ?? 0}</span>
                    </div>
                    <div className="project-bar">
                      <div
                        className="project-fill"
                        style={{ 
                          width: `${((overview?.verifiedWorkers ?? 0) / (overview?.totalWorkers || 1)) * 100}%`, 
                          background: 'linear-gradient(90deg, #10b981, #059669)' 
                        }}
                      />
                    </div>
                  </div>
                  <div className="project-row">
                    <div className="project-meta">
                      <span className="project-name">Pending Review</span>
                      <span className="project-progress">{overview?.pendingWorkers ?? 0}</span>
                    </div>
                    <div className="project-bar">
                      <div
                        className="project-fill"
                        style={{ 
                          width: `${((overview?.pendingWorkers ?? 0) / (overview?.totalWorkers || 1)) * 100}%`, 
                          background: 'linear-gradient(90deg, #f59e0b, #d97706)' 
                        }}
                      />
                    </div>
                  </div>
                  <div className="project-row">
                    <div className="project-meta">
                      <span className="project-name">Rejected</span>
                      <span className="project-progress">{overview?.rejectedWorkers ?? 0}</span>
                    </div>
                    <div className="project-bar">
                      <div
                        className="project-fill"
                        style={{ 
                          width: `${((overview?.rejectedWorkers ?? 0) / (overview?.totalWorkers || 1)) * 100}%`, 
                          background: 'linear-gradient(90deg, #ef4444, #dc2626)' 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="widget card recent-updates"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="widget-header">
                  <h2>Quick Stats</h2>
                </div>
                <div className="updates-list">
                  <div className="update-row">
                    <div className="update-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                      <UserCheck size={18} />
                    </div>
                    <div className="update-text">
                      <span className="update-title">{overview?.verifiedWorkers ?? 0} Verified Workers</span>
                      <span className="update-subtitle">Ready for deployment</span>
                    </div>
                  </div>
                  <div className="update-row">
                    <div className="update-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                      <Clock size={18} />
                    </div>
                    <div className="update-text">
                      <span className="update-title">{overview?.pendingWorkers ?? 0} Pending Review</span>
                      <span className="update-subtitle">Action required</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        <footer className="bottom-nav">
          <button className="bottom-nav-item active">
            <BarChart2 size={18} />
            <span>Dashboard</span>
          </button>
          <button className="bottom-nav-item" onClick={() => navigate('/admin/sites')}>
            <MapPin size={18} />
            <span>Sites</span>
          </button>
          <button className="bottom-nav-item" onClick={() => navigate('/admin/workers')}>
            <Users size={18} />
            <span>Workers</span>
          </button>
          <button className="bottom-nav-item" onClick={() => navigate('/admin/reports')}>
            <BarChart2 size={18} />
            <span>Reports</span>
          </button>
          <button className="bottom-nav-item" onClick={() => navigate('/admin/settings')}>
            <UserCheck size={18} />
            <span>Admin</span>
          </button>
        </footer>
      </main>
    </div>
  );
}
