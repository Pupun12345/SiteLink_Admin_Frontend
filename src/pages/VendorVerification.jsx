import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, ClipboardList, BarChart2, Download, Building, FilePlus } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/ToastProvider';
import api from '../api/axios';
import "./verificationVendor.css";

export default function VendorVerification() {
  const [vendors, setVendors] = useState([]);
  const [overview, setOverview] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [tableLoading, setTableLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    fetchOverview();
    fetchVendors(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchVendors(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchOverview = async () => {
    try {
      const { data } = await api.get('/stats/overview');
      setOverview(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchVendors = async (status) => {
    setTableLoading(true);
    try {
      const query = status && status !== 'all' ? `?status=${status}` : '';
      const { data } = await api.get(`/admin/vendors${query}`);
      setVendors(data.data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      toast.showToast(err.response?.data?.message || 'Failed to fetch vendors', { type: 'error' });
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/admin/login');
      }
    } finally {
      setTableLoading(false);
    }
  };


  const getVendorLogo = (vendor) => {
    const img = vendor?.companyLogo || vendor?.profileImage;
    if (!img) return null;
    return img.startsWith('http') ? img : `http://localhost:5000/${img}`;
  };

  const formatDate = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  };

  const exportToCSV = () => {
    if (!vendors.length) {
      toast.showToast('No vendors to export', { type: 'info' });
      return;
    }

    const headers = [
      'Company Name',
      'Contact Person',
      'Email',
      'City',
      'GST Number',
      'Status',
      'Submitted',
    ];

    const escape = (value) => {
      if (value == null) return '';
      const str = String(value);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = vendors.map((vendor) => [
      vendor.companyName,
      vendor.ownerName,
      vendor.email,
      vendor.city,
      vendor.gstNumber,
      vendor.verificationStatus,
      formatDate(vendor.createdAt),
    ]);

    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vendors_${statusFilter}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const statusTabs = [
    { key: 'all', label: 'All Applications' },
    { key: 'pending', label: 'Pending' },
    { key: 'verified', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const totalVendors = overview?.totalVendors ?? 0;
  const pendingCount = overview?.pendingVendors ?? 0;
  const verifiedCount = overview?.verifiedVendors ?? 0;
  const rejectedCount = overview?.rejectedVendors ?? 0;
  const rejectionRate = totalVendors > 0 ? ((rejectedCount / totalVendors) * 100).toFixed(1) : '0.0';

  const isActionDisabled =
    isProcessing || (selectedVendor?.verificationStatus && selectedVendor.verificationStatus !== 'pending');

  const handleVerify = async (id) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await api.put(`/admin/vendors/${id}/verify`);
      toast.showToast('Vendor verified successfully!', { type: 'success' });
      setSelectedVendor(null);
      fetchOverview();
      fetchVendors(statusFilter);
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Verification failed', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.showToast('Please provide a rejection reason', { type: 'error' });
      return;
    }

    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await api.put(`/admin/vendors/${selectedVendor._id}/reject`, { reason: rejectionReason });
      toast.showToast('Vendor verification rejected', { type: 'success' });
      setShowRejectModal(false);
      setSelectedVendor(null);
      setRejectionReason('');
      fetchOverview();
      fetchVendors(statusFilter);
    } catch (err) {
      toast.showToast(err.response?.data?.message || 'Rejection failed', { type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const tableColumns = [
    { key: 'companyName', label: 'Company Name', className: 'col-company' },
    { key: 'ownerName', label: 'Contact Person', className: 'col-owner' },
    { key: 'email', label: 'Email', className: 'col-email' },
    { key: 'city', label: 'City', className: 'col-city' },
    { key: 'gstNumber', label: 'GST Number', className: 'col-gst' },
    { key: 'createdAt', label: 'Submitted', className: 'col-submitted' },
    { key: 'actions', label: 'Actions', className: 'col-actions' },
  ];

  const tableRows = useMemo(() => {
    if (!vendors) return [];
    return vendors.map((vendor) => ({
      ...vendor,
      submitted: formatDate(vendor.createdAt),
    }));
  }, [vendors]);

  const [dateFilter, setDateFilter] = useState('30d');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const filteredRows = useMemo(() => {
    if (dateFilter === 'all') return tableRows;

    const days = dateFilter === '7d' ? 7 : dateFilter === '30d' ? 30 : 90;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return tableRows.filter((row) => {
      const date = new Date(row.createdAt);
      return date >= cutoff;
    });
  }, [tableRows, dateFilter]);

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = [1];
    const left = Math.max(2, currentPage - 1);
    const right = Math.min(totalPages - 1, currentPage + 1);

    if (left > 2) pages.push('left-ellipsis');
    for (let i = left; i <= right; i += 1) {
      pages.push(i);
    }
    if (right < totalPages - 1) pages.push('right-ellipsis');
    pages.push(totalPages);

    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="dashboard-page">
      <Sidebar />
      <div className="dashboard-content">
        <div className="verification-container">
          <div className="verification-header">
            <div className="header-left">
              <button className="back-btn" onClick={() => navigate('/admin/dashboard')}>
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
              <div className="header-title">
                <h1>Vendor Verification</h1>
                <p className="header-subtitle">
                  Review and approve vendor applications and compliance documents.
                </p>
              </div>
            </div>
            <div className="header-actions">
              <button className="secondary-btn" onClick={exportToCSV}>
                <Download size={16} /> Export CSV
              </button>
              <button
                className="primary-btn"
                onClick={() => toast.showToast('Invite flow coming soon', { type: 'info' })}
              >
                <FilePlus size={16} /> Invite Vendor
              </button>
            </div>
          </div>

          <div className="verification-stats-grid">
            <div className="verification-stat-card">
              <div>
                <div className="verification-stat-top">
                  <span className="verification-stat-title">Pending Reviews</span>
                  <span className="verification-stat-badge">{pendingCount}</span>
                </div>
                <div className="verification-stat-value">{pendingCount.toLocaleString()}</div>
                <div className="verification-stat-sub">
                  {pendingCount === 0 ? 'No pending items' : 'New since yesterday'}
                </div>
              </div>
              <div className="verification-stat-icon">
                <ClipboardList size={18} />
              </div>
            </div>

            <div className="verification-stat-card">
              <div>
                <div className="verification-stat-top">
                  <span className="verification-stat-title">Verified Vendors</span>
                  <span className="verification-stat-badge success">{verifiedCount}</span>
                </div>
                <div className="verification-stat-value">{verifiedCount.toLocaleString()}</div>
                <div className="verification-stat-sub">
                  {verifiedCount === 0 ? 'None verified yet' : '12% increase this month'}
                </div>
              </div>
              <div className="verification-stat-icon">
                <CheckCircle size={18} />
              </div>
            </div>

            <div className="verification-stat-card">
              <div>
                <div className="verification-stat-top">
                  <span className="verification-stat-title">Rejection Rate</span>
                  <span className="verification-stat-badge danger">{rejectionRate}%</span>
                </div>
                <div className="verification-stat-value">{rejectionRate}%</div>
                <div className="verification-stat-sub">Same as previous period</div>
              </div>
              <div className="verification-stat-icon">
                <XCircle size={18} />
              </div>
            </div>
          </div>

          <div className="table-card">
            <div className="table-card-header">
              <div className="tabs">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.key}
                    className={`tab ${statusFilter === tab.key ? 'active' : ''}`}
                    onClick={() => setStatusFilter(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="table-actions">
                <span className="filter-label">Filter by:</span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>

            {tableLoading ? (
              <div className="loading">Loading vendors...</div>
            ) : filteredRows.length === 0 ? (
              <div className="empty-state">No vendors found for this filter.</div>
            ) : (
              <>
                <div className="table-wrapper">
                  <table className="vendors-table">
                    <thead>
                      <tr>
                        {tableColumns.map((col) => (
                          <th key={col.key} className={col.className}>
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRows.map((vendor) => (
                        <tr key={vendor._id} onClick={() => navigate(`/admin/vendors/${vendor._id}`)}>
                          <td className="col-company">
                            <div className="company-cell">
                              <div className="company-avatar">
                                {getVendorLogo(vendor) ? (
                                  <img src={getVendorLogo(vendor)} alt={vendor.companyName || vendor.ownerName} />
                                ) : (
                                  <div className="placeholder-avatar">
                                    <Building size={18} />
                                  </div>
                                )}
                              </div>
                              <div className="company-info">
                                <div className="company-name">{vendor.companyName || '—'}</div>
                                <div className="company-sub">{vendor.ownerName || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="col-owner">{vendor.ownerName || '—'}</td>
                          <td className="col-email">{vendor.email || '—'}</td>
                          <td className="col-city">{vendor.city || '—'}</td>
                          <td className="col-gst">{vendor.gstNumber || '—'}</td>
                          <td className="col-submitted">{formatDate(vendor.createdAt)}</td>
                          <td className="col-actions">
                            <button
                              className="action-link"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/vendors/${vendor._id}`);
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="table-footer">
                    <div className="pagination-info">
                      Showing {Math.min(totalRows, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(totalRows, currentPage * rowsPerPage)} of {totalRows} entries
                    </div>
                    <div className="pagination-controls">
                      <button
                        className="pagination-btn"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        ‹
                      </button>
                      {pageNumbers.map((page) =>
                        typeof page === 'number' ? (
                          <button
                            key={page}
                            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        ) : (
                          <span key={page} className="pagination-ellipsis">
                            …
                          </span>
                        )
                      )}
                      <button
                        className="pagination-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {selectedVendor && (
            <div className="modal-overlay" onClick={() => setSelectedVendor(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setSelectedVendor(null)}>
                  <XCircle size={20} />
                </button>

                <div className="modal-header">
                  {(() => {
                    const vendorImage = selectedVendor.companyLogo || selectedVendor.profileImage;
                    const src = vendorImage
                      ? vendorImage.startsWith('http')
                        ? vendorImage
                        : `http://localhost:5000/${vendorImage}`
                      : undefined;
                    return (
                      <div className="modal-avatar-wrapper">
                        {src ? (
                          <img src={src} alt={selectedVendor.companyName || selectedVendor.ownerName} />
                        ) : (
                          <div className="placeholder-avatar">
                            <Building size={28} />
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <div>
                    <h2>{selectedVendor.companyName || selectedVendor.ownerName}</h2>
                    <p className="modal-subtitle">{selectedVendor.phone || 'No phone provided'}</p>
                  </div>
                </div>

                <div className="modal-body">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Owner Name</label>
                      <span>{selectedVendor.ownerName || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Company Name</label>
                      <span>{selectedVendor.companyName || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>City</label>
                      <span>{selectedVendor.city || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <span>{selectedVendor.email || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>GST Number</label>
                      <span>{selectedVendor.gstNumber || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>PAN Number</label>
                      <span>{selectedVendor.panNumber || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>License Number</label>
                      <span>{selectedVendor.licenseNumber || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Project Types</label>
                      <span>
                        {selectedVendor.projectTypes?.length > 0
                          ? selectedVendor.projectTypes.join(', ')
                          : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="documents-section">
                    <label>Documents</label>
                    <div className="documents-grid">
                      {selectedVendor.panCardImage ? (
                        <div className="document-card">
                          <img src={selectedVendor.panCardImage} alt="PAN Card" />
                          <a href={selectedVendor.panCardImage} download>
                            <Download size={16} /> Download
                          </a>
                        </div>
                      ) : (
                        <div className="document-card empty">
                          <span>No PAN card uploaded</span>
                        </div>
                      )}

                      {selectedVendor.companyLogo ? (
                        <div className="document-card">
                          <img src={selectedVendor.companyLogo} alt="Company Logo" />
                          <a href={selectedVendor.companyLogo} download>
                            <Download size={16} /> Download
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    className="reject-btn"
                    onClick={() => setShowRejectModal(true)}
                    disabled={isActionDisabled}
                  >
                    <XCircle size={20} />
                    Reject
                  </button>
                  <button
                    className="approve-btn"
                    onClick={() => handleVerify(selectedVendor._id)}
                    disabled={isActionDisabled}
                  >
                    <CheckCircle size={20} />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          )}

          {showRejectModal && (
            <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
              <div className="reject-modal" onClick={(e) => e.stopPropagation()}>
                <h3>Rejection Reason</h3>
                <textarea
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                />
                <div className="reject-modal-actions">
                  <button onClick={() => setShowRejectModal(false)}>Cancel</button>
                  <button className="confirm-reject" onClick={handleReject}>
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
