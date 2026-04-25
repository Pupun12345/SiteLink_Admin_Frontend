import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import './WorkerVerification.css';
import { hasPermission, usePermissions } from '../hooks/usePermissions';

export default function VendorVerification() {
  const [vendors, setVendors] = useState([]);
  const [profile, setProfile] = useState({ name: '', email: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    website: '',
    city: '',
    gstNumber: '',
    projectTypes: '',
    adminRating: '',
  });
  const [panCardFile, setPanCardFile] = useState(null);
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');

    navigate('/admin/login');
  };

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

  const handleExportCSV = () => {
    if (filteredVendors.length === 0) {
      alert('No vendors to export');
      return;
    }

    const headers = ['Company Name', 'Owner Name', 'City', 'GST Number', 'Email', 'Status'];
    const rows = filteredVendors.map(v => [
      v.companyName || '',
      v.ownerName || '',
      v.city || '',
      v.gstNumber || '',
      v.email || '',
      v.verificationStatus || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendors-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleViewFiles = (vendor) => {
    const files = [];
    if (vendor.panCardImage) files.push({ name: 'PAN Card', url: vendor.panCardImage });
    if (vendor.companyLogo) files.push({ name: 'Company Logo', url: vendor.companyLogo });

    if (files.length === 0) {
      alert('No files available for this vendor');
      return;
    }

    files.forEach(file => {
      const fileUrl = file.url.startsWith('http') ? file.url : `http://localhost:5000/${file.url}`;
      window.open(fileUrl, '_blank');
    });
  };

  //Permissions to Access
  let canAccess = true;
  const adminUser = localStorage.getItem("adminUser")

  if (adminUser) {
    const permissions = usePermissions();
    canAccess = hasPermission(permissions, 'canVerifyUsers');
  }

  const handleAddVendor = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const loadingToast = toast.loading('Adding vendor...');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.ownerName);
      formDataToSend.append('phone', formData.phone);

      if (formData.email) {
        formDataToSend.append('email', formData.email);
      }

      formDataToSend.append('password', 'TempPass@123');
      formDataToSend.append('confirmPassword', 'TempPass@123');
      formDataToSend.append('userType', 'vendor');
      formDataToSend.append('ownerName', formData.ownerName);
      formDataToSend.append('companyName', formData.companyName);

      if (formData.city) {
        formDataToSend.append('city', formData.city);
      }

      if (formData.gstNumber) {
        formDataToSend.append('gstNumber', formData.gstNumber);
      }

      if (formData.whatsappNumber) {
        formDataToSend.append('whatsappNumber', formData.whatsappNumber);
      }

      if (formData.website) {
        formDataToSend.append('website', formData.website);
      }

      if (formData.projectTypes) {
        formDataToSend.append('projectTypes', formData.projectTypes);
      }

      if (formData.adminRating) {
        formDataToSend.append('adminRating', formData.adminRating);
      }

      if (panCardFile) {
        formDataToSend.append('panCardImage', panCardFile);
      }
      if (companyLogoFile) {
        formDataToSend.append('companyLogo', companyLogoFile);
      }

      const registerResponse = await api.post('/auth/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const vendorOTP = registerResponse.data?.data?.otp;
      console.log('Vendor OTP:', vendorOTP);

      const vendorResponse = await api.post("/auth/verify-otp", {
        phone: formData.phone,
        otp: vendorOTP
      });

      const vendorID = vendorResponse?.data?.user?.id || vendorResponse?.data?.user?._id || vendorResponse?.data?.data?.id || vendorResponse?.data?.data?._id;
      console.log('Vendor ID after OTP verification:', vendorID);

      const finalVendorID = vendorID || registerResponse.data?.userId;
      console.log('Final vendor ID:', finalVendorID);

      if (finalVendorID) {
        try {
          console.log('Attempting auto-verify with:', {
            url: `/admin/vendors/${finalVendorID}/auto-verify`,
            rating: parseFloat(formData.adminRating)
          });

          const verifyResponse = await api.put(`/admin/vendors/${finalVendorID}/auto-verify`, {
            rating: parseFloat(formData.adminRating)
          });

          console.log('Auto-verify response:', verifyResponse.data);
          toast.success('Vendor added and approved successfully!', { id: loadingToast });
        } catch (verifyErr) {
          console.error('Failed to auto-approve:', verifyErr);
          console.error('Error status:', verifyErr.response?.status);
          console.error('Error data:', verifyErr.response?.data);
          console.error('Request URL:', verifyErr.config?.url);
          toast.error(`Vendor added but approval failed: ${verifyErr.response?.data?.message || verifyErr.message}. Please approve manually.`, { id: loadingToast });
        }
      } else {
        console.error('No vendor ID received');
        toast.error('Vendor added but no ID received. Please verify manually.', { id: loadingToast });
      }

      setFormData({
        companyName: '',
        ownerName: '',
        email: '',
        phone: '',
        whatsappNumber: '',
        website: '',
        city: '',
        gstNumber: '',
        projectTypes: '',
        adminRating: '',
      });
      setPanCardFile(null);
      setCompanyLogoFile(null);
      setShowAddForm(false);
      fetchVendors();
    } catch (err) {
      console.error('Full error:', err);
      console.error('Error response:', JSON.stringify(err.response?.data, null, 2));

      let errorMsg = 'Failed to add vendor';

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
    setFormData({
      companyName: '',
      ownerName: '',
      email: '',
      phone: '',
      whatsappNumber: '',
      website: '',
      city: '',
      gstNumber: '',
      projectTypes: '',
      adminRating: '',
    });
    setPanCardFile(null);
    setCompanyLogoFile(null);
  };

  const fetchVendors = useCallback(async () => {
    try {
      const statusParam = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const { data } = await api.get(`/admin/vendors${statusParam}`);
      setVendors(data.data || []);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, statusFilter]);

  const fetchStats = async () => {
    try {
      await api.get('/stats/overview');
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchStats();
  }, [fetchVendors, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, roleFilter]);

  useEffect(() => {
    const handleVendorRated = () => {
      console.log('Vendor rated event received, refreshing list...');
      fetchVendors();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing vendors...');
        fetchVendors();
      }
    };

    window.addEventListener('vendorRated', handleVendorRated);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('vendorRated', handleVendorRated);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchVendors]);

  const getStatusBadgeClass = (status) => {
    if (status === 'verified' || status === 'approved') return 'status-approved';
    if (status === 'pending') return 'status-pending';
    if (status === 'rejected') return 'status-rejected';
    return 'status-pending';
  };

  const getStatusText = (vendor) => {
    if (vendor.verificationStatus === 'verified') return 'APPROVED';
    if (vendor.verificationStatus === 'rejected') return 'REJECTED';
    return 'PENDING';
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = !searchTerm ||
      vendor.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor._id?.includes(searchTerm);

    if (!matchesSearch) return false;

    if (roleFilter && !vendor.projectTypes?.some(type => type.toLowerCase().includes(roleFilter.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const paginatedVendors = filteredVendors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return <div className="loading-screen">Loading vendors...</div>;
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
            marginLeft:"180px"
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
              You do not have permission to access the Vendor Verification Page.
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
                placeholder="Search vendors, ID or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="topbar-actions">
              <button className="icon-btn">
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
                <h1>Vendor Verification</h1>
                <p className="page-subtitle">Review and manage vendor certifications for construction projects.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="export-btn" onClick={() => { setLoading(true); fetchVendors(); }}>
                  ↻ Refresh
                </button>
                <button className="export-btn" onClick={handleExportCSV}>
                  <Download size={18} />
                  Export CSV
                </button>
                <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
                  <Plus size={18} />
                  {showAddForm ? 'Cancel' : 'Add Vendor'}
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
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700' }}>Add New Vendor</h3>
                <form onSubmit={handleAddVendor}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Company Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Enter company name"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Owner Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        placeholder="Enter owner name"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Email *</label>
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Phone *</label>
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>WhatsApp Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        placeholder="Enter WhatsApp number"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Website *</label>
                      <input
                        type="url"
                        required
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="Enter website URL (e.g., https://example.com)"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>GST Number</label>
                      <input
                        type="text"
                        value={formData.gstNumber}
                        onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                        placeholder="Enter GST number"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Project Types</label>
                      <select
                        value={formData.projectTypes}
                        onChange={(e) => setFormData({ ...formData, projectTypes: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Select project type</option>
                        <option value="Residential Building">Residential Building</option>
                        <option value="Commercial Building">Commercial Building</option>
                        <option value="Industrial Project">Industrial Project</option>
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Renovation">Renovation</option>
                        <option value="Interior Design">Interior Design</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Rating (1-5)</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={formData.adminRating}
                        onChange={(e) => setFormData({ ...formData, adminRating: e.target.value })}
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
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>PAN Card (Optional)</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setPanCardFile(e.target.files[0])}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      {panCardFile && <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Selected: {panCardFile.name}</p>}
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Company Logo (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCompanyLogoFile(e.target.files[0])}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      {companyLogoFile && <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Selected: {companyLogoFile.name}</p>}
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
                      {submitting ? 'Adding...' : 'Add Vendor'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="stats-row">
              <div className="stat-box">
                <p className="stat-box-label">TOTAL REQUESTS</p>
                <div className="stat-box-value">{vendors.length.toLocaleString()}</div>
                <p className="stat-box-change success">↑ 12% this month</p>
              </div>

              <div className="stat-box highlight-orange">
                <p className="stat-box-label">PENDING REVIEW</p>
                <div className="stat-box-value">{vendors.filter(v => v.verificationStatus === 'pending').length}</div>
                <p className="stat-box-change warning">8 requires urgent action</p>
              </div>

              <div className="stat-box">
                <p className="stat-box-label">APPROVED VENDORS</p>
                <div className="stat-box-value">{vendors.filter(v => v.verificationStatus === 'verified').length.toLocaleString()}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="stat-box">
                <p className="stat-box-label">AVG. RATING</p>
                <div className="stat-box-value">4.8<span className="rating-sub">/5.0</span></div>
                <p className="stat-box-change success">★ Based on 90+</p>
              </div>
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
                      <button onClick={() => { setStatusFilter('verified'); setShowFilterDropdown(false); }}>Approved</button>
                      <button onClick={() => { setStatusFilter('rejected'); setShowFilterDropdown(false); }}>Rejected</button>
                    </div>
                  )}
                </div>
                {roleFilter && (
                  <div className="filter-pill">
                    Project Type: {roleFilter}
                    <button onClick={() => setRoleFilter('')}>
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
              <div className="results-count">
                SHOWING {paginatedVendors.length} OF {filteredVendors.length}
              </div>
            </div>

            <div className="table-container">
              <table className="workers-table">
                <thead>
                  <tr>
                    <th>VENDOR NAME</th>
                    <th>PROJECT TYPES</th>
                    <th>CITY</th>
                    <th>GST NUMBER</th>
                    <th>RATING</th>
                    <th>DOCUMENTS</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVendors.map((vendor) => (
                    <tr key={vendor._id}>
                      <td>
                        <div className="worker-cell" onClick={() => navigate(`/admin/vendors/${vendor._id}`)} style={{ cursor: 'pointer' }}>
                          <img
                            src={vendor.companyLogo ? `http://localhost:5000/${vendor.companyLogo}` : `https://ui-avatars.com/api/?name=${vendor.companyName || vendor.ownerName}&background=3b82f6&color=fff`}
                            alt={vendor.companyName || vendor.ownerName}
                            className="worker-table-avatar"
                          />
                          <div>
                            <div className="vendor-name" style={{ fontSize: "1.2rem" }}>{vendor.companyName || vendor.ownerName}</div>
                            <div className="worker-id">ID: #VN-{vendor._id.slice(-4)}</div>
                          </div>
                        </div>
                      </td>
                      <td>{vendor.projectTypes?.[0] || 'General'}</td>
                      <td>{vendor.city || 'N/A'}</td>
                      <td>{vendor.gstNumber || 'N/A'}</td>
                      <td>
                        {vendor.verificationStatus === 'verified' && vendor.adminRating ? (
                          <div className="rating-cell">
                            {[1, 2, 3, 4, 5].map((star) => {
                              const rating = parseFloat(vendor.adminRating);
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
                            <span>{parseFloat(vendor.adminRating).toFixed(1)}/5</span>
                          </div>
                        ) : (
                          <div className="rating-cell">
                            <span className="no-rating">—</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          className="view-files-btn"
                          onClick={() => handleViewFiles(vendor)}
                        >
                          <FileText size={16} />
                          VIEW {(vendor.panCardImage ? 1 : 0) + (vendor.companyLogo ? 1 : 0)} FILES
                        </button>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(vendor.verificationStatus)}`}>
                          {getStatusText(vendor)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">
                Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredVendors.length)}</strong> of <strong>{filteredVendors.length}</strong> entries
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
