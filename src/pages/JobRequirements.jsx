import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./JobRequirements.css";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

function StatusBadge({ status }) {
  const normalized = status ? status.toLowerCase() : "open";
  return <span className={`status-badge ${normalized}`}>{status || "Open"}</span>;
}

function getStatusClass(status) {
  if (!status) return "open";
  switch (status.toLowerCase()) {
    case "open":
      return "open";
    case "filled":
      return "filled";
    case "closed":
      return "closed";
    case "cancelled":
      return "cancelled";
    default:
      return "open";
  }
}

export default function JobRequirements() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [showAllApplicants, setShowAllApplicants] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [mapUrl, setMapUrl] = useState("");

  useEffect(() => {
    const fetchJob = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const response = await api.get(`/jobs/${id}`);
        if (response.data.success) {
          const jobData = response.data.data || {};
          setJob(jobData);
          
          const actualApplicants = (jobData.applicants || []).map(app => ({
            ...app,
            applied: formatDate(app.applied)
          }));
          setApplicants(actualApplicants);
          
          // Generate map URL for location
          if (jobData.address || jobData.location) {
            const locationQuery = encodeURIComponent(jobData.address || jobData.location);
            setMapUrl(`https://www.google.com/maps/search/?api=1&query=${locationQuery}`);
          }
          
          setError(null);
        } else {
          setError(response.data.message || "Job not found");
        }
      } catch (err) {
        console.error("Failed to fetch job:", err);
        setError(err.response?.data?.message || "Failed to load job details");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };


  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading job details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <div className="error-state">
            <p>{error}</p>
          </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main">
          <div className="error-state">
            <p>Job details not available.</p>
          </div>
        </main>
      </div>
    );
  }

  const handleViewAllApplicants = () => {
    console.log('Button clicked - opening modal');
    setShowAllApplicants(true);
  };

  const handleCloseModal = () => {
    setShowAllApplicants(false);
    setSelectedApplicant(null);
  };

  const handleApplicantAction = async (applicantId, action) => {
    setActionLoading(true);
    try {
      const response = await api.put(`/jobs/${id}/applications/${applicantId}`, { 
        status: action,
        notes: `Status updated to ${action}` 
      });
      
      if (response.data.success) {
        setApplicants(prev => prev.map(app => 
          app.id === applicantId ? { ...app, status: action } : app
        ));
        
        // Refresh job data to update counts
        const jobResponse = await api.get(`/jobs/${id}`);
        if (jobResponse.data.success) {
          setJob(jobResponse.data.data);
        }
        
        alert(`Application ${action} successfully!`);
      }
    } catch (error) {
      console.error(`Failed to ${action} applicant:`, error);
      alert(error.response?.data?.message || `Failed to ${action} application. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJobStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this job?`)) {
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await api.put(`/jobs/${id}`, { status: newStatus });
      if (response.data.success) {
        setJob(prev => ({ ...prev, status: newStatus }));
        alert(`Job status updated to ${newStatus} successfully!`);
      }
    } catch (error) {
      console.error(`Failed to update job status:`, error);
      alert(error.response?.data?.message || 'Failed to update job status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGetDirections = () => {
    if (mapUrl) {
      window.open(mapUrl, '_blank');
    } else {
      alert('Location information not available');
    }
  };

  const handleDeleteJob = async () => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await api.delete(`/jobs/${id}`);
      if (response.data.success) {
        alert('Job deleted successfully!');
        navigate('/admin/requirements');
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert(error.response?.data?.message || 'Failed to delete job. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const displayJobId = job?.jobId || `REQ-${job?._id?.slice(-4).toUpperCase()}`;
  const mapImage = job?.mapImage || "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800";

  const filteredApplicants = applicants.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      a.name?.toLowerCase().includes(q) ||
      a.role?.toLowerCase().includes(q) ||
      a.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Requirements</span>
            <span className="material-symbols-outlined breadcrumb-chevron">chevron_right</span>
            <span className="breadcrumb-current">{displayJobId}</span>
          </div>
          <div className="topbar-actions">
            <div className="search-wrapper">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                type="text"
                placeholder="Search applicants..."
                className="search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {job.status === 'Open' && (
              <button 
                className="btn btn-secondary"
                onClick={() => handleJobStatusUpdate('Closed')}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Close Job'}
              </button>
            )}
            {job.status !== 'Cancelled' && (
              <button 
                className="btn btn-danger"
                onClick={() => handleJobStatusUpdate('Cancelled')}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : 'Cancel Job'}
              </button>
            )}
            <button 
              className="btn btn-danger"
              onClick={handleDeleteJob}
              disabled={actionLoading}
              style={{ marginLeft: '8px' }}
            >
              {actionLoading ? 'Deleting...' : 'Delete Job'}
            </button>
          </div>
        </header>

        <div className="content">
          <div className="page-title">
            <div>
              <div className="title-row">
                <h1>{job.title || "Job Requirement"}</h1>
                <span className={`job-badge ${getStatusClass(job.status)}`}>{job.status || "Open"}</span>
              </div>
              <p className="job-meta">
                <strong>{job.company || "Unknown Company"}</strong>
                {job.postedBy?.name ? ` • Posted by ${job.postedBy.name}` : ''}
              </p>
              <p className="posted-meta">
                <span className="material-symbols-outlined meta-icon">calendar_today</span>
                Posted on {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "N/A"} • ID: {displayJobId}
              </p>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="left-col">
              <div className="card">
                <div className="card-header">
                  <span className="material-symbols-outlined card-header-icon">subject</span>
                  Job Description
                </div>
                <div className="card-body">
                  <p className="description-text">{job.description || "No description available."}</p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="material-symbols-outlined card-header-icon">verified_user</span>
                  Worker Requirements
                </div>
                <div className="card-body">
                  <div className="req-grid">
                    <div className="req-section">
                      <p className="label-upper">Required Skills</p>
                      <div className="skill-tags">
                        {(job.skills && job.skills.length > 0 ? job.skills : ["N/A"]).map((s) => (
                          <span key={s} className="skill-tag">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="req-section">
                      <p className="label-upper">Experience</p>
                      <p className="req-value">{job.experience || "N/A"}</p>
                    </div>
                    <div className="req-section">
                      <p className="label-upper">Quantity</p>
                      <p className="req-value">{job.quantity || "1"}</p>
                    </div>
                    <div className="req-section">
                      <p className="label-upper">Type</p>
                      <p className="req-value">{job.type || "Unknown"}</p>
                    </div>
                    <div className="req-section">
                      <p className="label-upper">Company</p>
                      <p className="req-value">{job.company || "N/A"}</p>
                    </div>
                  </div>

                  <div className="equipment-section">
                    <p className="label-upper">Equipment Needed</p>
                    <ul className="equipment-list">
                      {(job.equipment && job.equipment.length > 0 ? job.equipment : ["No equipment listed"]).map((item) => (
                        <li key={item} className="equipment-item">
                          <span className="material-symbols-outlined check-icon">check_circle</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="material-symbols-outlined card-header-icon">location_on</span>
                  Location
                </div>
                <div className="card-body location-body">
                  <div className="map-thumb" style={{ backgroundImage: `url(${mapImage})` }}>
                    {mapUrl && (
                      <div className="map-overlay">
                        <button className="view-map-btn" onClick={handleGetDirections}>
                          <span className="material-symbols-outlined">map</span>
                          View on Map
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="location-info">
                    <div>
                      <p className="label-upper">Project Site</p>
                      <p className="location-name">{job.projectSite || job.location || "Unknown site"}</p>
                      <p className="location-address">{job.address || job.location || "Not available"}</p>
                    </div>
                    <button className="directions-btn" onClick={handleGetDirections} disabled={!mapUrl}>
                      Get Directions
                      <span className="material-symbols-outlined directions-icon">open_in_new</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="right-col">
              <div className="card applicants-card">
                <div className="card-header">
                  <div className="card-header-left">
                    <span className="material-symbols-outlined card-header-icon">groups</span>
                    Application List
                  </div>
                  <span className="total-badge">{filteredApplicants.length} Total</span>
                </div>

                <div className="table-wrapper">
                  <table className="applicant-table">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Applied</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplicants.length > 0 ? (
                        filteredApplicants.map((a) => (
                          <tr key={a.id} className="applicant-row">
                            <td>
                              <div className="applicant-cell">
                                <img src={a.avatar || a.img} alt={a.name} className="applicant-avatar" />
                                <div>
                                  <p className="applicant-name">{a.name}</p>
                                  <p className="applicant-role">{a.role}</p>
                                </div>
                              </div>
                            </td>
                            <td className="applied-time">{a.applied}</td>
                            <td>
                              <StatusBadge status={a.status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                            No applicants found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="card-footer">
                  <button 
                    className="view-all-btn" 
                    onClick={() => {
                      console.log('Button clicked - opening modal');
                      console.log('Current showAllApplicants state:', showAllApplicants);
                      setShowAllApplicants(true);
                      console.log('After setting state - showAllApplicants should be true');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    View All Applicants ({applicants.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Applicants Modal */}
        {showAllApplicants && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>All Applicants - {job?.title}</h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="applicants-stats">
                  <div className="stat-item">
                    <span className="stat-number">{applicants.length}</span>
                    <span className="stat-label">Total Applications</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{applicants.filter(a => a.status === 'shortlisted').length}</span>
                    <span className="stat-label">Shortlisted</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{applicants.filter(a => a.status === 'pending').length}</span>
                    <span className="stat-label">Pending Review</span>
                  </div>
                </div>

                <div className="applicants-search">
                  <div className="search-wrapper">
                    <span className="material-symbols-outlined search-icon">search</span>
                    <input
                      type="text"
                      placeholder="Search applicants..."
                      className="search-input"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-table-wrapper">
                  <table className="modal-applicant-table">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Experience</th>
                        <th>Location</th>
                        <th>Skills</th>
                        <th>Daily Rate</th>
                        <th>Applied</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplicants.map((applicant) => (
                        <tr key={applicant.id} className="modal-applicant-row">
                          <td>
                            <div className="modal-applicant-cell">
                              <img 
                                src={applicant.avatar || applicant.img} 
                                alt={applicant.name} 
                                className="modal-applicant-avatar"
                              />
                              <div>
                                <p className="modal-applicant-name">{applicant.name}</p>
                                <p className="modal-applicant-role">{applicant.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="modal-experience">{applicant.experience || 'Not specified'}</td>
                          <td className="modal-location">{applicant.location || 'Not specified'}</td>
                          <td>
                            <div className="modal-skills-list">
                              {(applicant.skills || ['General']).slice(0, 2).map((skill, index) => (
                                <span key={index} className="modal-skill-chip">{skill}</span>
                              ))}
                              {applicant.skills && applicant.skills.length > 2 && (
                                <span className="modal-skill-more">+{applicant.skills.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="modal-rate">
                            {applicant.dailyRate ? `₹${applicant.dailyRate}` : 'Not specified'}
                          </td>
                          <td className="modal-applied-time">{applicant.applied}</td>
                          <td><StatusBadge status={applicant.status} /></td>
                          <td>
                            <div className="modal-actions">
                              {applicant.status === 'pending' && (
                                <>
                                  <button 
                                    className="modal-action-btn shortlist-btn"
                                    onClick={() => handleApplicantAction(applicant.id, 'shortlisted')}
                                    title="Shortlist"
                                    disabled={actionLoading}
                                  >
                                    <span className="material-symbols-outlined">star</span>
                                  </button>
                                  <button 
                                    className="modal-action-btn reject-btn"
                                    onClick={() => handleApplicantAction(applicant.id, 'rejected')}
                                    title="Reject"
                                    disabled={actionLoading}
                                  >
                                    <span className="material-symbols-outlined">close</span>
                                  </button>
                                </>
                              )}
                              {applicant.status === 'shortlisted' && (
                                <>
                                  <button 
                                    className="modal-action-btn hire-btn"
                                    onClick={() => handleApplicantAction(applicant.id, 'hired')}
                                    title="Hire"
                                    disabled={actionLoading}
                                  >
                                    <span className="material-symbols-outlined">check</span>
                                  </button>
                                  <button 
                                    className="modal-action-btn reject-btn"
                                    onClick={() => handleApplicantAction(applicant.id, 'rejected')}
                                    title="Reject"
                                    disabled={actionLoading}
                                  >
                                    <span className="material-symbols-outlined">close</span>
                                  </button>
                                </>
                              )}
                              <button 
                                className="modal-action-btn view-btn"
                                onClick={() => setSelectedApplicant(applicant)}
                                title="View Profile"
                              >
                                <span className="material-symbols-outlined">visibility</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredApplicants.length === 0 && (
                  <div className="no-applicants">
                    <span className="material-symbols-outlined">person_search</span>
                    <p>No applicants found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Applicant Profile Modal */}
        {selectedApplicant && (
          <div className="modal-overlay" onClick={() => setSelectedApplicant(null)}>
            <div className="modal-content applicant-profile-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedApplicant.name}'s Profile</h2>
                <button className="modal-close" onClick={() => setSelectedApplicant(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <div className="modal-body">
                <div className="profile-header">
                  <img 
                    src={selectedApplicant.avatar || selectedApplicant.img} 
                    alt={selectedApplicant.name} 
                    className="profile-photo"
                  />
                  <div className="profile-info">
                    <h3>{selectedApplicant.name}</h3>
                    <p className="profile-role">{selectedApplicant.role}</p>
                    <StatusBadge status={selectedApplicant.status} />
                  </div>
                </div>
                
                <div className="profile-details">
                  <div className="detail-section">
                    <h4>Contact Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{selectedApplicant.phone || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{selectedApplicant.email || 'Not provided'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Location:</span>
                        <span className="detail-value">{selectedApplicant.location || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Professional Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Experience:</span>
                        <span className="detail-value">{selectedApplicant.experience || 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Daily Rate:</span>
                        <span className="detail-value">{selectedApplicant.dailyRate ? `₹${selectedApplicant.dailyRate}` : 'Not specified'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Applied On:</span>
                        <span className="detail-value">{selectedApplicant.applied}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="detail-section">
                    <h4>Skills</h4>
                    <div className="skills-grid">
                      {(selectedApplicant.skills || ['General']).map((skill, index) => (
                        <span key={index} className="skill-badge">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="profile-actions">
                  {selectedApplicant.status === 'pending' && (
                    <>
                      <button 
                        className="action-btn shortlist-btn"
                        onClick={() => {
                          handleApplicantAction(selectedApplicant.id, 'shortlisted');
                          setSelectedApplicant(null);
                        }}
                        disabled={actionLoading}
                      >
                        <span className="material-symbols-outlined">star</span>
                        {actionLoading ? 'Processing...' : 'Shortlist Candidate'}
                      </button>
                      <button 
                        className="action-btn reject-btn"
                        onClick={() => {
                          handleApplicantAction(selectedApplicant.id, 'rejected');
                          setSelectedApplicant(null);
                        }}
                        disabled={actionLoading}
                      >
                        <span className="material-symbols-outlined">close</span>
                        {actionLoading ? 'Processing...' : 'Reject Application'}
                      </button>
                    </>
                  )}
                  {selectedApplicant.status === 'shortlisted' && (
                    <>
                      <button 
                        className="action-btn hire-btn"
                        onClick={() => {
                          handleApplicantAction(selectedApplicant.id, 'hired');
                          setSelectedApplicant(null);
                        }}
                        disabled={actionLoading}
                      >
                        <span className="material-symbols-outlined">check</span>
                        {actionLoading ? 'Processing...' : 'Hire Candidate'}
                      </button>
                      <button 
                        className="action-btn reject-btn"
                        onClick={() => {
                          handleApplicantAction(selectedApplicant.id, 'rejected');
                          setSelectedApplicant(null);
                        }}
                        disabled={actionLoading}
                      >
                        <span className="material-symbols-outlined">close</span>
                        {actionLoading ? 'Processing...' : 'Reject Application'}
                      </button>
                    </>
                  )}
                  {(selectedApplicant.status === 'hired' || selectedApplicant.status === 'rejected') && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      <p>This application has been {selectedApplicant.status}.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
