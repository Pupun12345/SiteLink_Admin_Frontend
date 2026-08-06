import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import './CreateJobPost.css';

export default function CreateJobPost() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '', imageUrl: '' });
  const [amenities, setAmenities] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    company: 'SiteLink',
    location: '',
    quantity: '1',
    salary: '',
    salaryType: 'daily',
    duration: '',
    description: '',
    experience: '',
    isUrgent: false,
    amenities: [],
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile/me');
        if (res.data.success && res.data.data?.user) {
          const user = res.data.data.user;
          setProfile({
            name: user.name || 'Admin',
            imageUrl: user.profileImage ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Admin')}&background=2b3f57&color=fff`,
          });
        }
      } catch {}
    };

    const fetchAmenities = async () => {
      try {
        const res = await api.get('/amenities');
        setAmenities(res.data.data || []);
      } catch {}
    };

    fetchProfile();
    fetchAmenities();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleAmenity = (id) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter(a => a !== id)
        : [...prev.amenities, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/jobs', form);
      setSuccess('Job post created successfully!');
      setTimeout(() => navigate('/admin/requirements'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create job post.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cjp-page">
      <Sidebar />
      <main className="cjp-main">
        <header className="cjp-header">
          <div />
          <div className="profile">
            <img src={profile.imageUrl} alt="profile" />
            <div>
              <p>{profile.name}</p>
              <span>Super Admin</span>
            </div>
          </div>
        </header>

        <div className="cjp-title-row">
          <div>
            <h1>Create Job Post</h1>
            <p>Post a new job opening on behalf of <strong>SiteLink</strong></p>
          </div>
        </div>

        <div className="cjp-card">
          <div className="cjp-posted-by">
            <img src="/SiteLinkIcon.png" alt="SiteLink" className="cjp-brand-icon" />
            <div>
              <span className="cjp-brand-name">SiteLink</span>
              <span className="cjp-brand-label">Official Job Post · Posted by {profile.name || 'Admin'}</span>
            </div>
          </div>

          {error && <div className="cjp-alert cjp-alert-error">{error}</div>}
          {success && <div className="cjp-alert cjp-alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="cjp-form">
            <div className="cjp-grid-2">
              <div className="cjp-field">
                <label>Job Title *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Site Supervisor" required />
              </div>
              <div className="cjp-field">
                <label>Company</label>
                <input name="company" value={form.company} onChange={handleChange} placeholder="Company name" required />
              </div>
            </div>

            <div className="cjp-grid-2">
              <div className="cjp-field">
                <label>Location *</label>
                <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Mumbai, Maharashtra" required />
              </div>
              <div className="cjp-field">
                <label>Quantity</label>
                <input name="quantity" type="number" min="1" value={form.quantity} onChange={handleChange} />
              </div>
            </div>

            <div className="cjp-grid-2">
              <div className="cjp-field">
                <label>Salary (₹)</label>
                <input name="salary" type="number" value={form.salary} onChange={handleChange} placeholder="e.g. 500" />
              </div>
              <div className="cjp-field">
                <label>Salary Type</label>
                <select name="salaryType" value={form.salaryType} onChange={handleChange}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="cjp-grid-2">
              <div className="cjp-field">
                <label>Duration</label>
                <input name="duration" value={form.duration} onChange={handleChange} placeholder="e.g. 3 months" />
              </div>
              <div className="cjp-field">
                <label>Experience Required *</label>
                <input name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 2+ years" required />
              </div>
            </div>

            <div className="cjp-field">
              <label>Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} placeholder="Describe the job role, responsibilities..." required />
            </div>

            {amenities.length > 0 && (
              <div className="cjp-field">
                <label>Amenities / Benefits</label>
                <div className="cjp-amenities">
                  {amenities.map(a => (
                    <button
                      type="button"
                      key={a._id}
                      className={`cjp-amenity-chip ${form.amenities.includes(a._id) ? 'selected' : ''}`}
                      onClick={() => toggleAmenity(a._id)}
                    >
                      {a.icon && <span>{a.icon}</span>} {a.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="cjp-field cjp-urgent-row">
              <label className="cjp-checkbox-label">
                <input type="checkbox" name="isUrgent" checked={form.isUrgent} onChange={handleChange} />
                <span>Mark as Urgent 🔥</span>
              </label>
            </div>

            <div className="cjp-actions">
              <button type="button" className="cjp-btn-cancel" onClick={() => navigate('/admin/requirements')}>
                Cancel
              </button>
              <button type="submit" className="cjp-btn-submit" disabled={submitting}>
                {submitting ? 'Posting...' : 'Post Job'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
