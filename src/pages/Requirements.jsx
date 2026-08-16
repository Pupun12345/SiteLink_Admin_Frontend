import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Requirements.css";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

export default function RequirementsDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState({ name: '', email: '', imageUrl: '' });
  const [availableRoles, setAvailableRoles] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [filters, setFilters] = useState({
    role: "All",
    location: "Global",
    status: "Any",
    salaryType: "All"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const fetchAdminProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      console.log('Profile response:', response.data);

      if (response.data.success && response.data.data) {
        const user = response.data.data.user;
        console.log('User data:', user);

        const imageUrl = user.profileImage
          ? user.profileImage
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name || 'Admin'
          )}&background=2b3f57&color=fff`;

        console.log('Image URL:', imageUrl);

        setProfile({
          name: user.name || '',
          email: user.email || '',
          imageUrl: imageUrl,
          role: user.role || ''
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAdminProfile();
    fetchAvailableFilters();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [currentPage, filters]);

  const fetchAvailableFilters = async () => {
    try {
      const response = await api.get('/jobs');
      const allJobs = response.data.data || [];

      // Extract unique roles
      const roles = [...new Set(allJobs.map(job => job.title).filter(Boolean))];
      setAvailableRoles(roles.sort());

      // Extract unique locations
      const locations = [...new Set(allJobs.map(job => job.location).filter(Boolean))];
      setAvailableLocations(locations.sort());
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (filters.salaryType !== "All") {
        params.append("salaryType", filters.salaryType);
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await api.get(`/jobs?${params.toString()}`);
      let jobsData = response.data.data || [];

      // Apply client-side filters for location (exact match)
      if (filters.location !== "Global") {
        jobsData = jobsData.filter(job =>
          job.location?.toLowerCase() === filters.location.toLowerCase()
        );
      }

      // Apply client-side filters for status
      if (filters.status !== "Any") {
        jobsData = jobsData.filter(job =>
          job.status?.toLowerCase() === filters.status.toLowerCase()
        );
      }

      // Apply client-side filters for role (exact match)
      if (filters.role !== "All") {
        jobsData = jobsData.filter(job =>
          job.title?.toLowerCase() === filters.role.toLowerCase()
        );
      }

      // Calculate pagination
      const total = jobsData.length;
      setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));

      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedJobs = jobsData.slice(startIndex, startIndex + itemsPerPage);

      setJobs(paginatedJobs);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError(err.response?.data?.message || "Failed to load job requirements");
      setJobs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      setCurrentPage(1);
      fetchJobs();
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      role: "All",
      location: "Global",
      status: "Any",
      salaryType: "All"
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleJobClick = (jobId) => {
    navigate(`/admin/requirements/${jobId}`);
  };

  const exportToCSV = async () => {
    try {
      // Fetch all jobs without pagination for export
      const response = await api.get('/jobs');
      const allJobs = response.data.data || [];

      if (allJobs.length === 0) {
        alert('No data to export');
        return;
      }

      const headers = ["Job ID", "Company", "Role", "Salary", "Salary Type", "Duration", "Quantity", "Location", "Amenities", "Urgent", "Applications", "Status", "Date"];
      const csvData = allJobs.map(job => [
        job.jobId || `REQ-${job._id.slice(-4).toUpperCase()}`,
        job.company || 'N/A',
        job.title || 'N/A',
        job.salary ? `₹${job.salary}` : 'N/A',
        job.salaryType ? job.salaryType.charAt(0).toUpperCase() + job.salaryType.slice(1) : 'N/A',
        job.duration || 'N/A',
        job.quantity || "1",
        job.location || 'N/A',
        (job.amenities || []).map(a => a.name || '').join('; ') || 'None',
        job.isUrgent ? 'Yes' : 'No',
        job.applicationsCount || "0",
        job.status || 'Open',
        new Date(job.createdAt).toLocaleDateString()
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(","))
        .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-requirements-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'open': return 'open';
      case 'filled': return 'filled';
      case 'closed': return 'closed';
      case 'cancelled': return 'cancelled';
      default: return 'open';
    }
  };

  return (
    <div className="requirements-page">
      <Sidebar />

      <main className="requirements-main">
        {/* Header */}
        <header className="requirements-header">
          <div className="search-container">
            <input
              className="search"
              placeholder="Search Requirement ID, Vendors or Roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearch}
            />
            <button className="search-btn" onClick={handleSearch}>
              🔍
            </button>
          </div>

          <div className="profile">
            <img
              src={profile.imageUrl}
              alt="profile"
            />
            <div>
              <p>{profile.name}</p>
              <span>Super Admin</span>
            </div>
          </div>
        </header>

        {/* Title */}
        <div className="page-header">
          <div>
            <h1>Job Requirements</h1>
            <p>Review and manage active requisitions for field operations.</p>
          </div>

          <button className="export" onClick={exportToCSV}>
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="filters">
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="All">Worker Role: All</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <select
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          >
            <option value="Global">Location: Global</option>
            {availableLocations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="Any">Status: Any</option>
            <option value="Open">Open</option>
            <option value="Filled">Filled</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={filters.salaryType}
            onChange={(e) => handleFilterChange('salaryType', e.target.value)}
          >
            <option value="All">Salary Type: All</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <button className="clear" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {/* Table */}
        <div className="table-card">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading job requirements...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={fetchJobs} className="retry-btn">Retry</button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Req ID</th>
                      <th>Company Name</th>
                      <th>Worker Role</th>
                      <th>Qty</th>
                      <th>Location</th>
                      <th>Apps</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {jobs.length > 0 ? (
                      jobs.map((job) => (
                        <tr key={job._id}>
                          <td className="req">
                            {job.jobId || `REQ-${job._id.slice(-4).toUpperCase()}`}
                          </td>
                          <td>{job.postedBy?.companyName || job.company}</td>
                          <td>
                            <strong
                              style={{ cursor: 'pointer', color: '#007bff' }}
                              onClick={() => handleJobClick(job._id)}
                            >
                              {job.title}
                            </strong>
                            <div className="role-type">
                              {job.salary ? `₹${job.salary}` : 'N/A'} / {job.salaryType ? job.salaryType.charAt(0).toUpperCase() + job.salaryType.slice(1) : 'N/A'}
                              {job.isUrgent && <span style={{ color: 'red', marginLeft: '8px' }}>🔥 Urgent</span>}
                            </div>
                            {job.amenities && job.amenities.length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                {job.amenities.slice(0, 3).map((amenity) => (
                                  <span key={amenity._id} style={{
                                    fontSize: '10px',
                                    padding: '2px 6px',
                                    background: '#f0f4ff',
                                    borderRadius: '10px',
                                    color: '#4a3f7a',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '2px'
                                  }}>
                                    {amenity.icon && <span>{amenity.icon}</span>}
                                    {amenity.name}
                                  </span>
                                ))}
                                {job.amenities.length > 3 && (
                                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                                    +{job.amenities.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td>{job.quantity || "1"}</td>
                          <td>{job.location}</td>
                          <td>{job.applicationsCount || "0"}</td>
                          <td>
                            <span className={`status ${getStatusClass(job.status)}`}>
                              {job.status}
                            </span>
                          </td>
                          <td>
                            {new Date(job.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                          No job requirements found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="mobile-cards">
                {jobs.length > 0 ? (
                  jobs.map((job) => (
                    <div key={job._id} className="job-card" onClick={() => handleJobClick(job._id)}>
                      <div className="card-header">
                        <span className="req">{job.jobId || `REQ-${job._id.slice(-4).toUpperCase()}`}</span>
                        <span className={`status ${getStatusClass(job.status)}`}>{job.status}</span>
                      </div>
                      <div className="card-title">
                        <strong>{job.title}</strong>
                        {job.isUrgent && <span style={{ color: 'red', marginLeft: '8px' }}>🔥 Urgent</span>}
                      </div>
                      <div className="card-details">
                        <div><strong>Vendor:</strong> {job.company}</div>
                        <div><strong>Salary:</strong> {job.salary ? `₹${job.salary}` : 'N/A'} / {job.salaryType ? job.salaryType.charAt(0).toUpperCase() + job.salaryType.slice(1) : 'N/A'}</div>
                        <div><strong>Location:</strong> {job.location}</div>
                        <div><strong>Qty:</strong> {job.quantity || "1"} | <strong>Apps:</strong> {job.applicationsCount || "0"}</div>
                        <div className="card-date">
                          {new Date(job.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No job requirements found
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="pagination">
                <span>Page {currentPage} of {totalPages}</span>

                <div>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    {"<"}
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {">"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}