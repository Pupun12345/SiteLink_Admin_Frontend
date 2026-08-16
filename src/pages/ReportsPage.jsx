import { useMemo, useState, useEffect } from 'react';
import { Bell, Briefcase, CreditCard, Download, DollarSign, Search, Users } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import toast, { Toaster } from 'react-hot-toast';
import api from '../api/axios';
import './ReportsPage.css';

const reportCards = [
  {
    key: 'user',
    title: 'User Reports',
    description:
      'Analyze vendor growth, worker verification rates, and platform engagement status.',
    icon: Users,
    iconClass: 'blue',
    formats: ['CSV'],
  },
  {
    key: 'revenue',
    title: 'Revenue Reports',
    description: 'Export transaction logs, monthly recurring revenue (MRR), and earnings distribution.',
    icon: DollarSign,
    iconClass: 'green',
    formats: ['CSV'],
  },
  {
    key: 'jobs',
    title: 'Job Reports',
    description: 'Monitor job fulfillment rates, application volume, and requirement fulfillment monitoring.',
    icon: Briefcase,
    iconClass: 'amber',
    formats: ['CSV'],
  },
];


export default function ReportsPage() {
  const [formState, setFormState] = useState(() =>
    reportCards.reduce((acc, card) => {
      acc[card.key] = {
        startDate: '',
        endDate: '',
        format: card.formats[0],
      };
      return acc;
    }, {})
  );
  const [profile, setProfile] = useState({ name: '', email: '', imageUrl: '' });
  const [exportHistory, setExportHistory] = useState([]);
  const [loadingKey, setLoadingKey] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVendors: 0,
    totalWorkers: 0,
    totalRevenue: 0,
    totalJobs: 0
  });

  useEffect(() => {
    fetchProfile();
    fetchStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile/me');
      if (response.data.data?.user) {
        const user = response.data.data.user;
        setProfile({
          name: user.name || 'Admin User',
          email: user.email || '',
          imageUrl: user.profileImage || `https://ui-avatars.com/api/?name=${user.name || 'Admin'}&background=f3b86b&color=2b2b2b`
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/vendor-worker', {
        params: { userType: 'all', status: 'all', limit: 1000 }
      });
      const data = response.data.data || [];
      const vendors = data.filter(u => u.userType === 'vendor');
      const workers = data.filter(u => u.userType === 'worker');
      
      setStats({
        totalUsers: data.length,
        totalVendors: vendors.length,
        totalWorkers: workers.length,
        totalRevenue: 0,
        totalJobs: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const updateCardState = (cardKey, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [cardKey]: {
        ...prev[cardKey],
        [field]: value,
      },
    }));
  };

  const handleGenerateReport = async (reportType) => {
    const state = formState[reportType];
    
    if (!state.startDate || !state.endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoadingKey(reportType);
    const loadingToast = toast.loading('Generating report...');

    try {
      let data = [];
      let headers = [];
      let filename = '';

      if (reportType === 'user') {
        const response = await api.get('/admin/vendor-worker', {
          params: { userType: 'all', status: 'all', limit: 1000, startDate: state.startDate, endDate: state.endDate }
        });
        data = response.data.data || [];
        headers = ['Name', 'Email', 'Phone', 'User Type', 'Company Name', 'Subscription', 'Experience', 'Role', 'Additional Skills', 'Work State', 'City', 'Verification Status', 'Created Date'];
        filename = `User_Report_${state.startDate}_to_${state.endDate}`;
        
        data = data.map(u => ([
          u.name || '',
          u.email || '',
          u.phone || '',
          u.userType || '',
          u.companyName || '',
          u.subscription ? 'Yes' : 'No',
          u.experience || '',
          u.role || '',
          Array.isArray(u.additionalSkills) ? u.additionalSkills.map(s => s.skillName || s).join(', ') : '',
          u.workState || '',
          u.city || '',
          u.verificationStatus || '',
          u.join || ''
        ]));
      } else if (reportType === 'revenue') {
        const response = await api.get('/stats/revenue-stats/report', {
          params: { startDate: state.startDate, endDate: state.endDate }
        });
        const { subscriptions: subs, totalRevenue } = response.data.data;
        if (!subs || subs.length === 0) {
          toast.error('No revenue data found for the selected date range', { id: loadingToast });
          setLoadingKey(null);
          return;
        }
        const planLabels = { vendor_basic: 'Vendor Basic', vendor_premium: 'Vendor Premium', worker: 'Worker Premium', worker_premium: 'Worker Premium' };
        headers = ['User Name', 'Company Name', 'User Type', 'Plan', 'Status', 'Amount', 'Start Date', 'End Date'];
        filename = `Revenue_Report_${state.startDate}_to_${state.endDate}`;
        data = subs.map(s => [
          s.userName || 'N/A',
          s.companyName || 'N/A',
          s.userType || 'N/A',
          planLabels[s.plan] || s.plan || 'N/A',
          s.status || 'N/A',
          `₹${s.amount || 0}`,
          s.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A',
          s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A',
        ]);
        data.push(['', '', '', '', 'TOTAL', `₹${totalRevenue}`, '', '']);
      } else if (reportType === 'jobs') {
        const response = await api.get('/admin/reports/jobs', {
          params: { startDate: state.startDate, endDate: state.endDate }
        });
        const { dayWise, summary, jobs: jobList } = response.data.data;

        // Day-wise breakdown sheet
        headers = ['Date', 'Total Created', 'Open', 'Filled', 'Closed', 'Cancelled'];
        filename = `Jobs_Report_${state.startDate}_to_${state.endDate}`;
        data = dayWise.map(d => [
          d.date, d.total, d.open, d.filled, d.closed, d.cancelled
        ]);
      }

      if (state.format === 'CSV') {
        downloadCSV(headers, data, filename);
      }

      const newExport = {
        reportName: filename,
        dateGenerated: new Date().toLocaleString(),
        status: 'Ready',
        fileType: state.format
      };
      setExportHistory(prev => [newExport, ...prev]);

      toast.success('Report generated successfully!', { id: loadingToast });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report', { id: loadingToast });
    } finally {
      setLoadingKey(null);
    }
  };

  const downloadCSV = (headers, rows, filename) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleClearHistory = () => {
    setExportHistory([]);
    toast.success('Export history cleared');
  };

  return (
    <div className="reports-page-shell">
      <Toaster position="top-right" reverseOrder={false} />
      <Sidebar />

      <div className="reports-content">
        <header className="reports-header">
          <div className="reports-search">
            <Search size={18} />
            <input type="search" placeholder="Search reports, logs, or files..." />
          </div>

          <div className="reports-header-right">
            <button className="reports-icon-btn" type="button" aria-label="Notifications">
              <Bell size={18} />
            </button>

            <div className="reports-user-meta">
              <div>
                <p className="reports-user-name">{profile.name || 'Admin User'}</p>
                <p className="reports-user-role">Admin</p>
              </div>
              <img
                src={profile.imageUrl || `https://ui-avatars.com/api/?name=${profile.name || 'Admin'}&background=f3b86b&color=2b2b2b`}
                alt="Admin avatar"
              />
            </div>
          </div>
        </header>

        <div className="reports-title-row">
          <h1>Reports &amp; Data Export</h1>
          <p>Advanced analytical insights and bulk data extraction for SiteLink ecosystem.</p>
        </div>

        <div className="reports-cards-grid">
          {reportCards.map((card) => {
            const Icon = card.icon;
            return (
              <section key={card.key} className="report-card">
                <div className="report-card-top">
                  <div className={`report-card-icon ${card.iconClass}`}>
                    <Icon size={16} />
                  </div>
                  <h2>{card.title}</h2>
                </div>

                <p className="report-card-description">{card.description}</p>

                <div className="report-card-fields">
                  <label>
                    <span>Start Date</span>
                    <input
                      type="date"
                      value={formState[card.key].startDate}
                      onChange={(e) => updateCardState(card.key, 'startDate', e.target.value)}
                    />
                  </label>

                  <label>
                    <span>End Date</span>
                    <input
                      type="date"
                      value={formState[card.key].endDate}
                      onChange={(e) => updateCardState(card.key, 'endDate', e.target.value)}
                    />
                  </label>

                  <label>
                    <span>Format</span>
                    <select
                      value={formState[card.key].format}
                      onChange={(e) => updateCardState(card.key, 'format', e.target.value)}
                    >
                      {card.formats.map((format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <button 
                  type="button" 
                  className="report-download-btn"
                  onClick={() => handleGenerateReport(card.key)}
                  disabled={loadingKey === card.key}
                >
                  <Download size={14} />
                  {loadingKey === card.key ? 'Generating...' : 'Generate & Download'}
                </button>
              </section>
            );
          })}
        </div>

      </div>
    </div>
  );
}
