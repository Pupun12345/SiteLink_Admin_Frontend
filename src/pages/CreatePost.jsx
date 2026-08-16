import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, FileText, Image, Video, Tag, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import './CreatePost.css';

// Compress an image File using Canvas — returns a new File
const compressImage = (file, maxWidth = 1280, quality = 0.75) =>
  new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() })),
        'image/jpeg',
        quality
      );
    };
    img.src = url;
  });

const VIDEO_MAX_MB = 50;

const FEELINGS = ['😊 Happy', '🎉 Excited', '💪 Motivated', '🙏 Grateful', '📢 Announcing', '⚠️ Important', '💡 Informative'];

const CATEGORY_META = {
  'Financial Benefits':    { emoji: '💰', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  'Accommodation & Food':  { emoji: '🏠', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'Travel':                { emoji: '🚌', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  'Safety & Medical':      { emoji: '🏥', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  'Leave':                 { emoji: '🌴', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  'Work & Career':         { emoji: '📈', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  'Employee Rewards':      { emoji: '🏆', color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
};

export default function CreatePost() {
  const navigate = useNavigate();
  const imageInputRef = useRef();
  const videoInputRef = useRef();

  const [postType, setPostType] = useState(null);
  const [postDuration, setPostDuration] = useState('permanent');
  const [customHours, setCustomHours] = useState(24);
  const [profile, setProfile] = useState({ name: '', imageUrl: '' });
  const [amenities, setAmenities] = useState([]);
  const [openCategories, setOpenCategories] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [content, setContent] = useState('');
  const [feeling, setFeeling] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [video, setVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');

  const [job, setJob] = useState({
    title: '', company: 'SiteLink', location: '', quantity: '1',
    salary: '', salaryType: 'daily', duration: '', description: '',
    experience: '', isUrgent: false, amenities: [],
  });

  useEffect(() => {
    api.get('/profile/me').then(res => {
      if (res.data.success && res.data.data?.user) {
        const u = res.data.data.user;
        setProfile({
          name: u.name || 'Admin',
          imageUrl: u.profileImage ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'Admin')}&background=2b3f57&color=fff`,
        });
      }
    }).catch(() => {});

    api.get('/amenities').then(res => {
      const data = res.data.data || [];
      setAmenities(data);
      // open all categories by default
      const cats = [...new Set(data.map(a => a.category))];
      const initial = {};
      cats.forEach(c => { initial[c] = true; });
      setOpenCategories(initial);
    }).catch(() => {});
  }, []);

  // group amenities by category
  const amenityGroups = amenities.reduce((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {});

  const toggleCategory = (cat) =>
    setOpenCategories(p => ({ ...p, [cat]: !p[cat] }));

  const handleImages = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) { setError('Maximum 5 images allowed.'); return; }
    setError('');
    setCompressing(true);
    try {
      const compressed = await Promise.all(files.map(f => compressImage(f)));
      setImages(p => [...p, ...compressed]);
      setImagePreviews(p => [...p, ...compressed.map(f => URL.createObjectURL(f))]);
    } finally {
      setCompressing(false);
      e.target.value = '';
    }
  };

  const removeImage = (i) => {
    URL.revokeObjectURL(imagePreviews[i]);
    setImages(p => p.filter((_, idx) => idx !== i));
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
  };

  const handleVideo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > VIDEO_MAX_MB) {
      setError(`Video must be under ${VIDEO_MAX_MB}MB. Your file is ${sizeMB.toFixed(1)}MB.`);
      e.target.value = '';
      return;
    }
    setError('');
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    URL.revokeObjectURL(videoPreview);
    setVideo(null); setVideoPreview('');
    videoInputRef.current.value = '';
  };

  const handleJob = (e) => {
    const { name, value, type, checked } = e.target;
    setJob(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleAmenity = (id) => {
    setJob(p => ({
      ...p,
      amenities: p.amenities.includes(id)
        ? p.amenities.filter(a => a !== id)
        : [...p.amenities, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setSubmitting(true);
    try {
      if (postType === 'post') {
        if (!content.trim()) { setError('Post content is required.'); setSubmitting(false); return; }
        const fd = new FormData();
        fd.append('content', content.trim());
        if (feeling) fd.append('feeling', feeling);
        const dur = postDuration === 'custom' ? String(customHours) : postDuration;
        fd.append('postDuration', dur);
        images.forEach(img => fd.append('images', img));
        if (video) fd.append('video', video);
        await api.post('/community/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Post published successfully!');
        setTimeout(() => navigate('/admin/create-post'), 1500);
      } else {
        await api.post('/jobs', job);
        setSuccess('Job post created successfully!');
        setTimeout(() => navigate('/admin/requirements'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetType = () => { setPostType(null); setError(''); setSuccess(''); };
  const charLeft = 1000 - content.length;

  return (
    <div className="cp-page">
      <Sidebar />
      <main className="cp-main">

        {/* ── Header ── */}
        <header className="cp-header">
          <div />
          <div className="profile">
            <img src={profile.imageUrl} alt="profile" />
            <div><p>{profile.name}</p><span>Super Admin</span></div>
          </div>
        </header>

        {/* ── Entry screen ── */}
        {!postType && (
          <div className="cp-entry">
            <div className="cp-entry-hero">
              <div className="cp-entry-hero-left">
                <div className="cp-entry-eyebrow">SiteLink Admin</div>
                <h1>What would you like to post?</h1>
                <p>Create content that reaches workers and vendors across the SiteLink platform.</p>
              </div>
              <div className="cp-entry-hero-right">
                <img src="/SiteLinkIcon.png" alt="SiteLink" className="cp-entry-logo" />
              </div>
            </div>

            <div className="cp-type-grid">
              {/* General Post card */}
              <button className="cp-type-card cp-type-post" onClick={() => setPostType('post')}>
                <div className="cp-type-card-top">
                  <div className="cp-type-icon-wrap cp-icon-post">
                    <FileText size={26} />
                  </div>
                  <span className="cp-type-badge cp-badge-post">Community</span>
                </div>
                <div className="cp-type-card-body">
                  <h3>General Post</h3>
                  <p>Share announcements, updates, news or any message with the community.</p>
                </div>
                <div className="cp-type-card-features">
                  <span><Image size={13} /> Images</span>
                  <span><Video size={13} /> Video</span>
                  <span><Tag size={13} /> Feelings</span>
                </div>
                <div className="cp-type-card-cta">Create Post →</div>
              </button>

              {/* Job Post card */}
              <button className="cp-type-card cp-type-job" onClick={() => setPostType('job')}>
                <div className="cp-type-card-top">
                  <div className="cp-type-icon-wrap cp-icon-job">
                    <Briefcase size={26} />
                  </div>
                  <span className="cp-type-badge cp-badge-job">Hiring</span>
                </div>
                <div className="cp-type-card-body">
                  <h3>Job Post</h3>
                  <p>Post a new job opening or requirement for workers on behalf of SiteLink.</p>
                </div>
                <div className="cp-type-card-features">
                  <span>💰 Salary</span>
                  <span>📍 Location</span>
                  <span>🎁 Benefits</span>
                </div>
                <div className="cp-type-card-cta">Post a Job →</div>
              </button>
            </div>
          </div>
        )}

        {/* ── Form screen ── */}
        {postType && (
          <>
            <div className="cp-form-topbar">
              <button className="cp-back-btn" onClick={resetType}>
                <ArrowLeft size={15} /> Change Type
              </button>
              <div className="cp-form-title">
                <h1>{postType === 'job' ? 'Post a Job' : 'Create General Post'}</h1>
                <p>Publishing as <strong>SiteLink</strong> · {profile.name}</p>
              </div>
            </div>

            <div className="cp-card">
              {/* Author strip */}
              <div className={`cp-author ${postType === 'job' ? 'cp-author-job' : ''}`}>
                <img src="/SiteLinkIcon.png" alt="SiteLink" className="cp-brand-icon" />
                <div>
                  <span className="cp-brand-name">SiteLink</span>
                  <span className="cp-brand-meta">
                    {postType === 'job' ? '💼 Job Post' : '📢 General Post'} · Posted by {profile.name}
                  </span>
                </div>
                <span className={`cp-author-badge ${postType === 'job' ? 'cp-author-badge-job' : ''}`}>
                  {postType === 'job' ? 'Job Post' : 'Admin Post'}
                </span>
              </div>

              {error && <div className="cp-alert cp-alert-error">{error}</div>}
              {success && <div className="cp-alert cp-alert-success">{success}</div>}
              {compressing && <div className="cp-alert" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>⏳ Compressing images, please wait...</div>}

              <form onSubmit={handleSubmit} className="cp-form">

                {/* ── GENERAL POST ── */}
                {postType === 'post' && (
                  <>
                    <div className="cp-field">
                      <label>Post Duration</label>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        {[{ val: 'permanent', label: '♾️ Permanent' }, { val: '24', label: '24 hrs' }, { val: '48', label: '48 hrs' }, { val: '72', label: '72 hrs' }, { val: 'custom', label: '⏱ Custom' }].map(opt => (
                          <button type="button" key={opt.val}
                            onClick={() => setPostDuration(opt.val)}
                            style={{ padding: '6px 14px', borderRadius: '20px', border: '1.5px solid', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: postDuration === opt.val ? '#2b3f57' : '#f3f4f6', color: postDuration === opt.val ? '#fff' : '#374151', borderColor: postDuration === opt.val ? '#2b3f57' : '#d1d5db' }}>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      {postDuration === 'custom' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="number" min="1" max="8760" value={customHours} onChange={e => setCustomHours(Number(e.target.value))} style={{ width: '100px', padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #d1d5db' }} />
                          <span style={{ fontSize: '13px', color: '#6b7280' }}>hours</span>
                        </div>
                      )}
                    </div>

                    <div className="cp-field">
                      <label>What's on your mind? *</label>
                      <textarea value={content} onChange={e => setContent(e.target.value)}
                        maxLength={1000} rows={6} placeholder="Write your post content here..." required />
                      <span className={`cp-char-count ${charLeft < 50 ? 'warn' : ''}`}>{charLeft} characters left</span>
                    </div>

                    <div className="cp-field">
                      <label>Feeling / Tag</label>
                      <div className="cp-chips">
                        {FEELINGS.map(f => (
                          <button type="button" key={f}
                            className={`cp-chip ${feeling === f ? 'selected' : ''}`}
                            onClick={() => setFeeling(p => p === f ? '' : f)}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="cp-media-row">
                      <div className="cp-field cp-field-grow">
                        <label>Images <span className="cp-hint">(up to 5)</span></label>
                        {imagePreviews.length > 0 && (
                          <div className="cp-img-previews">
                            {imagePreviews.map((src, i) => (
                              <div key={i} className="cp-img-wrap">
                                <img src={src} alt="" />
                                <button type="button" className="cp-x-btn" onClick={() => removeImage(i)}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                        {images.length < 5 && (
                          <button type="button" className="cp-upload-btn" onClick={() => imageInputRef.current.click()}>
                            <Image size={15} /> Add Images
                          </button>
                        )}
                        <input ref={imageInputRef} type="file" accept="image/*" multiple hidden onChange={handleImages} />
                      </div>

                      <div className="cp-field cp-field-grow">
                        <label>Video <span className="cp-hint">(optional)</span></label>
                        {videoPreview ? (
                          <div className="cp-video-wrap">
                            <video src={videoPreview} controls className="cp-video-preview" />
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                              {video && `${(video.size / (1024 * 1024)).toFixed(1)} MB`}
                            </div>
                            <button type="button" className="cp-remove-video" onClick={removeVideo}>✕ Remove</button>
                          </div>
                        ) : (
                          <button type="button" className="cp-upload-btn" onClick={() => videoInputRef.current.click()}>
                            <Video size={15} /> Add Video
                          </button>
                        )}
                        <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleVideo} />
                      </div>
                    </div>
                  </>
                )}

                {/* ── JOB POST ── */}
                {postType === 'job' && (
                  <>
                    <div className="cp-section-label">Basic Info</div>
                    <div className="cp-grid-3">
                      <div className="cp-field">
                        <label>Job Title *</label>
                        <input name="title" value={job.title} onChange={handleJob} placeholder="e.g. Site Supervisor" required />
                      </div>
                      <div className="cp-field">
                        <label>Company</label>
                        <input name="company" value={job.company} onChange={handleJob} required />
                      </div>
                      <div className="cp-field">
                        <label>Location *</label>
                        <input name="location" value={job.location} onChange={handleJob} placeholder="e.g. Mumbai, Maharashtra" required />
                      </div>
                    </div>

                    <div className="cp-section-label">Compensation</div>
                    <div className="cp-grid-4">
                      <div className="cp-field">
                        <label>Salary (₹)</label>
                        <input name="salary" type="number" value={job.salary} onChange={handleJob} placeholder="e.g. 500" />
                      </div>
                      <div className="cp-field">
                        <label>Salary Type</label>
                        <select name="salaryType" value={job.salaryType} onChange={handleJob}>
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="cp-field">
                        <label>Duration</label>
                        <input name="duration" value={job.duration} onChange={handleJob} placeholder="e.g. 3 months" />
                      </div>
                      <div className="cp-field">
                        <label>Quantity</label>
                        <input name="quantity" type="number" min="1" value={job.quantity} onChange={handleJob} />
                      </div>
                    </div>

                    <div className="cp-section-label">Details</div>
                    <div className="cp-grid-2">
                      <div className="cp-field">
                        <label>Experience Required *</label>
                        <input name="experience" value={job.experience} onChange={handleJob} placeholder="e.g. 2+ years" required />
                      </div>
                      <div className="cp-field cp-urgent-field">
                        <label>Urgency</label>
                        <label className="cp-urgent-toggle">
                          <input type="checkbox" name="isUrgent" checked={job.isUrgent} onChange={handleJob} />
                          <span className="cp-toggle-track">
                            <span className="cp-toggle-thumb" />
                          </span>
                          <span className="cp-urgent-text">{job.isUrgent ? '🔥 Urgent' : 'Not Urgent'}</span>
                        </label>
                      </div>
                    </div>

                    <div className="cp-field">
                      <label>Description *</label>
                      <textarea name="description" value={job.description} onChange={handleJob} rows={4}
                        placeholder="Describe the job role, responsibilities and requirements..." required />
                    </div>

                    {/* Amenities grouped by category */}
                    {Object.keys(amenityGroups).length > 0 && (
                      <div className="cp-field">
                        <div className="cp-amenities-header">
                          <label>Amenities / Benefits</label>
                          {job.amenities.length > 0 && (
                            <span className="cp-amenities-count">{job.amenities.length} selected</span>
                          )}
                        </div>
                        <div className="cp-amenity-groups">
                          {Object.entries(amenityGroups).map(([cat, items]) => {
                            const meta = CATEGORY_META[cat] || { emoji: '📦', color: '#374151', bg: '#f9fafb', border: '#e5e7eb' };
                            const isOpen = openCategories[cat];
                            const selectedInCat = items.filter(a => job.amenities.includes(a._id)).length;
                            return (
                              <div key={cat} className="cp-amenity-group" style={{ '--cat-border': meta.border, '--cat-bg': meta.bg }}>
                                <button type="button" className="cp-cat-header" onClick={() => toggleCategory(cat)}>
                                  <span className="cp-cat-left">
                                    <span className="cp-cat-emoji">{meta.emoji}</span>
                                    <span className="cp-cat-name" style={{ color: meta.color }}>{cat}</span>
                                    {selectedInCat > 0 && (
                                      <span className="cp-cat-count" style={{ background: meta.color }}>{selectedInCat}</span>
                                    )}
                                  </span>
                                  <span className="cp-cat-chevron" style={{ color: meta.color }}>
                                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </span>
                                </button>
                                {isOpen && (
                                  <div className="cp-cat-chips">
                                    {items.map(a => (
                                      <button type="button" key={a._id}
                                        className={`cp-chip cp-amenity-chip ${job.amenities.includes(a._id) ? 'selected' : ''}`}
                                        style={job.amenities.includes(a._id)
                                          ? { background: meta.bg, borderColor: meta.color, color: meta.color }
                                          : {}}
                                        onClick={() => toggleAmenity(a._id)}>
                                        {a.icon && <span>{a.icon}</span>}
                                        {a.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="cp-actions">
                  <button type="button" className="cp-btn-cancel" onClick={resetType}>Cancel</button>
                  <button type="submit" className="cp-btn-submit" disabled={submitting || compressing}>
                    {submitting ? 'Submitting...' : compressing ? 'Compressing...' : postType === 'job' ? 'Post Job' : 'Publish Post'}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
