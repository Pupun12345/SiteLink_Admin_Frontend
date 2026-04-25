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
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0.0);
  const [ratingComment, setRatingComment] = useState('');
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
      const response = await api.put(`/admin/users/${id}/rate`, { 
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
    const url = fileUrl.startsWith('http') ? fileUrl : `http://localhost:5000/${fileUrl}`;
    const a = document.createElement('a');
    a.href = url;
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
    const url = fileUrl.startsWith('http') ? fileUrl : `http://localhost:5000/${fileUrl}`;
    window.open(url, '_blank');
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
              {vendor?.adminRating && getStatus() === 'verified' && (
                <div className="vendor-rating">
                  <span className="rating-stars">{'⭐'.repeat(vendor.adminRating)}</span>
                  <span className="rating-value">{vendor.adminRating}/5</span>
                </div>
              )}
              <div className="action-buttons">
                {getStatus() === 'pending' && (
                  <>
                    <button
                      className="reject-btn"
                      onClick={() => setShowReject(true)}
                      disabled={isProcessing}
                    >
                      <XCircle size={18} />
                      Reject Vendor
                    </button>
                    <button
                      className="approve-btn"
                      onClick={handleVerify}
                      disabled={isProcessing}
                    >
                      <CheckCircle size={18} />
                      Approve Vendor
                    </button>
                  </>
                )}
                {getStatus() === 'verified' && (
                  <button
                    className="rate-btn"
                    onClick={() => setShowRating(true)}
                    disabled={isProcessing}
                  >
                    ⭐ Rate Vendor
                  </button>
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
                      <span className="label">Registered Address</span>
                      <span className="value">{vendor.city}</span>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="card-row">
                      <span className="label">Website</span>
                      <span className="value">{vendor.website}</span>
                    </div>
                  )}
                  {vendor.panNumber && (
                    <div className="card-row">
                      <span className="label">Tax ID / PAN</span>
                      <span className="value">{vendor.panNumber}</span>
                    </div>
                  )}
                  {vendor.licenseNumber && (
                    <div className="card-row">
                      <span className="label">License Number</span>
                      <span className="value">{vendor.licenseNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Contact Information</h3>
                </div>
                <div className="card-body">
                  {vendor.ownerName && (
                    <div className="card-row">
                      <span className="label">Primary Contact Person</span>
                      <span className="value">{vendor.ownerName}</span>
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
                  <button className="upload-btn">Upload Additional Document</button>
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

                  {vendor.gstNumber && (
                    <div className="document-row">
                      <div className="document-meta">
                        <div className="doc-icon">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="doc-title">GST Number</div>
                          <div className="doc-size">{vendor.gstNumber}</div>
                        </div>
                      </div>
                      <button className="doc-action">Verified</button>
                    </div>
                  )}

                  {vendor.companyLogo && (
                    <div className="document-row">
                      <div className="document-meta">
                        <div className="doc-icon">
                          <FileText size={18} />
                        </div>
                        <div>
                          <div className="doc-title">Company Logo</div>
                          <div className="doc-size">Image</div>
                        </div>
                      </div>
                      <div className="doc-actions">
                        <button 
                          className="doc-action"
                          onClick={() => handleViewFile(vendor.companyLogo)}
                        >
                          View
                        </button>
                        <button 
                          className="doc-action"
                          onClick={() => handleDownloadFile(vendor.companyLogo, 'company-logo')}
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </div>
                    </div>
                  )}

                  {!vendor.panCardImage && !vendor.gstNumber && !vendor.companyLogo && (
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
