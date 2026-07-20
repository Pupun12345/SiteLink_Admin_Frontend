import { Bell, Save, AlertCircle, CheckCircle, FileText, Plus, Trash2, X, Edit2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import './PlatformSettings.css';
import { useNavigate } from 'react-router-dom';
import { hasPermission, usePermissions } from '../hooks/usePermissions';

const POLICY_TYPES = ['PRIVACY_POLICY', 'TERMS_AND_CONDITIONS', 'HELP_AND_SUPPORT'];
const POLICY_LABELS = {
  PRIVACY_POLICY: 'Privacy Policy',
  TERMS_AND_CONDITIONS: 'Terms & Conditions',
  HELP_AND_SUPPORT: 'Help & Support',
};

export default function PlatformSettings() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [plansError, setPlansError] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanData, setEditingPlanData] = useState(null);
  const [planForm, setPlanForm] = useState({ planName: 'basic', userType: 'worker', planType: 'basic', frequency: 'monthly', amount: '', features: [''], maxWorkers: '' });
  const [planSaving, setPlanSaving] = useState(false);

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
  const [supportContact, setSupportContact] = useState({
    phone: '', whatsapp: '', email: '', hoursWeekday: '', hoursSunday: '', emergencyNote: '', avgResponseTime: '',
  });
  const [supportContactSaving, setSupportContactSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [legalPolicies, setLegalPolicies] = useState({
    PRIVACY_POLICY: {
      allVersions: [],
      form: { title: '', content: '', summary: '', changelog: '', effectiveDate: '', version: '' },
      publishing: false,
    },
    TERMS_AND_CONDITIONS: {
      allVersions: [],
      form: { title: '', content: '', summary: '', changelog: '', effectiveDate: '', version: '' },
      publishing: false,
    },
    HELP_AND_SUPPORT: {
      allVersions: [],
      form: { title: '', content: '', summary: '', changelog: '', effectiveDate: '', version: '' },
      publishing: false,
    },
  });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  async function fetchPlans() {
    try {
      const res = await api.get('/platform-settings/plans');
      if (res.data.success) {
        setPlans(res.data.data);
        setPlansError('');
      }
      console.log(res)
    } catch (e) {
      console.error('Failed to fetch plans:', e);
      setPlansError(e.response?.data?.message || 'Failed to load plans. Please try again.');
    }
  }

  async function fetchSettings() {
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
        if (settings.skills) setSkills(settings.skills);
        if (settings.supportContact) setSupportContact(prev => ({ ...prev, ...settings.supportContact }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }

  const updateSupportContactField = (field, value) => {
    setSupportContact(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSupportContact = async () => {
    setSupportContactSaving(true);
    try {
      const response = await api.put('/platform-settings/support-contact', supportContact);
      if (response.data.success) {
        showMessage('success', 'Support contact updated successfully.');
        setSupportContact(prev => ({ ...prev, ...response.data.supportContact }));
      }
    } catch (error) {
      console.error('Error saving support contact:', error);
      showMessage('error', error.response?.data?.message || 'Failed to update support contact');
    } finally {
      setSupportContactSaving(false);
    }
  };

  async function fetchLegalPolicies() {
    try {
      const res = await api.get('/legal/policies');
      const all = res.data.data || [];
      const nextState = {};
      for (const policyType of POLICY_TYPES) {
        const versions = all.filter(p => p.policyType === policyType).sort((a, b) => b.version - a.version);
        nextState[policyType] = {
          allVersions: versions,
          form: { title: '', content: '', summary: '', changelog: '', effectiveDate: '', version: '' },
          publishing: false,
        };
      }
      setLegalPolicies(nextState);
    } catch (error) {
      console.error('Error fetching legal policies:', error);
      showMessage('error', 'Failed to load legal policies');
    }
  }

  const updateLegalForm = (policyType, field, value) => {
    setLegalPolicies((prev) => ({
      ...prev,
      [policyType]: {
        ...prev[policyType],
        form: { ...prev[policyType].form, [field]: value },
      },
    }));
  };

  const handleSaveLegalPolicy = async (policyType) => {
    const { form } = legalPolicies[policyType];

    if (!form.title.trim() || !form.content.trim()) {
      showMessage('error', `${POLICY_LABELS[policyType]} title and content are required.`);
      return;
    }

    setLegalPolicies(prev => ({ ...prev, [policyType]: { ...prev[policyType], publishing: true } }));

    try {
      const response = await api.post('/legal/policies', {
        policyType,
        title: form.title.trim(),
        content: form.content.trim(),
        summary: form.summary.trim(),
        changelog: form.changelog.trim() || 'Updated from platform settings',
        effectiveDate: form.effectiveDate || new Date().toISOString(),
        version: form.version || undefined,
      });
      if (response.data.success) {
        showMessage('success', `${POLICY_LABELS[policyType]} published successfully.`);
        await fetchLegalPolicies();
      }
    } catch (error) {
      console.error('Error saving legal policy:', error);
      showMessage('error', error.response?.data?.message || `Failed to publish ${POLICY_LABELS[policyType]}`);
    } finally {
      setLegalPolicies(prev => ({ ...prev, [policyType]: { ...prev[policyType], publishing: false } }));
    }
  };

  const handleDeleteLegalPolicy = async (policyType, policyId) => {
    if (!window.confirm(`Delete this ${POLICY_LABELS[policyType].toLowerCase()} version?`)) return;
    try {
      const response = await api.delete(`/legal/policies/${policyId}`);
      if (response.data.success) {
        showMessage('success', `${POLICY_LABELS[policyType]} version deleted successfully.`);
        await fetchLegalPolicies();
      }
    } catch (error) {
      console.error('Error deleting legal policy:', error);
      showMessage('error', error.response?.data?.message || 'Failed to delete legal policy');
    }
  };

  useEffect(() => {
    const savedWorkerRules = localStorage.getItem('workerRules');
    const savedVendorRules = localStorage.getItem('vendorRules');
    const savedNotifications = localStorage.getItem('notifications');
    const savedLanguage = localStorage.getItem('language');

    if (savedWorkerRules) setWorkerRules(JSON.parse(savedWorkerRules));
    if (savedVendorRules) setVendorRules(JSON.parse(savedVendorRules));
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
    if (savedLanguage) setLanguage(savedLanguage);

    const loadInitialData = async () => {
      try {
        await fetchSettings();
      } catch (e) {
        console.error('fetchSettings error:', e);
      }
      try {
        await fetchLegalPolicies();
      } catch (e) {
        console.error('fetchLegalPolicies error:', e);
      }
      try {
        await fetchPlans();
      } catch (e) {
        console.error('fetchPlans error:', e);
      }
      setLoading(false);
    };

    loadInitialData();
  }, []);

  const openAddPlan = () => {
    setEditingPlanData(null);
    setPlanForm({ planName: 'basic', userType: 'worker', planType: 'basic', frequency: 'monthly', amount: '', features: [''], maxWorkers: '' });
    setShowPlanModal(true);
  };

  const openEditPlan = (plan) => {
    setEditingPlanData(plan);
    setPlanForm({
      planName: plan.planName || 'basic',
      userType: plan.userType,
      planType: plan.planType || 'basic',
      frequency: plan.frequency || 'monthly',
      amount: plan.amount,
      features: plan.features?.length ? plan.features : [''],
      maxWorkers: plan.maxWorkers || '',
    });
    setShowPlanModal(true);
  };

  const handlePlanFeatureChange = (index, value) => {
    const updated = [...planForm.features];
    updated[index] = value;
    setPlanForm(prev => ({ ...prev, features: updated }));
  };

  const addFeatureField = () => setPlanForm(prev => ({ ...prev, features: [...prev.features, ''] }));

  const removeFeatureField = (index) => {
    const updated = planForm.features.filter((_, i) => i !== index);
    setPlanForm(prev => ({ ...prev, features: updated.length ? updated : [''] }));
  };

  const handleSavePlan = async () => {
    if (!planForm.amount) {
      showMessage('error', 'Amount is required');
      return;
    }
    setPlanSaving(true);
    try {
      const payload = {
        planName: planForm.planName.trim(),
        userType: planForm.userType,
        planType: planForm.planType,
        frequency: planForm.frequency,
        amount: parseFloat(planForm.amount),
        features: planForm.features.filter(f => f.trim()),
        maxWorkers: planForm.userType === 'vendor'
          ? Math.max(parseInt(planForm.maxWorkers, 10) || 0, 0)
          : 0,
      };
      if (editingPlanData) {
        await api.put(`/platform-settings/plans/${editingPlanData._id}`, payload);
        showMessage('success', 'Plan updated successfully');
      } else {
        await api.post('/platform-settings/plans', payload);
        showMessage('success', 'Plan created successfully');
      }
      setShowPlanModal(false);
      await fetchPlans();
    } catch (e) {
      showMessage('error', e.response?.data?.message || 'Failed to save plan');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await api.delete(`/platform-settings/plans/${id}`);
      showMessage('success', 'Plan deleted');
      await fetchPlans();
    } catch (e) {
      showMessage('error', 'Failed to delete plan');
    }
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
      await api.put('/platform-settings/notifications', notifications);

      const workerRulesObj = {};
      workerRules.forEach(rule => { workerRulesObj[rule.key] = rule.enabled; });
      await api.put('/platform-settings/verification-rules', { userProfile: 'worker', rules: workerRulesObj });

      const vendorRulesObj = {};
      vendorRules.forEach(rule => { vendorRulesObj[rule.key] = rule.enabled; });
      await api.put('/platform-settings/verification-rules', { userProfile: 'vendor', rules: vendorRulesObj });

      await api.put('/platform-settings/language', { language });

      localStorage.setItem('workerRules', JSON.stringify(workerRules));
      localStorage.setItem('vendorRules', JSON.stringify(vendorRules));
      localStorage.setItem('notifications', JSON.stringify(notifications));
      localStorage.setItem('language', language);

      showMessage('success', 'All settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showMessage('error', 'Failed to save settings');
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) {
      showMessage('error', 'Please enter a skill name');
      return;
    }

    try {
      const response = await api.post('/platform-settings/skills', { skill: newSkill.trim() });
      if (response.data.success) {
        setSkills(response.data.skills);
        setNewSkill('');
        showMessage('success', 'Skill added successfully!');
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      showMessage('error', error.response?.data?.message || 'Failed to add skill');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page platform-settings-page">
        <Sidebar />
        <main className="dashboard-content platform-settings-content">
          <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
            Loading settings...
          </div>
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
            <button
              type="button"
              className="platform-icon-btn"
              onClick={() => navigate("/admin/notifications")}
            >
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2>Subscription Plans</h2>
                <p>Create and manage pricing plans for workers and vendors.</p>
              </div>
              <button type="button" className="platform-save-btn" onClick={openAddPlan} style={{ whiteSpace: 'nowrap' }}>
                <Plus size={14} /> Add Plan
              </button>
            </div>

            {plansError ? (
              <p style={{ color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> {plansError}
              </p>
            ) : plans.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '14px' }}>No plans created yet. Click "Add Plan" to get started.</p>
            ) : (
              <div className="pricing-table-wrapper">
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th>Plan Name</th>
                    <th>For</th>
                    <th>Type</th>
                    <th>Frequency</th>
                    <th>Amount</th>
                    <th>Features</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map(plan => (
                    <tr key={plan._id}>
                      <td style={{ fontWeight: '600' }}>{plan.planName}</td>
                      <td><span className={`status-pill ${plan.userType === 'vendor' ? 'vendor-pill' : 'worker-pill'}`}>{plan.userType}</span></td>
                      <td><span className={`status-pill ${plan.planType === 'premium' ? 'premium-pill' : 'basic-pill'}`} style={{ textTransform: 'capitalize' }}>{plan.planType || 'basic'}</span></td>
                      <td style={{ textTransform: 'capitalize' }}>{plan.frequency}</td>
                      <td style={{ fontWeight: '600', color: '#10b981' }}>₹{plan.amount}</td>
                      <td>
                        {plan.features?.length ? (
                          <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#6b7280' }}>
                            {plan.features.map((f, i) => <li key={i}>{f}</li>)}
                          </ul>
                        ) : <span style={{ color: '#9ca3af', fontSize: '12px' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" className="legal-action-btn" onClick={() => openEditPlan(plan)}>
                            <Edit2 size={13} /> Edit
                          </button>
                          <button type="button" className="legal-delete-btn" onClick={() => handleDeletePlan(plan._id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </section>

          <aside className="platform-side-stack">
            <section className="platform-card">
              <h3>Skills Management</h3>
              <p>Add skills for workers and vendors.</p>
              <div className="skill-input-group">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Enter skill name"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  className="skill-input"
                />
                <button type="button" onClick={handleAddSkill} className="skill-add-btn">Add</button>
              </div>
              <div className="skills-list">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <div key={skill.id} className="skill-item">
                      <span className="skill-id">{skill.id}</span>
                      <span className="skill-name">{skill.name}</span>
                    </div>
                  ))
                ) : (
                  <p className="no-skills-text">No skills added yet</p>
                )}
              </div>
            </section>

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

        {showPlanModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '28px', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>{editingPlanData ? 'Edit Plan' : 'Add New Plan'}</h3>
                <button onClick={() => setShowPlanModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Plan Name *</label>
                  <input value={planForm.planName} onChange={e => setPlanForm(p => ({ ...p, planName: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>For *</label>
                    <select value={planForm.userType} onChange={e => setPlanForm(p => ({ ...p, userType: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}>
                      <option value="worker">Worker</option>
                      <option value="vendor">Vendor</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Plan Type *</label>
                    <select value={planForm.planType} onChange={e => setPlanForm(p => ({ ...p, planType: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Frequency *</label>
                    <select value={planForm.frequency} onChange={e => setPlanForm(p => ({ ...p, frequency: e.target.value }))} style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px' }}>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Amount (₹) *</label>
                  <input type="number" min="0" value={planForm.amount} onChange={e => setPlanForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 999" style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>

                {planForm.userType === 'vendor' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#374151' }}>Max Workers (total across all posted jobs)</label>
                    <input type="number" min="0" value={planForm.maxWorkers} onChange={e => setPlanForm(p => ({ ...p, maxWorkers: e.target.value }))} placeholder="e.g. 50 (0 = no limit)" style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                    <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>Vendors on this plan can post at most this many workers in total across all their jobs. Leave 0 for no limit.</p>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Features</label>
                    <button type="button" onClick={addFeatureField} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={13} /> Add</button>
                  </div>
                  {planForm.features.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                      <input type="text" value={f} onChange={e => handlePlanFeatureChange(i, e.target.value)} placeholder={`Feature ${i + 1}`} style={{ flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px' }} />
                      <button type="button" onClick={() => removeFeatureField(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><X size={16} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowPlanModal(false)} style={{ padding: '9px 20px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#374151' }}>Cancel</button>
                <button type="button" onClick={handleSavePlan} disabled={planSaving} style={{ padding: '9px 20px', background: '#10b981', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: planSaving ? 'not-allowed' : 'pointer', color: 'white', opacity: planSaving ? 0.6 : 1 }}>
                  {planSaving ? 'Saving...' : editingPlanData ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="platform-card legal-policies-card">
          <div className="legal-header-row">
            <div>
              <h2><FileText size={18} /> Legal Policies</h2>
              <p>Publish and manage all versions of the privacy policy and terms & conditions.</p>
            </div>
          </div>

          <div className="legal-policy-stack">
            {POLICY_TYPES.map((policyType) => {
              const policyState = legalPolicies[policyType];
              const activeVersion = policyState.allVersions.find(v => v.isActive);

              return (
                <div className="legal-policy-card" key={policyType}>
                  <div className="legal-policy-head">
                    <h3>{POLICY_LABELS[policyType]}</h3>
                    {activeVersion ? (
                      <span className="status-pill">Active v{activeVersion.version}</span>
                    ) : (
                      <span className="status-pill muted">No active version</span>
                    )}
                  </div>

                  <div className="legal-policy-form">
                    <label>
                      <span>Title</span>
                      <input
                        type="text"
                        value={policyState.form.title}
                        onChange={(e) => updateLegalForm(policyType, 'title', e.target.value)}
                        placeholder={`Enter ${POLICY_LABELS[policyType]} title`}
                      />
                    </label>

                    <label>
                      <span>Version</span>
                      <input
                        type="text"
                        value={policyState.form.version}
                        onChange={(e) => updateLegalForm(policyType, 'version', e.target.value)}
                        placeholder="e.g. 1 (optional)"
                      />
                    </label>

                    <label>
                      <span>Summary</span>
                      <input
                        type="text"
                        value={policyState.form.summary}
                        onChange={(e) => updateLegalForm(policyType, 'summary', e.target.value)}
                        placeholder="Brief summary"
                      />
                    </label>

                    <label className="legal-full">
                      <span>Content (Markdown supported — # Heading, **bold**, - list, --- divider)</span>
                      <textarea
                        rows={8}
                        value={policyState.form.content}
                        onChange={(e) => updateLegalForm(policyType, 'content', e.target.value)}
                        placeholder="Paste the full document content. Markdown formatting (# Heading, **bold**, - list) is rendered in the app."
                      />
                    </label>

                    <label>
                      <span>Change Log</span>
                      <input
                        type="text"
                        value={policyState.form.changelog}
                        onChange={(e) => updateLegalForm(policyType, 'changelog', e.target.value)}
                        placeholder="What changed in this version?(Optional)"
                      />
                    </label>

                    <label>
                      <span>Effective Date</span>
                      <input
                        type="date"
                        value={policyState.form.effectiveDate}
                        onChange={(e) => updateLegalForm(policyType, 'effectiveDate', e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="legal-actions">
                    <button
                      type="button"
                      className="platform-save-btn legal-save-btn"
                      onClick={() => handleSaveLegalPolicy(policyType)}
                      disabled={policyState.publishing}
                      style={{ opacity: policyState.publishing ? 0.7 : 1, cursor: policyState.publishing ? 'not-allowed' : 'pointer' }}
                    >
                      <Plus size={14} />
                      {policyState.publishing ? 'Publishing...' : 'Publish new version'}
                    </button>
                  </div>

                  <div className="legal-versions">
                    <h4>All versions ({policyState.allVersions.length})</h4>
                    {policyState.allVersions.length > 0 ? (
                      <ul>
                        {policyState.allVersions.map((version) => (
                          <li key={version._id} className={version.isActive ? 'active-version' : ''}>
                            <div className="version-meta">
                              <strong>Version {version.version} {version.isActive && <span className="status-pill" style={{ fontSize: '11px', padding: '1px 7px' }}>Active</span>}</strong>
                              <span>{version.effectiveDate ? new Date(version.effectiveDate).toLocaleDateString() : '—'}</span>
                              {version.title && <p style={{ fontWeight: 600, color: '#1f2f47' }}>{version.title}</p>}
                              {version.summary && <p>{version.summary}</p>}
                              {version.changelog && <p style={{ fontStyle: 'italic', color: '#7083a3' }}>↳ {version.changelog}</p>}
                            </div>
                            <div className="version-actions">
                              <button type="button" className="legal-delete-btn" onClick={() => handleDeleteLegalPolicy(policyType, version._id)}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-skills-text">No versions have been published yet.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="platform-card">
          <div className="legal-header-row">
            <div>
              <h2><FileText size={18} /> Support Contact</h2>
              <p>Phone, WhatsApp, email and hours shown on the app's "Contact Support" screen.</p>
            </div>
          </div>

          <div className="legal-policy-form">
            <label>
              <span>Phone (with country code)</span>
              <input type="text" value={supportContact.phone} onChange={(e) => updateSupportContactField('phone', e.target.value)} placeholder="+918000000000" />
            </label>
            <label>
              <span>WhatsApp Number</span>
              <input type="text" value={supportContact.whatsapp} onChange={(e) => updateSupportContactField('whatsapp', e.target.value)} placeholder="+918000000000" />
            </label>
            <label>
              <span>Support Email</span>
              <input type="text" value={supportContact.email} onChange={(e) => updateSupportContactField('email', e.target.value)} placeholder="support@sitelink.com" />
            </label>
            <label>
              <span>Average Response Time</span>
              <input type="text" value={supportContact.avgResponseTime} onChange={(e) => updateSupportContactField('avgResponseTime', e.target.value)} placeholder="under 2 hours" />
            </label>
            <label>
              <span>Hours — Monday to Saturday</span>
              <input type="text" value={supportContact.hoursWeekday} onChange={(e) => updateSupportContactField('hoursWeekday', e.target.value)} placeholder="9:00 AM – 7:00 PM" />
            </label>
            <label>
              <span>Hours — Sunday</span>
              <input type="text" value={supportContact.hoursSunday} onChange={(e) => updateSupportContactField('hoursSunday', e.target.value)} placeholder="10:00 AM – 4:00 PM" />
            </label>
            <label className="legal-full">
              <span>Emergency Note</span>
              <input type="text" value={supportContact.emergencyNote} onChange={(e) => updateSupportContactField('emergencyNote', e.target.value)} placeholder="24/7 on WhatsApp" />
            </label>
          </div>

          <div className="legal-actions">
            <button
              type="button"
              className="platform-save-btn legal-save-btn"
              onClick={handleSaveSupportContact}
              disabled={supportContactSaving}
              style={{ opacity: supportContactSaving ? 0.7 : 1, cursor: supportContactSaving ? 'not-allowed' : 'pointer' }}
            >
              <Save size={14} />
              {supportContactSaving ? 'Saving...' : 'Save Support Contact'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}