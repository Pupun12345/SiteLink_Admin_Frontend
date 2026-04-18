import { Bell, Lock, Save, User, AlertCircle, CheckCircle, Eye, EyeOff, Users, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import './AdminSettings.css';

export default function AdminSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    profileImage: '',
    role: 'Enterprise Admin',
    timezone: '(GMT-08:00) Pacific Time'
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const [adminUsers, setAdminUsers] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState({
    email: '',
    password: '',
    name: '',
    permissions: {
      canAccessPlatformSettings: false,
      canAccessRevenue: false,
      canVerifyUsers: true,
      canManageUsers: true,
    },
  });

  useEffect(() => {
    fetchProfile();
    fetchAdminUsers();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      if (response.data.user) {
        const user = response.data.user;
        setProfile(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          profileImage: user.profileImage || ''
        }));
        const imageUrl = user.profileImage 
          ? `http://localhost:5000/${user.profileImage.replace(/\\/g, '/')}` 
          : `https://ui-avatars.com/api/?name=${user.name || 'Admin'}&background=2b3f57&color=fff`;
        setProfileImagePreview(imageUrl);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      showMessage('error', 'Failed to load profile');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAdminUsers();
  },[]);

  const fetchAdminUsers = async () => {
    try {
      const response = await api.get('/admin-users');
      if (response.data.success) {
        setAdminUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      if (!newAdminForm.email || !newAdminForm.password || !newAdminForm.name) {
        showMessage('error', 'All fields are required');
        return;
      }

      const response = await api.post('/admin-users', newAdminForm);
      if (response.data.success) {
        showMessage('success', 'Admin user created successfully');
        setNewAdminForm({
          email: '',
          password: '',
          name: '',
          permissions: {
            canAccessPlatformSettings: false,
            canAccessRevenue: false,
            canVerifyUsers: true,
            canManageUsers: true,
          },
        });
        fetchAdminUsers();
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      showMessage('error', error.response?.data?.message || 'Failed to create admin user');
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this admin user?')) return;
    
    try {
      const response = await api.delete(`/admin-users/${id}`);
      if (response.data.success) {
        showMessage('success', 'Admin user deleted successfully');
        fetchAdminUsers();
      }
    } catch (error) {
      console.error('Error deleting admin:', error);
      showMessage('error', 'Failed to delete admin user');
    }
  };

  const handleTogglePermission = async (userId, permission) => {
    try {
      const user = adminUsers.find(u => u._id === userId);
      const updatedPermissions = {
        ...user.permissions,
        [permission]: !user.permissions[permission],
      };

      const response = await api.put(`/admin-users/${userId}`, {
        permissions: updatedPermissions,
      });

      if (response.data.success) {
        showMessage('success', 'Permissions updated');
        fetchAdminUsers();
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      showMessage('error', 'Failed to update permissions');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showMessage('error', 'Image size must be less than 2MB');
        return;
      }
      
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        showMessage('error', 'Only JPG and PNG formats are allowed');
        return;
      }

      setProfileImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSaveProfile = async () => {
    try {
      if (!profile.name || !profile.email) {
        showMessage('error', 'Name and email are required');
        return;
      }

      const formData = new FormData();
      formData.append('name', profile.name);
      formData.append('email', profile.email);
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }

      const response = await api.put('/profile/admin/edit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.message) {
        showMessage('success', 'Profile updated successfully!');
        setProfileImageFile(null);
        fetchProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        showMessage('error', 'All password fields are required');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        showMessage('error', 'New passwords do not match');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        showMessage('error', 'Password must be at least 6 characters long');
        return;
      }

      const response = await api.put('/profile/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      if (response.data.message) {
        showMessage('success', 'Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswords({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('error', error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    
    navigate('/admin/login');
  };

  if (loading) {
    return (
      <div className="dashboard-page admin-settings-page">
        <Sidebar onLogout={handleLogout} />
        <main className="dashboard-content admin-settings-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading settings...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page admin-settings-page">
      <Sidebar onLogout={handleLogout} />

      <main className="dashboard-content admin-settings-content">
        <header className="admin-settings-header">
          <div>
            <h1>Admin Settings</h1>
            <p>Manage your account preferences and security protocols.</p>
          </div>

          <div className="admin-settings-header-actions">
            <button type="button" className="mini-icon-btn" aria-label="Notifications" onClick={()=>navigate("/admin/notifications")}> 
              <Bell size={16} />
            </button>
            <button type="button" className="save-btn" onClick={handleSaveProfile}>
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </header>

        {message.text && (
          <div className={`message-banner ${message.type}`}>
            {message.type === 'success' ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <section className="settings-panel">
          <h2>
            <User size={16} />
            Admin Profile
          </h2>

          <div className="profile-grid">
            <div className="profile-avatar-area">
              <img src={profileImagePreview} alt="Profile" />
              <label className="image-upload-label">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                <span className="upload-text">Change Photo</span>
              </label>
              <p>Allowed formats: JPG, PNG. Max size 2MB.</p>
            </div>

            <div className="profile-form-grid">
              <label>
                <span>Full Name</span>
                <input 
                  type="text"
                  name="name"
                  value={profile.name}
                  onChange={handleProfileChange}
                />
              </label>
              <label>
                <span>Email Address</span>
                <input 
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                />
              </label>
              <label>
                <span>Role</span>
                <select 
                  name="role"
                  value={profile.role}
                  onChange={handleProfileChange}
                >
                  <option>Enterprise Admin</option>
                  <option>Operations Admin</option>
                </select>
              </label>
              <label>
                <span>Timezone</span>
                <select 
                  name="timezone"
                  value={profile.timezone}
                  onChange={handleProfileChange}
                >
                  <option>(GMT-08:00) Pacific Time</option>
                  <option>(GMT+00:00) UTC</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <section className="settings-panel">
          <h2>
            <Lock size={16} />
            Change Password
          </h2>

          <div className="password-form-grid">
            <label>
              <span>Current Password</span>
              <div className="password-input-wrapper">
                <input 
                  type={showPasswords.currentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your current password"
                />
                <button
                  type="button"
                  className="password-visibility-btn"
                  onClick={() => togglePasswordVisibility('currentPassword')}
                >
                  {showPasswords.currentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label>
              <span>New Password</span>
              <div className="password-input-wrapper">
                <input 
                  type={showPasswords.newPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="password-visibility-btn"
                  onClick={() => togglePasswordVisibility('newPassword')}
                >
                  {showPasswords.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            <label>
              <span>Confirm New Password</span>
              <div className="password-input-wrapper">
                <input 
                  type={showPasswords.confirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="password-visibility-btn"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                >
                  {showPasswords.confirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          <p className="security-hint">
            Password must be at least 12 characters long and include uppercase, numbers, and special
            characters.
          </p>

          <button 
            type="button"
            className="save-btn"
            onClick={handleChangePassword}
          >
            <Save size={14} />
            Update Password
          </button>
        </section>

        <section className="settings-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>
              <Users size={16} />
              Admin Users Management
            </h2>
            <button type="button" className="save-btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={14} />
              Create Admin User
            </button>
          </div>

          <div className="admin-users-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Platform Settings</th>
                  <th>Revenue Access</th>
                  <th>Verify Users</th>
                  <th>Manage Users</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={user.permissions.canAccessPlatformSettings}
                          onChange={() => handleTogglePermission(user._id, 'canAccessPlatformSettings')}
                        />
                        <span className="slider" />
                      </label>
                    </td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={user.permissions.canAccessRevenue}
                          onChange={() => handleTogglePermission(user._id, 'canAccessRevenue')}
                        />
                        <span className="slider" />
                      </label>
                    </td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={user.permissions.canVerifyUsers}
                          onChange={() => handleTogglePermission(user._id, 'canVerifyUsers')}
                        />
                        <span className="slider" />
                      </label>
                    </td>
                    <td>
                      <label className="switch">
                        <input
                          type="checkbox"
                          checked={user.permissions.canManageUsers}
                          onChange={() => handleTogglePermission(user._id, 'canManageUsers')}
                        />
                        <span className="slider" />
                      </label>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => handleDeleteAdmin(user._id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {showCreateModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowCreateModal(false)}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ margin: '0 0 20px', color: '#1b2944', fontSize: '24px' }}>Create Admin User</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#5f718f', fontWeight: '700' }}>Name</span>
                  <input type="text" value={newAdminForm.name} onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })} placeholder="Enter admin name" style={{ border: '1px solid #d9e2f0', background: '#fdfefe', color: '#2a3a57', borderRadius: '8px', height: '38px', padding: '0 10px', fontSize: '14px' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#5f718f', fontWeight: '700' }}>Email</span>
                  <input type="email" value={newAdminForm.email} onChange={(e) => setNewAdminForm({ ...newAdminForm, email: e.target.value })} placeholder="Enter admin email" style={{ border: '1px solid #d9e2f0', background: '#fdfefe', color: '#2a3a57', borderRadius: '8px', height: '38px', padding: '0 10px', fontSize: '14px' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#5f718f', fontWeight: '700' }}>Password</span>
                  <input type="password" value={newAdminForm.password} onChange={(e) => setNewAdminForm({ ...newAdminForm, password: e.target.value })} placeholder="Enter password" style={{ border: '1px solid #d9e2f0', background: '#fdfefe', color: '#2a3a57', borderRadius: '8px', height: '38px', padding: '0 10px', fontSize: '14px' }} />
                </label>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#f8fafc' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '14px', color: '#1b2944' }}>Permissions</h3>
                  <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" checked={newAdminForm.permissions.canAccessPlatformSettings} onChange={(e) => setNewAdminForm({ ...newAdminForm, permissions: { ...newAdminForm.permissions, canAccessPlatformSettings: e.target.checked } })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontWeight: '400', color: '#2a3a57' }}>Access Platform Settings</span>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" checked={newAdminForm.permissions.canAccessRevenue} onChange={(e) => setNewAdminForm({ ...newAdminForm, permissions: { ...newAdminForm.permissions, canAccessRevenue: e.target.checked } })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontWeight: '400', color: '#2a3a57' }}>Access Revenue Page</span>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" checked={newAdminForm.permissions.canVerifyUsers} onChange={(e) => setNewAdminForm({ ...newAdminForm, permissions: { ...newAdminForm.permissions, canVerifyUsers: e.target.checked } })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontWeight: '400', color: '#2a3a57' }}>Verify Workers/Vendors</span>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={newAdminForm.permissions.canManageUsers} onChange={(e) => setNewAdminForm({ ...newAdminForm, permissions: { ...newAdminForm.permissions, canManageUsers: e.target.checked } })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                    <span style={{ fontWeight: '400', color: '#2a3a57' }}>Manage Users</span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: '#fff', border: '1px solid #d4ddeb', color: '#5e7292', padding: '0 16px', height: '36px', borderRadius: '9px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                  <button type="button" onClick={handleCreateAdmin} style={{ background: '#2f63db', border: '1px solid #2f63db', color: '#fff', padding: '0 16px', height: '36px', borderRadius: '9px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Save size={14} />Create Admin</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
