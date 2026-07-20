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
const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function WorkerVerification() {
  const [workers, setWorkers] = useState([]);
  const [profile, setProfile] = useState({ name: '', email: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showSubscriptionDropdown, setShowSubscriptionDropdown] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    primarySkillId: '',
    secondarySkillId: [],
    otherSkill: '',
    dateOfBirth: '',
    gender: '',
    totalExperience: '',
    experienceDescription: '',
    workStateID: '',
    workCityID: '',
    willingtoRelocate: false,
    salaryType: 'daily',
    salary: '',
    location: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [workSamplesPhoto, setWorkSamplesPhoto] = useState([]);
  const [experienceCertificate, setExperienceCertificate] = useState(null);
  const [governmentID, setGovernmentID] = useState(null);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [skills, setSkills] = useState([]);
  const navigate = useNavigate();

  const fetchAdminProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      console.log('Profile response:', response.data);

      if (response.data.success && response.data.data) {
        const user = response.data.data.user;
        console.log('User data:', user);

        const imageUrl = user.profileImage
          ? user.profileImage
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Admin')}&background=2b3f57&color=fff`;

        console.log('Image URL:', imageUrl);

        setProfile({
          name: user.name || '',
          email: user.email || '',
          imageUrl: imageUrl,
          role: user.role || ''
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
    fetchStates();
    fetchSkills();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await api.get('/profile/states');
      if (response.data.success) {
        setStates(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchCities = async (stateId) => {
    try {
      const response = await api.get(`/profile/cities/${stateId}`);
      if (response.data.success) {
        setCities(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await api.get('/profile/skills');
      if (response.data.success) {
        setSkills(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleStateChange = (stateId) => {
    setFormData({ ...formData, workStateID: stateId, workCityID: '' });
    setCities([]);
    if (stateId) {
      fetchCities(stateId);
    }
  };


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

    const headers = ['Worker Name', 'Role', 'Experience', 'City', 'Phone', 'Email', 'Primary Skill', 'Additional Skills', 'Wiiling to Relocate', 'Salary Type', 'Salary', 'Rating', 'Applied Date', 'Subscription', 'Status'];
    const rows = filteredWorkers.map(worker => [
      worker.name || '',
      worker.role || 'N/A',
      worker.experience || 'N/A',
      worker.city || 'N/A',
      worker.phone || 'N/A',
      worker.email || 'N/A',
      worker.primarySkill || 'N/A',
      worker.skills || 'N/A',
      worker.willingtoRelocate || 'N/A',
      worker.salaryType || 'N/A',
      worker.salary || 'N/A',
      worker.adminRating ? `${parseFloat(worker.adminRating).toFixed(1)}/5` : 'Not Rated',
      worker.join || 'N/A',
      worker.subscription ? "Subscribed" : "Not Subscribed",
      worker.status || 'Pending',
      worker.experienceCertificate ? true : false
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
      const { data } = await api.get('/admin/vendor-worker', {
        params: {
          userType: 'worker',
          status: 'all',
          limit: 1000,
        },
      });

      const workersData = data.data || [];

      const formattedWorkers = workersData.map(worker => ({
        ...worker,
        name: worker.name || 'Unknown',
        role: worker.primarySkill?.name || worker.role || 'General Worker',
        experience: worker.experience || 'N/A',
        city: worker.city || 'N/A',
        status: worker.verificationStatus || 'Pending',
        adminRating: worker.adminRating || null,
        profileImage: worker.profileImage || null,
        phone: worker.phone || 'N/A',
        email: worker.email || 'N/A',
        join: worker.join || 'N/A',
        subscription: worker.subscription || false,
        subscriptionPlan: worker.subscriptionPlan || null,
        subscriptionEndDate: worker.subscriptionEndDate || null,
        experienceCertificate: worker.experienceCertificate || null
      }));

      setWorkers(formattedWorkers);
    } catch (err) {
      console.error('Failed to load workers:', err);
      toast.error('Failed to load workers');
    } finally {
      setLoading(false);
    }
  };


  const handleAddWorker = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const loadingToast = toast.loading('Adding worker...');

    try {
      // Admin creates worker profile directly
      const profileData = new FormData();
      profileData.append('phone', formData.phone);
      profileData.append('name', formData.name);
      profileData.append('primarySkillId', formData.primarySkillId);
      if (formData.secondarySkillId.length > 0) {
        formData.secondarySkillId.forEach(id => profileData.append('secondarySkillId', id));
      }
      if (formData.otherSkill) profileData.append('otherSkill', formData.otherSkill);
      if (formData.dateOfBirth) profileData.append('dateOfBirth', formData.dateOfBirth);
      if (formData.gender) profileData.append('gender', formData.gender);
      if (formData.totalExperience) profileData.append('totalExperience', formData.totalExperience);
      if (formData.experienceDescription) profileData.append('experienceDescription', formData.experienceDescription);
      if (formData.workStateID) profileData.append('workStateID', formData.workStateID);
      if (formData.workCityID) profileData.append('workCityID', formData.workCityID);
      profileData.append('willingtoRelocate', formData.willingtoRelocate);
      if (formData.salaryType) profileData.append('salaryType', formData.salaryType);
      if (formData.salary) profileData.append('salary', formData.salary);
      if (formData.location) profileData.append('location', formData.location);
      if (profileImage) profileData.append('profileImage', profileImage);
      if (workSamplesPhoto.length > 0) {
        workSamplesPhoto.forEach(file => profileData.append('workSamplesPhoto', file));
      }
      if (experienceCertificate) profileData.append('experienceCertificate', experienceCertificate);
      if (governmentID) profileData.append('governmentID', governmentID);

      await api.post('/profile/worker/create', profileData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Worker added successfully!', { id: loadingToast });
      setFormData({ name: '', phone: '', primarySkillId: '', secondarySkillId: [], otherSkill: '', dateOfBirth: '', gender: '', totalExperience: '', experienceDescription: '', workStateID: '', workCityID: '', willingtoRelocate: false, salaryType: 'daily', salary: '', location: '' });
      setProfileImage(null);
      setWorkSamplesPhoto([]);
      setExperienceCertificate(null);
      setGovernmentID(null);
      setCities([]);
      setShowAddForm(false);
      fetchWorkers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add worker';
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errors = err.response.data.errors.map(e => `${e.param}: ${e.msg}`).join('\n');
        toast.error(
          <div style={{ whiteSpace: 'pre-line' }}>
            <strong>Validation Errors:</strong>\n{errors}
          </div>,
          { id: loadingToast, duration: 6000 }
        );
      } else {
        toast.error(errorMsg, { id: loadingToast });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setFormData({ name: '', phone: '', primarySkillId: '', secondarySkillId: [], otherSkill: '', dateOfBirth: '', gender: '', totalExperience: '', experienceDescription: '', workStateID: '', workCityID: '', willingtoRelocate: false, salaryType: 'daily', salary: '', location: '' });
    setProfileImage(null);
    setWorkSamplesPhoto([]);
    setExperienceCertificate(null);
    setGovernmentID(null);
    setCities([]);
  };

  const getStatusBadgeClass = (worker) => {
    const status = (worker.status || '').toLowerCase();
    if (status === 'verified' || status === 'approved') return 'status-approved';
    if (status === 'pending') return 'status-pending';
    if (status === 'rejected') return 'status-rejected';
    return 'status-pending';
  };

  const getStatusText = (worker) => {
    const status = (worker.status || '').toLowerCase();
    if (status === 'verified' || status === 'approved') return 'APPROVED';
    if (status === 'rejected') return 'REJECTED';
    return 'PENDING';
  };

  const approvedWorkers = workers.filter(worker =>
    worker.status === 'Verified' || worker.status === 'Approved' || worker.status === 'approved'
  );
  const subscribedWorkers = workers.filter(worker => worker.subscription === true);

  const filteredWorkers = workers.filter(worker => {
    const workerStatus = (worker.status || '').toLowerCase();

    if (statusFilter === 'pending' && workerStatus !== 'pending') return false;
    if (statusFilter === 'approved' && !['verified', 'approved'].includes(workerStatus)) return false;

    if (subscriptionFilter === 'subscribed' && !worker.subscription) return false;
    if (subscriptionFilter === 'not-subscribed' && worker.subscription) return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const workerName = (worker.name || '').toLowerCase();
      const workerRole = (worker.role || '').toLowerCase();
      const workerId = (worker._id || '').toLowerCase();

      if (!workerName.includes(searchLower) &&
        !workerRole.includes(searchLower) &&
        !workerId.includes(searchLower)) {
        return false;
      }
    }

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
                  {profile.imageUrl ? (
                    <img src={profile.imageUrl} alt="Admin" />
                  ) : null}
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Full Name *</label>
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Primary Skill *</label>
                      <select
                        required
                        value={formData.primarySkillId}
                        onChange={(e) => setFormData({ ...formData, primarySkillId: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Select primary skill</option>
                        {skills.map(skill => (
                          <option key={skill.id} value={skill.id}>{skill.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Total Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={formData.totalExperience}
                        onChange={(e) => setFormData({ ...formData, totalExperience: e.target.value })}
                        placeholder="Enter years of experience"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>State</label>
                      <select
                        value={formData.workStateID}
                        onChange={(e) => handleStateChange(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Select state</option>
                        {states.map(state => (
                          <option key={state.id} value={state.id}>{state.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>City</label>
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
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="">Select city</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Salary Type</label>
                      <select
                        value={formData.salaryType}
                        onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          backgroundColor: 'white'
                        }}
                      >
                        <option value="daily">Daily</option>
                        <option value="monthly">Monthly</option>
                        <option value="hourly">Hourly</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Salary</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                        placeholder="Enter salary amount"
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Enter location"
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
                      <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: '600', marginTop: '30px' }}>
                        <input
                          type="checkbox"
                          checked={formData.willingtoRelocate}
                          onChange={(e) => setFormData({ ...formData, willingtoRelocate: e.target.checked })}
                          style={{ marginRight: '8px', width: '18px', height: '18px' }}
                        />
                        Willing to Relocate
                      </label>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Experience Description</label>
                      <textarea
                        value={formData.experienceDescription}
                        onChange={(e) => setFormData({ ...formData, experienceDescription: e.target.value })}
                        placeholder="Describe work experience..."
                        maxLength="1000"
                        rows="3"
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Profile Photo</label>
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
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Government ID</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setGovernmentID(e.target.files[0])}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      {governmentID && <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Selected: {governmentID.name}</p>}
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Experience Certificate</label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setExperienceCertificate(e.target.files[0])}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px'
                        }}
                      />
                      {experienceCertificate && <p style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>Selected: {experienceCertificate.name}</p>}
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
                <div className="stat-box-value">{workers.filter(w => (w.status || '').toLowerCase() === 'pending').length.toLocaleString()}</div>
                <p className="stat-box-change warning">{workers.filter(w => (w.status || '').toLowerCase() === 'pending').length} requires review</p>
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
                <p className="stat-box-label">SUBSCRIPTIONS</p>
                <div className="stat-box-value">{subscribedWorkers.length.toLocaleString()}</div>
                <p className="stat-box-change success">
                  {subscribedWorkers.length > 0 ? `${((subscribedWorkers.length / workers.length) * 100).toFixed(0)}% of total workers` : 'No subscriptions yet'}
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
                    <th>SUBSCRIPTION</th>
                    <th>BLOCKED</th>
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
                              worker.profileImage ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                worker.name
                              )}&background=3b82f6&color=fff`
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
                      <td style={{ maxWidth: '180px' }}>
                        {worker.adminRating && worker.subscription ? (
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
                          <span className="no-rating" style={{ color: '#9ca3af', fontSize: '0.75rem', display: 'block', whiteSpace: 'normal', lineHeight: '1.4' }}>
                            {!worker.subscription
                              ? 'No active subscription'
                              : worker.status.toLowerCase() === 'rejected'
                                ? 'Worker rejected'
                                : worker.status.toLowerCase() !== 'verified'
                                  ? 'Not verified yet'
                                  : !worker.adminRating 
                                    ? 'No rating given yet'
                                    : ''}
                          </span>
                        )}
                      </td>
                      <td>
                        {worker.subscription ? (
                          <span className="subscription-badge active">
                            ✓ Active
                          </span>
                        ) : (
                          <span className="subscription-badge inactive">✕ Not Subscribed</span>
                        )}
                      </td>
                      <td>
                        <span className={`subscription-badge ${worker.isBlocked ? 'inactive' : 'active'}`}>
                          {worker.isBlocked ? '🔒 Blocked' : '🔓 Active'}
                        </span>
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

