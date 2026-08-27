import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Briefcase, Plus, Trash2, Eye, MessageCircle, ChevronDown, ChevronUp, Send, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import './AdminPosts.css';

const TABS = [
  { key: 'all',  label: 'All Posts' },
  { key: 'post', label: 'General Posts' },
  { key: 'job',  label: 'Job Posts' },
];

function CommentsPanel({ postId, onClose }) {
  const [comments, setComments]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [replyText, setReplyText]   = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // commentId or null (null = top-level)
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchComments = useCallback(() => {
    setLoading(true);
    api.get(`/community/posts/${postId}/comments?limit=100`)
      .then(res => setComments(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const handleReply = async (parentCommentId = null) => {
    const text = replyText.trim();
    if (!text) return;
    setSubmitting(true);
    try {
      const body = { comment: text };
      if (parentCommentId) body.parentComment = parentCommentId;
      await api.post(`/community/posts/${postId}/comments`, body);
      setReplyText('');
      setReplyingTo(null);
      fetchComments();
    } catch {
      alert('Failed to post reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    setDeletingId(commentId);
    try {
      await api.delete(`/community/posts/${postId}/comments/${commentId}`);
      setComments(c => c.filter(x => x._id !== commentId));
    } catch {
      alert('Failed to delete comment.');
    } finally {
      setDeletingId(null);
    }
  };

  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="ap-comments-panel">
      <div className="ap-comments-header">
        <span className="ap-comments-title">
          <MessageCircle size={16} /> Comments ({comments.length})
        </span>
        <button className="ap-comments-close" onClick={onClose}><X size={16} /></button>
      </div>

      <div className="ap-comments-body">
        {loading ? (
          <div className="ap-comments-loading"><div className="ap-spinner" /></div>
        ) : comments.length === 0 ? (
          <p className="ap-comments-empty">No comments yet.</p>
        ) : (
          <ul className="ap-comments-list">
            {comments.map(c => (
              <li key={c._id} className="ap-comment-item">
                <div className="ap-comment-avatar">
                  {c.userImage
                    ? <img src={c.userImage} alt="" />
                    : <span>{(c.userName || 'U')[0].toUpperCase()}</span>
                  }
                </div>
                <div className="ap-comment-content">
                  <div className="ap-comment-meta">
                    <span className="ap-comment-name">{c.userName || 'Unknown'}</span>
                    <span className="ap-comment-date">{fmt(c.createdAt)}</span>
                  </div>
                  <p className="ap-comment-text">{c.comment}</p>
                  <div className="ap-comment-actions">
                    <button
                      className="ap-comment-reply-btn"
                      onClick={() => setReplyingTo(replyingTo === c._id ? null : c._id)}
                    >
                      Reply
                    </button>
                    <button
                      className="ap-comment-delete-btn"
                      onClick={() => handleDelete(c._id)}
                      disabled={deletingId === c._id}
                    >
                      {deletingId === c._id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                  {replyingTo === c._id && (
                    <div className="ap-reply-box">
                      <textarea
                        className="ap-reply-input"
                        placeholder={`Reply to ${c.userName || 'this comment'}…`}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        rows={2}
                      />
                      <div className="ap-reply-actions">
                        <button className="ap-reply-cancel" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Cancel</button>
                        <button className="ap-reply-submit" onClick={() => handleReply(c._id)} disabled={submitting || !replyText.trim()}>
                          <Send size={13} /> {submitting ? 'Posting…' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Nested replies */}
                  {c.replies?.length > 0 && (
                    <ul className="ap-replies-list">
                      {c.replies.map(r => (
                        <li key={r._id} className="ap-reply-item">
                          <div className="ap-comment-avatar ap-reply-avatar">
                            {r.userImage
                              ? <img src={r.userImage} alt="" />
                              : <span>{(r.userName || 'U')[0].toUpperCase()}</span>
                            }
                          </div>
                          <div className="ap-comment-content">
                            <div className="ap-comment-meta">
                              <span className="ap-comment-name">{r.userName || 'Unknown'}</span>
                              <span className="ap-comment-date">{fmt(r.createdAt)}</span>
                            </div>
                            <p className="ap-comment-text">{r.comment}</p>
                            <div className="ap-comment-actions">
                              <button
                                className="ap-comment-delete-btn"
                                onClick={() => handleDelete(r._id)}
                                disabled={deletingId === r._id}
                              >
                                {deletingId === r._id ? 'Deleting…' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top-level admin comment */}
      <div className="ap-comments-footer">
        {replyingTo === null && (
          <>
            <textarea
              className="ap-reply-input"
              placeholder="Write an admin comment…"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={2}
            />
            <div className="ap-reply-actions">
              <button
                className="ap-reply-submit"
                onClick={() => handleReply(null)}
                disabled={submitting || !replyText.trim()}
              >
                <Send size={13} /> {submitting ? 'Posting…' : 'Post Comment'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPosts() {
  const navigate = useNavigate();
  const [tab, setTab]               = useState('all');
  const [posts, setPosts]           = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [openComments, setOpenComments] = useState(null); // postId

  useEffect(() => {
    setLoading(true);
    api.get('/community/admin-posts')
      .then(res => {
        setPosts(res.data.data?.posts || []);
        setJobs(res.data.data?.jobs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setDeletingId(id);
    try {
      if (type === 'job') {
        await api.delete(`/jobs/${id}`);
        setJobs(p => p.filter(j => j._id !== id));
      } else {
        await api.delete(`/community/posts/${id}`);
        setPosts(p => p.filter(post => post._id !== id));
      }
    } catch {
      alert('Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  const generalPosts = posts.map(p => ({ ...p, _type: 'post' }));
  const jobPosts     = jobs.map(j => ({ ...j, _type: 'job' }));
  const allItems     = [...generalPosts, ...jobPosts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const displayed    = tab === 'all' ? allItems : tab === 'post' ? generalPosts : jobPosts;

  const fmt = d => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="ap-page">
      <Sidebar />
      <main className="ap-main">

        <div className="ap-hero">
          <div className="ap-hero-left">
            <div className="ap-hero-eyebrow">SiteLink Admin</div>
            <h1>Admin Posts</h1>
            <p>Manage all posts and job posts published by the admin on the platform.</p>
          </div>
          <div className="ap-hero-right">
            <img src="/SiteLinkIcon.png" alt="SiteLink" className="ap-hero-logo" />
          </div>
        </div>

        <div className="ap-stats">
          <div className="ap-stat-card ap-stat-total">
            <span className="ap-stat-num">{allItems.length}</span>
            <span className="ap-stat-label">Total Posts</span>
          </div>
          <div className="ap-stat-card ap-stat-post">
            <div className="ap-stat-icon"><FileText size={18} /></div>
            <span className="ap-stat-num">{generalPosts.length}</span>
            <span className="ap-stat-label">General Posts</span>
          </div>
          <div className="ap-stat-card ap-stat-job">
            <div className="ap-stat-icon"><Briefcase size={18} /></div>
            <span className="ap-stat-num">{jobPosts.length}</span>
            <span className="ap-stat-label">Job Posts</span>
          </div>
          <button className="ap-create-btn" onClick={() => navigate('/admin/create-post')}>
            <Plus size={16} />
            Create Post
          </button>
        </div>

        <div className="ap-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`ap-tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.key === 'post' && <FileText size={14} />}
              {t.key === 'job'  && <Briefcase size={14} />}
              {t.label}
              <span className="ap-tab-count">
                {t.key === 'all' ? allItems.length : t.key === 'post' ? generalPosts.length : jobPosts.length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="ap-empty">
            <div className="ap-spinner" />
            <p>Loading posts...</p>
          </div>
        ) : displayed.length === 0 ? (
          <div className="ap-empty">
            <FileText size={40} strokeWidth={1.2} color="#d1d5db" />
            <p>No posts found.</p>
            <button className="ap-empty-btn" onClick={() => navigate('/admin/create-post')}>
              Create your first post
            </button>
          </div>
        ) : (
          <div className="ap-list">
            {displayed.map(item => (
              <div key={item._id} className="ap-card-wrapper">
                <div className={`ap-card ${item._type}`}>

                  <div className={`ap-card-accent ${item._type}`}>
                    {item._type === 'job' ? <Briefcase size={20} /> : <FileText size={20} />}
                  </div>

                  <div className="ap-card-body">
                    <div className="ap-card-top">
                      <span className={`ap-type-badge ${item._type}`}>
                        {item._type === 'job' ? '💼 Job Post' : '📢 General Post'}
                      </span>
                      {item.isPermanent && <span className="ap-badge permanent">♾ Permanent</span>}
                      {item.expiresAt && !item.isPermanent && (
                        <span className="ap-badge timed">⏱ Expires {fmt(item.expiresAt)}</span>
                      )}
                      <span className="ap-date">{fmt(item.createdAt)}</span>
                    </div>

                    {item._type === 'job' ? (
                      <>
                        <h3 className="ap-card-title">{item.title}</h3>
                        <div className="ap-chips-row">
                          <span className="ap-chip">🏢 {item.company}</span>
                          <span className="ap-chip">📍 {item.location}</span>
                          <span className="ap-chip">💰 ₹{item.salary} / {item.salaryType}</span>
                          {item.isUrgent && <span className="ap-chip urgent">🔥 Urgent</span>}
                          <span className={`ap-chip status-${(item.status || 'open').toLowerCase()}`}>
                            {item.status || 'Open'}
                          </span>
                        </div>
                        {item.description && (
                          <p className="ap-card-text">
                            {item.description.slice(0, 140)}{item.description.length > 140 ? '…' : ''}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        {item.feeling && <span className="ap-feeling">{item.feeling}</span>}
                        <p className="ap-card-text">
                          {item.content?.slice(0, 200)}{item.content?.length > 200 ? '…' : ''}
                        </p>
                        {item.images?.length > 0 && (
                          <div className="ap-thumbs">
                            {item.images.slice(0, 4).map((img, i) => (
                              <img key={i} src={img} alt="" className="ap-thumb" />
                            ))}
                            {item.images.length > 4 && (
                              <span className="ap-thumb-more">+{item.images.length - 4}</span>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Comments toggle — only for general posts */}
                    {item._type === 'post' && (
                      <button
                        className="ap-comments-toggle"
                        onClick={() => setOpenComments(openComments === item._id ? null : item._id)}
                      >
                        <MessageCircle size={14} />
                        {item.commentsCount ?? 0} Comment{item.commentsCount !== 1 ? 's' : ''}
                        {openComments === item._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>

                  <div className="ap-card-actions">
                    {item._type === 'job' && (
                      <button
                        className="ap-btn-view"
                        onClick={() => navigate(`/admin/requirements/${item._id}`)}
                        title="View job"
                      >
                        <Eye size={15} /> View
                      </button>
                    )}
                    <button
                      className="ap-btn-delete"
                      onClick={() => handleDelete(item._id, item._type)}
                      disabled={deletingId === item._id}
                      title="Delete"
                    >
                      <Trash2 size={15} />
                      {deletingId === item._id ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </div>

                {/* Inline comments panel */}
                {openComments === item._id && item._type === 'post' && (
                  <CommentsPanel
                    postId={item._id}
                    onClose={() => setOpenComments(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
