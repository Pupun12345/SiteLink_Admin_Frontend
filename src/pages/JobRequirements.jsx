import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./JobRequirements.css";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

const CATEGORY_META = {
  'Financial Benefits':   { emoji: '💰', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  'Accommodation & Food': { emoji: '🏠', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'Travel':               { emoji: '🚌', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  'Safety & Medical':     { emoji: '🏥', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  'Leave':                { emoji: '🌴', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  'Work & Career':        { emoji: '📈', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'Employee Rewards':     { emoji: '🏆', color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
};

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
  const [loadingApplicant, setLoadingApplicant] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApplicantIds, setSelectedApplicantIds] = useState([]);

  // Edit / Delete state
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [allAmenities, setAllAmenities] = useState([]);
  const [openCats, setOpenCats] = useState({});
  const [editForm, setEditForm] = useState({
    title: '', company: '', location: '', quantity: '1',
    salary: '', salaryType: 'daily', duration: '',
    description: '', experience: '', isUrgent: false, amenities: [],
  });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Fetch amenities once
  useEffect(() => {
    api.get('/amenities').then(res => {
      const data = res.data.data || [];
      setAllAmenities(data);
      const cats = [...new Set(data.map(a => a.category))];
      const init = {};
      cats.forEach(c => { init[c] = true; });
      setOpenCats(init);
    }).catch(() => {});
  }, []);

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
            applied: formatDate(app.applied),
            avatar: app.profileImage || app.avatar || app.img || 'https://via.placeholder.com/40',
            img: app.profileImage || app.avatar || app.img || 'https://via.placeholder.com/40'
          }));
          setApplicants(actualApplicants);

          // Generate map URL for location
          if (jobData.location) {
            const locationQuery = encodeURIComponent(jobData.location);
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
    setModalOpen(false);
    setShowAllApplicants(false);
    setSelectedApplicant(null);
    setSelectedApplicantIds([]);
  };

  const handleOpenModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setTimeout(() => {
      setModalOpen(true);
      setShowAllApplicants(true);
    }, 0);
  };

  const fetchApplicantDetails = async (applicantId) => {
    setLoadingApplicant(true);
    try {
      const { data } = await api.get('/admin/vendor-worker', {
        params: {
          userType: 'worker',
          status: 'all',
          limit: 1000,
        },
      });
      let response = data.data;
      console.log(response);
      if (response.data.success) {
        const fullDetails = response.data.data;
        const applicantData = applicants.find(a => a.id === applicantId);
        setSelectedApplicant({ ...applicantData, ...fullDetails });
        console.log(response);
      }

    } catch (error) {
      console.error('Failed to fetch applicant details:', error);
      alert('Failed to load applicant details');
    } finally {
      setLoadingApplicant(false);
    }
  };

  const generateCSV = (data) => {
    const headers = ['Name', 'Phone', 'Email', 'Role', 'Experience', 'Salary Type', 'Salary', 'Work State', 'Work City', 'Skills', 'Location'];
    const rows = data.map(app => [
      app.name || '',
      app.phone || '',
      app.email || '',
      app.role || '',
      app.experience || '',
      app.salaryType || '',
      app.salary || '',
      app.workState || '',
      app.city || '',
      (app.skills || []).join('; '),
      app.location
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  };

  const handleShareWhatsApp = () => {
    const dataToExport = selectedApplicantIds.length > 0
      ? filteredApplicants.filter(app => selectedApplicantIds.includes(app.id))
      : filteredApplicants;

    if (dataToExport.length === 0) {
      alert('Please select at least one applicant to export');
      return;
    }

    const csv = generateCSV(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${job.title.replace(/\s+/g, '_')}_applicants.csv`;
    a.click();
    URL.revokeObjectURL(url);

    const message = `*Applicants for ${job.title}*\n\nTotal: ${dataToExport.length}\n\nCSV file downloaded. Please attach it manually.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleSelectApplicant = (applicantId) => {
    setSelectedApplicantIds(prev => {
      if (prev.includes(applicantId)) {
        return prev.filter(id => id !== applicantId);
      } else {
        return [...prev, applicantId];
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedApplicantIds(filteredApplicants.map(app => app.id));
    } else {
      setSelectedApplicantIds([]);
    }
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
    setActionLoading(true);
    try {
      const response = await api.delete(`/jobs/${id}`);
      if (response.data.success) {
        setDeleteOpen(false);
        navigate('/admin/requirements');
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = () => {
    setEditForm({
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      quantity: job.quantity || '1',
      salary: job.salary || '',
      salaryType: job.salaryType || 'daily',
      duration: job.duration || '',
      description: job.description || '',
      experience: job.experience || '',
      isUrgent: job.isUrgent || false,
      amenities: (job.amenities || []).map(a => a._id || a),
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleEditAmenity = (aid) => {
    setEditForm(p => ({
      ...p,
      amenities: p.amenities.includes(aid)
        ? p.amenities.filter(x => x !== aid)
        : [...p.amenities, aid],
    }));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSaving(true);
    try {
      const res = await api.put(`/jobs/${id}`, editForm);
      if (res.data.success) {
        // Re-fetch to get populated amenities
        const fresh = await api.get(`/jobs/${id}`);
        if (fresh.data.success) setJob(fresh.data.data);
        setEditOpen(false);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setEditSaving(false);
    }
  };

  const amenityGroups = allAmenities.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  const displayJobId = job?.jobId || `REQ-${job?._id?.slice(-4).toUpperCase()}`;

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
              <button className="btn btn-secondary" onClick={() => handleJobStatusUpdate('Closed')} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Close Job'}
              </button>
            )}
            {job.status !== 'Cancelled' && (
              <button className="btn btn-danger" onClick={() => handleJobStatusUpdate('Cancelled')} disabled={actionLoading}>
                {actionLoading ? 'Processing...' : 'Cancel Job'}
              </button>
            )}
            <button className="btn btn-edit" onClick={openEdit} disabled={actionLoading}>
              ✏️ Edit Job
            </button>
            <button className="btn btn-danger" onClick={() => setDeleteOpen(true)} disabled={actionLoading}>
              🗑️ Delete Job
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
                <strong>{job.postedBy?.companyName || job.company || 'Unknown Company'}</strong>
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
              {/* Applicant List - Now in horizontal box */}
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
                        <th>Role</th>
                        <th>Experience</th>
                        <th>Location</th>
                        <th>Applied</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplicants.length > 0 ? (
                        filteredApplicants.slice(0, 5).map((a) => (
                          <tr
                            key={a.id}
                            className="applicant-row"
                            style={{ cursor: 'pointer' }}
                          >
                            <td onClick={() => navigate(`/admin/workers`)}>
                              <div className="applicant-cell">
                                <img src={a.avatar || a.img} alt={a.name} className="applicant-avatar" />
                                <div>
                                  <p className="applicant-name">{a.name}</p>
                                </div>
                              </div>
                            </td>
                            <td onClick={() => navigate(`/admin/workers`)} className="applicant-role">{a.role}</td>
                            <td onClick={() => navigate(`/admin/workers`)} className="applicant-experience">{a.experience || 'N/A'}</td>
                            <td onClick={() => navigate(`/admin/workers`)} className="applicant-location">{a.location || 'N/A'}</td>
                            <td onClick={() => navigate(`/admin/workers`)} className="applied-time">{a.applied}</td>
                            <td onClick={() => navigate(`/admin/workers`)}>
                              <StatusBadge status={a.status} />
                            </td>
                            <td>
                              <button
                                className="view-profile-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/workers`);
                                }}
                                title="View Profile"
                                style={{ pointerEvents: 'auto' }}
                              >
                                <span className="material-symbols-outlined">visibility</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
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
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => handleOpenModal(e)}
                  >
                    View All Applicants ({applicants.length})
                  </button>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="material-symbols-outlined card-header-icon">verified_user</span>
                  Job Details
                </div>
                <div className="card-body">
                  <div className="req-grid">
                    <div className="req-section">
                      <p className="label-upper">Experience Required</p>
                      <p className="req-value">{job.experience || "N/A"}</p>
                    </div>
                    <div className="req-section">
                      <p className="label-upper">Quantity</p>
                      <p className="req-value">{job.quantity || "1"}</p>
                    </div>
                    <div className="req-section">
                      <p className="label-upper">Salary Type</p>
                      <p className="req-value">{job.salaryType ? job.salaryType.charAt(0).toUpperCase() + job.salaryType.slice(1) : "N/A"}</p>
                    </div>
                    <div className="req-section">
                      <p className="label-upper">Salary</p>
                      <p className="req-value">{job.salary ? `₹${job.salary}` : "N/A"}</p>
                    </div>
                    <div className="req-section">
                      <p className="label-upper">Duration</p>
                      <p className="req-value">{job.duration || "N/A"}</p>
                    </div>
                    <div className="req-section">
                      <p className="label-upper">Urgent</p>
                      <p className="req-value">{job.isUrgent ? "Yes" : "No"}</p>
                    </div>
                    {job.amenities?.length > 0 && (
                      <div className="req-section amenities-section">
                        <p className="label-upper">Amenities & Benefits</p>

                        {Object.entries(
                          job.amenities.reduce((acc, amenity) => {
                            if (!acc[amenity.category]) {
                              acc[amenity.category] = [];
                            }

                            acc[amenity.category].push(amenity);

                            return acc;
                          }, {})
                        ).map(([category, amenities]) => (
                          <div key={category} style={{ marginBottom: "14px" }}>
                            <div
                              style={{
                                fontWeight: 600,
                                marginBottom: "8px",
                                color: "#374151",
                              }}
                            >
                              {amenities[0].icon} {category}
                            </div>

                            <div className="amenities-list">
                              {amenities.map((amenity) => (
                                <span
                                  key={amenity._id}
                                  className="amenity-chip"
                                >
                                  ✓ {amenity.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="material-symbols-outlined card-header-icon">location_on</span>
                  Location
                </div>
                <div className="card-body location-body">
                  <div className="location-info">
                    <div>
                      <p className="label-upper">Location</p>
                      <p className="location-name">{job.location || "Not specified"}</p>
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
              {/* Job Description - Now in vertical box */}
              <div className="card">
                <div className="card-header">
                  <span className="material-symbols-outlined card-header-icon">subject</span>
                  Job Description
                </div>
                <div className="card-body">
                  <p className="description-text">{job.description || "No description available."}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All Applicants Modal */}
        {modalOpen && showAllApplicants ? (
          <div
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: '9999',
              padding: '20px'
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseModal();
              }
            }}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '14px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                maxWidth: '1200px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>All Applicants - {job?.title}</h2>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                >
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
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {selectedApplicantIds.length} selected
                    </span>
                    <button
                      className="btn btn-primary"
                      onClick={handleShareWhatsApp}
                      disabled={selectedApplicantIds.length === 0}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span className="material-symbols-outlined">share</span>
                      Export Selected to WhatsApp
                    </button>
                  </div>
                </div>

                <div className="modal-table-wrapper">
                  <table className="modal-applicant-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>
                          <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={selectedApplicantIds.length === filteredApplicants.length && filteredApplicants.length > 0}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </th>
                        <th>Applicant</th>
                        <th>Experience</th>
                        <th>Location</th>
                        <th>Skills</th>
                        <th>Salary</th>
                        <th>Applied</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplicants.map((applicant) => (
                        <tr key={applicant.id} className="modal-applicant-row">
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedApplicantIds.includes(applicant.id)}
                              onChange={() => handleSelectApplicant(applicant.id)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                          </td>
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
                            {applicant.salary ? `₹${applicant.salary}` : 'Not specified'}
                            {applicant.salaryType && <span style={{ fontSize: '12px', color: '#666' }}> / {applicant.salaryType}</span>}
                          </td>
                          <td className="modal-applied-time">{applicant.applied}</td>
                          <td><StatusBadge status={applicant.status} /></td>
                          <td>
                            <div className="modal-actions">
                              <button
                                className="modal-action-btn view-btn"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  window.location.href = `/admin/workers`;
                                }}
                                title="View Full Profile"
                              >
                                <span className="material-symbols-outlined">open_in_new</span>
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
        ) : null}

        {/* ── Delete Confirm Modal ── */}
        {deleteOpen && (
          <div className="jr-modal-overlay" onClick={() => setDeleteOpen(false)}>
            <div className="jr-modal jr-modal-sm" onClick={e => e.stopPropagation()}>
              <div className="jr-modal-head">
                <h2>Delete Job Post</h2>
                <button className="modal-close" onClick={() => setDeleteOpen(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="jr-modal-body">
                <div className="jr-delete-icon">🗑️</div>
                <p className="jr-delete-title">Are you sure you want to delete <strong>{job.title}</strong>?</p>
                <p className="jr-delete-sub">This action cannot be undone. All applicant data for this job will also be removed.</p>
              </div>
              <div className="jr-modal-foot">
                <button className="jr-btn-cancel" onClick={() => setDeleteOpen(false)}>Cancel</button>
                <button className="jr-btn-delete" onClick={handleDeleteJob} disabled={actionLoading}>
                  {actionLoading ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Edit Job Modal ── */}
        {editOpen && (
          <div className="jr-modal-overlay" onClick={() => setEditOpen(false)}>
            <div className="jr-modal jr-modal-lg" onClick={e => e.stopPropagation()}>
              <div className="jr-modal-head">
                <h2>Edit Job Post</h2>
                <button className="modal-close" onClick={() => setEditOpen(false)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="jr-modal-body jr-edit-body">
                {editError && <div className="jr-edit-error">{editError}</div>}
                <form id="edit-job-form" onSubmit={handleEditSave} className="jr-edit-form">
                  <div className="jr-edit-section-label">Basic Info</div>
                  <div className="jr-edit-grid-3">
                    <div className="jr-edit-field">
                      <label>Job Title *</label>
                      <input name="title" value={editForm.title} onChange={handleEditChange} required />
                    </div>
                    <div className="jr-edit-field">
                      <label>Company *</label>
                      <input name="company" value={editForm.company} onChange={handleEditChange} required />
                    </div>
                    <div className="jr-edit-field">
                      <label>Location *</label>
                      <input name="location" value={editForm.location} onChange={handleEditChange} required />
                    </div>
                  </div>
                  <div className="jr-edit-section-label">Compensation</div>
                  <div className="jr-edit-grid-4">
                    <div className="jr-edit-field">
                      <label>Salary (₹)</label>
                      <input name="salary" type="number" value={editForm.salary} onChange={handleEditChange} />
                    </div>
                    <div className="jr-edit-field">
                      <label>Salary Type</label>
                      <select name="salaryType" value={editForm.salaryType} onChange={handleEditChange}>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                    <div className="jr-edit-field">
                      <label>Duration</label>
                      <input name="duration" value={editForm.duration} onChange={handleEditChange} placeholder="e.g. 3 months" />
                    </div>
                    <div className="jr-edit-field">
                      <label>Quantity</label>
                      <input name="quantity" type="number" min="1" value={editForm.quantity} onChange={handleEditChange} />
                    </div>
                  </div>
                  <div className="jr-edit-section-label">Details</div>
                  <div className="jr-edit-grid-2">
                    <div className="jr-edit-field">
                      <label>Experience Required *</label>
                      <input name="experience" value={editForm.experience} onChange={handleEditChange} required />
                    </div>
                    <div className="jr-edit-field">
                      <label>Status</label>
                      <select name="status" value={editForm.status || job.status} onChange={handleEditChange}>
                        <option value="Open">Open</option>
                        <option value="Filled">Filled</option>
                        <option value="Closed">Closed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="jr-edit-field">
                    <label>Description *</label>
                    <textarea name="description" value={editForm.description} onChange={handleEditChange} rows={4} required />
                  </div>
                  <div className="jr-edit-field">
                    <label className="jr-urgent-label">
                      <input type="checkbox" name="isUrgent" checked={editForm.isUrgent} onChange={handleEditChange} />
                      <span>Mark as Urgent 🔥</span>
                    </label>
                  </div>
                  {Object.keys(amenityGroups).length > 0 && (
                    <div className="jr-edit-field">
                      <div className="jr-amenity-header">
                        <label>Amenities / Benefits</label>
                        {editForm.amenities.length > 0 && (
                          <span className="jr-amenity-count">{editForm.amenities.length} selected</span>
                        )}
                      </div>
                      <div className="jr-amenity-groups">
                        {Object.entries(amenityGroups).map(([cat, items]) => {
                          const meta = CATEGORY_META[cat] || { emoji: '📦', color: '#374151', bg: '#f9fafb', border: '#e5e7eb' };
                          const isOpen = openCats[cat];
                          const selCount = items.filter(a => editForm.amenities.includes(a._id)).length;
                          return (
                            <div key={cat} className="jr-amenity-group"
                              style={{ '--cat-border': meta.border, '--cat-bg': meta.bg }}>
                              <button type="button" className="jr-cat-header"
                                onClick={() => setOpenCats(p => ({ ...p, [cat]: !p[cat] }))}>
                                <span className="jr-cat-left">
                                  <span>{meta.emoji}</span>
                                  <span className="jr-cat-name" style={{ color: meta.color }}>{cat}</span>
                                  {selCount > 0 && (
                                    <span className="jr-cat-count" style={{ background: meta.color }}>{selCount}</span>
                                  )}
                                </span>
                                <span style={{ color: meta.color, fontSize: 13 }}>{isOpen ? '▲' : '▼'}</span>
                              </button>
                              {isOpen && (
                                <div className="jr-cat-chips">
                                  {items.map(a => {
                                    const sel = editForm.amenities.includes(a._id);
                                    return (
                                      <button type="button" key={a._id}
                                        className={`jr-amenity-chip ${sel ? 'selected' : ''}`}
                                        style={sel ? { background: meta.bg, borderColor: meta.color, color: meta.color } : {}}
                                        onClick={() => toggleEditAmenity(a._id)}>
                                        {a.icon && <span>{a.icon}</span>} {a.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </form>
              </div>
              <div className="jr-modal-foot">
                <button className="jr-btn-cancel" onClick={() => setEditOpen(false)}>Cancel</button>
                <button className="jr-btn-save" type="submit" form="edit-job-form" disabled={editSaving}>
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
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

              {loadingApplicant ? (
                <div className="modal-body" style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading applicant details...</p>
                </div>
              ) : (
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
                          <span className="detail-label">Salary:</span>
                          <span className="detail-value">
                            {selectedApplicant.salary ? `₹${selectedApplicant.salary}` : 'Not specified'}
                            {selectedApplicant.salaryType && ` / ${selectedApplicant.salaryType}`}
                          </span>
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
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
