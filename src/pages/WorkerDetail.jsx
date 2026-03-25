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

  const MOCK_WORKERS_DB = {
    wk0001: {
      _id: 'wk0001',
      name: 'Rajesh Kumar',
      age: 32,
      phone: '+91 98765 43210',
      email: 'rajesh.kumar@example.com',
      experience: '5+ Years',
      city: 'Mumbai',
      dailyRate: 1200,
      isVerified: false,
      verificationStatus: 'pending',
      createdAt: '2024-03-10T10:00:00Z',
      skills: [{ skillId: 1, skillName: 'Electrician' }],
      aadhaarFrontImage: null,
      aadhaarBackImage: null,
      certificates: ['Master Electrician Certification (Level 4)', 'Industrial Training Institute (ITI) Diploma'],
    },
    wk0002: {
      _id: 'wk0002',
      name: 'Suresh Patel',
      age: 28,
      phone: '+91 91234 56789',
      email: 'suresh.patel@example.com',
      experience: '3-5 Years',
      city: 'Ahmedabad',
      dailyRate: 900,
      isVerified: true,
      verificationStatus: 'verified',
      createdAt: '2024-01-15T09:30:00Z',
      skills: [{ skillId: 2, skillName: 'Plumber' }],
      aadhaarFrontImage: null,
      aadhaarBackImage: null,
      certificates: ['ITI Diploma in Plumbing'],
    },
    wk0003: {
      _id: 'wk0003',
      name: 'Amit Singh',
      age: 24,
      phone: '+91 87654 32109',
      email: 'amit.singh@example.com',
      experience: '1-3 Years',
      city: 'Delhi',
      dailyRate: 700,
      isVerified: false,
      verificationStatus: 'rejected',
      createdAt: '2024-05-20T14:00:00Z',
      skills: [{ skillId: 3, skillName: 'Carpenter' }],
      aadhaarFrontImage: null,
      aadhaarBackImage: null,
      certificates: [],
    },
    wk0004: {
      _id: 'wk0004',
      name: 'Vikram Yadav',
      age: 38,
      phone: '+91 99887 76655',
      email: 'vikram.yadav@example.com',
      experience: '5+ Years',
      city: 'Pune',
      dailyRate: 1100,
      isVerified: false,
      verificationStatus: 'pending',
      createdAt: '2024-06-01T08:00:00Z',
      skills: [{ skillId: 4, skillName: 'Mason' }],
      aadhaarFrontImage: null,
      aadhaarBackImage: null,
      certificates: ['Construction Safety Certificate'],
    },
    wk0005: {
      _id: 'wk0005',
      name: 'Pradeep Nair',
      age: 30,
      phone: '+91 94455 66778',
      email: 'pradeep.nair@example.com',
      experience: '3-5 Years',
      city: 'Chennai',
      dailyRate: 1050,
      isVerified: true,
      verificationStatus: 'verified',
      createdAt: '2023-11-11T11:00:00Z',
      skills: [{ skillId: 5, skillName: 'Welder' }],
      aadhaarFrontImage: null,
      aadhaarBackImage: null,
      certificates: ['Welding Technology Diploma', 'Industrial Safety Certificate'],
    },
    wk0006: {
      _id: 'wk0006',
      name: 'Rohit Sharma',
      age: 22,
      phone: '+91 78899 00112',
      email: 'rohit.sharma@example.com',
      experience: '0-1 Year',
      city: 'Hyderabad',
      dailyRate: 600,
      isVerified: false,
      verificationStatus: 'pending',
      createdAt: '2025-01-05T07:30:00Z',
      skills: [{ skillId: 6, skillName: 'Painter' }],
      aadhaarFrontImage: null,
      aadhaarBackImage: null,
      certificates: [],
    },
    wk0007: {
      _id: 'wk0007',
      name: 'Deepak Joshi',
      age: 27,
      phone: '+91 93344 55667',
      email: 'deepak.joshi@example.com',
      experience: '1-3 Years',
      city: 'Jaipur',
      dailyRate: 800,
      isVerified: true,
      verificationStatus: 'verified',
      createdAt: '2024-08-22T13:00:00Z',
      skills: [{ skillId: 7, skillName: 'Tile Fitter' }],
      aadhaarFrontImage: null,
      aadhaarBackImage: null,
      certificates: ['Tiling & Flooring Certificate'],
    },
    wk0008: {
      _id: 'wk0008',
      name: 'Sanjay Mehra',
      age: 20,
      phone: '+91 85533 44221',
      email: 'sanjay.mehra@example.com',
      experience: '0-1 Year',
      city: 'Kolkata',
      dailyRate: 550,
      isVerified: false,
      verificationStatus: 'pending',
      createdAt: '2025-02-18T10:45:00Z',
      skills: [{ skillId: 8, skillName: 'Civil Helper' }],
      aadhaarFrontImage: null,
      aadhaarBackImage: null,
      certificates: [],
    },
  };

  const fetchWorkerDetails = async () => {
    try {
      const w = MOCK_WORKERS_DB[id];
      if (!w) throw new Error('Worker not found');
      const docs = [
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
      ];
      const mapped = {
        _id: w._id,
        name: w.name,
        workerId: `ID-#WK-${w._id.slice(-4)}`,
        role: w.skills?.[0]?.skillName || 'General Worker',
        experience: w.experience || 'N/A',
        age: w.age || 'N/A',
        expectedWage: w.dailyRate ? `₹${w.dailyRate}/day` : 'N/A',
        appliedOn: w.createdAt
          ? new Date(w.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : 'N/A',
        status: w.isVerified ? 'APPROVED' : w.verificationStatus === 'rejected' ? 'REJECTED' : 'PENDING REVIEW',
        profileImage: w.profileImage,
        locations: w.city ? [{ name: w.city, isPrimary: true }] : [],
        documents: docs,
        certifications: (w.certificates || []).map(cert => ({ name: cert, icon: '📜' })),
        workPhotos: [1, 2, 3, 4],
        contactInfo: {
          email: w.email || 'N/A',
          phone: w.phone || 'N/A',
        },
      };
      setWorker(mapped);
    } catch (err) {
      console.error('Worker not found in mock data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = () => {
    alert(`Worker "${worker?.name}" approved successfully! (Mock action)`);
    navigate('/admin/workers');
  };

  const handleReject = () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    alert(`Worker "${worker?.name}" rejected. Reason: ${reason} (Mock action)`);
    navigate('/admin/workers');
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
