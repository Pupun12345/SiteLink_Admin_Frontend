import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./UserManagement.css";
import api from "../api/axios";
import { hasPermission, usePermissions } from "../hooks/usePermissions";

const statusColors = {
  Active: "active",
  Verified: "active",
  Pending: "pending",
  Rejected: "rejected",
};

const typeColors = {
  Worker: "worker-badge",
  Vendor: "vendor-badge",
};

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [rejectModal, setRejectModal] = useState({ show: false, userId: null, reason: "" });
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null });
  const [actionLoading, setActionLoading] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleDeleteClick = (e, userId) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({ show: true, userId });
  };

  const handleDeleteCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteModal({ show: false, userId: null });
  };

  useEffect(() => {
    fetchUsers();
  }, [userTypeFilter, statusFilter, currentPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (userTypeFilter !== "All") {
        params.append("userType", userTypeFilter.toLowerCase());
      }

      if (statusFilter !== "All") {
        params.append("status", statusFilter.toLowerCase());
      }

      params.append("page", currentPage);
      params.append("limit", 10);

      const response = await api.get(`/admin/users?${params.toString()}`);
      setUsers(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchTerm ||
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getUserType = (user) => {
    return user.userType === 'worker' ? 'Worker' : user.userType === 'vendor' ? 'Vendor' : user.userType;
  };

  const getStatusDisplay = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleUserClick = (userId) => {
    navigate(`/admin/user-profile/${userId}`);
  };

  const handleApprove = async (userId) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    setActionLoading(userId);
    try {
      const endpoint = user.userType === 'worker'
        ? `/admin/workers/${userId}/verify`
        : `/admin/vendors/${userId}/verify`;

      await api.put(endpoint);

      fetchUsers();
    } catch (err) {
      console.error("Failed to approve user:", err);
      alert("Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectClick = (userId) => {
    setRejectModal({ show: true, userId, reason: "" });
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.reason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    const user = users.find(u => u._id === rejectModal.userId);
    if (!user) return;

    setActionLoading(rejectModal.userId);
    try {
      const endpoint = user.userType === 'worker'
        ? `/admin/workers/${rejectModal.userId}/reject`
        : `/admin/vendors/${rejectModal.userId}/reject`;

      await api.put(endpoint, { reason: rejectModal.reason });

      setRejectModal({ show: false, userId: null, reason: "" });
      fetchUsers();
    } catch (err) {
      console.error("Failed to reject user:", err);
      alert("Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (userId) => {
    setDeleteModal({ show: true, userId });
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setActionLoading(deleteModal.userId);
    try {
      await api.delete(`/admin/users/${deleteModal.userId}`);
      setDeleteModal({ show: false, userId: null });
      fetchUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      alert("Failed to delete user");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = () => {
    setExporting(true);
    try {
      // Prepare data for export
      const exportData = filteredUsers.map(user => ({
        'User Name': user.name || 'N/A',
        'Email': user.email || 'N/A',
        'Phone': user.phone || 'N/A',
        'User Type': getUserType(user),
        'Status': getStatusDisplay(user.verificationStatus),
        'Join Date': user.join || 'N/A',
        'City': user.city || 'N/A',
        'Work State': user.workState || 'N/A',
        ...(user.userType === 'worker' ? {
          'Role': user.role || 'N/A',
          'Primary Skill': user.primarySkill || 'N/A',
          'Experience': user.experience || 'N/A',
          'Salary': user.salary || 'N/A',
          'Salary Type': user.salaryType || 'N/A',
        } : {}),
        ...(user.userType === 'vendor' ? {
          'Company Name': user.companyName || 'N/A',
          'Designation': user.designation || 'N/A',
          'GST Number': user.gstNumber || 'N/A',
          'Work Area': user.workArea || 'N/A',
          'Website': user.website || 'N/A',
        } : {}),
      }));

      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            // Escape commas and quotes in CSV
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  //Permissions access
  let canAccess = true;
  const adminUser = localStorage.getItem("adminUser")

  if (adminUser) {
    const permissions = usePermissions();
    canAccess = hasPermission(permissions, 'canVerifyUsers');
  }

  return (
    !canAccess ? (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: '#f5f7fa',
        }}
      >
        <Sidebar />

        <main
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: "180px"
          }}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '40px 50px',
              borderRadius: '12px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
              textAlign: 'center',
              maxWidth: '500px',
              width: '100%',
            }}
          >
            <div
              style={{
                fontSize: '40px',
                marginBottom: '15px',
              }}
            >
              🚫
            </div>

            <h2
              style={{
                color: '#ff4d4f',
                marginBottom: '10px',
                fontWeight: '600',
              }}
            >
              Access Denied
            </h2>

            <p
              style={{
                color: '#555',
                fontSize: '16px',
                lineHeight: '1.6',
              }}
            >
              You do not have permission to access the User Management Page.
            </p>
          </div>
        </main>
      </div>
    ) : (
      <div className="user-mgmt-page">
        <Sidebar />
        <div className="user-mgmt-main">
          {/* Header */}
          <div className="user-mgmt-header">
            <div>
              <h1>User Management</h1>
              <p>Efficiently manage system access, roles, and user compliance across the organization.</p>
            </div>
            <div className="user-mgmt-header-actions">
              <button className="export-btn" onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="user-mgmt-stats">
            <div className="stat-box">
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{users.length} <span className="stat-trend up">~12%</span></div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Active Now</div>
              <div className="stat-value">{users.filter(u => u.verificationStatus?.toLowerCase() === "verified").length} <span className="stat-trend up">~5%</span></div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Pending Approval</div>
              <div className="stat-value">{users.filter(u => u.verificationStatus?.toLowerCase() === "pending").length} <span className="stat-trend stable">Stable</span></div>
            </div>
          </div>

          {/* Filters */}
          <div className="user-mgmt-table-controls">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search by name, email or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="table-filters">
              <select value={userTypeFilter} onChange={(e) => {
                setUserTypeFilter(e.target.value);
                setCurrentPage(1);
              }}>
                <option>User Type: All</option>
                <option>Worker</option>
                <option>Vendor</option>
              </select>
              <select value={statusFilter} onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}>
                <option>Status: All</option>
                <option>Verified</option>
                <option>Pending</option>
                <option>Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="user-mgmt-table-card">
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
                Loading users...
              </div>
            ) : error ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#d32f2f" }}>
                {error}
              </div>
            ) : (
              <>
                <table className="user-mgmt-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>User Type</th>
                      <th>Status</th>
                      <th>Join Date</th>
                      <th>Subscription</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className="user-cell">
                            <img
                              src={u.profileImage ? `http://localhost:5000/${u.profileImage}` : "https://randomuser.me/api/portraits/lego/1.jpg"}
                              alt={u.name}
                              className="user-avatar"
                              onError={(e) => e.target.src = "https://randomuser.me/api/portraits/lego/1.jpg"}
                            />
                            <div>
                              <div
                                className="user-name"
                                style={{ cursor: 'pointer', color: '#2463eb' }}
                                onClick={() => handleUserClick(u._id)}
                              >
                                {u.name}
                              </div>
                              <div className="user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`user-type-badge ${typeColors[getUserType(u)] || 'worker-badge'}`}>
                            {getUserType(u)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${statusColors[getStatusDisplay(u.verificationStatus)] || 'pending'}`}>
                            {getStatusDisplay(u.verificationStatus)}
                          </span>
                        </td>
                        <td>{u.join}</td>
                        <td>-</td>
                        <td>
                          <span
                            className="action-icon"
                            title="Edit Profile"
                            onClick={() => handleUserClick(u._id)}
                            style={{ cursor: 'pointer' }}
                          >
                            ✏️
                          </span>
                          {u.verificationStatus?.toLowerCase() === 'pending' && (
                            <>
                              <span
                                className="action-icon"
                                title="Approve"
                                onClick={() => handleApprove(u._id)}
                                style={{ cursor: 'pointer', opacity: actionLoading === u._id ? 0.5 : 1 }}
                              >
                                ✔️
                              </span>
                              <span
                                className="action-icon"
                                title="Reject"
                                onClick={() => handleRejectClick(u._id)}
                                style={{ cursor: 'pointer', opacity: actionLoading === u._id ? 0.5 : 1 }}
                              >
                                ❌
                              </span>
                            </>
                          )}
                          <span
                            className="action-icon"
                            title="Delete"
                            onClick={(e) => handleDeleteClick(e, u._id)}
                            style={{ cursor: 'pointer', opacity: actionLoading === u._id ? 0.5 : 1, color: '#dc2626' }}
                          >
                            🗑️
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="user-mgmt-table-footer">
                  <span>Showing {filteredUsers.length} users</span>
                  <div className="pagination">
                    <button
                      className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      &lt;
                    </button>
                    <button className="page-btn active">{currentPage}</button>
                    <button
                      className="page-btn"
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {rejectModal.show && (
            <div className="modal-overlay" onClick={() => setRejectModal({ show: false, userId: null, reason: "" })}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Reject User</h2>
                <p>Please provide a reason for rejection:</p>
                <textarea
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="Enter rejection reason..."
                  rows="4"
                />
                <div className="modal-actions">
                  <button
                    className="modal-btn cancel-btn"
                    onClick={() => setRejectModal({ show: false, userId: null, reason: "" })}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-btn reject-btn"
                    onClick={handleRejectSubmit}
                    disabled={actionLoading === rejectModal.userId}
                  >
                    {actionLoading === rejectModal.userId ? 'Rejecting...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {deleteModal.show && (
            <div 
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999
              }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  handleDeleteCancel(e);
                }
              }}
            >
              <div 
                style={{
                  backgroundColor: 'white',
                  padding: '30px',
                  borderRadius: '12px',
                  maxWidth: '450px',
                  width: '90%',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  position: 'relative',
                  zIndex: 100000
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{ marginBottom: '15px', color: '#dc2626', fontSize: '22px', fontWeight: '600' }}>Delete User</h2>
                <p style={{ marginBottom: '25px', color: '#555', fontSize: '15px', lineHeight: '1.6' }}>
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
                <div 
                  style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'flex-end'
                  }}
                >
                  <button
                    style={{
                      padding: '10px 20px',
                      border: '1px solid #d1d5db',
                      backgroundColor: 'white',
                      color: '#374151',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={handleDeleteCancel}
                  >
                    Cancel
                  </button>
                  <button
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      borderRadius: '6px',
                      cursor: actionLoading === deleteModal.userId ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: actionLoading === deleteModal.userId ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={handleDeleteSubmit}
                    disabled={actionLoading === deleteModal.userId}
                  >
                    {actionLoading === deleteModal.userId ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
}
