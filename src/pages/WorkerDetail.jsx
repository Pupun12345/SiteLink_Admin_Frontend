import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  Briefcase,
  Star,
  Settings,
  HelpCircle,
  Wrench,
  Shield,
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';
import './WorkerDetail.css';
import Sidebar from '../components/Sidebar';
const BACKEND_URL=import.meta.env.VITE_API_URL;

export default function WorkerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0.0);
  const [ratingComment, setRatingComment] = useState('');
  const [activeTab, setActiveTab] = useState('info');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkillName, setCustomSkillName] = useState('');

  useEffect(() => {
    fetchWorkerDetails();
    fetchAvailableSkills();
  }, [id]);

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    return filePath.startsWith('http') ? filePath : `${BACKEND_URL}/${filePath}`;
  };

  const buildDocument = (name, type, filePath) => {
    if (!filePath) return null;
    return {
      name,
      type,
      verified: 'Uploaded',
      viewLink: getFileUrl(filePath),
      downloadLink: getFileUrl(filePath),
    };
  };

  const fetchWorkerDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get(`/admin/users/${id}`);
      const user = data.data;
      if (!user) throw new Error('Worker not found');

      console.log('Raw verificationStatus from backend:', user.verificationStatus);

      const mapped = {
        ...user,
        id: user.id || user._id,
        status: user.verificationStatus || 'pending',
        role: user.primarySkill || user.role || 'Worker',
        skills: user.skills || [],
        appliedOn: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'N/A',
        expectedWage: user.salary ? `₹${user.salary}/${user.salaryType || 'day'}` : 'N/A',
        experience: user.experience || 'N/A',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A',
        age: user.dateOfBirth ? Math.floor((new Date() - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : (user.age || 'N/A'),
        gender: user.gender || 'N/A',
        experienceDescription: user.experienceDescription || 'No description provided',
        willingtoRelocate: user.willingtoRelocate || false,
        location: user.location || 'N/A',
        workState: user.workState || 'N/A',
        workCity: user.city || 'N/A',
        salaryType: user.salaryType || 'N/A',
        locations: [
          ...(user.workState && user.city ? [{ name: `${user.city}, ${user.workState}`, isPrimary: true }] : []),
          ...(user.location && user.location !== 'N/A' ? [{ name: user.location, isPrimary: false }] : [])
        ],
        documents: [
          buildDocument('Aadhaar Front', 'NATIONAL ID PROOF', user.aadhaarFrontImage),
          buildDocument('Aadhaar Back', 'ID BACK', user.aadhaarBackImage),
          buildDocument('Medical Certificate', 'HEALTH CLEARANCE', user.medicalCertificate),
          buildDocument('Government ID', 'IDENTITY PROOF', user.governmentID),
          buildDocument('Experience Certificate', 'EXPERIENCE PROOF', user.experienceCertificate),
        ].filter(doc => doc !== null),
        certifications: (user.certificates || []).filter(cert => cert && cert.trim()).map(cert => ({ 
          name: cert, 
          icon: '📜',
          downloadLink: null
        })),
        workPhotos: [
          ...(user.workSamplesPhoto || []).map(photo => ({ 
            url: getFileUrl(photo),
            path: photo 
          })),
          ...(user.workPhotos || user.posts || []).filter(photo => photo && (typeof photo === 'string' || photo.url || photo.path || photo.images))
        ],
        contactInfo: {
          email: user.email || 'N/A',
          phone: user.phone || 'N/A',
        },
        adminRating: user.adminRating || null,
        adminRatingComment: user.adminRatingComment || '',
        ratedAt: user.ratedAt ? new Date(user.ratedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
      };

      console.log('Worker Data:', {
        dateOfBirth: user.dateOfBirth,
        age: user.age,
        mappedAge: mapped.age,
        mappedDOB: mapped.dateOfBirth,
        gender: mapped.gender
      });

      setWorker(mapped);
    } catch (err) {
      console.error('Failed to load worker details:', err);
      setError(err.response?.data?.message || err.message || 'Unable to load worker');
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      const { data } = await api.get('/skills');
      setAvailableSkills(data.data || []);
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    }
  };

  const handleAddSkills = async () => {
    if (selectedSkills.length === 0 && !customSkillName.trim()) {
      toast.showToast('Please select at least one skill or enter a custom skill', { type: 'error' });
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const skillsToAdd = [];
      
      // Add selected skills from checkboxes
      selectedSkills.forEach(skillId => {
        const skill = availableSkills.find(s => s.id === skillId);
        if (skill) {
          skillsToAdd.push({
            skillId: skill.id,
            skillName: skill.name
          });
        }
      });

      // Add custom skill
      if (customSkillName.trim()) {
        const customSkillId = Date.now() + Math.floor(Math.random() * 1000);
        skillsToAdd.push({
          skillId: customSkillId,
          skillName: customSkillName.trim()
        });
      }

      await api.put(`/admin/workers/${id}/skills`, { skills: skillsToAdd });
      await fetchWorkerDetails();
      toast.showToast('Skills added successfully', { type: 'success' });
      setShowAddSkillModal(false);
      setSelectedSkills([]);
      setCustomSkillName('');
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Failed to add skills', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      await api.delete(`/admin/workers/${id}/skills/${skillId}`);
      await fetchWorkerDetails();
      toast.showToast('Skill removed successfully', { type: 'success' });
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Failed to remove skill', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleSkill = (skillId) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleApprove = () => {
    setShowApprovalConfirm(true);
  };

  const confirmApproval = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await api.put(`/admin/users/${id}/verify`);
      await fetchWorkerDetails();
      toast.showToast('Worker approved successfully', { type: 'success' });
      setShowApprovalConfirm(false);
      setTimeout(() => {
        setShowRating(true);
      }, 500);
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Approval failed', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = () => {
    setShowRejectModal(true);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.showToast('Please provide a reason for rejection', { type: 'error' });
      return;
    }
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await api.put(`/admin/workers/${id}/reject`, { reason: rejectReason });
      await fetchWorkerDetails();
      toast.showToast('Worker rejected successfully', { type: 'success' });
      setShowRejectModal(false);
      setRejectReason('');
      navigate('/admin/workers');
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Rejection failed', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRateWorker = async () => {
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
        await fetchWorkerDetails();
        toast.showToast('Worker rated successfully', { type: 'success' });
        setShowRating(false);
        setRating(0.0);
        setRatingComment('');
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

  const handleRequestInfo = async () => {
    if (!requestMessage.trim()) {
      toast.showToast('Please enter a message for the request', { type: 'error' });
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    try {
      //implement an API call here to send the request
      toast.showToast('Information request sent successfully', { type: 'success' });
      setShowRequestModal(false);
      setRequestMessage('');
    } catch (err) {
      toast.showToast('Failed to send request', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewDocument = (doc) => {
    if (!doc.viewLink) {
      toast.showToast('Document not available', { type: 'error' });
      return;
    }
    
    const newWindow = window.open(doc.viewLink, '_blank');
    if (!newWindow) {
      toast.showToast('Please allow popups to view documents', { type: 'warning' });
    }
  };

  const handleDownloadDocument = async (doc) => {
    if (!doc.downloadLink) {
      toast.showToast('Document not available for download', { type: 'error' });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = doc.downloadLink;
      link.download = `${doc.name.replace(/\s+/g, '_')}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.showToast(`Downloading ${doc.name}...`, { type: 'success' });
    } catch (error) {
      console.error('Download error:', error);
      toast.showToast('Download failed', { type: 'error' });
    }
  };

  const handleDownloadCertification = async (cert) => {
    if (cert.downloadLink) {
      try {
        const link = document.createElement('a');
        link.href = cert.downloadLink;
        link.download = `${cert.name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.showToast(`Downloading ${cert.name}...`, { type: 'success' });
      } catch (error) {
        toast.showToast('Download failed', { type: 'error' });
      }
    } else {
      toast.showToast('Certificate file not available', { type: 'warning' });
    }
  };

  const handleViewAllPortfolio = () => {
    toast.showToast('Portfolio view coming soon', { type: 'info' });
  };

  if (loading) {
    return <div className="loading-screen">Loading worker details...</div>;
  }

  if (!worker) {
    return <div className="error-screen">Worker not found</div>;
  }

  return (
    <div className="worker-detail-page">
      {/* Sidebar */}
      <Sidebar/>

      {/* Main Content */}
      <main className="detail-main">
        <header className="detail-header">
          <div className="breadcrumb">
            <span>Workers</span>
            <span className="separator">›</span>
            <span className="current">{worker.name}</span>
          </div>
          <button className="back-btn" onClick={() => navigate('/admin/workers')}>
            <ArrowLeft size={18} />
            Back to List
          </button>
        </header>

        <div className="detail-content">
          {/* Worker Profile Header */}
          <div className="profile-header-section">
            <div className="profile-main">
              <div className="profile-avatar-container">
                <div className="profile-avatar-large">
                  {worker.profileImage ? (
                    <img 
                      src={getFileUrl(worker.profileImage)} 
                      alt={worker.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{ display: worker.profileImage ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                    <User size={80} strokeWidth={1.5} />
                  </div>
                </div>
                <div className={`status-badge ${worker.status.toLowerCase()}`}>
                  {worker.status.toUpperCase()}
                </div>
              </div>
              
              <div className="profile-details-main">
                <div style={{ marginBottom: '8px' }}>
                  <div className="worker-name" style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '4px' }}>{worker.name}</div>
                  <div className="applied-date" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280', fontSize: '14px' }}>
                    <Calendar size={14} />
                    Applied on {worker.appliedOn}
                  </div>
                </div>
                
                <div className="worker-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', marginTop: '20px' }}>
                  <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="stat-label" style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.5px' }}>PRIMARY ROLE</div>
                    <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>
                      <Briefcase size={16} className="role-icon" style={{ color: '#3b82f6' }} />
                      {worker.role}
                    </div>
                  </div>
                  <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="stat-label" style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.5px' }}>EXPERIENCE</div>
                    <div className="stat-value" style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>{worker.experience}</div>
                  </div>
                  <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="stat-label" style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.5px' }}>EXPECTED WAGE</div>
                    <div className="stat-value" style={{ fontSize: '15px', fontWeight: '600', color: '#10b981' }}>{worker.expectedWage}</div>
                  </div>
                  <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="stat-label" style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.5px' }}>AGE</div>
                    <div className="stat-value" style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>{worker.age !== 'N/A' ? `${worker.age} Years` : 'N/A'}</div>
                  </div>
                  <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="stat-label" style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.5px' }}>GENDER</div>
                    <div className="stat-value" style={{ fontSize: '15px', fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' }}>{worker.gender}</div>
                  </div>
                  <div className="stat-item" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div className="stat-label" style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', letterSpacing: '0.5px' }}>RELOCATE</div>
                    <div className="stat-value" style={{ fontSize: '15px', fontWeight: '600', color: worker.willingtoRelocate ? '#10b981' : '#ef4444' }}>
                      {worker.willingtoRelocate ? '✓ Yes' : '✗ No'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="profile-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '200px' }}>
              {worker.adminRating && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '8px', 
                  padding: '16px', 
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', 
                  borderRadius: '12px',
                  border: '1px solid #fbbf24',
                  boxShadow: '0 2px 8px rgba(251, 191, 36, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Star size={20} fill="#fbbf24" stroke="#fbbf24" />
                    <div style={{ fontWeight: '700', fontSize: '18px', color: '#92400e' }}>
                      {worker.adminRating.toFixed(1)}/5.0
                    </div>
                  </div>
                  {worker.adminRatingComment && (
                    <div style={{ fontSize: '13px', color: '#78350f', lineHeight: '1.4' }}>
                      {worker.adminRatingComment}
                    </div>
                  )}
                  {worker.ratedAt && (
                    <div style={{ fontSize: '11px', color: '#92400e', fontWeight: '500' }}>
                      Rated on {worker.ratedAt}
                    </div>
                  )}
                </div>
              )}
              <button className="btn-danger" onClick={handleReject} disabled={isProcessing || worker.status.toLowerCase() === 'rejected'} style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', borderRadius: '8px' }}>
                {worker.status.toLowerCase() === 'rejected' ? 'Already Rejected' : 'Reject Worker'}
              </button>
              {worker.status.toLowerCase() !== 'verified' && (
                <button className="btn-primary" onClick={handleApprove} disabled={isProcessing} style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', borderRadius: '8px' }}>
                  Approve Worker
                </button>
              )}
              {worker.status.toLowerCase() === 'verified' && (
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    setShowRating(true);
                    if (worker.adminRating) {
                      setRating(worker.adminRating);
                      setRatingComment(worker.adminRatingComment || '');
                    }
                  }} 
                  disabled={isProcessing}
                  style={{ padding: '12px 20px', fontSize: '14px', fontWeight: '600', borderRadius: '8px' }}
                >
                  ⭐ {worker.adminRating ? 'Update Rating' : 'Rate Worker'}
                </button>
              )}
            </div>
          </div>

          {/* Content Grid */}
          <div className="content-grid">
            {/* Left Column */}
            <div className="left-column">
              {/* Worker Details Card */}
              <div className="card locations-card">
                <div className="card-header">
                  <div className="card-title">
                    <User size={18} className="location-icon" />
                    Worker Details
                  </div>
                </div>
                <div className="locations-content">
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#6b7280' }}>Date of Birth:</span>
                      <span style={{ color: '#1f2937' }}>{worker.dateOfBirth}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#6b7280' }}>Gender:</span>
                      <span style={{ color: '#1f2937', textTransform: 'capitalize' }}>{worker.gender}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#6b7280' }}>Salary Type:</span>
                      <span style={{ color: '#1f2937', textTransform: 'capitalize' }}>{worker.salaryType || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#6b7280' }}>Willing to Relocate:</span>
                      <span style={{ color: worker.willingtoRelocate ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                        {worker.willingtoRelocate ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {worker.experienceDescription && worker.experienceDescription !== 'No description provided' && (
                      <div style={{ paddingTop: '8px' }}>
                        <span style={{ fontWeight: '600', color: '#6b7280', display: 'block', marginBottom: '8px' }}>Experience Description:</span>
                        <p style={{ color: '#1f2937', lineHeight: '1.6', margin: 0 }}>{worker.experienceDescription}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preferred Locations */}
              <div className="card locations-card">
                <div className="card-header">
                  <div className="card-title">
                    <MapPin size={18} className="location-icon" />
                    Preferred Locations
                  </div>
                </div>
                <div className="locations-content">
                  {worker.locations && worker.locations.length > 0 ? (
                    <>
                      {worker.locations.map((location, index) => (
                        <div key={index} className={`location-item ${location.isPrimary ? 'primary' : ''}`}>
                          {location.isPrimary && <span className="location-label">Primary</span>}
                          <span className="location-name">{location.name}</span>
                        </div>
                      ))}

                    </>
                  ) : (
                    <div className="no-data-state">
                      <MapPin size={48} className="no-data-icon" />
                      <p className="no-data-text">No location information available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="card contact-card">
                <div className="card-header">
                  <div className="card-title">Contact Info</div>
                </div>
                <div className="contact-content">
                  {(worker.contactInfo?.email && worker.contactInfo.email !== 'N/A') || 
                   (worker.contactInfo?.phone && worker.contactInfo.phone !== 'N/A') ? (
                    <>
                      {worker.contactInfo.email && worker.contactInfo.email !== 'N/A' && (
                        <div className="contact-item">
                          <div className="contact-icon">
                            <Mail size={18} />
                          </div>
                          <div className="contact-details">
                            <div className="contact-label">EMAIL</div>
                            <div className="contact-value">{worker.contactInfo.email}</div>
                          </div>
                        </div>
                      )}
                      {worker.contactInfo.phone && worker.contactInfo.phone !== 'N/A' && (
                        <div className="contact-item">
                          <div className="contact-icon">
                            <Phone size={18} />
                          </div>
                          <div className="contact-details">
                            <div className="contact-label">PHONE</div>
                            <div className="contact-value">{worker.contactInfo.phone}</div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="no-data-state">
                      <Phone size={48} className="no-data-icon" />
                      <p className="no-data-text">No contact information available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="right-column">
              {/* Documents & Identity Verification */}
              <div className="card documents-card">
                <div className="card-header">
                  <div className="card-title">Documents & Identity Verification</div>
                  {worker.documents && worker.documents.length > 0 && (
                    <span className="verified-count">{worker.documents.length} Available</span>
                  )}
                </div>
                <div className="documents-content">
                  {worker.documents && worker.documents.length > 0 ? (
                    <div className="documents-grid">
                      {worker.documents.map((doc, index) => (
                        <div key={index} className="document-card">
                          <div className={`document-icon ${doc.name.toLowerCase().includes('aadhaar') ? 'aadhaar' : doc.name.toLowerCase().includes('medical') ? 'medical' : 'police'}`}>
                            <FileText size={20} />
                          </div>
                          <div className="document-info">
                            <div className="document-name">{doc.name}</div>
                            <div className="document-type">{doc.type}</div>
                          </div>
                          <div className="document-actions">
                            <button 
                              className="view-document-btn" 
                              onClick={() => handleViewDocument(doc)}
                              title="View Document"
                            >
                              View <ExternalLink size={14} />
                            </button>
                            <button 
                              className="download-document-btn" 
                              onClick={() => handleDownloadDocument(doc)}
                              title="Download Document"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data-state">
                      <FileText size={48} className="no-data-icon" />
                      <p className="no-data-text">No documents uploaded</p>
                      <p className="no-data-subtext">Worker hasn't uploaded any identity documents yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Certifications */}
              <div className="card certifications-card">
                <div className="card-header">
                  <div className="card-title">CERTIFICATES & QUALIFICATIONS</div>
                </div>
                <div className="certifications-content">
                  {worker.certifications && worker.certifications.length > 0 ? (
                    worker.certifications.map((cert, index) => (
                      <div key={index} className="certification-item">
                        <div className="cert-icon">
                          <Award size={20} />
                        </div>
                        <div className="cert-info">
                          <div className="cert-name">{cert.name}</div>
                        </div>
                        <button 
                          className="download-cert-btn" 
                          onClick={() => handleDownloadCertification(cert)}
                          title="Download Certificate"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="no-data-state">
                      <Award size={48} className="no-data-icon" />
                      <p className="no-data-text">No certificates available</p>
                      <p className="no-data-subtext">Worker hasn't uploaded any certificates or qualifications</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills Section */}
              <div className="card certifications-card">
                <div className="card-header">
                  <div className="card-title">SKILLS</div>
                  <button 
                    className="view-all-btn" 
                    onClick={() => setShowAddSkillModal(true)}
                    style={{ background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                  >
                    + Add Skill
                  </button>
                </div>
                <div className="certifications-content">
                  {worker.skills && worker.skills.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {worker.skills.map((skill, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px', 
                            background: '#f3f4f6', 
                            padding: '8px 12px', 
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          <Wrench size={16} />
                          <span>{skill.skillName}</span>
                          <button
                            onClick={() => handleRemoveSkill(skill.skillId)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              padding: '0',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Remove skill"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data-state">
                      <Wrench size={48} className="no-data-icon" />
                      <p className="no-data-text">No skills added</p>
                      <p className="no-data-subtext">Click "Add Skill" to add skills for this worker</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Photos Portfolio */}
              <div className="card portfolio-card">
                <div className="card-header">
                  <div className="card-title">Work Photos Portfolio</div>
                  {worker.workPhotos && worker.workPhotos.length > 0 && (
                    <button className="view-all-btn" onClick={handleViewAllPortfolio}>
                      View All ({worker.workPhotos.length})
                    </button>
                  )}
                </div>
                <div className="portfolio-content">
                  {worker.workPhotos && worker.workPhotos.length > 0 ? (
                    <div className="portfolio-gallery">
                      {worker.workPhotos.slice(0, 4).map((photo, index) => (
                        <div key={index} className="portfolio-photo">
                          <img 
                            src={typeof photo === 'string' ? photo : photo.url || photo.path} 
                            alt={`Work ${index + 1}`}
                            className="portfolio-image"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            onClick={() => window.open(typeof photo === 'string' ? photo : photo.url || photo.path, '_blank')}
                          />
                          <div className="photo-placeholder" style={{ display: 'none' }}>
                            <Wrench size={24} />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-data-state">
                      <Wrench size={48} className="no-data-icon" />
                      <p className="no-data-text">No work photos available</p>
                      <p className="no-data-subtext">Worker hasn't uploaded any portfolio images yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showApprovalConfirm && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>Approve Worker</h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '16px', color: '#6b7280', lineHeight: '1.6' }}>
                Are you sure you want to approve <strong>{worker.name}</strong>? 
                This action will verify the worker and allow them to receive job assignments.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => setShowApprovalConfirm(false)}
                  style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                >
                  No, Cancel
                </button>
                <button 
                  onClick={confirmApproval}
                  disabled={isProcessing}
                  style={{ padding: '10px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: isProcessing ? 'not-allowed' : 'pointer', opacity: isProcessing ? 0.6 : 1 }}
                >
                  {isProcessing ? 'Approving...' : 'Yes, Approve'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRejectModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>Reject Worker</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#6b7280' }}>
                Please provide a reason for rejecting <strong>{worker.name}</strong>:
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '15px', fontFamily: 'inherit', resize: 'vertical', marginBottom: '24px', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmReject}
                  disabled={isProcessing || !rejectReason.trim()}
                  style={{ padding: '10px 24px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: (isProcessing || !rejectReason.trim()) ? 'not-allowed' : 'pointer', opacity: (isProcessing || !rejectReason.trim()) ? 0.6 : 1 }}
                >
                  {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}

{/* Rating Modal */}
        {showRating && (
          <div 
            className="rating-modal-backdrop"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowRating(false);
              }
            }}
          >
            <div className="rating-modal-container">
              <div className="rating-modal-header">
                <h3>Rate Worker</h3>
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
                  Rate <strong>{worker.name}</strong> based on their profile, qualifications, and documentation quality.
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
                          <Star 
                            size={32} 
                            fill={isFilled ? '#fbbf24' : isHalfFilled ? '#fbbf24' : 'transparent'} 
                            stroke={isFilled || isHalfFilled ? '#fbbf24' : '#d1d5db'}
                            style={{
                              opacity: isHalfFilled ? 0.6 : 1
                            }}
                          />
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
                  <label htmlFor="rating-comment" className="comment-label">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    id="rating-comment"
                    className="rating-textarea"
                    placeholder="Share your thoughts about this worker's profile, qualifications, or documentation..."
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
                  onClick={handleRateWorker}
                  disabled={isProcessing || rating < 0.1}
                >
                  {isProcessing ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRequestModal && (
          <div 
            className="modal-overlay"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowRequestModal(false);
              }
            }}
          >
            <div className="request-modal">
              <h3>Request Additional Information</h3>
              <p className="request-description">Send a request to the worker for additional information or clarification.</p>
              <textarea
                className="request-message"
                placeholder="Enter your message to the worker..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={4}
              />
              <div className="request-actions">
                <button 
                  className="cancel" 
                  onClick={() => setShowRequestModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm" 
                  onClick={handleRequestInfo}
                  disabled={isProcessing || !requestMessage.trim()}
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddSkillModal && (
          <div 
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddSkillModal(false);
                setSelectedSkills([]);
                setCustomSkillName('');
              }
            }}
          >
            <div style={{ background: 'white', borderRadius: '12px', padding: '32px', maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>Add Skills to Worker</h3>
              <p style={{ margin: '0 0 24px 0', fontSize: '16px', color: '#6b7280' }}>
                Select skills to add to <strong>{worker.name}</strong>'s profile:
              </p>
              
              {/* Custom Skill Input */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                  Add Custom Skill
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={customSkillName}
                    onChange={(e) => setCustomSkillName(e.target.value)}
                    placeholder="Enter custom skill name (e.g., Welding, Plumbing)"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && customSkillName.trim()) {
                        handleAddSkills();
                      }
                    }}
                  />
                  {customSkillName.trim() && (
                    <button
                      onClick={() => setCustomSkillName('')}
                      style={{
                        padding: '8px',
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Clear"
                    >
                      <XCircle size={18} color="#6b7280" />
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                  Type a skill name and click "Add Skills" or press Enter
                </p>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>OR SELECT FROM LIST</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
              </div>

              {/* Existing Skills Checkboxes */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
                {availableSkills
                  .filter(skill => !worker.skills.some(ws => ws.skillId === skill.id))
                  .map(skill => (
                    <label 
                      key={skill.id}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '12px', 
                        border: selectedSkills.includes(skill.id) ? '2px solid #10b981' : '1px solid #e5e7eb',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: selectedSkills.includes(skill.id) ? '#f0fdf4' : 'white',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill.id)}
                        onChange={() => handleToggleSkill(skill.id)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>{skill.name}</span>
                    </label>
                  ))
                }
              </div>
              {availableSkills.filter(skill => !worker.skills.some(ws => ws.skillId === skill.id)).length === 0 && (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>All available skills have been added to this worker.</p>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => {
                    setShowAddSkillModal(false);
                    setSelectedSkills([]);
                    setCustomSkillName('');
                  }}
                  style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddSkills}
                  disabled={isProcessing || (selectedSkills.length === 0 && !customSkillName.trim())}
                  style={{ padding: '10px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: (isProcessing || (selectedSkills.length === 0 && !customSkillName.trim())) ? 'not-allowed' : 'pointer', opacity: (isProcessing || (selectedSkills.length === 0 && !customSkillName.trim())) ? 0.6 : 1 }}
                >
                  {isProcessing ? 'Adding...' : customSkillName.trim() ? `Add ${selectedSkills.length + 1} Skill${selectedSkills.length + 1 !== 1 ? 's' : ''}` : `Add ${selectedSkills.length} Skill${selectedSkills.length !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}


      </main>
    </div>
  );
}
