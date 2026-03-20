import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  Search,
  Download,
  X,
  ChevronDown,
  FileText,
  Star,
} from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import './WorkerVerification.css';

export default function WorkerVerification() {
  const [workers, setWorkers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  useEffect(() => {
    fetchWorkers();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/stats/overview');
      setStats(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchWorkers = async () => {
    try {
      const { data } = await api.get('/admin/users?userType=worker');
      setWorkers(data.data || []);
    } catch (err) {
      console.error('Failed to fetch workers:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (worker) => {
    if (worker.status === 'Verified' || worker.verified) return 'status-approved';
    if (worker.status === 'Pending') return 'status-pending';
    if (worker.status === 'Rejected') return 'status-rejected';
    return 'status-pending';
  };

  const getStatusText = (worker) => {
    if (worker.status === 'Verified' || worker.verified) return 'APPROVED';
    if (worker.status === 'Rejected') return 'REJECTED';
    return 'PENDING';
  };

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const filteredWorkers = workers.filter(worker => {
    if (statusFilter === 'pending' && (worker.status === 'Verified' || worker.verified)) return false;
    if (statusFilter === 'approved' && !(worker.status === 'Verified' || worker.verified)) return false;
    if (roleFilter && !worker.role?.toLowerCase().includes(roleFilter.toLowerCase())) return false;
    return true;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
  const paginatedWorkers = filteredWorkers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="loading-screen">Loading workers...</div>;
  }

  return (
    <div className="verification-page">
      <Sidebar onLogout={handleLogout} />

      {/* Main Content */}
      <main className="verification-main">
        {/* Top Bar */}
        <header className="verification-topbar">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search workers, ID or trade..." />
          </div>

          <div className="topbar-actions">
            <button className="icon-btn">
              <Bell size={20} />
              <span className="notification-badge"></span>
            </button>
            <div className="user-menu">
              <div className="user-avatar">
                <img src="https://ui-avatars.com/api/?name=Alex+Rivera&background=3b82f6&color=fff" alt="Admin" />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="verification-content">
          {/* Page Header */}
          <div className="page-header">
            <div>
              <h1>Worker Verification</h1>
              <p className="page-subtitle">Review and manage professional certifications for site personnel.</p>
            </div>
            <button className="export-btn">
              <Download size={18} />
              Export CSV
            </button>
          </div>

          {/* Stats Cards */}
          <div className="stats-row">
            <motion.div
              className="stat-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <p className="stat-box-label">TOTAL REQUESTS</p>
              <div className="stat-box-value">{workers.length.toLocaleString()}</div>
              <p className="stat-box-change success">↑ 12% this month</p>
            </motion.div>

            <motion.div
              className="stat-box highlight-orange"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <p className="stat-box-label">PENDING REVIEW</p>
              <div className="stat-box-value">{workers.filter(w => w.status === 'Pending').length}</div>
              <p className="stat-box-change warning">8 requires urgent action</p>
            </motion.div>

            <motion.div
              className="stat-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="stat-box-label">APPROVED WORKERS</p>
              <div className="stat-box-value">{workers.filter(w => w.status === 'Verified' || w.verified).length.toLocaleString()}</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '75%' }}></div>
              </div>
            </motion.div>

            <motion.div
              className="stat-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <p className="stat-box-label">AVG. RATING</p>
              <div className="stat-box-value">4.8<span className="rating-sub">/5.0</span></div>
              <p className="stat-box-change success">★ Based on 90+</p>
            </motion.div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="filter-group">
              <div className="filter-dropdown">
                <button className="filter-btn" onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
                  Filter: {statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                  <ChevronDown size={16} />
                </button>
                {showFilterDropdown && (
                  <div className="dropdown-menu">
                    <button onClick={() => { setStatusFilter('all'); setShowFilterDropdown(false); }}>All Status</button>
                    <button onClick={() => { setStatusFilter('pending'); setShowFilterDropdown(false); }}>Pending</button>
                    <button onClick={() => { setStatusFilter('approved'); setShowFilterDropdown(false); }}>Approved</button>
                  </div>
                )}
              </div>
              {roleFilter && (
                <div className="filter-pill">
                  Role: {roleFilter}
                  <button onClick={() => setRoleFilter('')}>
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
            <div className="results-count">
              SHOWING {paginatedWorkers.length} OF {filteredWorkers.length}
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="workers-table">
              <thead>
                <tr>
                  <th>WORKER NAME</th>
                  <th>ROLE</th>
                  <th>EXPERIENCE</th>
                  <th>CITY</th>
                  <th>RATING</th>
                  <th>DOCUMENTS</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedWorkers.map((worker, index) => (
                  <motion.tr
                    key={worker._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td>
                      <div className="worker-cell">
                        <img
                          src={worker.avatar || `https://ui-avatars.com/api/?name=${worker.name}&background=3b82f6&color=fff`}
                          alt={worker.name}
                          className="worker-table-avatar"
                        />
                        <div>
                          <div className="worker-name">{worker.name}</div>
                          <div className="worker-id">ID: #WK-{worker._id.slice(-4)}</div>
                        </div>
                      </div>
                    </td>
                    <td>{worker.role || 'General Worker'}</td>
                    <td>{worker.experience || 'N/A'}</td>
                    <td>{worker.city || 'N/A'}</td>
                    <td>
                      <div className="rating-cell">
                        <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                        <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                        <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                        <Star size={14} fill="#fbbf24" stroke="#fbbf24" />
                        <Star size={14} fill="#e5e7eb" stroke="#e5e7eb" />
                        <span>4.5</span>
                      </div>
                    </td>
                    <td>
                      <button className="view-files-btn">
                        <FileText size={16} />
                        VIEW FILES
                      </button>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(worker)}`}>
                        {getStatusText(worker)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="pagination">
            <div className="pagination-info">
              Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredWorkers.length)}</strong> of <strong>{filteredWorkers.length}</strong> entries
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                &lt;
              </button>
              {[...Array(Math.min(3, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 3 && <span className="page-ellipsis">...</span>}
              <button
                className="page-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
