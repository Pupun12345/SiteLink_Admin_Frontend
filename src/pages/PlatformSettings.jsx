import { Bell, Save } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import './PlatformSettings.css';

const pricingRows = [
  { tier: 'Basic', monthly: '$49/mo', annual: '$490/yr', status: 'Active' },
  { tier: 'Pro', monthly: '$99/mo', annual: '$990/yr', status: 'Active' },
  { tier: 'Enterprise', monthly: 'Custom', annual: 'Custom', status: 'Active' },
];

const workerRules = [
  { name: 'Mandatory ID Proof', enabled: true },
  { name: 'Criminal Background Check', enabled: false },
  { name: 'Medical Certificate', enabled: false },
];

const vendorRules = [
  { name: 'GST / Tax Verification', enabled: true },
  { name: 'Business License', enabled: true },
  { name: 'Public Liability Insurance', enabled: false },
];

export default function PlatformSettings() {
  return (
    <div className="dashboard-page platform-settings-page">
      <Sidebar />

      <main className="dashboard-content platform-settings-content">
        <header className="platform-header">
          <div>
            <h1>Platform Settings</h1>
            <p>Manage global system configurations and business rules.</p>
          </div>

          <div className="platform-header-actions">
            <button type="button" className="platform-icon-btn" aria-label="Notifications">
              <Bell size={16} />
            </button>
            <button type="button" className="platform-save-btn">
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </header>

        <div className="platform-grid">
          <section className="platform-card main-card">
            <h2>Subscription Pricing</h2>
            <p>Update monthly and annual pricing for vendor tiers.</p>

            <table className="pricing-table">
              <thead>
                <tr>
                  <th>Tier Name</th>
                  <th>Monthly Price</th>
                  <th>Annual Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.map((row) => (
                  <tr key={row.tier}>
                    <td>{row.tier}</td>
                    <td>{row.monthly}</td>
                    <td>{row.annual}</td>
                    <td>
                      <span className="status-pill">{row.status}</span>
                    </td>
                    <td>
                      <button type="button">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <aside className="platform-side-stack">
            <section className="platform-card">
              <h3>Language Settings</h3>
              <p>Set the default platform language.</p>
              <select defaultValue="English (United States)">
                <option>English (United States)</option>
                <option>English (United Kingdom)</option>
              </select>
            </section>

            <section className="platform-card">
              <h3>Notification Settings</h3>
              <p>Configure how admins receive updates.</p>
              <label>
                <input type="checkbox" defaultChecked />
                <span>System Alerts</span>
              </label>
              <label>
                <input type="checkbox" defaultChecked />
                <span>Email Notifications</span>
              </label>
              <label>
                <input type="checkbox" />
                <span>Push Notifications</span>
              </label>
            </section>
          </aside>

          <section className="platform-card main-card verification-card">
            <h2>Verification Rules</h2>
            <p>Control mandatory documentation for onboarding.</p>

            <div className="rule-columns">
              <div>
                <h4>Worker Requirements</h4>
                {workerRules.map((rule) => (
                  <div className="rule-row" key={rule.name}>
                    <span>{rule.name}</span>
                    <span className={`rule-toggle ${rule.enabled ? 'on' : ''}`} />
                  </div>
                ))}
              </div>

              <div>
                <h4>Vendor Requirements</h4>
                {vendorRules.map((rule) => (
                  <div className="rule-row" key={rule.name}>
                    <span>{rule.name}</span>
                    <span className={`rule-toggle ${rule.enabled ? 'on' : ''}`} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}