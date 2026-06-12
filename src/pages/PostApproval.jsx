import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, User, Image as ImageIcon, MessageSquare, ThumbsUp, Share2, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import './PostApproval.css';

const API_BASE_URL = 'http://localhost:5000';

// Helper function to get proper image URL
const getImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/uploads')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/uploads/${path}`;
};

// Helper function to get user avatar
const getUserAvatar = (item) => {
  // Try multiple sources for the image
  const posterImage = item?.posterImage || item?.postedBy?.profileImage;
  const posterName = item?.posterName || item?.postedBy?.name || 'User';
  
  if (posterImage) {
    return getImageUrl(posterImage);
  }
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(posterName)}&background=random&color=fff&size=128`;
};

export default function PostApproval() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('post'); // 'post' or 'job'
  const [newPost, setNewPost] = useState({ content: '', feeling: '', images: [], video: null });
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    quantity: '1',
    salary: '',
    salaryType: 'daily',
    isUrgent: false,
    duration: '',
    description: '',
    experience: ''
  });

  useEffect(() => {
    fetchPendingPosts();
  }, [currentPage]);

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/community/posts/pending?page=${currentPage}&limit=20`);
      console.log('Fetched pending posts:', data.data);
      // Log first item to check image paths
      if (data.data && data.data.length > 0) {
        console.log('First post sample:', {
          posterImage: data.data[0].posterImage,
          images: data.data[0].images,
          video: data.data[0].video
        });
      }
      setPosts(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch pending posts:', err);
      setError(err.response?.data?.message || 'Failed to load pending posts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const loadingToast = toast.loading(`Approving ${item.contentType}...`);

    try {
      await api.put(`/community/posts/${item._id}/approve`, { contentType: item.contentType });
      setPosts(prev => prev.filter(p => p._id !== item._id));
      toast.success(`${item.contentType === 'job' ? 'Job' : 'Post'} approved successfully!`, { id: loadingToast });
    } catch (err) {
      console.error('Failed to approve:', err);
      toast.error(err.response?.data?.message || 'Failed to approve', { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (item) => {
    setSelectedPost(item);
    setShowRejectModal(true);
    setRejectReason('');
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    const loadingToast = toast.loading(`Rejecting ${selectedPost.contentType}...`);

    try {
      await api.put(`/community/posts/${selectedPost._id}/reject`, { 
        reason: rejectReason,
        contentType: selectedPost.contentType 
      });
      setPosts(prev => prev.filter(p => p._id !== selectedPost._id));
      setShowRejectModal(false);
      setSelectedPost(null);
      setRejectReason('');
      toast.success(`${selectedPost.contentType === 'job' ? 'Job' : 'Post'} rejected successfully!`, { id: loadingToast });
    } catch (err) {
      console.error('Failed to reject:', err);
      toast.error(err.response?.data?.message || 'Failed to reject', { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePost = async () => {
    if (createType === 'post') {
      if (!newPost.content.trim()) {
        toast.error('Please enter post content');
        return;
      }
    } else {
      if (!newJob.title.trim() || !newJob.company.trim() || !newJob.location.trim() || !newJob.description.trim() || !newJob.experience) {
        toast.error('Please fill in all required job fields');
        return;
      }
      const expValue = parseInt(newJob.experience);
      if (isNaN(expValue) || expValue < 0 || expValue > 60) {
        toast.error('Experience must be between 0 and 60 years');
        return;
      }
    }

    if (isProcessing) return;
    setIsProcessing(true);

    const loadingToast = toast.loading(`Creating ${createType}...`);

    try {
      if (createType === 'post') {
        const formData = new FormData();
        formData.append('content', newPost.content);
        if (newPost.feeling) formData.append('feeling', newPost.feeling);
        
        if (newPost.images.length > 0) {
          newPost.images.forEach(img => formData.append('images', img));
        }
        
        if (newPost.video) {
          formData.append('video', newPost.video);
        }

        await api.post('/community/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/jobs', {
          title: newJob.title.trim(),
          company: newJob.company.trim(),
          location: newJob.location.trim(),
          quantity: parseInt(newJob.quantity) || 1,
          salary: parseFloat(newJob.salary) || 0,
          salaryType: newJob.salaryType,
          isUrgent: newJob.isUrgent,
          duration: newJob.duration.trim(),
          description: newJob.description.trim(),
          experience: parseInt(newJob.experience) || 0
        });
      }
      
      // Reset form
      setCreateType('post');
      setNewPost({ content: '', feeling: '', images: [], video: null });
      setNewJob({
        title: '',
        company: '',
        location: '',
        quantity: '1',
        salary: '',
        salaryType: 'daily',
        isUrgent: false,
        duration: '',
        description: '',
        experience: ''
      });
      toast.success(`${createType === 'post' ? 'Post' : 'Job'} created and pending approval!`, { id: loadingToast });
      // Refresh the list
      fetchPendingPosts();
      // Close modal after a slight delay to show success message
      setTimeout(() => {
        setShowCreateModal(false);
      }, 500);
    } catch (err) {
      console.error(`Failed to create ${createType}:`, err);
      toast.error(err.response?.data?.message || `Failed to create ${createType}`, { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  const getTimeRemaining = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const elapsed = now - created;
    const remaining = oneHour - elapsed;

    if (remaining <= 0) {
      return { text: 'Auto-approved', color: '#10b981', expired: true };
    }

    const minutes = Math.floor(remaining / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

    if (minutes < 10) {
      return { text: `${minutes}m ${seconds}s`, color: '#ef4444', expired: false };
    } else if (minutes < 30) {
      return { text: `${minutes}m ${seconds}s`, color: '#f59e0b', expired: false };
    } else {
      return { text: `${minutes}m ${seconds}s`, color: '#10b981', expired: false };
    }
  };

  const filteredPosts = posts.filter(item => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    if (item.contentType === 'job') {
      return (
        item.title?.toLowerCase().includes(search) ||
        item.company?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.location?.toLowerCase().includes(search)
      );
    }
    return (
      item.content?.toLowerCase().includes(search) ||
      item.posterName?.toLowerCase().includes(search) ||
      item.feeling?.toLowerCase().includes(search)
    );
  });

  if (loading && posts.length === 0) {
    return (
      <div className="dashboard-page">
        <Sidebar />
        <main className="dashboard-content">
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading pending posts...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Toaster position="top-right" reverseOrder={false} />
      <Sidebar />
      <main className="dashboard-content post-approval-content">
        <header className="post-approval-header">
          <div>
            <h1>Post & Job Approval</h1>
            <p>Review and approve community posts and jobs before they go live</p>
          </div>
          <div className="header-actions">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search posts and jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="create-post-btn" 
                onClick={() => {
                  console.log('Create Post button clicked');
                  setCreateType('post');
                  setShowCreateModal(true);
                  console.log('showCreateModal set to true');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >
                <Plus size={18} />
                Create Post
              </button>
              <button 
                className="create-job-btn" 
                onClick={() => {
                  console.log('Create Job button clicked');
                  setCreateType('job');
                  setShowCreateModal(true);
                  console.log('showCreateModal set to true');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                }}
              >
                <Plus size={18} />
                Create Job
              </button>
            </div>
            <button className="refresh-btn" onClick={fetchPendingPosts} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        <div className="stats-row">
          <div className="stat-box">
            <p className="stat-label">PENDING ITEMS</p>
            <div className="stat-value">{filteredPosts.length}</div>
          </div>
          <div className="stat-box">
            <p className="stat-label">POSTS</p>
            <div className="stat-value" style={{ color: '#667eea' }}>
              {filteredPosts.filter(p => p.contentType === 'post').length}
            </div>
          </div>
          <div className="stat-box">
            <p className="stat-label">JOBS</p>
            <div className="stat-value" style={{ color: '#10b981' }}>
              {filteredPosts.filter(p => p.contentType === 'job').length}
            </div>
          </div>
          <div className="stat-box">
            <p className="stat-label">URGENT (&lt; 10 min)</p>
            <div className="stat-value" style={{ color: '#ef4444' }}>
              {filteredPosts.filter(p => {
                const remaining = getTimeRemaining(p.createdAt);
                return !remaining.expired && remaining.color === '#ef4444';
              }).length}
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <XCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="posts-grid">
          {filteredPosts.length === 0 ? (
            <div className="no-posts">
              <CheckCircle size={64} color="#10b981" />
              <h3>All caught up!</h3>
              <p>No pending posts or jobs to review at the moment.</p>
            </div>
          ) : (
            filteredPosts.map((item) => {
              const timeRemaining = getTimeRemaining(item.createdAt);
              const isJob = item.contentType === 'job';
              
              return (
                <div key={item._id} className="post-card">
                  <div className="post-header">
                    <div className="post-author">
                      <img
                        src={getUserAvatar(item)}
                        alt={item.posterName || item.postedBy?.name}
                        className="author-avatar"
                        onError={(e) => {
                          console.error('Avatar load error for:', item.posterImage, item.postedBy?.profileImage);
                          e.target.onerror = null;
                          const name = item.posterName || item.postedBy?.name || 'User';
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
                        }}
                      />
                      <div>
                        <div className="author-name">{item.posterName || item.postedBy?.name}</div>
                        <div className="post-meta">
                          <span className={`user-type ${item.posterType || item.postedBy?.userType}`}>
                            {item.posterType || item.postedBy?.userType}
                          </span>
                          <span className="post-time">{new Date(item.createdAt).toLocaleString()}</span>
                          {isJob && <span className="content-badge job-badge">📋 Job</span>}
                          {!isJob && <span className="content-badge post-badge">💬 Post</span>}
                        </div>
                      </div>
                    </div>
                    <div className="time-remaining" style={{ color: timeRemaining.color }}>
                      <Clock size={16} />
                      <span>{timeRemaining.text}</span>
                    </div>
                  </div>

                  {isJob ? (
                    <div className="post-content">
                      <h3 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>
                        {item.title}
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <p style={{ margin: '0', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Company</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#374151' }}>{item.company}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Location</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#374151' }}>{item.location}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Salary</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#374151' }}>
                            ₹{item.salary} / {item.salaryType}
                          </p>
                        </div>
                        <div>
                          <p style={{ margin: '0', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>Experience</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '15px', color: '#374151' }}>{item.experience} years</p>
                        </div>
                      </div>
                      <p style={{ margin: '12px 0 0 0', fontSize: '15px', color: '#4b5563', lineHeight: '1.6' }}>
                        {item.description}
                      </p>
                      {item.isUrgent && (
                        <div style={{ 
                          marginTop: '12px', 
                          padding: '8px 12px', 
                          background: '#fef2f2', 
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}>
                          <span style={{ color: '#dc2626', fontSize: '14px', fontWeight: '600' }}>🔥 Urgent Hiring</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="post-content">
                      <p>{item.content}</p>
                      {item.video && (
                        <div className="post-video">
                          <video 
                            controls 
                            style={{ width: '100%', borderRadius: '8px', marginTop: '12px' }}
                            onError={(e) => {
                              console.error('Video load error:', item.video);
                              e.target.style.display = 'none';
                            }}
                          >
                            <source src={getImageUrl(item.video)} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      )}
                      {item.images && item.images.length > 0 && (
                        <div className="post-images">
                          {item.images.slice(0, 3).map((img, idx) => (
                            <img
                              key={idx}
                              src={getImageUrl(img)}
                              alt={`Post image ${idx + 1}`}
                              className="post-image"
                              loading="lazy"
                              onError={(e) => {
                                console.error('Image load error for:', img, 'Attempted URL:', getImageUrl(img));
                                e.target.style.display = 'none';
                              }}
                            />
                          ))}
                          {item.images.length > 3 && (
                            <div className="more-images">+{item.images.length - 3} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="post-stats">
                    <span><ThumbsUp size={14} /> {item.likesCount || 0}</span>
                    <span><MessageSquare size={14} /> {item.commentsCount || 0}</span>
                    {!isJob && item.feeling && <span className="feeling-badge">😊 {item.feeling}</span>}
                    {!isJob && item.video && <span className="video-badge">🎥 Video</span>}
                    {isJob && <span className="quantity-badge">👥 {item.quantity} positions</span>}
                  </div>

                  <div className="post-actions">
                    <button
                      className="approve-btn"
                      onClick={() => handleApprove(item)}
                      disabled={isProcessing}
                    >
                      <CheckCircle size={18} />
                      Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleRejectClick(item)}
                      disabled={isProcessing}
                    >
                      <XCircle size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {showCreateModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                console.log('Modal overlay clicked, closing modal');
                setShowCreateModal(false);
              }
            }}
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: '10000',
              padding: '20px',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                borderRadius: '20px',
                padding: '32px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                margin: '20px auto',
                position: 'relative',
                zIndex: '10001'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: createType === 'post' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: createType === 'post' 
                    ? '0 4px 15px rgba(102, 126, 234, 0.4)'
                    : '0 4px 15px rgba(16, 185, 129, 0.4)'
                }}>
                  <Plus size={24} color="white" />
                </div>
                <h3 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  background: createType === 'post'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>Create New {createType === 'post' ? 'Post' : 'Job'}</h3>
              </div>
              <p style={{
                fontSize: '15px',
                color: '#6b7280',
                margin: '0 0 28px 0'
              }}>{createType === 'post' ? 'Share your thoughts with the community' : 'Post a new job opportunity'}</p>
              
              {createType === 'post' ? (
                // POST CREATION FORM
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>Post Content</label>
                    <textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                      placeholder="What's on your mind?"
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '14px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        background: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>Feeling (Optional)</label>
                    <input
                      type="text"
                      value={newPost.feeling}
                      onChange={(e) => setNewPost({...newPost, feeling: e.target.value})}
                      placeholder="e.g., happy, excited, grateful..."
                      style={{
                        width: '100%',
                        padding: '14px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '15px',
                        boxSizing: 'border-box',
                        outline: 'none',
                        background: 'white',
                        transition: 'all 0.3s ease'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>Video (Optional)</label>
                    <div style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '12px',
                      padding: '32px',
                      textAlign: 'center',
                      background: '#f9fafb',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative'
                    }}>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setNewPost({...newPost, video: e.target.files[0]})}
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          top: 0,
                          left: 0,
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                      <ImageIcon size={32} color="#9ca3af" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                        {newPost.video 
                          ? `${newPost.video.name}` 
                          : 'Click or drag video here'}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>Images (Optional, max 5)</label>
                    <div style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '12px',
                      padding: '32px',
                      textAlign: 'center',
                      background: '#f9fafb',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative'
                    }}>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => setNewPost({...newPost, images: Array.from(e.target.files)})}
                        style={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          top: 0,
                          left: 0,
                          opacity: 0,
                          cursor: 'pointer'
                        }}
                      />
                      <ImageIcon size={32} color="#9ca3af" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                        {newPost.images.length > 0 
                          ? `${newPost.images.length} image(s) selected` 
                          : 'Click or drag images here'}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                // JOB CREATION FORM
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>Job Title *</label>
                      <input
                        type="text"
                        value={newJob.title}
                        onChange={(e) => setNewJob({...newJob, title: e.target.value})}
                        placeholder="e.g., Construction Worker"
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '15px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          background: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>Company *</label>
                      <input
                        type="text"
                        value={newJob.company}
                        onChange={(e) => setNewJob({...newJob, company: e.target.value})}
                        placeholder="Company name"
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '15px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          background: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>Location *</label>
                      <input
                        type="text"
                        value={newJob.location}
                        onChange={(e) => setNewJob({...newJob, location: e.target.value})}
                        placeholder="City, State"
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '15px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          background: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>Workers Needed</label>
                      <input
                        type="number"
                        value={newJob.quantity}
                        onChange={(e) => setNewJob({...newJob, quantity: e.target.value})}
                        placeholder="Number of workers"
                        min="1"
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '15px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          background: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>Salary</label>
                      <input
                        type="number"
                        value={newJob.salary}
                        onChange={(e) => setNewJob({...newJob, salary: e.target.value})}
                        placeholder="Amount"
                        min="0"
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '15px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          background: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>Salary Type</label>
                      <select
                        value={newJob.salaryType}
                        onChange={(e) => setNewJob({...newJob, salaryType: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '15px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          background: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>Experience Required *</label>
                      <input
                        type="number"
                        value={newJob.experience}
                        onChange={(e) => setNewJob({...newJob, experience: e.target.value})}
                        placeholder="Years of experience"
                        min="0"
                        max="60"
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '15px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          background: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>Duration</label>
                      <input
                        type="text"
                        value={newJob.duration}
                        onChange={(e) => setNewJob({...newJob, duration: e.target.value})}
                        placeholder="e.g., 3 months, Permanent"
                        style={{
                          width: '100%',
                          padding: '14px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '15px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          background: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#10b981'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>Job Description *</label>
                    <textarea
                      value={newJob.description}
                      onChange={(e) => setNewJob({...newJob, description: e.target.value})}
                      placeholder="Describe the job requirements, responsibilities, and qualifications..."
                      rows={5}
                      style={{
                        width: '100%',
                        padding: '14px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        background: 'white'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#10b981'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ marginBottom: '28px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      cursor: 'pointer'
                    }}>
                      <input
                        type="checkbox"
                        checked={newJob.isUrgent}
                        onChange={(e) => setNewJob({...newJob, isUrgent: e.target.checked})}
                        style={{ margin: 0 }}
                      />
                      🔥 Mark as Urgent Hiring
                    </label>
                  </div>
                </>
              )}

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPost({ content: '', feeling: '', images: [], video: null });
                    setNewJob({
                      title: '',
                      company: '',
                      location: '',
                      quantity: '1',
                      salary: '',
                      salaryType: 'daily',
                      isUrgent: false,
                      duration: '',
                      description: '',
                      experience: ''
                    });
                  }}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: '#f3f4f6',
                    color: '#374151',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                  onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={isProcessing || (
                    createType === 'post' 
                      ? !newPost.content.trim()
                      : !newJob.title.trim() || !newJob.company.trim() || !newJob.location.trim() || 
                        !newJob.description.trim() || !newJob.experience ||
                        isNaN(parseInt(newJob.experience)) || parseInt(newJob.experience) < 0
                  )}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (isProcessing || (
                      createType === 'post' 
                        ? !newPost.content.trim()
                        : !newJob.title.trim() || !newJob.company.trim() || !newJob.location.trim() || 
                          !newJob.description.trim() || !newJob.experience ||
                          isNaN(parseInt(newJob.experience)) || parseInt(newJob.experience) < 0
                    )) ? 'not-allowed' : 'pointer',
                    background: createType === 'post'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    opacity: (isProcessing || (
                      createType === 'post' 
                        ? !newPost.content.trim()
                        : !newJob.title.trim() || !newJob.company.trim() || !newJob.location.trim() || 
                          !newJob.description.trim() || !newJob.experience ||
                          isNaN(parseInt(newJob.experience)) || parseInt(newJob.experience) < 0
                    )) ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                >
                  {isProcessing ? `Creating...` : `Create ${createType === 'post' ? 'Post' : 'Job'}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRejectModal && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowRejectModal(false);
              }
            }}
            style={{
              position: 'fixed',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: '10000',
              padding: '20px',
              boxSizing: 'border-box'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '32px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                zIndex: '10001'
              }}
            >
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0 0 12px 0'
              }}>Reject Post</h3>
              <p style={{
                fontSize: '16px',
                color: '#6b7280',
                margin: '0 0 20px 0'
              }}>Please provide a reason for rejecting this post:</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginBottom: '24px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: '#f3f4f6',
                    color: '#374151',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
                  onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={isProcessing || !rejectReason.trim()}
                  style={{
                    padding: '10px 24px',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (isProcessing || !rejectReason.trim()) ? 'not-allowed' : 'pointer',
                    background: '#ef4444',
                    color: 'white',
                    opacity: (isProcessing || !rejectReason.trim()) ? 0.6 : 1,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessing && rejectReason.trim()) {
                      e.target.style.background = '#dc2626';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProcessing && rejectReason.trim()) {
                      e.target.style.background = '#ef4444';
                    }
                  }}
                >
                  {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
