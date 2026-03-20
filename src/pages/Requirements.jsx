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
  const [filters, setFilters] = useState({
    role: "All",
    location: "Global",
    status: "Any",
    type: "All"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchJobs();
  }, [currentPage, filters]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (filters.location !== "Global") {
        params.append("location", filters.location);
      }
      
      if (filters.type !== "All") {
        params.append("type", filters.type);
      }
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await api.get(`/jobs?${params.toString()}`);
      let jobsData = response.data.data || [];

      // Apply client-side filters for status and role
      if (filters.status !== "Any") {
        jobsData = jobsData.filter(job => job.status === filters.status);
      }
      
      if (filters.role !== "All") {
        jobsData = jobsData.filter(job => 
          job.title.toLowerCase().includes(filters.role.toLowerCase())
        );
      }

      // Apply search filter
      if (searchTerm) {
        jobsData = jobsData.filter(job =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (job.jobId && job.jobId.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }

      // Calculate pagination
      const total = jobsData.length;
      setTotalPages(Math.ceil(total / itemsPerPage));
      
      // Apply pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const paginatedJobs = jobsData.slice(startIndex, startIndex + itemsPerPage);
      
      setJobs(paginatedJobs);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError("Failed to load job requirements");
      setJobs([]);
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
      type: "All"
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleJobClick = (jobId) => {
    navigate(`/admin/requirements/${jobId}`);
  };

  const exportToCSV = () => {
    const headers = ["Job ID", "Company", "Role", "Type", "Quantity", "Location", "Applications", "Status", "Date"];
    const csvData = jobs.map(job => [
      job.jobId || `REQ-${job._id.slice(-4)}`,
      job.company,
      job.title,
      job.type,
      job.quantity || "1",
      job.location,
      job.applicationsCount || "0",
      job.status,
      new Date(job.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "job-requirements.csv";
    a.click();
    window.URL.revokeObjectURL(url);
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
              src="https://i.pravatar.cc/100"
              alt="profile"
            />
            <div>
              <p>Alex Rivera</p>
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
            <option value="Manager">Site Manager</option>
            <option value="Engineer">Safety Engineer</option>
            <option value="Technician">Civil Technician</option>
            <option value="Operator">Crane Operator</option>
            <option value="Inspector">Structural Inspector</option>
          </select>

          <select 
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          >
            <option value="Global">Location: Global</option>
            <option value="Austin">Austin, TX</option>
            <option value="Denver">Denver, CO</option>
            <option value="Houston">Houston, TX</option>
            <option value="Phoenix">Phoenix, AZ</option>
            <option value="Seattle">Seattle, WA</option>
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
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="All">Type: All</option>
            <option value="Full-time Contract">Full-time Contract</option>
            <option value="On-site">On-site</option>
            <option value="Offshore">Offshore</option>
            <option value="Heavy Machinery">Heavy Machinery</option>
            <option value="Contractual">Contractual</option>
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
              <table>
                <thead>
                  <tr>
                    <th>Req ID</th>
                    <th>Vendor</th>
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
                        <td>{job.company}</td>
                        <td>
                          <strong 
                            style={{ cursor: 'pointer', color: '#007bff' }}
                            onClick={() => handleJobClick(job._id)}
                          >
                            {job.title}
                          </strong>
                          <div className="role-type">{job.type}</div>
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