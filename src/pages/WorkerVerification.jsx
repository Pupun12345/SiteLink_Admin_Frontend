import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Eye, Download, X } from 'lucide-react';
import api from '../api/axios';
import './WorkerVerification.css';

export default function WorkerVerification() {
  const [workers, setWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingWorkers();
  }, []);

  const fetchPendingWorkers = async () => {
    try {
      const { data } = await api.get('/admin/workers/pending');
      setWorkers(data.data);
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
