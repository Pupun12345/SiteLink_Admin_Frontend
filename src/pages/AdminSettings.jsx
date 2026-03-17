import { Bell, Lock, Save, ShieldCheck, User } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import './AdminSettings.css';

export default function AdminSettings() {
  return (
    <div className="dashboard-page admin-settings-page">
      <Sidebar />

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
            <button type="button" className="save-btn">
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </header>

        <section className="settings-panel">
          <h2>
            <User size={16} />
            Admin Profile
          </h2>

          <div className="profile-grid">
            <div className="profile-avatar-area">
              <img src="https://ui-avatars.com/api/?name=Alex+Rivera&background=2b3f57&color=fff" alt="Profile" />
              <p>Allowed formats: JPG, PNG. Max size 2MB.</p>
            </div>

            <div className="profile-form-grid">
              <label>
                <span>Full Name</span>
                <input defaultValue="Alex Rivera" />
              </label>
              <label>
                <span>Email Address</span>
                <input defaultValue="alex.rivera@sitelink.io" />
              </label>
              <label>
                <span>Role</span>
                <select defaultValue="Enterprise Admin">
                  <option>Enterprise Admin</option>
                  <option>Operations Admin</option>
                </select>
              </label>
              <label>
                <span>Timezone</span>
                <select defaultValue="(GMT-08:00) Pacific Time">
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
              <input type="password" defaultValue="password" />
            </label>
            <label>
              <span>New Password</span>
              <input type="password" defaultValue="newpassword" />
            </label>
            <label>
              <span>Confirm New Password</span>
              <input type="password" defaultValue="newpassword" />
            </label>
          </div>

          <p className="security-hint">
            Password must be at least 12 characters long and include uppercase, numbers, and special
            characters.
          </p>
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
              <input type="checkbox" defaultChecked />
              <span />
            </label>
          </div>

          <div className="twofa-methods">
            <article className="method-card enabled">
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