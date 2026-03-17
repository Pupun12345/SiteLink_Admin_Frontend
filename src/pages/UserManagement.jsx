import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./UserManagement.css";
import api from "../api/axios";

const statusColors = {
  Active: "active",
  Pending: "pending",
  Suspended: "suspended",
  Banned: "banned",
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
  const [actionLoading, setActionLoading] = useState(null);

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

  const handleUserClick = (userId) => {
    navigate(`/admin/user-profile/${userId}`);
  };

  const handleApprove = async (userId) => {
    const user = users.find(u => u._id === userId);
    if (!user) return;

    setActionLoading(userId);
    try {
      const endpoint = user.type === 'Worker' 
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
      const endpoint = user.type === 'Worker' 
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

  return (
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
            <button className="export-btn">Export</button>
            <button className="invite-btn">+ Invite User</button>
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
            <div className="stat-value">{users.filter(u => u.status === "Active").length} <span className="stat-trend up">~5%</span></div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Pending Invites</div>
            <div className="stat-value">{users.filter(u => u.status === "Pending").length} <span className="stat-trend stable">Stable</span></div>
          </div>
          <div className="stat-box">
            <div className="stat-label">Suspended</div>
            <div className="stat-value">{users.filter(u => u.status === "Suspended").length} <span className="stat-trend down">~2%</span></div>
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
              <option>Active</option>
              <option>Pending</option>
              <option>Suspended</option>
              <option>Banned</option>
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
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-cell">
                          <img 
                            src={u.avatar || "https://randomuser.me/api/portraits/lego/1.jpg"} 
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
                        <span className={`user-type-badge ${typeColors[u.type] || 'worker-badge'}`}>
                          {u.type}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${statusColors[u.status] || 'pending'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td>{u.join}</td>
                      <td>{u.plan}</td>
                      <td>{u.lastActive}</td>
                      <td>
                        <span 
                          className="action-icon" 
                          title="View Profile"
                          onClick={() => handleUserClick(u._id)}
                          style={{ cursor: 'pointer' }}
                        >
                          ✏️
                        </span>
                        {u.status === 'Pending' && (
                          <span 
                            className="action-icon" 
                            title="Approve"
                            onClick={() => handleApprove(u._id)}
                            style={{ cursor: 'pointer', opacity: actionLoading === u._id ? 0.5 : 1 }}
                          >
                            ✔️
                          </span>
                        )}
                        {u.status === 'Pending' && (
                          <span 
                            className="action-icon" 
                            title="Reject"
                            onClick={() => handleRejectClick(u._id)}
                            style={{ cursor: 'pointer', opacity: actionLoading === u._id ? 0.5 : 1 }}
                          >
                            ❌
                          </span>
                        )}
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
      </div>
    </div>
  );
}
