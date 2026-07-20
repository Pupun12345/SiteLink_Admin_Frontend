import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, Download, Building } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';
import './VendorDetails.css';
const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0.0);
  const [ratingComment, setRatingComment] = useState('');
  const toast = useToast();

  const fetchVendor = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/vendors/${id}`);
      const vendorData = data.data;

      console.log('Raw vendor data:', vendorData);
      console.log('Verification status:', vendorData.verificationStatus);

      setVendor(vendorData);
    } catch (err) {
      console.error('Failed to load vendor:', err);
      setError(err.response?.data?.message || 'Unable to load vendor');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
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

  const handleRateVendor = async () => {
    if (rating < 0.1 || rating > 5.0) {
      toast.showToast('Please choose a rating between 0.1 and 5.0', { type: 'error' });
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const response = await api.put(`/admin/vendors/${id}/rate`, {
        rating: parseFloat(rating.toFixed(1)),
        comment: ratingComment
      });

      if (response.data.success) {
        setShowRating(false);
        setRating(0.0);
        setRatingComment('');
        await fetchVendor();
        toast.showToast('Vendor rated successfully', { type: 'success' });

        sessionStorage.setItem('vendorListRefresh', Date.now().toString());
        window.dispatchEvent(new Event('vendorRated'));
      } else {
        throw new Error(response.data.message || 'Rating failed');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.showToast('Authentication required. Please login again.', { type: 'error' });
        localStorage.removeItem('adminToken');

        navigate('/admin/login');
      } else {
        toast.showToast(err.response?.data?.message || err.message || 'Rating failed', { type: 'error' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadFile = (fileUrl, fileName) => {
    if (!fileUrl) {
      toast.showToast('File not available', { type: 'error' });
      return;
    }

    const a = document.createElement('a');
    a.href = fileUrl;
    a.target = '_blank';
    a.download = fileName || 'document';

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleViewFile = (fileUrl) => {
    if (!fileUrl) {
      toast.showToast('File not available', { type: 'error' });
      return;
    }
    window.open(fileUrl, '_blank');
  };

  const getStatus = () => {
    if (!vendor) return 'pending';
    const status = (vendor.verificationStatus || 'pending').toLowerCase();
    if (status === 'verified') return 'verified';
    if (status === 'rejected') return 'rejected';
    return 'pending';
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

  const vendorImageUrl = vendor?.companyLogo || vendor?.profileImage
    ? vendor.companyLogo || vendor.profileImage
    : vendor ? `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor?.name || "Vendor")}&background=random&color=fff` : null;

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-content">
        <header className="vendor-top-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
          <div className="vendor-breadcrumbs" style={{ marginBottom: '24px' }}>
            <button className="breadcrumb-link" onClick={() => navigate('/admin/vendors')} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>Vendors</button>
            <span className="breadcrumb-sep" style={{ margin: '0 8px', color: '#9ca3af' }}>›</span>
            <span className="breadcrumb-current" style={{ color: '#6b7280', fontSize: '14px', fontWeight: '500' }}>{vendor?.companyName || 'Vendor Details'}</span>
          </div>

          <div className="vendor-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '32px' }}>
            <div className="vendor-top-left" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flex: 1 }}>
              <div className="vendor-logo" style={{ position: 'relative' }}>
                {vendorImageUrl ? (
                  <img
                    src={vendorImageUrl}
                    alt="Vendor Logo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        vendor?.name || "Vendor"
                      )}&background=random&color=fff`;
                    }}
                    style={{
                      width: '120px',
                      height: '120px',
                      borderRadius: '16px',
                      objectFit: 'cover',
                      border: '3px solid #e5e7eb',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                ) : (
                  <div className="vendor-placeholder-logo" style={{ width: '120px', height: '120px', borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                    <Building size={48} />
                  </div>
                )}
              </div>
              <div className="vendor-title" style={{ flex: 1 }}>
                <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '8px', lineHeight: '1.2' }}>{vendor?.companyName || 'Vendor Details'}</h2>
                <div className="vendor-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                  <span className="vendor-id" style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Vendor ID: <strong style={{ color: '#1f2937' }}>{vendor?._id ? `VND-${vendor._id.slice(-6).toUpperCase()}` : '—'}</strong>
                  </span>
                  <span className="vendor-submitted" style={{ fontSize: '14px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Designation: <strong style={{ color: '#1f2937', textTransform: 'uppercase' }}>{vendor?.role ? vendor.role : '—'}</strong>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
                  {vendor?.adminRating && getStatus() === 'verified' && (
                    <div className="vendor-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                      <span className="rating-stars" style={{ fontSize: '16px' }}>{'⭐'.repeat(vendor.adminRating)}</span>
                      <span className="rating-value" style={{ fontSize: '14px', fontWeight: '600', color: '#92400e' }}>{vendor.adminRating}/5</span>
                    </div>
                  )}
                  <div className="vendor-subscription" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: vendor?.subscription ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' : 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', borderRadius: '8px', border: vendor?.subscription ? '1px solid #10b981' : '1px solid #ef4444' }}>
                    <span style={{ fontSize: '14px' }}>{vendor?.subscription ? '✓' : '✕'}</span>
                    <span className="subscription-value" style={{ fontSize: '14px', fontWeight: '600', color: vendor?.subscription ? '#065f46' : '#991b1b' }}>{vendor?.subscription ? 'SUBSCRIBED' : 'NOT SUBSCRIBED'}</span>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: vendor?.isBlocked ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', borderRadius: '8px', border: vendor?.isBlocked ? '1px solid #ef4444' : '1px solid #10b981' }}>
                    <span style={{ fontSize: '14px' }}>{vendor?.isBlocked ? '🔒' : '🔓'}</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: vendor?.isBlocked ? '#991b1b' : '#065f46' }}>{vendor?.isBlocked ? 'BLOCKED' : 'NOT BLOCKED'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="vendor-top-right" style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', minWidth: '200px' }}>
              <span className={statusClass[getStatus()]} style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{statusText[getStatus()]}</span>
              <div className="action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                {getStatus() === 'pending' && (
                  <>
                    <button
                      className="reject-btn"
                      onClick={() => setShowReject(true)}
                      disabled={isProcessing}
                      style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <XCircle size={16} />
                      Reject Vendor
                    </button>
                    <button
                      className="approve-btn"
                      onClick={handleVerify}
                      disabled={isProcessing}
                      style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <CheckCircle size={16} />
                      Approve Vendor
                    </button>
                  </>
                )}
                {getStatus() === 'verified' && (
                  <>
                    <button
                      className="reject-btn"
                      onClick={() => setShowReject(true)}
                      disabled={isProcessing}
                      style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <XCircle size={16} />
                      Reject Vendor
                    </button>
                    <button
                      className="rate-btn"
                      onClick={() => {
                        setShowRating(true);
                        if (vendor?.adminRating) {
                          setRating(vendor.adminRating);
                          setRatingComment(vendor.adminRatingComment || '');
                        }
                      }}
                      disabled={isProcessing}
                      style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      ⭐ {vendor?.adminRating ? 'Update Rating' : 'Rate Vendor'}
                    </button>
                  </>
                )}
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
                  {vendor.companyName && (
                    <div className="card-row">
                      <span className="label">Company Name</span>
                      <span className="value">{vendor.companyName}</span>
                    </div>
                  )}
                  {vendor.projectTypes && vendor.projectTypes.length > 0 && (
                    <div className="card-row">
                      <span className="label">Industry</span>
                      <span className="value">{vendor.projectTypes.join(', ')}</span>
                    </div>
                  )}
                  {vendor.city && (
                    <div className="card-row">
                      <span className="label">Work City</span>
                      <span className="value">{vendor.city}</span>
                    </div>
                  )}
                  {vendor.workState && (
                    <div className="card-row">
                      <span className="label">Work State</span>
                      <span className="value">{vendor.workState}</span>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="card-row">
                      <span className="label">Website</span>
                      <span className="value">{vendor.website}</span>
                    </div>
                  )}
                  {vendor.workArea && (
                    <div className="card-row">
                      <span className="label">Work Area</span>
                      <span className="value">{vendor.workArea}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Contact Information</h3>
                </div>
                <div className="card-body">
                  {vendor.name && (
                    <div className="card-row">
                      <span className="label">Vendor Name</span>
                      <span className="value">{vendor.name}</span>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="card-row">
                      <span className="label">Email Address</span>
                      <span className="value">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="card-row">
                      <span className="label">Direct Phone</span>
                      <span className="value">{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.whatsappNumber && (
                    <div className="card-row">
                      <span className="label">WhatsApp Number</span>
                      <span className="value">{vendor.whatsappNumber}</span>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="card-row">
                      <span className="label">Website</span>
                      <span className="value">
                        <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                          {vendor.website}
                        </a>
                      </span>
                    </div>
                  )}
                  {vendor.emergencyContact && (
                    <div className="card-row alert-row">
                      <span className="label">Emergency Contact</span>
                      <span className="value danger">{vendor.emergencyContact}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="right-column">
              <div className="card">
                <div className="card-header">
                  <h3>Legal Documents</h3>
                </div>
                <div className="card-body">
                  {vendor.panCardImage && (
                    <div className="document-row">
                      <div className="document-meta">
                        <div className="doc-icon">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="doc-title">PAN Card</div>
                          <div className="doc-size">Document</div>
                        </div>
                      </div>
                      <div className="doc-actions">
                        <button
                          className="doc-action"
                          onClick={() => handleViewFile(vendor.panCardImage)}
                        >
                          View
                        </button>
                        <button
                          className="doc-action"
                          onClick={() => handleDownloadFile(vendor.panCardImage, 'pan-card')}
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
                    </div>
                  )}

                  {vendor.gstCertificate && (
                    <div className="document-row">
                      <div className="document-meta">
                        <div className="doc-icon">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="doc-title">GST Certificate</div>
                          <div className="doc-size">Document</div>
                        </div>
                      </div>
                      <div className="doc-actions">
                        <button
                          className="doc-action"
                          onClick={() => handleViewFile(vendor.gstCertificate)}
                        >
                          View
                        </button>
                        <button
                          className="doc-action"
                          onClick={() => handleDownloadFile(vendor.gstCertificate, 'gst-certificate')}
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
                    </div>
                  )}

                  {!vendor.panCardImage&& !vendor.gstCertificate && (
                    <div className="no-documents">
                      <p>No documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showReject && (
          <div
            className="modal-overlay visible"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowReject(false);
              }
            }}
          >
            <div className="reject-modal">
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
        )}

        {showRating && (
          <div
            className="modal-overlay visible"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowRating(false);
              }
            }}
          >
            <div className="rating-modal-container">
              <div className="rating-modal-header">
                <h3>Rate Vendor</h3>
                <button
                  className="rating-modal-close"
                  type="button"
                  onClick={() => setShowRating(false)}
                >
                  ×
                </button>
              </div>

              <div className="rating-modal-body">
                <p className="rating-modal-description">
                  Rate <strong>{vendor?.companyName}</strong> based on their profile, documentation, and business credentials.
                </p>

                <div className="rating-input-section">
                  <div className="rating-display">
                    <span className="rating-label">Current Rating:</span>
                    <span className="rating-value">{rating.toFixed(1)}/5.0</span>
                  </div>

                  <div className="rating-stars-container">
                    {[1, 2, 3, 4, 5].map(starValue => {
                      const isFilled = starValue <= Math.floor(rating);
                      const isHalfFilled = starValue > Math.floor(rating) && starValue <= Math.ceil(rating) && rating % 1 >= 0.5;

                      return (
                        <button
                          key={starValue}
                          type="button"
                          className={`rating-star ${isFilled || isHalfFilled ? 'active' : ''}`}
                          onClick={() => setRating(starValue)}
                        >
                          ⭐
                        </button>
                      );
                    })}
                  </div>

                  <div className="rating-slider-section">
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={rating}
                      onChange={(e) => setRating(parseFloat(e.target.value))}
                      className="rating-range-input"
                    />
                    <div className="rating-scale-labels">
                      <span className="scale-label">0</span>
                      <span className="scale-label">1</span>
                      <span className="scale-label">2</span>
                      <span className="scale-label">3</span>
                      <span className="scale-label">4</span>
                      <span className="scale-label">5</span>
                    </div>
                    <div className="rating-decimal-display">
                      Use slider for precise rating: {rating.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="rating-comment-section">
                  <label htmlFor="vendor-rating-comment" className="comment-label">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    id="vendor-rating-comment"
                    className="rating-textarea"
                    placeholder="Share your thoughts about this vendor's profile, credentials, or documentation..."
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div className="rating-modal-footer">
                <button
                  type="button"
                  className="rating-btn rating-btn-cancel"
                  onClick={() => {
                    setShowRating(false);
                    setRating(0.0);
                    setRatingComment('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rating-btn rating-btn-submit"
                  onClick={handleRateVendor}
                  disabled={isProcessing || rating < 0.1}
                >
                  {isProcessing ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
