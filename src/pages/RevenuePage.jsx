import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Users, Briefcase, DollarSign, Download, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import './RevenuePage.css';

export default function RevenuePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '', profileImage: '' });
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({
    totalWorkerSubscriptions: 0,
    totalVendorSubscriptions: 0,
    totalSubscriptions: 0,
    totalRevenue: 0,
    vendorBasicSubscriptions: 0,
    vendorPremiumSubscriptions: 0,
    workerPremiumSubscriptions: 0,
  });
  const [filterType, setFilterType] = useState('all');
  const [planFilterType, setPlanFilterType] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProfile();
    fetchSubscriptions();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      if (response.data.success && response.data.data) {
        const user = response.data.data.user;
        setProfile({
          name: user.name || 'Admin',
          profileImage: user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Admin')}&background=2b3f57&color=fff`
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/stats/revenue-stats/subscriptions');
      const raw = data.data?.subscriptions || [];

      const subscriptionsData = raw.map(sub => ({
        _id: sub._id,
        userId: sub.user?._id,
        name: sub.user?.name || 'N/A',
        userType: sub.user?.userType || 'N/A',
        profileImage: sub.user?.profileImage || null,
        companyName: sub.user?.companyName || null,
        companyLogo: sub.user?.companyLogo || null,
        planType: sub.planType || sub.planName || sub.plan || 'N/A',
        status: sub.status,
        amount: sub.amount,
        startDate: sub.startDate,
        endDate: sub.endDate,
      }));

      setSubscriptions(subscriptionsData);

      setStats({
        totalWorkerSubscriptions: data.data?.totalWorkerSubscriptions || 0,
        totalVendorSubscriptions: data.data?.totalVendorSubscriptions || 0,
        totalSubscriptions: data.data?.totalSubscriptions || 0,
        totalRevenue: data.data?.totalRevenue || 0,
        vendorBasicSubscriptions: data.data?.totalBasicVendorSubscriptions || 0,
        vendorPremiumSubscriptions: data.data?.totalPremiumVendorSubscriptions || 0,
        workerPremiumSubscriptions: data.data?.totalWorkerSubscriptions || 0,
      });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredSubscriptions.length === 0) {
      alert('No subscriptions to export');
      return;
    }

    const headers = ['Name','Company Name', 'Type', 'Plan', 'Status', 'Start Date', 'End Date', 'Amount', 'Contact'];
    const rows = filteredSubscriptions.map(sub => [
      sub.name || 'N/A',
      sub.companyName || 'N/A',
      sub.userType || 'N/A',
      sub.planType || 'N/A',
      sub.status || 'N/A',
      sub.startDate ? new Date(sub.startDate).toLocaleDateString() : 'N/A',
      sub.endDate ? new Date(sub.endDate).toLocaleDateString() : 'N/A',
      sub.amount ? `₹${sub.amount}` : 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesType = filterType === 'all' || sub.userType === filterType;
    const planType = (sub.planType || '').toLowerCase();
    const matchesPlan = planFilterType === 'all' ||
      (planFilterType === 'basic' && planType.includes('basic')) ||
      (planFilterType === 'premium' && planType.includes('premium'));
    const matchesSearch = !searchTerm ||
      sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(sub.userId || sub._id || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesPlan && matchesSearch;
  });

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (subscription) => {
    if (subscription.userType === 'worker') {
      navigate(`/admin/workers/${subscription.userId || subscription._id}`);
    } else if (subscription.userType === 'vendor') {
      navigate(`/admin/vendors/${subscription.userId || subscription._id}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  if (loading) {
    return <div className="loading-screen">Loading revenue data...</div>;
  }

  return (
    <div className="revenue-page">
      <Sidebar onLogout={handleLogout} />

      <div className="revenue-content">
        <header className="revenue-header">
          <div className="header-left">
            <div className="header-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="header-right">
            <button className="icon-btn" onClick={() => navigate('/admin/notifications')}>
              <Bell size={18} />
            </button>
            <div className="user-menu">
              <div className="user-avatar">
                <img src={profile.profileImage} alt="Admin" />
              </div>
              <div className="user-info">
                <p className="user-name">{profile.name}</p>
                <p className="user-role">Admin</p>
              </div>
            </div>
          </div>
        </header>

        <div className="page-title-section">
          <div>
            <h1>Revenue & Subscriptions</h1>
            <p className="page-subtitle">Monitor and manage all subscription revenue across the platform</p>
          </div>
          <button className="export-btn" onClick={handleExportCSV}>
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <div className="stats-cards">
          <motion.div
            className="stat-card revenue-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="stat-icon">
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Revenue</p>
              <div className="stat-value">₹{(stats.totalRevenue || 0).toLocaleString()}</div>
              <p className="stat-change">Revenue from active subscriptions</p>
            </div>
          </motion.div>

          <motion.div
            className="stat-card worker-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Worker Subscriptions</p>
              <div className="stat-value">{stats.totalWorkerSubscriptions}</div>
              <p className="stat-change">Active worker subscribers</p>
            </div>
          </motion.div>

          <motion.div
            className="stat-card vendor-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="stat-icon">
              <Briefcase size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Vendor Subscriptions</p>
              <div className="stat-value">{stats.totalVendorSubscriptions}</div>
              <p className="stat-change">Basic: {stats.vendorBasicSubscriptions} · Premium: {stats.vendorPremiumSubscriptions}</p>
            </div>
          </motion.div>

          <motion.div
            className="stat-card total-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Subscriptions</p>
              <div className="stat-value">{stats.totalSubscriptions}</div>
              <p className="stat-change">Combined active subscriptions</p>
            </div>
          </motion.div>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <div className="filter-dropdown">
              <button className="filter-btn" onClick={() => setShowFilterDropdown(!showFilterDropdown)}>
                Filter: {filterType === 'all' ? 'All Users' : filterType === 'worker' ? 'Workers' : 'Vendors'}
                <ChevronDown size={16} />
              </button>
              {showFilterDropdown && (
                <div className="dropdown-menu">
                  <button onClick={() => { setFilterType('all'); setShowFilterDropdown(false); }}>All Users</button>
                  <button onClick={() => { setFilterType('worker'); setShowFilterDropdown(false); }}>Workers</button>
                  <button onClick={() => { setFilterType('vendor'); setShowFilterDropdown(false); }}>Vendors</button>
                </div>
              )}
            </div>
            <div className="filter-dropdown">
              <button className="filter-btn" onClick={() => setShowPlanDropdown(!showPlanDropdown)}>
                Plan: {planFilterType === 'all' ? 'All Plans' : planFilterType === 'basic' ? 'Basic' : 'Premium'}
                <ChevronDown size={16} />
              </button>
              {showPlanDropdown && (
                <div className="dropdown-menu">
                  <button onClick={() => { setPlanFilterType('all'); setShowPlanDropdown(false); }}>All Plans</button>
                  <button onClick={() => { setPlanFilterType('basic'); setShowPlanDropdown(false); }}>Basic</button>
                  <button onClick={() => { setPlanFilterType('premium'); setShowPlanDropdown(false); }}>Premium</button>
                </div>
              )}
            </div>
          </div>
          <div className="results-count">
            SHOWING {paginatedSubscriptions.length} OF {filteredSubscriptions.length}
          </div>
        </div>

        <div className="table-container">
          <table className="subscriptions-table">
            <thead>
              <tr>
                <th>USER NAME</th>
                <th>TYPE</th>
                <th>PLAN</th>
                <th>STATUS</th>
                <th>START DATE</th>
                <th>END DATE</th>
                <th>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSubscriptions.map((subscription, index) => (
                <motion.tr
                  key={subscription._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleRowClick(subscription)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="user-cell">
                      <img
                        src={
                          subscription.userType?.toLowerCase() === "vendor"
                            ? (subscription.companyLogo ||
                              subscription.profileImage ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(subscription.name || "User")}&background=3b82f6&color=fff`)
                            : (subscription.profileImage ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(subscription.name || "User")}&background=3b82f6&color=fff`)
                        }
                        alt={subscription.name || "User"}
                        className="user-avatar"
                      />
                      <div>
                        <div className="user-name">{subscription.userType?.toLowerCase() === "vendor" ? subscription.companyName : subscription.name || 'N/A'}</div>
                        <div style={{ fontWeight: "bolder","fontSize":"10px"}}  className="user-id"> {subscription.userType?.toLowerCase() === "vendor" ? `Vendor Name: ${subscription.name}` : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`type-badge ${subscription.userType}`}>
                      {subscription.userType.toLowerCase() === 'worker' ? 'WORKER' : 'VENDOR'}
                    </span>
                  </td>
                  <td>{subscription.planType || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${subscription.status?.toLowerCase()}`}>
                      {subscription.status || 'Active'}
                    </span>
                  </td>
                  <td>{subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}</td>
                  <td className="amount-cell">₹{subscription.amount || '0'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <div className="pagination-info">
            Showing <strong>{((currentPage - 1) * itemsPerPage) + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, filteredSubscriptions.length)}</strong> of <strong>{filteredSubscriptions.length}</strong> entries
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
    </div>
  );
}
