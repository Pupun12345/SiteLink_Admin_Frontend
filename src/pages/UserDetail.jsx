import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Calendar, Award, FileText, Edit2, Save, X } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';
import './UserDetail.css';
import Sidebar from '../components/Sidebar';
const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/admin/users/${id}`);
      const userData = data.data;
      setUser(userData);
      setEditedData(userData);
      console.log(userData)
    } catch (err) {
      console.error('Failed to load user details:', err);
      toast.showToast(err.response?.data?.message || 'Failed to load user details', { type: 'error' });
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (editMode) {
      setEditedData(user);
    }
    setEditMode(!editMode);
  };

  const handleInputChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {};
      const allowedFields = ['name', 'email', 'phone', 'workCity', 'workState', 'location', 'role', 'primarySkill',
        'experience', 'salary', 'salaryType', 'willingtoRelocate', 'companyName', 'gstNumber',
        'role', 'workArea', 'whatsappNumber', 'website'];

      Object.keys(editedData).forEach(key => {
        if (editedData[key] !== user[key] && allowedFields.includes(key)) {
          updates[key] = editedData[key];
        }
      });

      if (Object.keys(updates).length === 0) {
        toast.showToast('No changes to save', { type: 'info' });
        setEditMode(false);
        return;
      }

      await api.put(`/admin/users/${id}`, updates);
      await fetchUserDetails();
      setEditMode(false);
      toast.showToast('User details updated successfully', { type: 'success' });
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Failed to update user details', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading user details...</div>;
  }

  if (!user) {
    return <div className="error-screen">User not found</div>;
  }

  const isWorker = user.userType === 'worker';
  const isVendor = user.userType === 'vendor';

  return (
    <div className="worker-detail-page">
      <Sidebar />
      <main className="detail-main">
        <header className="detail-header">
          <button className="back-btn" onClick={() => navigate('/admin/user-management')}>
            <ArrowLeft size={16} /> Back
          </button>
          <div className="header-actions">
            {editMode ? (
              <>
                <button className="btn-cancel" onClick={handleEditToggle} disabled={saving}>
                  <X size={16} /> Cancel
                </button>
                <button className="btn-save" onClick={handleSave} disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button className="btn-edit" onClick={handleEditToggle}>
                <Edit2 size={16} /> Edit
              </button>
            )}
          </div>
        </header>

        <div className="detail-content">
          <div className="profile-card">
            <div className="profile-info">
              <div className="profile-avatar">
                {user.profileImage ? (
                  <img src={`${BACKEND_URL}/${user.profileImage}`} alt={user.name} />
                ) : user.companyLogo ? (
                  <img src={`${BACKEND_URL}/${user.companyLogo}`} alt={user.companyName} />
                ) : (
                  <User size={48} strokeWidth={1.5} />
                )}
              </div>
              <div className="profile-text">
                <h1>{isVendor ? user.companyName : user.name}</h1>
                <div className="meta">
                  <span className="type">{user.userType}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="info-grid-vertical">
            {/* Contact & Personal Section */}
            <div className="info-section">
              <h3>Contact & Personal</h3>
              <div className="field-group">
                <div className="field">
                  <label>Name</label>
                  {editMode ? (
                    <input type="text" value={editedData.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} />
                  ) : (
                    <span>{user.name || 'N/A'}</span>
                  )}
                </div>
                <div className="field">
                  <label>Email</label>
                  {editMode ? (
                    <input type="email" value={editedData.email || ''} onChange={(e) => handleInputChange('email', e.target.value)} />
                  ) : (
                    <span>{user.email || 'N/A'}</span>
                  )}
                </div>
                <div className="field">
                  <label>Phone</label>
                  {editMode ? (
                    <input type="tel" value={editedData.phone || ''} onChange={(e) => handleInputChange('phone', e.target.value)} />
                  ) : (
                    <span>{user.phone || 'N/A'}</span>
                  )}
                </div>
                {isVendor && (
                  <div className="field">
                    <label>WhatsApp Number</label>
                    {editMode ? (
                      <input type="tel" value={editedData.whatsappNumber || ''} onChange={(e) => handleInputChange('whatsappNumber', e.target.value)} />
                    ) : (
                      <span>{user.whatsappNumber || 'N/A'}</span>
                    )}
                  </div>
                )}
                <div className="field">
                  <label>Work City</label>
                  {editMode ? (
                    <input type="text" value={editedData.workCity || ''} onChange={(e) => handleInputChange('workCity', e.target.value)} />
                  ) : (
                    <span>{user.workCity || 'N/A'}</span>
                  )}
                </div>
                <div className="field">
                  <label>Work State</label>
                  {editMode ? (
                    <input type="text" value={editedData.workState || ''} onChange={(e) => handleInputChange('workState', e.target.value)} />
                  ) : (
                    <span>{user.workState || 'N/A'}</span>
                  )}
                </div>
                {isWorker && user.location && (
                  <div className="field">
                    <label>Location</label>
                    {editMode ? (
                      <input type="text" value={editedData.location || ''} onChange={(e) => handleInputChange('location', e.target.value)} />
                    ) : (
                      <span>{user.location || 'N/A'}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Professional/Business Section */}
            {isWorker ? (
              <div className="info-section">
                <h3>Professional Information</h3>
                <div className="field-group">
                  <div className="field">
                    <label>Role</label>
                    {editMode ? (
                      <input type="text" value={editedData.role || ''} onChange={(e) => handleInputChange('role', e.target.value)} />
                    ) : (
                      <span>{user.role || 'N/A'}</span>
                    )}
                  </div>
                  <div className="field">
                    <label>Primary Skill</label>
                    {editMode ? (
                      <input type="text" value={editedData.primarySkill || ''} onChange={(e) => handleInputChange('primarySkill', e.target.value)} />
                    ) : (
                      <span>{user.primarySkill || 'N/A'}</span>
                    )}
                  </div>
                  <div className="field">
                    <label>Experience</label>
                    {editMode ? (
                      <input type="text" value={editedData.experience || ''} onChange={(e) => handleInputChange('experience', e.target.value)} />
                    ) : (
                      <span>{user.experience || 'N/A'}</span>
                    )}
                  </div>
                  <div className="field">
                    <label>Salary Type</label>
                    {editMode ? (
                      <select value={editedData.salaryType || ''} onChange={(e) => handleInputChange('salaryType', e.target.value)}>
                        <option value="">Select</option>
                        <option value="monthly">Monthly</option>
                        <option value="daily">Daily</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    ) : (
                      <span>{user.salaryType || 'N/A'}</span>
                    )}
                  </div>
                  <div className="field">
                    <label>Salary</label>
                    {editMode ? (
                      <input type="number" value={editedData.salary || ''} onChange={(e) => handleInputChange('salary', e.target.value)} />
                    ) : (
                      <span>₹{user.salary || 'N/A'}</span>
                    )}
                  </div>
                  <div className="field">
                    <label>Willing to Relocate</label>
                    {editMode ? (
                      <select value={editedData.willingtoRelocate || ''} onChange={(e) => handleInputChange('willingtoRelocate', e.target.value)}>
                        <option value="">Select</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <span>{JSON.stringify(user.willingtoRelocate).toUpperCase() ? "Yes" : "No"}</span>
                    )}
                  </div>
                </div>
                {user.skills && user.skills.length > 0 && (
                  <div className="skills-section">
                    <label>Additional Skills</label>
                    <div className="skill-tags">
                      {user.skills.map((s, i) => <span key={i}>{s.skillName || s}</span>)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="info-section">
                <h3>Business Information</h3>
                <div className="field-group">
                  <div className="field">
                    <label>Company Name</label>
                    {editMode ? (
                      <input type="text" value={editedData.companyName || ''} onChange={(e) => handleInputChange('companyName', e.target.value)} />
                    ) : (
                      <span>{user.companyName || 'N/A'}</span>
                    )}
                  </div>
                  <div className="field">
                    <label>Designation</label>
                    {editMode ? (
                      <input type="text" value={editedData.role || ''} onChange={(e) => handleInputChange('role', e.target.value)} />
                    ) : (
                      <span>{user.role || 'N/A'}</span>
                    )}
                  </div>
                  <div className="field">
                    <label>GST Number</label>
                    {editMode ? (
                      <input type="text" value={editedData.gstNumber || ''} onChange={(e) => handleInputChange('gstNumber', e.target.value)} />
                    ) : (
                      <span>{user.gstNumber || 'N/A'}</span>
                    )}
                  </div>
                  <div className="field">
                    <label>Work Area</label>
                    {editMode ? (
                      <input type="text" value={editedData.workArea || ''} onChange={(e) => handleInputChange('workArea', e.target.value)} />
                    ) : (
                      <span>{user.workArea || 'N/A'}</span>
                    )}
                  </div>
                  <div className="field">
                    <label>Website</label>
                    {editMode ? (
                      <input type="url" value={editedData.website || ''} onChange={(e) => handleInputChange('website', e.target.value)} />
                    ) : (
                      <span>{user.website || 'N/A'}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Account Information */}
            <div className="info-section">
              <h3>Account Information</h3>
              <div className="field-group">
                <div className="field">
                  <label>User ID</label>
                  <span>{user.id || user._id}</span>
                </div>
                <div className="field">
                  <label>User Type</label>
                  <span>{user.userType}</span>
                </div>
                <div className="field">
                  <label>Joined</label>
                  <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
