import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Download,
  X,
  ChevronDown,
  FileText,
  Star,
} from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import './WorkerVerification.css';

export default function VendorVerification() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

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

  const fetchVendors = useCallback(async () => {
    try {
      const statusParam = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const { data } = await api.get(`/admin/vendors${statusParam}`);
      setVendors(data.data || []);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, statusFilter]);

  const fetchStats = async () => {
    try {
      await api.get('/stats/overview');
      // Stats data is available but not used in UI for now
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
    <div className="verification-page">
      <Sidebar onLogout={handleLogout} />

      {/* Main Content */}
      <main className="verification-main">
        {/* Top Bar */}
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
                <img src="https://ui-avatars.com/api/?name=Alex+Rivera&background=3b82f6&color=fff" alt="Admin" />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="verification-content">
          {/* Page Header */}
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
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-row">
            <div
              className="stat-box"
            >
              <p className="stat-box-label">TOTAL REQUESTS</p>
              <div className="stat-box-value">{vendors.length.toLocaleString()}</div>
              <p className="stat-box-change success">↑ 12% this month</p>
            </div>

            <div
              className="stat-box highlight-orange"
            >
              <p className="stat-box-label">PENDING REVIEW</p>
              <div className="stat-box-value">{vendors.filter(v => v.verificationStatus === 'pending').length}</div>
              <p className="stat-box-change warning">8 requires urgent action</p>
            </div>

            <div
              className="stat-box"
            >
              <p className="stat-box-label">APPROVED VENDORS</p>
              <div className="stat-box-value">{vendors.filter(v => v.verificationStatus === 'verified').length.toLocaleString()}</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div
              className="stat-box"
            >
              <p className="stat-box-label">AVG. RATING</p>
              <div className="stat-box-value">4.8<span className="rating-sub">/5.0</span></div>
              <p className="stat-box-change success">★ Based on 90+</p>
            </div>
          </div>

          {/* Filters */}
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

          {/* Table */}
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
                  <tr
                    key={vendor._id}
                  >
                    <td>
                      <div className="worker-cell" onClick={() => navigate(`/admin/vendors/${vendor._id}`)} style={{ cursor: 'pointer' }}>
                        <img
                          src={vendor.companyLogo ? `http://localhost:5000/${vendor.companyLogo}` : `https://ui-avatars.com/api/?name=${vendor.companyName || vendor.ownerName}&background=3b82f6&color=fff`}
                          alt={vendor.companyName || vendor.ownerName}
                          className="worker-table-avatar"
                        />
                        <div>
                          <div className="worker-name">{vendor.companyName || vendor.ownerName}</div>
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
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              size={14} 
                              fill={star <= vendor.adminRating ? '#fbbf24' : '#e5e7eb'} 
                              stroke={star <= vendor.adminRating ? '#fbbf24' : '#e5e7eb'} 
                            />
                          ))}
                          <span>{vendor.adminRating}/5</span>
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

          {/* Pagination */}
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
  );
}
