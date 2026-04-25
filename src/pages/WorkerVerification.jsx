import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  Bell,
  Search,
  Download,
  X,
  ChevronDown,
  FileText,
  Star,
  Plus,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import './WorkerVerification.css';
import { hasPermission, usePermissions } from '../hooks/usePermissions';

export default function WorkerVerification() {
  const [workers, setWorkers] = useState([]);
  const [profile, setProfile] = useState({ name: '', email: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    experience: '',
    city: '',
    rating: '',
    dailyRate: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const navigate = useNavigate();

  const fetchAdminProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      if (response.data.user) {
        const user = response.data.user;
        const imageUrl = user.profileImage
          ? `http://localhost:5000/${user.profileImage.replace(/\\/g, '/')}`
          : `https://ui-avatars.com/api/?name=${user.name || 'Admin'}&background=2b3f57&color=fff`;
        setProfile({
          name: user.name || '',
          email: user.email || '',
          imageUrl: imageUrl
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
  }, []);


  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  //permissions access
  const permissions = usePermissions();
  const adminUser = localStorage.getItem("adminUser");
  const canAccess = !adminUser || hasPermission(permissions, 'canVerifyUsers');

  const handleExportCSV = () => {
    if (filteredWorkers.length === 0) {
      alert('No workers to export');
      return;
    }

    const headers = ['Worker Name', 'Role', 'Experience', 'City', 'Phone', 'Email', 'Rating', 'Status', 'Applied Date'];
    const rows = filteredWorkers.map(worker => [
      worker.name || '',
      worker.role || 'General Worker',
      worker.experience || 'N/A',
      worker.city || 'N/A',
      worker.phone || 'N/A',
      worker.email || 'N/A',
      worker.adminRating ? `${parseFloat(worker.adminRating).toFixed(1)}/5` : 'Not Rated',
      worker.status || 'Pending',
      worker.join || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workers-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users', {
        params: {
          userType: 'worker',
          status: 'all',
          limit: 1000,
        },
      });

      setWorkers(data.data || []);
      console.log(data.data)
    } catch (err) {
      console.error('Failed to load workers:', err);
    } finally {
      setLoading(false);
    }
  };


  const handleAddWorker = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const loadingToast = toast.loading('Adding worker...');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);

      if (formData.email) {
        formDataToSend.append('email', formData.email);
      }

      formDataToSend.append('password', 'TempPass@123'); // Temporary password
      formDataToSend.append('confirmPassword', 'TempPass@123');
      formDataToSend.append('userType', 'worker');

      if (formData.city) {
        formDataToSend.append('city', formData.city);
      }

      if (formData.experience) {
        formDataToSend.append('experience', formData.experience);
      }

      if (formData.rating) {
        formDataToSend.append('adminRating', formData.rating);
      }

      if (formData.dailyRate) {
        formDataToSend.append('dailyRate', formData.dailyRate);
      }

      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }
      if (documentFile) {
        formDataToSend.append('aadhaarFrontImage', documentFile);
      }

      const registerResponse = await api.post('/auth/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Get the worker ID from response
      const workerOTP = registerResponse.data?.data?.otp;
      console.log('Worker OTP:', workerOTP);

      const workerResponse = await api.post("/auth/verify-otp", {
        phone: formData.phone,
        otp: workerOTP
      });


      const workerID = workerResponse?.data?.user?.id || workerResponse?.data?.user?._id || workerResponse?.data?.data?.id || workerResponse?.data?.data?._id;
      console.log('Worker ID after OTP verification:', workerID);

      const finalWorkerID = workerID || registerResponse.data?.userId;
      console.log('Final worker ID:', finalWorkerID);

      if (finalWorkerID) {
        try {
          console.log('Attempting auto-verify with:', {
            url: `/admin/workers/${finalWorkerID}/auto-verify`,
            rating: parseFloat(formData.rating)
          });

          const verifyResponse = await api.put(`/admin/workers/${finalWorkerID}/auto-verify`, {
            rating: parseFloat(formData.rating)
          });

          console.log('Auto-verify response:', verifyResponse.data);
          toast.success('Worker added and approved successfully!', { id: loadingToast });
        } catch (verifyErr) {
          console.error('Failed to auto-approve:', verifyErr);
          console.error('Error status:', verifyErr.response?.status);
          console.error('Error data:', verifyErr.response?.data);
          console.error('Request URL:', verifyErr.config?.url);
          toast.error(`Worker added but approval failed: ${verifyErr.response?.data?.message || verifyErr.message}. Please approve manually.`, { id: loadingToast });
        }
      } else {
        console.error('No worker ID received');
        toast.error('Worker added but no ID received. Please verify manually.', { id: loadingToast });
      }

      setFormData({ name: '', email: '', phone: '', role: '', experience: '', city: '', rating: '', dailyRate: '' });
      setProfileImage(null);
      setDocumentFile(null);
      setShowAddForm(false);
      fetchWorkers();
    } catch (err) {
      console.error('Full error:', err);
      console.error('Error response:', JSON.stringify(err.response?.data, null, 2));

      let errorMsg = 'Failed to add worker';

      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errors = err.response.data.errors.map(e => `${e.param}: ${e.msg}`).join('\n');
        errorMsg = errors;
        toast.error(
          <div style={{ whiteSpace: 'pre-line' }}>
            <strong>Validation Errors:</strong>\n{errors}
          </div>,
          { id: loadingToast, duration: 6000 }
        );
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
        toast.error(errorMsg, { id: loadingToast });
      } else {
        errorMsg = err.message;
        toast.error(errorMsg, { id: loadingToast });
      }

      console.error('Error details:', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setFormData({ name: '', email: '', phone: '', role: '', experience: '', city: '', rating: '', dailyRate: '' });
    setProfileImage(null);
    setDocumentFile(null);
  };

  const getStatusBadgeClass = (worker) => {
    if (worker.status === 'Verified') return 'status-approved';
    if (worker.status === 'Pending') return 'status-pending';
    if (worker.status === 'Rejected') return 'status-rejected';
    return 'status-pending';
  };

  const getStatusText = (worker) => {
    if (worker.status === 'Verified') return 'APPROVED';
    if (worker.status === 'Rejected') return 'REJECTED';
    return 'PENDING';
  };

  const approvedWorkers = workers.filter(worker => worker.status === 'Verified');
  const ratedWorkers = approvedWorkers.filter(worker => typeof worker.adminRating === 'number');
  const averageRating = ratedWorkers.length > 0
    ? (ratedWorkers.reduce((sum, worker) => sum + worker.adminRating, 0) / ratedWorkers.length).toFixed(1)
    : null;

  const filteredWorkers = workers.filter(worker => {
    if (statusFilter === 'pending' && worker.status !== 'Pending') return false;
    if (statusFilter === 'approved' && worker.status !== 'Verified') return false;
    if (searchTerm && !`${worker.name} ${worker.role || ''} ${worker._id}`.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage);
  const paginatedWorkers = filteredWorkers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="loading-screen">Loading workers...</div>;
  }

  return (
    !canAccess ? (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: '#f5f7fa',
        }}
      >
        <Sidebar />

        <main
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: "180px"
          }}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '40px 50px',
              borderRadius: '12px',
              boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
              textAlign: 'center',
              maxWidth: '500px',
              width: '100%',
            }}
          >
            <div
              style={{
                fontSize: '40px',
                marginBottom: '15px',
              }}
            >
              🚫
            </div>

            <h2
              style={{
                color: '#ff4d4f',
                marginBottom: '10px',
                fontWeight: '600',
              }}
            >
              Access Denied
            </h2>

            <p
              style={{
                color: '#555',
                fontSize: '16px',
                lineHeight: '1.6',
              }}
            >
              You do not have permission to access the Worker Verification Page.
            </p>
          </div>
        </main>
      </div>
    ) : (
      <div className="verification-page">
        <Toaster position="top-right" reverseOrder={false} />
        <Sidebar onLogout={handleLogout} />

        <main className="verification-main">
          <header className="verification-topbar">
            <div className="search-bar">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search workers, ID or trade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="topbar-actions">
              <button className="icon-btn" onClick={() => navigate("/admin/notifications")}>
                <Bell size={20} />
                <span className="notification-badge"></span>
              </button>
              <div className="user-menu">
                <div className="user-avatar">
                  <img src={`${profile.imageUrl}`} alt="Admin" />
                </div>
              </div>
            </div>
          </header>

          <div className="verification-content">
            <div className="page-header">
              <div>
                <h1>Worker Verification</h1>
                <p className="page-subtitle">Review and manage professional certifications for site personnel.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="export-btn" onClick={handleExportCSV}>
                  <Download size={18} />
                  Export CSV
                </button>
                <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
                  <Plus size={18} />
                  {showAddForm ? 'Cancel' : 'Add Worker'}
                </button>
              </div>
            </div>

            {showAddForm && (
              <div style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>Add New Worker</h3>
                <form onSubmit={handleAddWorker}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Full Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter worker name"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email address"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Daily Wage</label>
                      <input
                        type="tel"
                        required
                        value={formData.dailyRate}
                        onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                        placeholder="Enter Daily Wage"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Phone</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter phone number"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Role</label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g., Carpenter, Electrician"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Experience</label>
                      <select
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Select experience</option>
                        <option value="0-1 Year">0-1 Year</option>
                        <option value="1-3 Years">1-3 Years</option>
                        <option value="3-5 Years">3-5 Years</option>
                        <option value="5+ Years">5+ Years</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="Enter city"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Rating (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                        placeholder="Enter rating"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Profile Photo (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setProfileImage(e.target.files[0])}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      {profileImage && <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Selected: {profileImage.name}</p>}
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Document (Optional)</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setDocumentFile(e.target.files[0])}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      {documentFile && <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Selected: {documentFile.name}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button
                      type="button"
                      onClick={handleCancelAdd}
                      style={{
                        padding: '10px 20px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{
                        padding: '10px 20px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.6 : 1
                      }}
                    >
                      {submitting ? 'Adding...' : 'Add Worker'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="stats-row">
              <motion.div
                className="stat-box"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className="stat-box-label">TOTAL REQUESTS</p>
                <div className="stat-box-value">{workers.length.toLocaleString()}</div>
                <p className="stat-box-change success">↑ 12% this month</p>
              </motion.div>

              <motion.div
                className="stat-box highlight-orange"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <p className="stat-box-label">PENDING REVIEW</p>
                <div className="stat-box-value">{workers.filter(w => w.status === 'Pending').length.toLocaleString()}</div>
                <p className="stat-box-change warning">{workers.filter(w => w.status === 'Pending').length} requires review</p>
              </motion.div>

              <motion.div
                className="stat-box"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="stat-box-label">APPROVED WORKERS</p>
                <div className="stat-box-value">{approvedWorkers.length.toLocaleString()}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: approvedWorkers.length > 0 ? `${Math.min(100, (approvedWorkers.length / Math.max(1, workers.length)) * 100)}%` : '0%' }}></div>
                </div>
              </motion.div>

              <motion.div
                className="stat-box"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <p className="stat-box-label">AVG. RATING</p>
                <div className="stat-box-value">
                  {averageRating || '—'}
                  <span className="rating-sub">/5.0</span>
                </div>
                <p className="stat-box-change success">
                  {ratedWorkers.length > 0 ? `★ Based on ${ratedWorkers.length} review${ratedWorkers.length === 1 ? '' : 's'}` : 'No ratings yet'}
                </p>
              </motion.div>
            </div>

            <div className="filters-section">
              <div className="filter-group">
                <div className="filter-dropdown">
                  <button className="filter-btn" onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
                    Filter: {statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                    <ChevronDown size={16} />
                  </button>
                  {showFilterDropdown && (
                    <div className="dropdown-menu">
                      <button onClick={() => { setStatusFilter('all'); setShowFilterDropdown(false); }}>All Status</button>
                      <button onClick={() => { setStatusFilter('pending'); setShowFilterDropdown(false); }}>Pending</button>
                      <button onClick={() => { setStatusFilter('approved'); setShowFilterDropdown(false); }}>Approved</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="results-count">
                SHOWING {paginatedWorkers.length} OF {filteredWorkers.length}
              </div>
            </div>

            <div className="table-container">
              <table className="workers-table">
                <thead>
                  <tr>
                    <th>WORKER NAME</th>
                    <th>ROLE</th>
                    <th>EXPERIENCE</th>
                    <th>CITY</th>
                    <th>RATING</th>
                    <th>DOCUMENTS</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWorkers.map((worker, index) => (
                    <motion.tr
                      key={worker._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/admin/workers/${worker._id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div className="worker-cell">
                          <img
                            src={
                              worker.profileImage
                                ? "http://localhost:5000/" + worker.profileImage.replace(/\\/g, '/')
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.name)}&background=3b82f6&color=fff`
                            }
                            alt={worker.name}
                            className="worker-table-avatar"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.name)}&background=3b82f6&color=fff`;
                            }}
                          />
                          <div>
                            <div className="worker-name" style={{ fontSize: "1.2rem" }}>{worker.name}</div>
                            <div className="worker-id">ID: #WK-{worker._id.slice(-4)}</div>
                          </div>
                        </div>
                      </td>
                      <td>{worker.role || 'General Worker'}</td>
                      <td>{worker.experience || 'N/A'}</td>
                      <td>{worker.city || 'N/A'}</td>
                      <td>
                        {worker.adminRating ? (
                          <div className="rating-cell">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const rating = parseFloat(worker.adminRating);
                              const isFilled = star <= Math.floor(rating);
                              const isHalfFilled = star > Math.floor(rating) && star <= Math.ceil(rating) && rating % 1 >= 0.5;

                              return (
                                <Star
                                  key={star}
                                  size={14}
                                  fill={isFilled ? '#fbbf24' : isHalfFilled ? '#fbbf24' : '#e5e7eb'}
                                  stroke={isFilled || isHalfFilled ? '#fbbf24' : '#e5e7eb'}
                                  style={{
                                    opacity: isHalfFilled ? 0.6 : 1
                                  }}
                                />
                              );
                            })}
                            <span>{parseFloat(worker.adminRating).toFixed(1)}/5</span>
                          </div>
                        ) : (
                          <span className="no-rating">—</span>
                        )}
                      </td>
                      <td>
                        <button className="view-files-btn">
                          <FileText size={16} />
                          VIEW FILES
                        </button>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(worker)}`}>
                          {getStatusText(worker)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">
                Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredWorkers.length)}</strong> of <strong>{filteredWorkers.length}</strong> entries
              </div>
              <div className="pagination-controls">
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                {[...Array(Math.min(3, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 3 && <span className="page-ellipsis">...</span>}
                <button
                  className="page-btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  );
}