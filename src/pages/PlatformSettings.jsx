import { Bell, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import './PlatformSettings.css';
import { redirect, useNavigate } from 'react-router-dom';
import { hasPermission } from '../hooks/usePermissions';

export default function PlatformSettings() {
  const navigate = useNavigate();
  const [pricingRows, setPricingRows] = useState([
    { tier: 'Basic', monthly: '₹499', annual: '₹4900', status: 'Active' },
    { tier: 'Pro', monthly: '₹999', annual: '₹9900', status: 'Active' },
    { tier: 'Enterprise', monthly: 'Custom', annual: 'Custom', status: 'Active' },
  ]);

  const [workerRules, setWorkerRules] = useState([
    { name: 'Mandatory ID Proof', key: 'idProof', enabled: true },
    { name: 'Age Verification', key: 'age', enabled: false },
    { name: 'Medical Certificate', key: 'medicalCertificate', enabled: false },
  ]);

  const [vendorRules, setVendorRules] = useState([
    { name: 'GST / Tax Verification', key: 'gstNumber', enabled: true },
    { name: 'Business License', key: 'licenseNumber', enabled: true },
    { name: 'Company Owner Name', key: 'ownerName', enabled: false },
  ]);

  const [notifications, setNotifications] = useState({
    systemAlerts: true,
    subscriptionNotifications: true,
    userNotifications: false,
  });

  const [language, setLanguage] = useState('English (United States)');
  const [editingPlan, setEditingPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [permissions, setPermissions] = useState({
    canAccessPlatformSettings: true,
  });


  const adminUser = localStorage.getItem('adminUser');
  useEffect(() => {
    if (!adminUser) return;
    hasPermission('canAccessPlatformSettings').then(hasAccess => {
      if (!hasAccess) {
        showMessage('error', 'You do not have permission to access platform settings');
        setTimeout(() => redirect('/admin/dashboard'), 2000);
      } else {
        setPermissions(prev => ({
          ...prev,
          canAccessPlatformSettings: true
        }));
      }
    });
  }, [adminUser]);


  useEffect(() => {
    const savedWorkerRules = localStorage.getItem('workerRules');
    const savedVendorRules = localStorage.getItem('vendorRules');
    const savedNotifications = localStorage.getItem('notifications');
    const savedLanguage = localStorage.getItem('language');

    if (savedWorkerRules) setWorkerRules(JSON.parse(savedWorkerRules));
    if (savedVendorRules) setVendorRules(JSON.parse(savedVendorRules));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedLanguage) setLanguage(savedLanguage);

    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/platform-settings');
      if (response.data.success) {
        const settings = response.data.settings;

        if (!localStorage.getItem('notifications')) {
          const newNotifications = settings.notifications;
          setNotifications(newNotifications);
          localStorage.setItem('notifications', JSON.stringify(newNotifications));
        }

        if (!localStorage.getItem('workerRules')) {
          const newWorkerRules = workerRules.map(rule => ({
            ...rule,
            enabled: settings.verificationRules.worker[rule.key] ?? rule.enabled
          }));
          setWorkerRules(newWorkerRules);
          localStorage.setItem('workerRules', JSON.stringify(newWorkerRules));
        }

        if (!localStorage.getItem('vendorRules')) {
          const newVendorRules = vendorRules.map(rule => ({
            ...rule,
            enabled: settings.verificationRules.vendor[rule.key] ?? rule.enabled
          }));
          setVendorRules(newVendorRules);
          localStorage.setItem('vendorRules', JSON.stringify(newVendorRules));
        }

        if (!localStorage.getItem('language')) {
          setLanguage(settings.language);
          localStorage.setItem('language', settings.language);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handlePricingEdit = (tier) => {
    setEditingPlan(tier);
  };

  const handlePricingChange = (tier, field, value) => {
    setPricingRows(prev =>
      prev.map(row =>
        row.tier === tier ? { ...row, [field]: value } : row
      )
    );
  };

  const handleNotificationChange = (key) => {
    const newNotifications = {
      ...notifications,
      [key]: !notifications[key]
    };
    setNotifications(newNotifications);
    localStorage.setItem('notifications', JSON.stringify(newNotifications));
  };

  const handleWorkerRuleToggle = async (key) => {
    const newWorkerRules = workerRules.map(rule =>
      rule.key === key ? { ...rule, enabled: !rule.enabled } : rule
    );
    setWorkerRules(newWorkerRules);
    localStorage.setItem('workerRules', JSON.stringify(newWorkerRules));


    try {
      const workerRulesObj = {};
      newWorkerRules.forEach(rule => {
        workerRulesObj[rule.key] = rule.enabled;
      });

      await api.put('/platform-settings/verification-rules', {
        userProfile: 'worker',
        rules: workerRulesObj
      });
    } catch (error) {
      console.error('Error saving worker rules:', error);
      showMessage('error', 'Failed to save worker rules');
    }
  };

  const handleVendorRuleToggle = async (key) => {
    const newVendorRules = vendorRules.map(rule =>
      rule.key === key ? { ...rule, enabled: !rule.enabled } : rule
    );
    setVendorRules(newVendorRules);
    localStorage.setItem('vendorRules', JSON.stringify(newVendorRules));


    try {
      const vendorRulesObj = {};
      newVendorRules.forEach(rule => {
        vendorRulesObj[rule.key] = rule.enabled;
      });

      await api.put('/platform-settings/verification-rules', {
        userProfile: 'vendor',
        rules: vendorRulesObj
      });
    } catch (error) {
      console.error('Error saving vendor rules:', error);
      showMessage('error', 'Failed to save vendor rules');
    }
  };

  const handleSaveChanges = async () => {
    try {
      for (const row of pricingRows) {
        if (row.tier !== 'Enterprise') {
          const monthlyPrice = parseFloat(row.monthly.replace('$', '') || 0);
          const annualPrice = parseFloat(row.annual.replace('$', '') || 0);

          if (monthlyPrice > 0 || annualPrice > 0) {
            const planName = row.tier.toLowerCase();
            await api.put('/platform-settings/plans', {
              planName,
              amount: monthlyPrice
            });
          }
        }
      }

      await api.put('/platform-settings/notifications', notifications);

      // Save worker verification rules
      const workerRulesObj = {};
      workerRules.forEach(rule => {
        workerRulesObj[rule.key] = rule.enabled;
      });

      await api.put('/platform-settings/verification-rules', {
        userProfile: 'worker',
        rules: workerRulesObj
      });

      // Save vendor verification rules
      const vendorRulesObj = {};
      vendorRules.forEach(rule => {
        vendorRulesObj[rule.key] = rule.enabled;
      });
      await api.put('/platform-settings/verification-rules', {
        userProfile: 'vendor',
        rules: vendorRulesObj
      });

      // Save language
      await api.put('/platform-settings/language', { language });

      localStorage.setItem('workerRules', JSON.stringify(workerRules));
      localStorage.setItem('vendorRules', JSON.stringify(vendorRules));
      localStorage.setItem('notifications', JSON.stringify(notifications));
      localStorage.setItem('language', language);

      setEditingPlan(null);
      showMessage('success', 'All settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', error.response?.data?.message || 'Failed to save settings');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page platform-settings-page">
        <Sidebar />
        <main className="dashboard-content platform-settings-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading settings...</div>
        </main>
      </div>
    );
  }

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
            <button type="button" className="platform-icon-btn" aria-label="Notifications" onClick={() => navigate("/admin/notifications")}>
              <Bell size={16} />
            </button>
            <button
              type="button"
              className="platform-save-btn"
              onClick={handleSaveChanges}
            >
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
                    <td>
                      {editingPlan === row.tier && row.tier !== 'Enterprise' ? (
                        <input
                          type="text"
                          value={row.monthly}
                          onChange={(e) => handlePricingChange(row.tier, 'monthly', e.target.value)}
                          placeholder="₹0"
                        />
                      ) : (
                        `${row.monthly}`
                      )}
                    </td>
                    <td>
                      {editingPlan === row.tier && row.tier !== 'Enterprise' ? (
                        <input
                          type="text"
                          value={row.annual}
                          onChange={(e) => handlePricingChange(row.tier, 'annual', e.target.value)}
                          placeholder="₹0"
                        />
                      ) : (
                        `${row.annual}`
                      )}
                    </td>
                    <td>
                      <span className="status-pill">{row.status}</span>
                    </td>
                    <td>
                      {row.tier !== 'Enterprise' && (
                        <button
                          type="button"
                          onClick={() =>
                            handlePricingEdit(editingPlan === row.tier ? null : row.tier)
                          }
                        >
                          {editingPlan === row.tier ? 'Done' : 'Edit'}
                        </button>
                      )}
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
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option>English (United States)</option>
                <option>English (United Kingdom)</option>
                <option>Hindi</option>
                <option>Spanish</option>
              </select>
            </section>

            <section className="platform-card">
              <h3>Notification Settings</h3>
              <p>Configure how admins receive updates.</p>
              <label>
                <input
                  type="checkbox"
                  checked={notifications.systemAlerts}
                  onChange={() => handleNotificationChange('systemAlerts')}
                />
                <span>System Alerts</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={notifications.subscriptionNotifications}
                  onChange={() => handleNotificationChange('subscriptionNotifications')}
                />
                <span>Subscription Notifications</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={notifications.userNotifications}
                  onChange={() => handleNotificationChange('userNotifications')}
                />
                <span>User Notifications</span>
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
                  <div className="rule-row" key={rule.key}>
                    <span>{rule.name}</span>
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleWorkerRuleToggle(rule.key)}
                      className="rule-toggle-input"
                    />
                  </div>
                ))}
              </div>

              <div>
                <h4>Vendor Requirements</h4>
                {vendorRules.map((rule) => (
                  <div className="rule-row" key={rule.key}>
                    <span>{rule.name}</span>
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => handleVendorRuleToggle(rule.key)}
                      className="rule-toggle-input"
                    />
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