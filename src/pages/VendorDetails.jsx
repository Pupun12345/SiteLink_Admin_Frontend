import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, Download, Building } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';
import './VendorDetails.css';

export default function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const toast = useToast();

  const fetchVendor = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/vendors/${id}`);
      setVendor(data.data);
    } catch (err) {
      console.error('Failed to load vendor:', err);
      setError(err.response?.data?.message || 'Unable to load vendor');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  const handleVerify = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await api.put(`/admin/vendors/${id}/verify`);
      await fetchVendor();
      toast.showToast('Vendor approved successfully', { type: 'success' });
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Approval failed', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.showToast('Please provide a rejection reason', { type: 'error' });
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await api.put(`/admin/vendors/${id}/reject`, { reason: rejectionReason });
      setShowReject(false);
      setRejectionReason('');
      await fetchVendor();
      toast.showToast('Vendor rejected', { type: 'success' });
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Rejection failed', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatus = () => {
    if (!vendor) return 'pending';
    return vendor.verificationStatus || 'pending';
  };

  const statusText = {
    pending: 'Pending Review',
    verified: 'Verified',
    rejected: 'Rejected',
  };

  const statusClass = {
    pending: 'status-pill pending',
    verified: 'status-pill verified',
    rejected: 'status-pill rejected',
  };

  const vendorImage = vendor?.companyLogo || vendor?.profileImage;
  const vendorImageUrl = vendorImage
    ? vendorImage.startsWith('http')
      ? vendorImage
      : `http://localhost:5000/${vendorImage}`
    : undefined;

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-content">
        <header className="vendor-top-card">
          <div className="vendor-breadcrumbs">
            <button className="breadcrumb-link" onClick={() => navigate('/admin/vendors')}>Vendors</button>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">{vendor?.companyName || 'Vendor Details'}</span>
          </div>

          <div className="vendor-top">
            <div className="vendor-top-left">
              <div className="vendor-logo">
                {vendorImageUrl ? (
                  <img src={vendorImageUrl} alt="Vendor Logo" />
                ) : (
                  <div className="vendor-placeholder-logo">
                    <Building size={34} />
                  </div>
                )}
              </div>
              <div className="vendor-title">
                <h2>{vendor?.companyName || 'Vendor Details'}</h2>
                <div className="vendor-meta">
                  <span className="vendor-id">
                    Vendor ID: <strong>{vendor?._id ? `VND-${vendor._id.slice(-6).toUpperCase()}` : '—'}</strong>
                  </span>
                  <span className="vendor-submitted">
                    Submitted on {vendor?.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="vendor-top-right">
              <span className={statusClass[getStatus()]}>{statusText[getStatus()]}</span>
              <div className="action-buttons">
                <button
                  className="reject-btn"
                  onClick={() => setShowReject(true)}
                  disabled={isProcessing || getStatus() !== 'pending'}
                >
                  <XCircle size={18} />
                  Reject Vendor
                </button>
                <button
                  className="approve-btn"
                  onClick={handleVerify}
                  disabled={isProcessing || getStatus() !== 'pending'}
                >
                  <CheckCircle size={18} />
                  Approve Vendor
                </button>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="loading">Loading vendor…</div>
        ) : error ? (
          <div className="loading">{error}</div>
        ) : (
          <div className="vendor-details-grid">
            <div className="left-column">
              <div className="card">
                <div className="card-header">
                  <h3>Company Information</h3>
                </div>
                <div className="card-body">
                  <div className="card-row">
                    <span className="label">Industry</span>
                    <span className="value">{vendor.projectTypes?.[0] || 'Construction & Services'}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Company Type</span>
                    <span className="value">Private Limited</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Registered Address</span>
                    <span className="value">{vendor.city || 'N/A'}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Website</span>
                    <span className="value">{vendor.website || '—'}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Tax ID / PAN</span>
                    <span className="value">{vendor.panNumber || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Contact Information</h3>
                </div>
                <div className="card-body">
                  <div className="card-row">
                    <span className="label">Primary Contact Person</span>
                    <span className="value">{vendor.ownerName || 'N/A'}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Email Address</span>
                    <span className="value">{vendor.email || 'N/A'}</span>
                  </div>
                  <div className="card-row">
                    <span className="label">Direct Phone</span>
                    <span className="value">{vendor.phone || 'N/A'}</span>
                  </div>
                  <div className="card-row alert-row">
                    <span className="label">Emergency Contact</span>
                    <span className="value danger">{vendor.emergencyContact || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="right-column">
              <div className="card">
                <div className="card-header">
                  <h3>Legal Documents</h3>
                  <button className="upload-btn">Upload Additional Document</button>
                </div>
                <div className="card-body">
                  <div className="document-row">
                    <div className="document-meta">
                      <div className="doc-icon">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="doc-title">GST Certificate</div>
                        <div className="doc-size">PDF • 1.2 MB</div>
                      </div>
                    </div>
                    <button className="doc-action">View</button>
                  </div>

                  <div className="document-row">
                    <div className="document-meta">
                      <div className="doc-icon">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="doc-title">Business Reg. Proof</div>
                        <div className="doc-size">PDF • 2.4 MB</div>
                      </div>
                    </div>
                    <a
                      href={vendor.panCardImage || '#'}
                      className="doc-action"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Download size={16} />
                      Download
                    </a>
                  </div>

                  <div className="document-row">
                    <div className="document-meta">
                      <div className="doc-icon">
                        <FileText size={18} />
                      </div>
                      <div>
                        <div className="doc-title">ID Proofs (Authorized)</div>
                        <div className="doc-size">ZIP • 5.8 MB</div>
                      </div>
                    </div>
                    <button className="doc-action">Download</button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        <div className={`modal-overlay ${showReject ? 'visible' : ''}`} onClick={() => setShowReject(false)}>
          <div className="reject-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Rejection Reason</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
            />
            <div className="reject-actions">
              <button className="cancel" onClick={() => setShowReject(false)}>
                Cancel
              </button>
              <button className="confirm" onClick={handleReject}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
