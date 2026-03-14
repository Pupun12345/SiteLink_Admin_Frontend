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
import api from '../api/axios';
import './WorkerDetail.css';

export default function WorkerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    fetchWorkerDetails();
  }, [id]);

  const fetchWorkerDetails = async () => {
    try {
      const { data } = await api.get(`/admin/workers/${id}`);
      // Mock detailed data matching the UI
      const mockWorker = {
        _id: id,
        name: 'John Doe',
        workerId: 'ID-#WK-9021',
        role: 'Electrician',
        experience: '8 Years',
        age: 28,
        expectedWage: '$45/hr',
        email: 'john.doe@example.com',
        phone: '+1 (555) 000-1234',
        appliedOn: 'October 24, 2023',
        status: 'PENDING REVIEW',
        profileImage: '/uploads/profiles/profile1.jpg',
        locations: [
          { name: 'New York, NY', isPrimary: true },
          { name: 'Jersey City, NJ', isPrimary: false },
          { name: 'Brooklyn, NY', isPrimary: false },
        ],
        documents: [
          {
            name: 'Aadhaar Card',
            type: 'NATIONAL ID PROOF',
            verified: '2/2 Verified',
            viewLink: '#',
          },
          {
            name: 'Police Clearance',
            type: 'BACKGROUND CHECK',
            verified: 'View Certificate',
            viewLink: '#',
          },
        ],
        certifications: [
          {
            name: 'Master Electrician Certification (Level 4)',
            icon: '🏆',
          },
          {
            name: 'Industrial Training Institute (ITI) Diploma',
            icon: '📜',
          },
        ],
        workPhotos: [
          '/uploads/work/photo1.jpg',
          '/uploads/work/photo2.jpg',
          '/uploads/work/photo3.jpg',
          '/uploads/work/photo4.jpg',
        ],
        contactInfo: {
          email: 'john.doe@example.com',
          phone: '+1 (555) 000-1234',
        },
      };
      setWorker(mockWorker);
    } catch (err) {
      console.error('Failed to fetch worker details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      await api.put(`/admin/workers/${id}/verify`);
      alert('Worker approved successfully!');
      navigate('/admin/workers');
    } catch (err) {
      alert('Failed to approve worker');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    try {
      await api.put(`/admin/workers/${id}/reject`, { reason });
      alert('Worker rejected');
      navigate('/admin/workers');
    } catch (err) {
      alert('Failed to reject worker');
    }
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
      <aside className="detail-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Wrench size={24} />
          </div>
          <div className="logo-text">
            <h3>SiteLink Admin</h3>
            <p>ENTERPRISE PANEL</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item" onClick={() => navigate('/admin/dashboard')}>
            <div className="nav-icon">📊</div>
            <span>Dashboard</span>
          </button>
          <button className="nav-item active">
            <div className="nav-icon">👷</div>
            <span>Workers</span>
          </button>
          <button className="nav-item">
            <div className="nav-icon">🏗️</div>
            <span>Projects</span>
          </button>
          <button className="nav-item">
            <div className="nav-icon">💰</div>
            <span>Payments</span>
          </button>
        </nav>

        <div className="sidebar-section">
          <p className="section-label">SYSTEM</p>
          <button className="nav-item">
            <div className="nav-icon"><Settings size={18} /></div>
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="detail-main">
        <header className="detail-header">
          <button className="back-btn" onClick={() => navigate('/admin/workers')}>
            <ArrowLeft size={18} />
            Back to List
          </button>

          <div className="breadcrumb">
            <span>Workers</span>
            <span className="separator">›</span>
            <span className="current">{worker.name}</span>
          </div>
        </header>

        <div className="detail-content">
          {/* Worker Profile Card */}
          <div className="profile-section">
            <motion.div
              className="profile-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="profile-header">
                <div className="profile-avatar">
                  <div className="avatar-circle">
                    <User size={60} strokeWidth={1.5} />
                  </div>
                  <div className="status-indicator pending"></div>
                </div>

                <div className="profile-info">
                  <h1>{worker.name}</h1>
                  <div className="profile-meta">
                    <span className="applied-date">
                      <Calendar size={14} />
                      Applied on {worker.appliedOn}
                    </span>
                  </div>
                </div>

                <div className="profile-actions">
                  <button className="btn-secondary" onClick={() => alert('Request info')}>
                    Request Info
                  </button>
                  <button className="btn-danger" onClick={handleReject}>
                    Reject Worker
                  </button>
                  <button className="btn-primary" onClick={handleApprove}>
                    Approve Worker
                  </button>
                </div>
              </div>

              <div className="profile-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <div className="detail-icon">
                      <Briefcase size={16} />
                    </div>
                    <div>
                      <p className="detail-label">PRIMARY ROLE</p>
                      <p className="detail-value">{worker.role}</p>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-icon">
                      <Award size={16} />
                    </div>
                    <div>
                      <p className="detail-label">EXPERIENCE</p>
                      <p className="detail-value">{worker.experience}</p>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-icon">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="detail-label">EXPECTED WAGE</p>
                      <p className="detail-value">{worker.expectedWage}</p>
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="detail-icon">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="detail-label">AGE</p>
                      <p className="detail-value">{worker.age} Years</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Content Grid */}
          <div className="content-grid">
            {/* Left Column */}
            <div className="left-column">
              {/* Preferred Locations */}
              <motion.div
                className="card locations-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="card-header">
                  <MapPin size={18} />
                  <h3>Preferred Locations</h3>
                </div>
                <div className="locations-list">
                  {worker.locations.map((location, index) => (
                    <div key={index} className="location-item">
                      {location.isPrimary && <span className="primary-badge">Primary</span>}
                      <p>{location.name}</p>
                    </div>
                  ))}
                </div>
                <div className="location-map">
                  {/* Map placeholder */}
                  <div className="map-placeholder">
                    <MapPin size={32} />
                    <p>Map View</p>
                  </div>
                </div>
              </motion.div>

              {/* Contact Info */}
              <motion.div
                className="card contact-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="card-header">
                  <h3>Contact Info</h3>
                </div>
                <div className="contact-list">
                  <div className="contact-item">
                    <Mail size={18} />
                    <div>
                      <p className="contact-label">EMAIL</p>
                      <p className="contact-value">{worker.contactInfo.email}</p>
                    </div>
                  </div>
                  <div className="contact-item">
                    <Phone size={18} />
                    <div>
                      <p className="contact-label">PHONE</p>
                      <p className="contact-value">{worker.contactInfo.phone}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="right-column">
              {/* Documents & Identity Verification */}
              <motion.div
                className="card documents-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="card-header">
                  <h3>Documents & Identity Verification</h3>
                  <span className="verified-badge">2/2 Verified</span>
                </div>
                <div className="documents-list">
                  {worker.documents.map((doc, index) => (
                    <div key={index} className="document-item">
                      <div className="document-icon">
                        <FileText size={20} />
                      </div>
                      <div className="document-info">
                        <p className="document-name">{doc.name}</p>
                        <p className="document-type">{doc.type}</p>
                      </div>
                      <div className="document-actions">
                        <a href={doc.viewLink} className="view-link">
                          {doc.verified} <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Certifications */}
              <motion.div
                className="card certifications-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="card-header">
                  <h3>Certificates & Qualifications</h3>
                </div>
                <div className="certifications-list">
                  {worker.certifications.map((cert, index) => (
                    <div key={index} className="certification-item">
                      <span className="cert-icon">{cert.icon}</span>
                      <p>{cert.name}</p>
                      <button className="download-btn">
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Work Photos Portfolio */}
              <motion.div
                className="card portfolio-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="card-header">
                  <h3>Work Photos Portfolio</h3>
                  <a href="#" className="view-all">View All</a>
                </div>
                <div className="portfolio-grid">
                  {worker.workPhotos.map((photo, index) => (
                    <div key={index} className="portfolio-item">
                      <div className="photo-placeholder">
                        <Briefcase size={24} />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="user-profile-footer">
          <div className="user-badge">
            <div className="user-avatar-small">AR</div>
            <div className="user-details">
              <p className="user-name">Alex Rivera</p>
              <p className="user-role">Super Admin</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
