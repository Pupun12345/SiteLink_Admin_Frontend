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
import './VendorVerification.css';
import { hasPermission, usePermissions } from '../hooks/usePermissions';
const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function VendorVerification() {
  const [vendors, setVendors] = useState([]);
  const [profile, setProfile] = useState({ name: '', email: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSubscriptionDropdown, setShowSubscriptionDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    phone: '',
    whatsappNumber: '',
    website: '',
    city: '',
    workStateID: '',
    workCityID: '',
    workArea: '',
    gstNumber: '',
    designation: '',
    adminRating: '',
    panNumber: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [panCardImage, setPanCardImage] = useState(null);
  const [gstCertificate, setGstCertificate] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');

    navigate('/admin/login');
  };

  const fetchAdminProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      if (response.data.data?.user) {
        const user = response.data.data.user;
        const imageUrl = user.profileImage
          ? user.profileImage
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

  const fetchStates = async () => {
    try {
      const response = await api.get('/profile/states');
      if (response.data.data) setStates(response.data.data);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchCities = async (stateId) => {
    if (!stateId) {
      setCities([]);
      return;
    }
    try {
      const response = await api.get(`/profile/cities/${stateId}`);
      if (response.data.data) setCities(response.data.data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  useEffect(() => {
    fetchAdminProfile();
    fetchStates();
  }, []);

  const handleExportCSV = () => {
    if (filteredVendors.length === 0) {
      alert('No vendors to export');
      return;
    }

    const headers = ['Company Name', 'Name', 'GST Number', 'Email', 'Work State', 'Work City', 'Designation', 'Work Area', 'Website', 'Pan Number', 'Subscription', 'Status'];
    const rows = filteredVendors.map(v => [
      v.companyName || '',
      v.name || '',
      v.gstNumber || '',
      v.email || '',
      v.workState || '',
      v.city || '',
      v.designation || '',
      v.workArea || '',
      v.website || '',
      v.panNumber || '',
      v.subscription ? 'Subscribed' : 'Not Subscribed',
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
    if (vendor.profileImage) files.push({ name: 'Profile Image', url: vendor.profileImage });
    if (vendor.companyLogo) files.push({ name: 'Company Logo', url: vendor.companyLogo });
    if (vendor.panCardImage) files.push({ name: 'PAN Card', url: vendor.panCardImage });
    if (vendor.gstCertificate) files.push({ name: 'GST Certificate', url: vendor.gstCertificate });

    if (files.length === 0) {
      alert('No files available for this vendor');
      return;
    }

    files.forEach(file => {
      const fileUrl = file.url;
      if (!fileUrl) {
        toast.showToast("File Not Found", { type: 'error' });
      }
      window.open(fileUrl, '_blank');
    });
  };

  //Permissions to Access
  const permissions = usePermissions();
  const adminUser = localStorage.getItem("adminUser");
  const canAccess = !adminUser || hasPermission(permissions, 'canVerifyUsers');

  const handleAddVendor = async (e) => {
    e.preventDefault();

    // Validate phone format
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      toast.error('Phone must be 10 digits starting with 6-9', { duration: 3000 });
      return;
    }

    setSubmitting(true);
    const loadingToast = toast.loading('Adding vendor...');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('companyName', formData.companyName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('designation', formData.designation);
      formDataToSend.append('workStateID', formData.workStateID);
      formDataToSend.append('workArea', formData.workArea);
      formDataToSend.append('workCityID', formData.workCityID);
      formDataToSend.append('gstNumber', formData.gstNumber);
      formDataToSend.append('panNumber', formData.panNumber);
      formDataToSend.append('whatsappNumber', formData.whatsappNumber);
      if (formData.website) {
        formDataToSend.append('website', formData.website);
      }
      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }
      if (companyLogoFile) {
        formDataToSend.append('companyLogo', companyLogoFile);
      }
      if (panCardImage) {
        formDataToSend.append('panCardImage', panCardImage);
      }
      if (gstCertificate) {
        formDataToSend.append('gstCertificate', gstCertificate);
      }

      formDataToSend.append('adminRating', formData.adminRating);


      await api.post('/profile/vendor/create', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Vendor added successfully!', { id: loadingToast });

      setFormData({
        companyName: '',
        name: '',
        email: '',
        phone: '',
        whatsappNumber: '',
        website: '',
        city: '',
        gstNumber: '',
        adminRating: '',
        workStateID: '',
        workCityID: '',
        workArea: '',
        designation: '',
        panNumber: '',
      });
      setProfileImage(null);
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
      name: '',
      email: '',
      phone: '',
      whatsappNumber: '',
      website: '',
      city: '',
      workStateID: '',
      workCityID: '',
      workArea: '',
      gstNumber: '',
      designation: '',
      adminRating: '',
      panNumber: '',
      gstCertificate: '',
      panCardImage: ''
    });
    setProfileImage(null);
    setCompanyLogoFile(null);
  };

  const fetchVendors = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/vendor-worker', {
        params: {
          userType: 'vendor',
          status: 'all',
          limit: 1000,
        },
      });

      const vendorsData = data.data || [];
      const formattedVendors = vendorsData.map(vendor => ({
        ...vendor,
        companyName: vendor.companyName || 'Unknown Company',
        name: vendor.name || 'Unknown',
        verificationStatus: vendor.verificationStatus || 'pending',
        gstNumber: vendor.gstNumber || 'N/A',
        email: vendor.email || 'N/A',
        companyLogo: vendor.companyLogo || null,
        profileImage: vendor.profileImage || null,
        gstCertificate: vendor.gstCertificate || null,
        panCardImage: vendor.panCardImage || null,
        adminRating: vendor.adminRating || null,
        workState: vendor.workState || null,
        workCity: vendor.city || null,
        designation: vendor.designation || null,
        workArea: vendor.workArea || null,
        panNumber: vendor.panNumber || null,
        subscription: vendor.subscription || false,
        subscriptionPlan: vendor.subscriptionPlan || null,
        subscriptionEndDate: vendor.subscriptionEndDate || null,
      }));

      setVendors(formattedVendors);
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
  }, [statusFilter]);

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
    const normalizedStatus = (status || '').toLowerCase();
    if (normalizedStatus === 'verified' || normalizedStatus === 'approved') return 'status-approved';
    if (normalizedStatus === 'pending') return 'status-pending';
    if (normalizedStatus === 'rejected') return 'status-rejected';
    return 'status-pending';
  };

  const getStatusText = (vendor) => {
    const normalizedStatus = (vendor.verificationStatus || '').toLowerCase();
    if (normalizedStatus === 'verified' || normalizedStatus === 'approved') return 'APPROVED';
    if (normalizedStatus === 'rejected') return 'REJECTED';
    return 'PENDING';
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = !searchTerm ||
      vendor.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor._id?.includes(searchTerm);

    const vendorStatus = (vendor.verificationStatus || '').toLowerCase();

    if (!matchesSearch) return false;
    if (statusFilter === 'pending' && vendorStatus !== 'pending') return false;
    if (statusFilter === 'approved' && !['verified', 'approved'].includes(vendorStatus)) return false;
    if (subscriptionFilter === 'subscribed' && !vendor.subscription) return false;
    if (subscriptionFilter === 'not-subscribed' && vendor.subscription) return false;
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter Name"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Company Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="Enter Company Name"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData({ ...formData, phone: value });
                        }}
                        placeholder="Enter 10-digit phone (start with 6-9)"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      {formData.phone && !/^[6-9]\d{9}$/.test(formData.phone) && (
                        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                          Phone must start with 6-9 and be 10 digits
                        </p>
                      )}
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
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Pan Number *</label>
                      <input
                        type="text"
                        required
                        value={formData.panNumber}
                        onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                        placeholder="Enter Pan Number"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Designation *</label>
                      <input
                        type="text"
                        required
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="Enter Designation"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Website </label>
                      <input
                        type="text"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Work State *</label>
                      <select
                        value={formData.workStateID}
                        onChange={(e) => {
                          setFormData({ ...formData, workStateID: e.target.value, workCityID: '' });
                          fetchCities(e.target.value);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="">Select State</option>
                        {states.map(state => (
                          <option key={state.id} value={state.id}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Work City *</label>
                      <select
                        value={formData.workCityID}
                        onChange={(e) => setFormData({ ...formData, workCityID: e.target.value })}
                        disabled={!formData.workStateID}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          opacity: !formData.workStateID ? 0.5 : 1
                        }}
                      >
                        <option value="">Select City</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Work Area *</label>
                      <input
                        type="text"
                        required
                        value={formData.workArea}
                        onChange={(e) => setFormData({ ...formData, workArea: e.target.value })}
                        placeholder="Enter Work Area"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>GST Number *</label>
                      <input
                        type="text"
                        required
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Profile Image (Optional)</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
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
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>GST Certificate*</label>
                      <input
                        type="file"
                        required
                        accept="image/*"
                        onChange={(e) => setGstCertificate(e.target.files[0])}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      {gstCertificate && <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Selected: {gstCertificate.name}</p>}
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>PanCard Image*</label>
                      <input
                        type="file"
                        required
                        accept="image/*"
                        onChange={(e) => setPanCardImage(e.target.files[0])}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      {panCardImage && <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Selected: {panCardImage.name}</p>}
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
                <p className="stat-box-label">TOTAL VENDORS</p>
                <div className="stat-box-value">{vendors.length.toLocaleString()}</div>
                <p className="stat-box-change success">Total registered</p>
              </div>

              <div className="stat-box highlight-orange">
                <p className="stat-box-label">PENDING REVIEW</p>
                <div className="stat-box-value">{vendors.filter(v => (v.verificationStatus || '').toLowerCase() === 'pending').length}</div>
                <p className="stat-box-change warning">Requires action</p>
              </div>

              <div className="stat-box">
                <p className="stat-box-label">APPROVED VENDORS</p>
                <div className="stat-box-value">{vendors.filter(v => ['verified', 'approved'].includes((v.verificationStatus || '').toLowerCase())).length.toLocaleString()}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: vendors.length > 0 ? `${(vendors.filter(v => ['verified', 'approved'].includes((v.verificationStatus || '').toLowerCase())).length / vendors.length * 100).toFixed(0)}%` : '0%' }}></div>
                </div>
              </div>

              <div className="stat-box">
                <p className="stat-box-label">SUBSCRIPTIONS</p>
                <div className="stat-box-value">{vendors.filter(v => v.subscription === true).length.toLocaleString()}</div>
                <p className="stat-box-change success">{vendors.length > 0 && vendors.filter(v => v.subscription === true).length > 0 ? `${((vendors.filter(v => v.subscription === true).length / vendors.length) * 100).toFixed(0)}% of total` : 'No active subscriptions'}</p>
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
                      <button onClick={() => { setStatusFilter('approved'); setShowFilterDropdown(false); }}>Approved</button>
                    </div>
                  )}
                </div>
                <div className="filter-dropdown">
                  <button className="filter-btn" onClick={() => setShowSubscriptionDropdown(!showSubscriptionDropdown)}>
                    Subscription: {subscriptionFilter === 'all' ? 'All' : subscriptionFilter === 'subscribed' ? 'Subscribed' : 'Not Subscribed'}
                    <ChevronDown size={16} />
                  </button>
                  {showSubscriptionDropdown && (
                    <div className="dropdown-menu">
                      <button onClick={() => { setSubscriptionFilter('all'); setShowSubscriptionDropdown(false); }}>All</button>
                      <button onClick={() => { setSubscriptionFilter('subscribed'); setShowSubscriptionDropdown(false); }}>Subscribed</button>
                      <button onClick={() => { setSubscriptionFilter('not-subscribed'); setShowSubscriptionDropdown(false); }}>Not Subscribed</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="results-count">
                SHOWING {paginatedVendors.length} OF {filteredVendors.length}
              </div>
            </div>

            <div className="table-container">
              <table className="vendors-table">
                <thead>
                  <tr>
                    <th style={{ minWidth: '250px' }}>VENDOR NAME</th>
                    <th style={{ minWidth: '140px' }}>DESIGNATION</th>
                    <th style={{ minWidth: '120px' }}>CITY</th>
                    <th style={{ minWidth: '150px' }}>GST NUMBER</th>
                    <th style={{ minWidth: '130px' }}>PAN NUMBER</th>
                    <th style={{ minWidth: '130px' }}>RATING</th>
                    <th style={{ minWidth: '140px' }}>SUBSCRIPTION</th>
                    <th style={{ minWidth: '140px' }}>DOCUMENTS</th>
                    <th style={{ minWidth: '120px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVendors.map((vendor) => (
                    <tr key={vendor._id}>
                      <td>
                        <div className="vendor-cell" onClick={() => navigate(`/admin/vendors/${vendor._id}`)} style={{ cursor: 'pointer',display:'flex' }}>
                          <img
                            src={
                              vendor.companyLogo
                                ? vendor.companyLogo
                                : vendor.profileImage
                                  ? vendor.profileImage
                                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.companyName || vendor.name || 'Vendor')}&background=3b82f6&color=fff`
                            }
                            alt={vendor.companyName || vendor.name}
                            className="vendor-table-avatar"
                            onError={(e) => {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.companyName || vendor.name || 'Vendor')}&background=3b82f6&color=fff`;
                            }}
                          />
                          <div>
                            <div className="vendor-name" style={{ fontSize: "1.2rem" }}>{vendor.companyName}</div>
                            <div className="vendor">Vendor Name: {vendor.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ minWidth: '140px' }}>{vendor.designation || 'N/A'}</td>
                      <td style={{ minWidth: '120px' }}>{vendor.city || 'N/A'}</td>
                      <td style={{ minWidth: '150px', fontSize: '13px' }}>{vendor.gstNumber || 'N/A'}</td>
                      <td style={{ minWidth: '130px', fontSize: '13px' }}>{vendor.panNumber || 'N/A'}</td>
                      <td style={{ maxWidth: '130px' }}>
                        {vendor.adminRating && vendor.subscription ? (
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
                          <span className="no-rating" style={{ color: '#9ca3af', fontSize: '0.75rem', display: 'block', whiteSpace: 'normal', lineHeight: '1.4' }}>
                            {!vendor.subscription
                              ? 'No active subscription'
                              : (vendor.verificationStatus || '').toLowerCase() === 'rejected'
                                ? 'Vendor rejected'
                                : (vendor.verificationStatus || '').toLowerCase() !== 'verified'
                                  ? 'Not verified yet'
                                  : !vendor.adminRating
                                    ? 'No rating given yet'
                                    : ''}
                          </span>
                        )}
                      </td>
                      <td>
                        {vendor.subscription ? (
                          <span className="subscription-badge active">
                            ✓ {'Active'}
                          </span>
                        ) : (
                          <span className="subscription-badge inactive">✕ Not Subscribed</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="view-files-btn"
                          onClick={() => handleViewFiles(vendor)}
                        >
                          <FileText size={16} />
                          VIEW {(vendor.profileImage ? 1 : 0) + (vendor.companyLogo ? 1 : 0) + (vendor.gstCertificate ? 1 : 0) + (vendor.panCardImage ? 1 : 0)} FILES
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
