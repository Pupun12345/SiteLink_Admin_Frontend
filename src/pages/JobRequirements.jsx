import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import "./JobRequirements.css";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

function StatusBadge({ status }) {
  const map = {
    shortlisted: { cls: "badge-shortlisted", label: "Shortlisted" },
    pending: { cls: "badge-pending", label: "Pending" },
    open: { cls: "badge-open", label: "Open" },
    filled: { cls: "badge-filled", label: "Filled" },
    closed: { cls: "badge-closed", label: "Closed" },
    cancelled: { cls: "badge-cancelled", label: "Cancelled" },
  };

  const { cls, label } = map[status?.toLowerCase()] || map.pending;
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function JobRequirements() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchVal, setSearchVal] = useState("");

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const fetchJobDetails = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await api.get(`/jobs/${id}`);
      setJob(response.data.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch job details:", err);
      setError("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseJob = async () => {
    if (!job) return;

    try {
      await api.put(`/jobs/${job._id}`, { status: "Closed" });
      setJob({ ...job, status: "Closed" });
    } catch (err) {
      console.error("Failed to close job:", err);
      alert("Failed to close job");
    }
  };

  const handleCancelJob = async () => {
    if (!job) return;

    if (window.confirm("Are you sure you want to cancel this job?")) {
      try {
        await api.put(`/jobs/${job._id}`, { status: "Cancelled" });
        setJob({ ...job, status: "Cancelled" });
      } catch (err) {
        console.error("Failed to cancel job:", err);
        alert("Failed to cancel job");
      }
    }
  };

  const filteredApplicants = useMemo(() => {
    const applicants = job?.applicants || [];
    const term = searchVal.trim().toLowerCase();

    if (!term) return applicants;

    return applicants.filter((applicant) => {
      const name = applicant?.name?.toLowerCase() || "";
      const role = applicant?.role?.toLowerCase() || "";
      const status = applicant?.status?.toLowerCase() || "";
      return (
        name.includes(term) || role.includes(term) || status.includes(term)
      );
    });
  }, [job, searchVal]);

  if (loading) {
    return (
      <div className="app-root">
        <Sidebar />
        <main className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading job details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="app-root">
        <Sidebar />
        <main className="main-content">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error || "Job not found"}</p>
            <button
              onClick={() => window.history.back()}
              className="btn btn--neutral"
            >
              Go Back
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-root">
      <Sidebar />

      <main className="main-content">
        <header className="top-header">
          <div className="breadcrumb">
            <span>Requirements</span>
            <span className="material-symbols-outlined breadcrumb-chevron">
              chevron_right
            </span>
            <span className="breadcrumb-current">
              {job.jobId || job._id?.slice(-6) || "Job Details"}
            </span>
          </div>

          <div className="header-actions">
            <div className="search-wrap">
              <span className="material-symbols-outlined search-icon">
                search
              </span>
              <input
                className="search-input"
                type="text"
                placeholder="Search applicants..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
              />
            </div>

            <button
              className="btn btn--neutral"
              onClick={handleCloseJob}
              disabled={
                job.status?.toLowerCase() === "closed" ||
                job.status?.toLowerCase() === "cancelled"
              }
            >
              Close Job
            </button>

            <button
              className="btn btn--danger"
              onClick={handleCancelJob}
              disabled={job.status?.toLowerCase() === "cancelled"}
            >
              Cancel Job
            </button>
          </div>
        </header>

        <div className="page-body">
          <div className="page-title-area">
            <div className="page-title-left">
              <div className="title-row">
                <h1 className="page-title">{job.role || job.title || "Untitled Job"}</h1>
                <StatusBadge status={job.status} />
              </div>

              <p className="page-meta">
                <span className="material-symbols-outlined meta-icon">
                  calendar_today
                </span>
                Posted on{" "}
                {new Date(job.createdAt || Date.now()).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}{" "}
                • ID: {job.jobId || job._id?.slice(-6)}
              </p>
            </div>
          </div>

          <div className="content-grid">
            <div className="col-left">
              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">
                    <span className="material-symbols-outlined card-header-icon">
                      subject
                    </span>
                    <h3 className="card-title">Job Description</h3>
                  </div>
                </div>

                <div className="card-body">
                  <p className="description-text">
                    {job.description || "No job description available."}
                  </p>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">
                    <span className="material-symbols-outlined card-header-icon">
                      verified_user
                    </span>
                    <h3 className="card-title">Worker Requirements</h3>
                  </div>
                </div>

                <div className="card-body">
                  <div className="req-grid">
                    <div className="req-section">
                      <p className="section-label">Required Skills</p>
                      <div className="skills-wrap">
                        {job.skills && job.skills.length > 0 ? (
                          job.skills.map((skill, index) => (
                            <span key={index} className="skill-tag">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="skill-tag">No skills specified</span>
                        )}
                      </div>
                    </div>

                    <div className="req-section">
                      <p className="section-label">Experience</p>
                      <p className="req-value">
                        {job.experience || "Not specified"}
                      </p>
                    </div>
                  </div>

                  {job.equipment && job.equipment.length > 0 && (
                    <div className="equipment-section">
                      <p className="section-label">Equipment Needed</p>
                      <ul className="equipment-list">
                        {job.equipment.map((item, index) => (
                          <li key={index} className="equipment-item">
                            <span className="material-symbols-outlined check-icon">
                              check_circle
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div className="card-header-left">
                    <span className="material-symbols-outlined card-header-icon">
                      location_on
                    </span>
                    <h3 className="card-title">Location</h3>
                  </div>
                </div>

                <div className="card-body">
                  <div className="location-body">
                    <div
                      className="map-thumb"
                      style={{
                        backgroundImage: job.mapImage
                          ? `url('${job.mapImage}')`
                          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      }}
                    />

                    <div className="location-info">
                      <div className="location-text-group">
                        <p className="section-label">Project Site</p>
                        <p className="location-name">
                          {job.projectSite || job.company || "Not specified"}
                        </p>
                        <p className="location-address">
                          {job.address || job.location || "No address available"}
                        </p>
                      </div>

                      <button className="directions-btn">
                        Get Directions
                        <span className="material-symbols-outlined">
                          open_in_new
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-right">
              <div className="card applicants-card">
                <div className="card-header">
                  <div className="card-header-left">
                    <span className="material-symbols-outlined card-header-icon">
                      groups
                    </span>
                    <h3 className="card-title">Application List</h3>
                  </div>

                  <span className="total-badge">
                    {job.applicants?.length || job.applicationsCount || 0} Total
                  </span>
                </div>

                <div className="table-wrap">
                  <table className="applicants-table">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Applied</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredApplicants.length > 0 ? (
                        filteredApplicants.map((applicant, index) => (
                          <tr
                            key={applicant.id || applicant._id || index}
                            className="applicant-row"
                          >
                            <td>
                              <div className="applicant-cell">
                                <img
                                  className="applicant-avatar"
                                  src={
                                    applicant.avatar ||
                                    "https://randomuser.me/api/portraits/lego/1.jpg"
                                  }
                                  alt={applicant.name || "Applicant"}
                                  onError={(e) => {
                                    e.target.src =
                                      "https://randomuser.me/api/portraits/lego/1.jpg";
                                  }}
                                />
                                <div className="applicant-info">
                                  <p className="applicant-name">
                                    {applicant.name || "Unknown Applicant"}
                                  </p>
                                  <p className="applicant-role">
                                    {applicant.role || "Role not specified"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="applied-time">
                              {new Date(
                                applicant.appliedAt || Date.now()
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </td>

                            <td>
                              <StatusBadge status={applicant.status} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="empty-state-cell">
                            No matching applications found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="card-footer">
                  <button className="view-all-btn">View All Applicants</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}