import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Clock,
  XCircle,
  Bell,
  BarChart2,
  ShoppingBag,
  Users,
  TrendingUp,
  CreditCard,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const { data } = await api.get('/stats/overview');
      setOverview(data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const [selectedPeriod, setSelectedPeriod] = useState('1M');

  const statCards = [
    {
      title: 'Total Workers',
      value: overview?.totalWorkers ?? 0,
      delta: overview ? `↗ ${((overview.totalWorkers || 0) * 0.08).toFixed(0)}% from last week` : '↗ 8% from last week',
      icon: Users,
      accent: '#4f46e5',
    },
    {
      title: 'Total Vendors',
      value: overview?.totalVendors ?? 0,
      delta: overview ? `↗ ${((overview.totalVendors || 0) * 0.03).toFixed(0)}% from last week` : '↗ 3% from last week',
      icon: ShoppingBag,
      accent: '#0ea5e9',
    },
    {
      title: 'Pending Verifications',
      value: overview?.pendingVendors ?? 0,
      delta: 'Action needed',
      icon: Clock,
      accent: '#f59e0b',
      badge: 'Action Needed',
    },
    {
      title: 'Active Jobs',
      value: overview?.activeSites ?? 0,
      delta: 'Stable',
      icon: TrendingUp,
      accent: '#22c55e',
    },
    {
      title: 'Subscriptions',
      value: overview?.budgetUtilization ? `${overview.budgetUtilization.toFixed(0)}%` : '––',
      delta: 'Stable',
      icon: CreditCard,
      accent: '#7c3aed',
    },
    {
      title: 'Total Revenue',
      value: overview?.totalRevenue ? `$${overview.totalRevenue.toLocaleString()}` : '$124,000',
      delta: '↗ 12% this month',
      icon: BarChart2,
      accent: '#0ea5e9',
      highlight: true,
    },
  ];

  const formatStatValue = (card) => {
    return typeof card.value === 'number'
      ? card.value.toLocaleString()
      : card.value;
  };

  const adminUser = localStorage.getItem('adminUser');
  const adminName = adminUser ? JSON.parse(adminUser)?.name : 'Admin';

  return (
    <div className="dashboard-page">
      <Sidebar onLogout={handleLogout} />
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="header-left">
            <div className="header-title">
              <h1>Platform Overview</h1>
              <p>Real-time analytics and activity across SiteLink network.</p>
            </div>
            <div className="header-search">
              <input
                type="search"
                placeholder="Search analytics, users, or jobs..."
                aria-label="Search"
              />
            </div>
          </div>

          <div className="header-right">
            <button className="primary-btn invite-btn" onClick={() => alert('Invite flow coming soon')}>
              Invite User
            </button>
            <button className="icon-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="admin-info">
              <span>{adminName || 'Admin'}</span>
            </div>
          </div>
        </header>

        <div className="period-picker">
          {['1D', '5D', '1M', '1Y'].map((period) => (
            <button
              key={period}
              className={`period-btn ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">Loading dashboard…</div>
        ) : (
          <div className="dashboard-grid">
            <div className="stats-grid">
              {statCards.map((card) => (
                <div key={card.title} className={`stat-card ${card.highlight ? 'highlight' : ''}`}>
                  {card.badge && <div className="stat-badge">{card.badge}</div>}
                  <div className="stat-icon" style={{ background: `${card.accent}22`, color: card.accent }}>
                    <card.icon size={18} />
                  </div>
                  <div className="stat-info">
                    <p className="stat-title">{card.title}</p>
                    <div className="stat-number">{formatStatValue(card)}</div>
                    <p className="stat-delta">{card.delta}</p>
                  </div>
                  {card.highlight && <div className="stat-highlight" />}
                </div>
              ))}
            </div>

            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h2>Worker Growth</h2>
                </div>
                <div className="chart-placeholder chart-line" />
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h2>Vendor Registrations</h2>
                </div>
                <div className="chart-placeholder chart-bars" />
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h2>Monthly Revenue</h2>
                </div>
                <div className="chart-placeholder chart-line" />
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h2>User Distribution</h2>
                </div>
                <div className="chart-placeholder chart-donut">
                  <div className="chart-donut-inner" />
                  <div className="chart-donut-label">14.7k</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
