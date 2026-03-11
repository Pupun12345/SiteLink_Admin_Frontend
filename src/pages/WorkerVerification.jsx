import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Store,
  Clock,
  Briefcase,
  DollarSign,
  Bell,
  Search,
  Settings,
  HelpCircle,
  Calendar,
  Wrench,
  Shield,
  Download,
  X,
  ChevronDown,
  FileText,
  Star,
} from 'lucide-react';
import api from '../api/axios';
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
      const { data } = await api.get('/admin/workers/all');
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

  const getStatusBadgeClass = (status) => {
    if (status === 'verified' || status === 'approved') return 'status-approved';
    if (status === 'pending') return 'status-pending';
    if (status === 'rejected') return 'status-rejected';
    return 'status-pending';
  };

  const getStatusText = (worker) => {
    if (worker.isVerified) return 'APPROVED';
    if (worker.verificationStatus === 'rejected') return 'REJECTED';
    return 'PENDING';
  };

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

  const filteredWorkers = workers.filter(worker => {
    if (statusFilter === 'pending' && worker.isVerified) return false;
    if (statusFilter === 'approved' && !worker.isVerified) return false;
    if (roleFilter && !worker.skills?.some(s => s.skillName.toLowerCase().includes(roleFilter.toLowerCase()))) return false;
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
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Wrench size={24} />
          </div>
          <div className="logo-text">
            <h3>SiteLink</h3>
            <p>ENTERPRISE ADMIN</p>
          </div>
        </div>

        <div className="sidebar-section">
          <p className="section-label">MAIN</p>
          <nav className="sidebar-nav">
            <button className="nav-item" onClick={() => navigate('/admin/dashboard')}>
              <div className="nav-icon"><Calendar size={20} /></div>
              <span>Dashboard</span>
            </button>
            <button className="nav-item active">
              <div className="nav-icon"><Users size={20} /></div>
              <span>Worker Verification</span>
            </button>
            <button className="nav-item">
              <div className="nav-icon"><Store size={20} /></div>
              <span>Vendor Verification</span>
            </button>
            <button className="nav-item">
              <div className="nav-icon"><Users size={20} /></div>
              <span>User Management</span>
            </button>
            <button className="nav-item">
              <div className="nav-icon"><FileText size={20} /></div>
              <span>Reports</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-section">
          <p className="section-label">SETTINGS</p>
          <nav className="sidebar-nav">
            <button className="nav-item">
              <div className="nav-icon"><Shield size={20} /></div>
              <span>System Settings</span>
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="nav-item">
            <div className="nav-icon"><HelpCircle size={20} /></div>
            <span>Support Center</span>
          </button>
        </div>
      </aside>

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
              <div className="stat-box-value">{workers.filter(w => !w.isVerified && w.verificationStatus !== 'rejected').length}</div>
              <p className="stat-box-change warning">8 requires urgent action</p>
            </motion.div>

            <motion.div
              className="stat-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="stat-box-label">APPROVED WORKERS</p>
              <div className="stat-box-value">{workers.filter(w => w.isVerified).length.toLocaleString()}</div>
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
                          src={worker.profileImage ? `http://localhost:5000/${worker.profileImage}` : `https://ui-avatars.com/api/?name=${worker.name}&background=3b82f6&color=fff`}
                          alt={worker.name}
                          className="worker-table-avatar"
                        />
                        <div>
                          <div className="worker-name">{worker.name}</div>
                          <div className="worker-id">ID: #WK-{worker._id.slice(-4)}</div>
                        </div>
                      </div>
                    </td>
                    <td>{worker.skills?.[0]?.skillName || 'General'}</td>
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
                        VIEW {(worker.aadhaarFrontImage ? 1 : 0) + (worker.aadhaarBackImage ? 1 : 0) + (worker.certificates?.length || 0)} FILES
                      </button>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(worker.verificationStatus)}`}>
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

  const fetchWorkerDetails = async (id) => {
    try {
      const { data } = await api.get(`/admin/workers/${id}`);
      setSelectedWorker(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.put(`/admin/workers/${id}/verify`);
      alert('Worker verified successfully!');
      setSelectedWorker(null);
      fetchPendingWorkers();
    } catch (err) {
      alert(err.response?.data?.message || 'Verification failed');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await api.put(`/admin/workers/${selectedWorker._id}/reject`, { reason: rejectionReason });
      alert('Worker verification rejected');
      setShowRejectModal(false);
      setSelectedWorker(null);
      setRejectionReason('');
      fetchPendingWorkers();
    } catch (err) {
      alert(err.response?.data?.message || 'Rejection failed');
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-header">
        <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1>Pending Worker Verifications</h1>
      </div>

      {loading ? (
        <div className="loading">Loading workers...</div>
      ) : workers.length === 0 ? (
        <div className="empty-state">No pending verifications</div>
      ) : (
        <div className="workers-grid">
          {workers.map((worker, index) => (
            <motion.div
              key={worker._id}
              className="worker-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <img
                src={`http://localhost:5000/${worker.profileImage}`}
                alt={worker.name}
                className="worker-avatar"
              />
              <h3>{worker.name}</h3>
              <p className="worker-phone">{worker.phone}</p>
              <div className="worker-details">
                <span className="badge">{worker.experience}</span>
                <span className="badge">{worker.city}</span>
              </div>
              <button className="view-btn" onClick={() => fetchWorkerDetails(worker._id)}>
                <Eye size={16} />
                View Details
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedWorker && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedWorker(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setSelectedWorker(null)}>
                <X size={24} />
              </button>

              <div className="modal-header">
                <img
                  src={`http://localhost:5000/${selectedWorker.profileImage}`}
                  alt={selectedWorker.name}
                  className="modal-avatar"
                />
                <div>
                  <h2>{selectedWorker.name}</h2>
                  <p>{selectedWorker.phone}</p>
                </div>
              </div>

              <div className="modal-body">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Age</label>
                    <span>{selectedWorker.age || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Experience</label>
                    <span>{selectedWorker.experience}</span>
                  </div>
                  <div className="info-item">
                    <label>City</label>
                    <span>{selectedWorker.city}</span>
                  </div>
                  <div className="info-item">
                    <label>Daily Rate</label>
                    <span>₹{selectedWorker.dailyRate || 'N/A'}</span>
                  </div>
                </div>

                {selectedWorker.skills?.length > 0 && (
                  <div className="skills-section">
                    <label>Skills</label>
                    <div className="skills-list">
                      {selectedWorker.skills.map((skill) => (
                        <span key={skill.skillId} className="skill-badge">
                          {skill.skillName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="documents-section">
                  <label>ID Proof (Aadhaar)</label>
                  <div className="documents-grid">
                    {selectedWorker.aadhaarFrontImage && (
                      <div className="document-card">
                        <img src={`http://localhost:5000/${selectedWorker.aadhaarFrontImage}`} alt="Aadhaar Front" />
                        <a href={`http://localhost:5000/${selectedWorker.aadhaarFrontImage}`} download>
                          <Download size={16} /> Front
                        </a>
                      </div>
                    )}
                    {selectedWorker.aadhaarBackImage && (
                      <div className="document-card">
                        <img src={`http://localhost:5000/${selectedWorker.aadhaarBackImage}`} alt="Aadhaar Back" />
                        <a href={`http://localhost:5000/${selectedWorker.aadhaarBackImage}`} download>
                          <Download size={16} /> Back
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {selectedWorker.certificates?.length > 0 && (
                  <div className="documents-section">
                    <label>Certificates</label>
                    <div className="documents-grid">
                      {selectedWorker.certificates.map((cert, idx) => (
                        <div key={idx} className="document-card">
                          <img src={`http://localhost:5000/${cert}`} alt={`Certificate ${idx + 1}`} />
                          <a href={`http://localhost:5000/${cert}`} download>
                            <Download size={16} /> Certificate {idx + 1}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button className="reject-btn" onClick={() => setShowRejectModal(true)}>
                  <XCircle size={20} />
                  Reject
                </button>
                <button className="approve-btn" onClick={() => handleVerify(selectedWorker._id)}>
                  <CheckCircle size={20} />
                  Approve
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              className="reject-modal"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Rejection Reason</h3>
              <textarea
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
              <div className="reject-modal-actions">
                <button onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button className="confirm-reject" onClick={handleReject}>
                  Confirm Rejection
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
