import { Bell, Lock, Save, ShieldCheck, User, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
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


  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);


  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  useEffect(() => {
    fetchProfile();
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
        setProfileImagePreview(user.profileImage || `https://ui-avatars.com/api/?name=${user.name || 'Admin'}&background=2b3f57&color=fff`);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      showMessage('error', 'Failed to load profile');
      setLoading(false);
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
      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        showMessage('error', 'Image size must be less than 2MB');
        return;
      }
      
      // Validate file type
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

      const response = await api.put('/settings/change-password', {
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
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('error', error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
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
            <button type="button" className="mini-icon-btn" aria-label="Notifications">
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

        <section className="settings-panel twofa-panel">
          <h2>
            <ShieldCheck size={16} />
            Two-Factor Authentication
          </h2>

          <div className="twofa-head-row">
            <div>
              <strong>Secure your account with 2FA</strong>
              <p>
                Two-factor authentication adds an extra layer of security to your account at login.
              </p>
            </div>

            <label className="switch">
              <input 
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              />
              <span />
            </label>
          </div>

          <div className="twofa-methods">
            <article className={`method-card ${twoFactorEnabled ? 'enabled' : ''}`}>
              <h3>Authenticator App</h3>
              <p>Google Authenticator or Authy</p>
            </article>
            <article className="method-card">
              <h3>SMS Authentication</h3>
              <p>Verification via phone number</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}