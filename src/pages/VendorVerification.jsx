import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Eye, Download, X, Building } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';
import './WorkerVerification.css';

export default function VendorVerification() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchPendingVendors();
  }, []);

  const fetchPendingVendors = async () => {
    try {
      const { data } = await api.get('/admin/vendors/pending');
      setVendors(data.data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      toast.showToast(err.response?.data?.message || 'Failed to fetch vendors', { type: 'error' });
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const getVendorLogo = (vendor) => {
    const img = vendor?.companyLogo || vendor?.profileImage;
    if (!img) return null;
    return img.startsWith('http') ? img : `http://localhost:5000/${img}`;
  };

  const fetchVendorDetails = async (id) => {
    try {
      const { data } = await api.get(`/admin/vendors/${id}`);
      setSelectedVendor(data.data);
    } catch (err) {
      console.error(err);
      toast.showToast(err.response?.data?.message || 'Failed to load vendor', { type: 'error' });
    }
  };

  const handleVerify = async (id) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await api.put(`/admin/vendors/${id}/verify`);
      toast.showToast('Vendor verified successfully!', { type: 'success' });
      setSelectedVendor(null);
      fetchPendingVendors();
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Verification failed', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const isActionDisabled =
    isProcessing || (selectedVendor?.verificationStatus && selectedVendor.verificationStatus !== 'pending');

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.showToast('Please provide a rejection reason', { type: 'error' });
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await api.put(`/admin/vendors/${selectedVendor._id}/reject`, { reason: rejectionReason });
      toast.showToast('Vendor verification rejected', { type: 'success' });
      setShowRejectModal(false);
      setSelectedVendor(null);
      setRejectionReason('');
      fetchPendingVendors();
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Rejection failed', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-content">
        <div className="verification-container">
          <div className="verification-header">
            <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
              <ArrowLeft size={20} />
              Back to Dashboard
            </button>
            <h1>Pending Vendor Verifications</h1>
          </div>

      {loading ? (
        <div className="loading">Loading vendors...</div>
      ) : vendors.length === 0 ? (
        <div className="empty-state">No pending verifications</div>
      ) : (
        <div className="workers-grid">
          {vendors.map((vendor, index) => (
            <motion.div
              key={vendor._id}
              className="worker-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              {(() => {
                const logoUrl = getVendorLogo(vendor);
                return logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={vendor.companyName || vendor.ownerName}
                    className="worker-avatar"
                  />
                ) : (
                  <div className="vendor-placeholder-logo">
                    <Building size={32} />
                  </div>
                );
              })()}
              <h3>{vendor.companyName || vendor.ownerName}</h3>
              <p className="worker-phone">{vendor.phone}</p>
              <div className="worker-details">
                <span className="badge">{vendor.city || 'N/A'}</span>
                <span className="badge">{vendor.gstNumber || 'GST N/A'}</span>
              </div>
              <button className="view-btn" onClick={() => navigate(`/admin/vendors/${vendor._id}`)}>
                <Eye size={16} />
                View Details
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedVendor && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVendor(null)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="modal-close" onClick={() => setSelectedVendor(null)}>
                <X size={24} />
              </button>

              <div className="modal-header">
                {(() => {
                  const vendorImage = selectedVendor.companyLogo || selectedVendor.profileImage;
                  const src = vendorImage
                    ? vendorImage.startsWith('http')
                      ? vendorImage
                      : `http://localhost:5000/${vendorImage}`
                    : undefined;
                  return (
                    <img
                      src={src}
                      alt={selectedVendor.companyName || selectedVendor.ownerName}
                      className="modal-avatar"
                    />
                  );
                })()}
                <div>
                  <h2>{selectedVendor.companyName || selectedVendor.ownerName}</h2>
                  <p>{selectedVendor.phone}</p>
                </div>
              </div>

              <div className="modal-body">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Owner Name</label>
                    <span>{selectedVendor.ownerName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Company Name</label>
                    <span>{selectedVendor.companyName || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>City</label>
                    <span>{selectedVendor.city || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Email</label>
                    <span>{selectedVendor.email || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>GST Number</label>
                    <span>{selectedVendor.gstNumber || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>PAN Number</label>
                    <span>{selectedVendor.panNumber || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>License Number</label>
                    <span>{selectedVendor.licenseNumber || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Project Types</label>
                    <span>
                      {selectedVendor.projectTypes?.length > 0
                        ? selectedVendor.projectTypes.join(', ')
                        : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="documents-section">
                  <label>PAN Card</label>
                  <div className="documents-grid">
                    {selectedVendor.panCardImage ? (
                      <div className="document-card">
                        <img src={selectedVendor.panCardImage} alt="PAN Card" />
                        <a href={selectedVendor.panCardImage} download>
                          <Download size={16} /> Download
                        </a>
                      </div>
                    ) : (
                      <div className="document-card" style={{ padding: '24px' }}>
                        <span>No PAN card uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedVendor.companyLogo && (
                  <div className="documents-section">
                    <label>Company Logo</label>
                    <div className="documents-grid">
                      <div className="document-card">
                        <img src={selectedVendor.companyLogo} alt="Company Logo" />
                        <a href={selectedVendor.companyLogo} download>
                          <Download size={16} /> Download
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  className="reject-btn"
                  onClick={() => setShowRejectModal(true)}
                  disabled={isActionDisabled}
                >
                  <XCircle size={20} />
                  Reject
                </button>
                <button
                  className="approve-btn"
                  onClick={() => handleVerify(selectedVendor._id)}
                  disabled={isActionDisabled}
                >
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
      </div>
    </div>
  );
}
