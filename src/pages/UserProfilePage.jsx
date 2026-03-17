import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./UserProfilePage.css";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

const activityLog = [
  {
    id: 1,
    color: "primary",
    title: "Profile Updated",
    desc: "Changed profile picture and bio",
    time: "2 hours ago",
  },
  {
    id: 2,
    color: "neutral",
    title: "Successful Login",
    desc: "Session started from Chrome/Windows",
    time: "Yesterday at 9:42 AM",
  },
  {
    id: 3,
    color: "neutral",
    title: "Security Alert",
    desc: "Password change requested",
    time: "Oct 14, 2023",
  },
  {
    id: 4,
    color: "green",
    title: "Identity Verified",
    desc: "ID documents successfully reviewed",
    time: "Oct 12, 2023",
  },
];

const applications = [
  {
    id: "VP-92384",
    type: "Vendor Registration",
    status: "approved",
    date: "Oct 20, 2023",
  },
  {
    id: "JOB-1029",
    type: "Contractor Posting",
    status: "pending",
    date: "Oct 24, 2023",
  },
  {
    id: "VP-91002",
    type: "Internal Audit Profile",
    status: "archived",
    date: "Sep 15, 2023",
  },
];

const statusMap = {
  approved: { cls: "status-approved", label: "Approved" },
  pending: { cls: "status-pending", label: "Pending Review" },
  archived: { cls: "status-archived", label: "Archived" },
};

export default function UserProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await api.get(`/admin/users/${id}`);
        setUser(res.data.data);
        setError(null);
      } catch (err) {
        setError("Failed to load user profile");
        console.error("Error fetching user:", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchUser();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="app-root">
        <Sidebar />
        <main className="main-content">
          <div className="page-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <div>Loading user profile...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="app-root">
        <Sidebar />
        <main className="main-content">
          <div className="page-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
            <div>{error || "User not found"}</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <main className="main-content">
        {/* Header */}
        <header className="top-header">
          <div className="breadcrumb">
            <span onClick={() => navigate('/admin/dashboard')} style={{ cursor: 'pointer' }}>Admin</span>
            <span className="material-symbols-outlined bc-arrow">chevron_right</span>
            <span onClick={() => navigate('/admin/user-management')} style={{ cursor: 'pointer' }}>Users</span>
            <span className="material-symbols-outlined bc-arrow">chevron_right</span>
            <span className="bc-current">User Profile</span>
          </div>
          <div className="header-right">
            <div className="search-wrap">
              <span className="material-symbols-outlined search-icon">search</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search profiles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="icon-btn">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* Page Body */}
        <div className="page-body">
          {/* Profile Hero */}
          <div className="profile-hero">
            <div className="avatar-wrap">
              <img
                className="avatar-img"
                src={user.avatar || "https://randomuser.me/api/portraits/lego/1.jpg"}
                alt={user.name}
                onError={(e) => e.target.src = "https://randomuser.me/api/portraits/lego/1.jpg"}
              />
              <span className="online-dot" />
            </div>

            <div className="profile-info">
              <div className="profile-name-row">
                <h2 className="profile-name">{user.name}</h2>
                <span className="role-badge">{user.role}</span>
              </div>
              <p className="profile-email">{user.email}</p>
              <div className="profile-meta">
                <div className="meta-item">
                  <span className="material-symbols-outlined meta-icon">calendar_today</span>
                  <span>Joined {user.join}</span>
                </div>
                <div className="meta-item">
                  <span className="material-symbols-outlined meta-icon">verified</span>
                  <div>
                    <span className="verified-text">{user.verified ? 'Verified Identity' : 'Unverified Identity'}</span>
                    <span className="verified-sub">Updated 2 days ago</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn btn--neutral">Reset Password</button>
              <button className="btn btn--danger">Suspend User</button>
            </div>
          </div>

          {/* Grid */}
          <div className="content-grid">
            {/* Activity Log */}
            <div className="col-narrow">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Recent Activity</h3>
                  <button className="link-btn">View All</button>
                </div>
                <div className="card-body">
                  <ul className="activity-list">
                    {activityLog.map((item) => (
                      <li key={item.id} className="activity-item">
                        <div className={`activity-dot dot--${item.color}`}>
                          <div className="dot-inner" />
                        </div>
                        <div className="activity-content">
                          <p className="activity-title">{item.title}</p>
                          <p className="activity-desc">{item.desc}</p>
                          <p className="activity-time">{item.time}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="col-wide">
              {/* Application History */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Application History</h3>
                  <div className="card-header-actions">
                    <button className="btn btn--outline-sm">Filter</button>
                    <button className="btn btn--primary-sm">Export PDF</button>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Reference / Type</th>
                        <th>Status</th>
                        <th>Submission Date</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <tr key={app.id} className="table-row">
                          <td>
                            <span className="app-ref">{app.id}</span>
                            <span className="app-type">{app.type}</span>
                          </td>
                          <td>
                            <span className={`status-badge ${statusMap[app.status].cls}`}>
                              {statusMap[app.status].label}
                            </span>
                          </td>
                          <td className="app-date">{app.date}</td>
                          <td className="text-right">
                            <button className="icon-btn-table">
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom 2-col cards */}
              <div className="two-col-grid">
                {/* Security */}
                <div className="card card--padded">
                  <h4 className="section-label">Security Overview</h4>
                  <div className="info-list">
                    <div className="info-row">
                      <span className="info-key">Two-factor Authentication</span>
                      <span className={`info-val ${user.twoFactor ? 'info-val--green' : 'info-val--red'}`}>
                        {user.twoFactor ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="info-key">Last Password Change</span>
                      <span className="info-val">{user.lastPasswordChange}</span>
                    </div>
                    <div className="info-row info-row--last">
                      <span className="info-key">Account Status</span>
                      <span className={`info-val ${user.accountStatus === 'ACTIVE' ? 'info-val--green' : 'info-val--orange'}`}>
                        {user.accountStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div className="card card--padded">
                  <h4 className="section-label">Account Metadata</h4>
                  <div className="info-list">
                    <div className="info-row">
                      <span className="info-key">Department</span>
                      <span className="info-val">{user.department}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-key">Office Location</span>
                      <span className="info-val">{user.location}</span>
                    </div>
                    <div className="info-row info-row--last">
                      <span className="info-key">Employee ID</span>
                      <span className="info-val">{user.employeeId}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
