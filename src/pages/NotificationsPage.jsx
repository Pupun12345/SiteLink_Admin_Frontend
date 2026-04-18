import { useMemo, useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  CircleHelp,
  Eye,
  Mail,
  Settings,
  ShieldAlert,
  Trash2,
  UserCheck,
  WalletCards,
  RefreshCw,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import './NotificationsPage.css';

const tabs = ['All Notifications', 'System', 'Verifications', 'Subscriptions'];

const typeConfig = {
  Verification: { icon: UserCheck, className: 'verification' },
  System: { icon: ShieldAlert, className: 'system' },
  Subscription: { icon: WalletCards, className: 'subscription' },
  Security: { icon: ShieldAlert, className: 'security' },
  User: { icon: UserCheck, className: 'user' },
  Job: { icon: WalletCards, className: 'job' },
  Payment: { icon: WalletCards, className: 'payment' }
};

const priorityConfig = {
  low: { icon: Info, className: 'low' },
  medium: { icon: Bell, className: 'medium' },
  high: { icon: AlertTriangle, className: 'high' },
  critical: { icon: XCircle, className: 'critical' }
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('All Notifications');
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    type: 'all'
  });
  const [createForm, setCreateForm] = useState({
    title: '',
    message: '',
    type: 'System',
    category: 'info',
    priority: 'medium',
    recipientType: 'admin',
    actionText: '',
    expiresAt: ''
  });
  const [creating, setCreating] = useState(false);

  const adminUser = useMemo(() => JSON.parse(localStorage.getItem('adminUser') || '{}'), []);

  // Fetch notifications
  const fetchNotifications = async (page = 1, search = '', tabFilter = activeTab) => {
    try {
      setLoading(page === 1);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        status: filters.status,
        priority: filters.priority
      });

      if (tabFilter !== 'All Notifications') {
        if (tabFilter === 'Verifications') {
          params.set('type', 'Verification');
        } else if (tabFilter === 'System') {
          params.set('type', 'System');
        } else if (tabFilter === 'Subscriptions') {
          params.set('type', 'Subscription');
        }
      }

      console.log('Fetching notifications with params:', params.toString());
      const response = await api.get(`/notifications?${params}`);
      
      if (response.data.success) {
        setNotifications(response.data.data || []);
        setStats(response.data.summary || {});
        setCurrentPage(response.data.pagination?.current || 1);
        setTotalPages(response.data.pagination?.pages || 1);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to load notifications');
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      if (err.response?.status === 404) {
        setNotifications([]);
        setStats({});
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Failed to load notifications');
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate system notifications
  const generateSystemNotifications = async () => {
    try {
      setRefreshing(true);
      const response = await api.post('/notifications/generate-system');
      if (response.data.success) {
        await fetchNotifications(1, searchTerm, activeTab);
        const count = response.data.data?.length || 0;
        if (count > 0) {
          alert(`Generated ${count} system notifications`);
        } else {
          alert('No new system notifications were generated');
        }
      } else {
        alert('Failed to generate system notifications: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to generate notifications:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      alert('Failed to generate system notifications: ' + errorMessage);
    } finally {
      setRefreshing(false);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!confirm('Are you sure you want to mark all notifications as read?')) return;
    
    try {
      const response = await api.put('/notifications/mark-all-read');
      if (response.data.success) {
        await fetchNotifications(currentPage, searchTerm, activeTab);
        alert(response.data.message || 'All notifications marked as read');
      } else {
        alert('Failed to mark notifications as read: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      alert('Failed to mark notifications as read: ' + errorMessage);
    }
  };

  // Mark single notification as read
  const markAsRead = async (id) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      if (response.data.success) {
        await fetchNotifications(currentPage, searchTerm, activeTab);
      } else {
        console.error('Failed to mark as read:', response.data.message);
      }
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    if (!confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      const response = await api.delete(`/notifications/${id}`);
      if (response.data.success) {
        await fetchNotifications(currentPage, searchTerm, activeTab);
        alert('Notification deleted successfully');
      } else {
        alert('Failed to delete notification: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      alert('Failed to delete notification: ' + errorMessage);
    }
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1); 
    
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      fetchNotifications(1, value, activeTab);
    }, 500);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm(''); // Clear search when changing tabs
    fetchNotifications(1, '', tab);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchNotifications(page, searchTerm, activeTab);
  };

  // Handle create form change
  const handleCreateFormChange = (field, value) => {
    setCreateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Create notification
  const createNotification = async () => {
    if (!createForm.title.trim() || !createForm.message.trim()) {
      alert('Title and message are required');
      return;
    }

    try {
      setCreating(true);
      
      const notificationData = {
        title: createForm.title.trim(),
        message: createForm.message.trim(),
        type: createForm.type,
        category: createForm.category,
        priority: createForm.priority,
        recipientType: createForm.recipientType
      };

      if (createForm.actionText.trim()) {
        notificationData.actionText = createForm.actionText.trim();
      }
      if (createForm.expiresAt) {
        notificationData.expiresAt = createForm.expiresAt;
      }

      console.log('Creating notification with data:', notificationData);
      const response = await api.post('/notifications', notificationData);
      
      if (response.data.success) {
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          message: '',
          type: 'System',
          category: 'info',
          priority: 'medium',
          recipientType: 'admin',
          actionText: '',
          expiresAt: ''
        });
        await fetchNotifications(1, searchTerm, activeTab);
        alert('Notification created successfully!');
      } else {
        alert('Failed to create notification: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to create notification:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      alert('Failed to create notification: ' + errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const closeCreateModal = () => {
    if (creating) return;
    setShowCreateModal(false);
    setCreateForm({
      title: '',
      message: '',
      type: 'System',
      category: 'info',
      priority: 'medium',
      recipientType: 'admin',
      actionText: '',
      expiresAt: ''
    });
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showCreateModal && !creating) {
        setShowCreateModal(false);
      }
    };

    if (showCreateModal) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showCreateModal, creating]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getPriorityIcon = (priority) => {
    if (!priority) return null;
    const config = priorityConfig[priority.toLowerCase()] || priorityConfig.medium;
    const Icon = config.icon;
    return <Icon size={12} className={`priority-icon ${config.className}`} />;
  };

  // View notification details
  const viewNotificationDetails = (notification) => {
    setSelectedNotification(notification);
    setShowViewModal(true);
  };

  // Show delete confirmation
  const showDeleteConfirmation = (notification) => {
    setSelectedNotification(notification);
    setShowDeleteModal(true);
  };

  // Delete notification
  const confirmDeleteNotification = async () => {
    if (!selectedNotification) return;
    
    try {
      const response = await api.delete(`/notifications/${selectedNotification._id}`);
      if (response.data.success) {
        await fetchNotifications(currentPage, searchTerm, activeTab);
        setShowDeleteModal(false);
        setSelectedNotification(null);
      } else {
        alert('Failed to delete notification: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      alert('Failed to delete notification: ' + errorMessage);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    return () => {
      if (window.searchTimeout) {
        clearTimeout(window.searchTimeout);
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !creating && !refreshing) {
        fetchNotifications(currentPage, searchTerm, activeTab);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPage, searchTerm, activeTab, loading, creating, refreshing]);

  const filteredNotifications = notifications;

  if (loading && notifications.length === 0) {
    return (
      <div className="notifications-page-shell">
        <Sidebar />
        <main className="notifications-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="notifications-page-shell">
      <Sidebar />

      <main className="notifications-content">
        <header className="notifications-topbar">
          <h1>Notifications Management</h1>

          <div className="notifications-topbar-right">
            <div className="notifications-search">
              <Search size={16} />
              <input 
                type="search" 
                placeholder="Search notifications..." 
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            <button 
              type="button" 
              className="mini-icon-btn" 
              onClick={generateSystemNotifications}
              disabled={refreshing}
              title="Generate system notifications"
            >
              <RefreshCw size={15} className={refreshing ? 'spinning' : ''} />
            </button>
          </div>
        </header>

        <section className="notifications-title-row">
          <div>
            <h2>Alert History</h2>
            <p>Manage and track all system and user alerts across the platform.</p>
            {error && (
              <div className="error-message">
                <AlertTriangle size={16} />
                {error}
              </div>
            )}
          </div>

          <div className="title-actions">
            <button 
              type="button" 
              className="ghost-action-btn"
              onClick={markAllAsRead}
              disabled={loading}
            >
              <CheckCheck size={15} />
              Mark all as read
            </button>
            <button 
              type="button" 
              className="primary-action-btn"
              onClick={() => {
                console.log('Create notification button clicked');
                setShowCreateModal(true);
              }}
            >
              <Plus size={15} />
              Create Notification
            </button>
          </div>
        </section>

        <section className="notification-panel">
          <div className="notification-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
                {tab === 'All Notifications' && stats.total > 0 && (
                  <span className="tab-count">{stats.total}</span>
                )}
                {tab === 'System' && stats.system > 0 && (
                  <span className="tab-count">{stats.system}</span>
                )}
                {tab === 'Verifications' && stats.verification > 0 && (
                  <span className="tab-count">{stats.verification}</span>
                )}
                {tab === 'Subscriptions' && stats.subscription > 0 && (
                  <span className="tab-count">{stats.subscription}</span>
                )}
              </button>
            ))}
          </div>

          <div className="notifications-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Priority</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="loading-spinner"></div>
                      <p>Loading notifications...</p>
                    </td>
                  </tr>
                ) : filteredNotifications.length > 0 ? (
                  filteredNotifications.map((item) => {
                    const config = typeConfig[item.type] || typeConfig.System;
                    const TypeIcon = config.icon;

                    return (
                      <tr key={item._id} className={item.status === 'Unread' ? 'unread-row' : ''}>
                        <td>
                          <div className="type-cell">
                            <span className={`type-icon ${config.className}`}>
                              <TypeIcon size={13} />
                            </span>
                            {item.type}
                          </div>
                        </td>
                        <td className="message-cell">
                          <div className="message-content">
                            <strong>{item.title}</strong>
                            <p>{item.message}</p>
                          </div>
                        </td>
                        <td>
                          <div className="priority-cell">
                            {getPriorityIcon(item.priority)}
                            <span className={`priority-text ${item.priority}`}>
                              {item.priority}
                            </span>
                          </div>
                        </td>
                        <td className="date-cell">{formatDate(item.createdAt)}</td>
                        <td>
                          <span className={`status-chip ${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            {item.status === 'Unread' && (
                              <button 
                                type="button" 
                                onClick={() => markAsRead(item._id)}
                                title="Mark as read"
                              >
                                <CheckCircle size={14} />
                              </button>
                            )}
                            <button 
                              type="button" 
                              title="View details"
                              onClick={() => viewNotificationDetails(item)}
                            >
                              <Eye size={14} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => showDeleteConfirmation(item)}
                              title="Delete notification"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                      {searchTerm ? 'No notifications found matching your search.' : 'No notifications available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="notification-footer">
            <p>
              Showing {filteredNotifications.length > 0 ? ((currentPage - 1) * 10) + 1 : 0} to{' '}
              {Math.min(currentPage * 10, (stats.total || 0))} of {stats.total || 0} notifications
            </p>
            <div className="pagination">
              <button 
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page;
                if (totalPages <= 5) {
                  page = i + 1;
                } else {
                  // Show pages around current page
                  const start = Math.max(1, currentPage - 2);
                  const end = Math.min(totalPages, start + 4);
                  page = start + i;
                  if (page > end) return null;
                }
                
                return (
                  <button
                    key={page}
                    type="button"
                    className={currentPage === page ? 'active' : ''}
                    onClick={() => handlePageChange(page)}
                    disabled={loading}
                  >
                    {page}
                  </button>
                );
              }).filter(Boolean)}
              <button 
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
              >
                Next
              </button>
            </div>
          </div>
        </section>

        <section className="notification-stats-grid">
          <article className="small-stat-card">
            <span className="small-stat-icon blue">
              <Mail size={17} />
            </span>
            <div>
              <p>Unread Notifications</p>
              <strong>{stats.unread || 0}</strong>
            </div>
          </article>

          <article className="small-stat-card">
            <span className="small-stat-icon amber">
              <UserCheck size={17} />
            </span>
            <div>
              <p>Pending Verifications</p>
              <strong>{stats.verification || 0}</strong>
            </div>
          </article>

          <article className="small-stat-card">
            <span className="small-stat-icon green">
              <CheckCheck size={17} />
            </span>
            <div>
              <p>Total Notifications</p>
              <strong>{stats.total || 0}</strong>
            </div>
          </article>
        </section>

        <footer className="notifications-user-footer">
          <span>{adminUser.name || 'Admin User'}</span>
          <p>System Admin</p>
        </footer>

        {/* Create Notification Modal */}
        {showCreateModal && (
          <div className="notification-modal-backdrop">
            <div className="notification-modal">
              <div className="notification-modal-header">
                <h3>Create New Notification</h3>
                <button 
                  className="notification-modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="notification-modal-body">
                <div className="notification-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={createForm.title}
                    onChange={(e) => handleCreateFormChange('title', e.target.value)}
                    placeholder="Enter notification title"
                    maxLength={200}
                  />
                </div>

                <div className="notification-form-group">
                  <label>Message *</label>
                  <textarea
                    value={createForm.message}
                    onChange={(e) => handleCreateFormChange('message', e.target.value)}
                    placeholder="Enter notification message"
                    rows={4}
                    maxLength={1000}
                  />
                </div>

                <div className="notification-form-row">
                  <div className="notification-form-group">
                    <label>Type</label>
                    <select
                      value={createForm.type}
                      onChange={(e) => handleCreateFormChange('type', e.target.value)}
                    >
                      <option value="System">System</option>
                      <option value="Verification">Verification</option>
                      <option value="Subscription">Subscription</option>
                      <option value="Security">Security</option>
                      <option value="User">User</option>
                      <option value="Job">Job</option>
                      <option value="Payment">Payment</option>
                    </select>
                  </div>
                  
                  <div className="notification-form-group">
                    <label>Priority</label>
                    <select
                      value={createForm.priority}
                      onChange={(e) => handleCreateFormChange('priority', e.target.value)}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="notification-form-row">
                  <div className="notification-form-group">
                    <label>Category</label>
                    <select
                      value={createForm.category}
                      onChange={(e) => handleCreateFormChange('category', e.target.value)}
                    >
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                  
                  <div className="notification-form-group">
                    <label>Recipient Type</label>
                    <select
                      value={createForm.recipientType}
                      onChange={(e) => handleCreateFormChange('recipientType', e.target.value)}
                    >
                      <option value="admin">Admin</option>
                      <option value="user">User</option>
                      <option value="vendor">Vendor</option>
                      <option value="worker">Worker</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                </div>

                <div className="notification-form-row">
                  
                  <div className="notification-form-group">
                    <label>Action Text (Optional)</label>
                    <input
                      type="text"
                      value={createForm.actionText}
                      onChange={(e) => handleCreateFormChange('actionText', e.target.value)}
                      placeholder="View Details"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="notification-form-group">
                  <label>Expires At (Optional)</label>
                  <input
                    type="datetime-local"
                    value={createForm.expiresAt}
                    onChange={(e) => handleCreateFormChange('expiresAt', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="notification-modal-footer">
                <button 
                  className="notification-btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button 
                  className="notification-btn-create"
                  onClick={createNotification}
                  disabled={creating || !createForm.title.trim() || !createForm.message.trim()}
                >
                  {creating ? 'Creating...' : 'Create Notification'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Notification Modal */}
        {showViewModal && selectedNotification && (
          <div className="notification-modal-backdrop" onClick={() => setShowViewModal(false)}>
            <div className="notification-view-modal" onClick={(e) => e.stopPropagation()}>
              <div className="notification-modal-header">
                <div className="view-modal-title">
                  <div className="notification-type-badge">
                    {(() => {
                      const config = typeConfig[selectedNotification.type] || typeConfig.System;
                      const TypeIcon = config.icon;
                      return (
                        <span className={`type-icon ${config.className}`}>
                          <TypeIcon size={16} />
                        </span>
                      );
                    })()}
                    {selectedNotification.type}
                  </div>
                  <div className={`priority-badge ${selectedNotification.priority}`}>
                    {getPriorityIcon(selectedNotification.priority)}
                    {selectedNotification.priority}
                  </div>
                </div>
                <button 
                  className="notification-modal-close"
                  onClick={() => setShowViewModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="notification-view-body">
                <div className="view-section">
                  <h4>{selectedNotification.title}</h4>
                  <p className="notification-message">{selectedNotification.message}</p>
                </div>

                <div className="view-details-grid">
                  <div className="view-detail">
                    <label>Status</label>
                    <span className={`status-chip ${selectedNotification.status.toLowerCase()}`}>
                      {selectedNotification.status}
                    </span>
                  </div>
                  <div className="view-detail">
                    <label>Category</label>
                    <span className={`category-chip ${selectedNotification.category}`}>
                      {selectedNotification.category}
                    </span>
                  </div>
                  <div className="view-detail">
                    <label>Created</label>
                    <span>{formatDate(selectedNotification.createdAt)}</span>
                  </div>
                  <div className="view-detail">
                    <label>Recipient Type</label>
                    <span>{selectedNotification.recipientType}</span>
                  </div>
                </div>

                {( selectedNotification.actionText) && (
                  <div className="view-section">
                    <h5>Action Details</h5>
                    {selectedNotification.actionText && (
                      <div className="view-detail">
                        <label>Action Text</label>
                        <span>{selectedNotification.actionText}</span>
                      </div>
                    )}
                  </div>
                )}

                {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                  <div className="view-section">
                    <h5>Additional Information</h5>
                    <div className="metadata-grid">
                      {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                        <div key={key} className="view-detail">
                          <label>{key}</label>
                          <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="notification-modal-footer">
                {selectedNotification.status === 'Unread' && (
                  <button 
                    className="notification-btn-mark-read"
                    onClick={() => {
                      markAsRead(selectedNotification._id);
                      setShowViewModal(false);
                    }}
                  >
                    <CheckCircle size={16} />
                    Mark as Read
                  </button>
                )}
                <button 
                  className="notification-btn-cancel"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedNotification && (
          <div className="notification-modal-backdrop" onClick={() => setShowDeleteModal(false)}>
            <div className="notification-delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-header">
                <div className="delete-icon">
                  <Trash2 size={24} />
                </div>
                <h3>Delete Notification</h3>
              </div>
              
              <div className="delete-modal-body">
                <p>Are you sure you want to delete this notification?</p>
                <div className="notification-preview">
                  <div className="preview-header">
                    <span className={`type-icon ${(typeConfig[selectedNotification.type] || typeConfig.System).className}`}>
                      {(() => {
                        const config = typeConfig[selectedNotification.type] || typeConfig.System;
                        const TypeIcon = config.icon;
                        return <TypeIcon size={14} />;
                      })()}
                    </span>
                    <strong>{selectedNotification.title}</strong>
                  </div>
                  <p className="preview-message">{selectedNotification.message}</p>
                  <div className="preview-meta">
                    <span className={`priority-text ${selectedNotification.priority}`}>
                      {selectedNotification.priority} priority
                    </span>
                    <span>•</span>
                    <span>{formatDate(selectedNotification.createdAt)}</span>
                  </div>
                </div>
                <p className="delete-warning">
                  <AlertTriangle size={16} />
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="notification-modal-footer">
                <button 
                  className="notification-btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="notification-btn-delete"
                  onClick={confirmDeleteNotification}
                >
                  <Trash2 size={16} />
                  Delete Notification
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
