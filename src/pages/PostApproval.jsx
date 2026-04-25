import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, User, Image as ImageIcon, MessageSquare, ThumbsUp, Share2, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import './PostApproval.css';

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
  const [newPost, setNewPost] = useState({ content: '', category: 'general', images: [] });

  useEffect(() => {
    fetchPendingPosts();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPendingPosts, 30000);
    return () => clearInterval(interval);
  }, [currentPage]);

  const fetchPendingPosts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/community/posts/pending?page=${currentPage}&limit=20`);
      setPosts(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch pending posts:', err);
      setError(err.response?.data?.message || 'Failed to load pending posts');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (postId) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const loadingToast = toast.loading('Approving post...');

    try {
      await api.put(`/community/posts/${postId}/approve`);
      setPosts(prev => prev.filter(p => p._id !== postId));
      toast.success('Post approved successfully!', { id: loadingToast });
    } catch (err) {
      console.error('Failed to approve post:', err);
      toast.error(err.response?.data?.message || 'Failed to approve post', { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectClick = (post) => {
    setSelectedPost(post);
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

    const loadingToast = toast.loading('Rejecting post...');

    try {
      await api.put(`/community/posts/${selectedPost._id}/reject`, { reason: rejectReason });
      setPosts(prev => prev.filter(p => p._id !== selectedPost._id));
      setShowRejectModal(false);
      setSelectedPost(null);
      setRejectReason('');
      toast.success('Post rejected successfully!', { id: loadingToast });
    } catch (err) {
      console.error('Failed to reject post:', err);
      toast.error(err.response?.data?.message || 'Failed to reject post', { id: loadingToast });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim()) {
      toast.error('Please enter post content');
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);

    const loadingToast = toast.loading('Creating post...');

    try {
      const formData = new FormData();
      formData.append('content', newPost.content);
      formData.append('category', newPost.category);
      
      if (newPost.images.length > 0) {
        newPost.images.forEach(img => formData.append('images', img));
      }

      const response = await api.post('/community/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowCreateModal(false);
      setNewPost({ content: '', category: 'general', images: [] });
      toast.success('Post created and pending approval!', { id: loadingToast });
      fetchPendingPosts(); // Refresh the list
    } catch (err) {
      console.error('Failed to create post:', err);
      toast.error(err.response?.data?.message || 'Failed to create post', { id: loadingToast });
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

  const filteredPosts = posts.filter(post => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      post.content?.toLowerCase().includes(search) ||
      post.posterName?.toLowerCase().includes(search) ||
      post.category?.toLowerCase().includes(search)
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
            <h1>Post Approval</h1>
            <p>Review and approve community posts before they go live</p>
          </div>
          <div className="header-actions">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className="create-post-btn" 
              onClick={() => setShowCreateModal(true)}
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
            <button className="refresh-btn" onClick={fetchPendingPosts} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        <div className="stats-row">
          <div className="stat-box">
            <p className="stat-label">PENDING POSTS</p>
            <div className="stat-value">{filteredPosts.length}</div>
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
              <p>No pending posts to review at the moment.</p>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const timeRemaining = getTimeRemaining(post.createdAt);
              return (
                <div key={post._id} className="post-card">
                  <div className="post-header">
                    <div className="post-author">
                      <img
                        src={post.posterImage || `https://ui-avatars.com/api/?name=${post.posterName}&background=3b82f6&color=fff`}
                        alt={post.posterName}
                        className="author-avatar"
                      />
                      <div>
                        <div className="author-name">{post.posterName}</div>
                        <div className="post-meta">
                          <span className={`user-type ${post.posterType}`}>{post.posterType}</span>
                          <span className="post-time">{new Date(post.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="time-remaining" style={{ color: timeRemaining.color }}>
                      <Clock size={16} />
                      <span>{timeRemaining.text}</span>
                    </div>
                  </div>

                  <div className="post-content">
                    <p>{post.content}</p>
                    {post.images && post.images.length > 0 && (
                      <div className="post-images">
                        {post.images.slice(0, 3).map((img, idx) => (
                          <img
                            key={idx}
                            src={`http://localhost:5000${img}`}
                            alt={`Post image ${idx + 1}`}
                            className="post-image"
                          />
                        ))}
                        {post.images.length > 3 && (
                          <div className="more-images">+{post.images.length - 3} more</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="post-stats">
                    <span><ThumbsUp size={14} /> {post.likesCount || 0}</span>
                    <span><MessageSquare size={14} /> {post.commentsCount || 0}</span>
                    <span><Share2 size={14} /> {post.shares || 0}</span>
                    <span className={`category-badge ${post.category}`}>{post.category}</span>
                  </div>

                  <div className="post-actions">
                    <button
                      className="approve-btn"
                      onClick={() => handleApprove(post._id)}
                      disabled={isProcessing}
                    >
                      <CheckCircle size={18} />
                      Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleRejectClick(post)}
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
            onClick={() => setShowCreateModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                borderRadius: '20px',
                padding: '40px',
                maxWidth: '600px',
                width: '100%',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                animation: 'slideUp 0.3s ease'
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
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}>
                  <Plus size={24} color="white" />
                </div>
                <h3 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0
                }}>Create New Post</h3>
              </div>
              <p style={{
                fontSize: '15px',
                color: '#6b7280',
                margin: '0 0 28px 0'
              }}>Share your thoughts with the community</p>
              
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
                }}>Category</label>
                <select
                  value={newPost.category}
                  onChange={(e) => setNewPost({...newPost, category: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    boxSizing: 'border-box',
                    outline: 'none',
                    cursor: 'pointer',
                    background: 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                >
                  <option value="general">🌐 General</option>
                  <option value="work">💼 Work</option>
                  <option value="skill">🎯 Skill</option>
                  <option value="question">❓ Question</option>
                  <option value="announcement">📢 Announcement</option>
                  <option value="discussion">💬 Discussion</option>
                  <option value="achievement">🏆 Achievement</option>
                  <option value="help">🆘 Help</option>
                </select>
              </div>

              <div style={{ marginBottom: '28px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px'
                }}>Images (Optional)</label>
                <div style={{
                  position: 'relative',
                  border: '2px dashed #d1d5db',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  background: 'white',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.background = '#f8f9ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.background = 'white';
                }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setNewPost({...newPost, images: Array.from(e.target.files)})}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
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

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end'
              }}>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPost({ content: '', category: 'general', images: [] });
                  }}
                  style={{
                    padding: '12px 28px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    background: 'white',
                    color: '#374151',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#f3f4f6';
                    e.target.style.borderColor = '#d1d5db';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'white';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={isProcessing || !newPost.content.trim()}
                  style={{
                    padding: '12px 28px',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: (isProcessing || !newPost.content.trim()) ? 'not-allowed' : 'pointer',
                    background: (isProcessing || !newPost.content.trim()) 
                      ? '#d1d5db' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    transition: 'all 0.3s ease',
                    boxShadow: (isProcessing || !newPost.content.trim()) 
                      ? 'none' 
                      : '0 4px 15px rgba(102, 126, 234, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isProcessing && newPost.content.trim()) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isProcessing && newPost.content.trim()) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                >
                  {isProcessing ? 'Creating...' : 'Create Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showRejectModal && (
          <div 
            onClick={() => setShowRejectModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
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
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
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
