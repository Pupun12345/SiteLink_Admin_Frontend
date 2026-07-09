import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Bell,
  BarChart2,
  FileText,
  ShoppingBag,
  Users,
  TrendingUp,
  CreditCard,
  UserPlus,
  Store,
  Briefcase,
  DollarSign,
  Search,
  Shield,
  Settings,
  HelpCircle,
  Calendar,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import "./AdminDashboard.css";
const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', imageUrl: '', role: '' });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("1M");
  const [selectedYear, setSelectedYear] = useState(null);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

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
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
            user.name || 'Admin'
          )}&background=2b3f57&color=fff`;

        console.log('Image URL:', imageUrl);

        setProfile({
          name: user.name || '',
          email: user.email || '',
          imageUrl: imageUrl,
          role: user.userType || user.role || ''
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAdminProfile();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchYearData(selectedYear);
    } else {
      fetchChartData();
    }
  }, [selectedPeriod, selectedYear]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/stats/overview");
      
      // Fetch real revenue data from new endpoint
      const revenueResponse = await api.get('/stats/revenue-stats');
      const revenueData = revenueResponse.data.data;
      
      setStats({
        ...data.data,
        totalRevenue: revenueData.totalRevenue,
        activeSubscriptions: revenueData.activeSubscriptions
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const params = new URLSearchParams({ period: selectedPeriod });
      const { data } = await api.get(`/stats/chart-data?${params}`);
      setChartData(data.data);
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
    }
  };

  const fetchYearData = async (year) => {
    try {
      const { data } = await api.get(`/stats/year-data?year=${year}`);
      setChartData(data.data);
    } catch (err) {
      console.error("Failed to fetch year data:", err);
    }
  };

  const renderYAxis = (data, formatter = (v) => v) => {
    if (!data?.length) return null;
    const max = Math.max(...data.map(d => d.value), 1);

    return [4, 3, 2, 1, 0].map(level => {
      const value = Math.round((max * level) / 4);

      return (
        <div
          key={level}
          style={{
            position: "absolute",
            left: "4px",
            top: `${10 + (4 - level) * 18}%`,
            fontSize: "10px",
            color: "#7c8ca8",
            zIndex: 5,
            pointerEvents: "none",
            fontWeight: "500"
          }}
        >
          {formatter(value)}
        </div>
      );
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const overview = stats;

  const formatStatValue = (card) => card.value;

  const statCards = [
    {
      title: "Total Workers",
      value: overview?.totalWorkers ?? 0,
      delta: overview
        ? `↗ ${((overview.totalWorkers || 0) * 0.08).toFixed(0)}% from last week`
        : "↗ 8% from last week",
      icon: Users,
      accent: "#4f46e5",
      path: "/admin/workers",
    },
    {
      title: "Total Vendors",
      value: overview?.totalVendors ?? 0,
      delta: overview
        ? `↗ ${((overview.totalVendors || 0) * 0.03).toFixed(0)}% from last week`
        : "↗ 3% from last week",
      icon: ShoppingBag,
      accent: "#0ea5e9",
      path: "/admin/vendors",
    },
    {
      title: "Pending Verifications",
      value: overview?.totalPending ?? 0,
      delta: "Action needed",
      icon: Clock,
      accent: "#f59e0b",
      badge: "Action Needed",
    },
    {
      title: "Active Jobs",
      value: overview?.activeSites ?? 0,
      delta: "Stable",
      icon: TrendingUp,
      accent: "#22c55e",
    },
    {
      title: "Active Subscriptions",
      value: overview?.activeSubscriptions ?? 0,
      delta: `${overview?.activeSubscriptions || 0} users subscribed`,
      icon: CreditCard,
      accent: "#7c3aed",
    },
    {
      title: "Total Revenue",
      value: overview?.totalRevenue
        ? `₹${overview.totalRevenue.toLocaleString()}`
        : 0,
      delta: "↗ 12% this month",
      icon: BarChart2,
      accent: "#0ea5e9",
      highlight: true,
      path: "/admin/reports",
    },
  ];

  if (loading) {
    return <div className="loading-screen">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <Sidebar className="sidebar-display" onLogout={handleLogout} />

      <div className="dashboard-content">
        {/* HEADER */}
        <header className="dashboard-header">
          <div className="header-left">
            <div className="header-title">
              <h1>Platform Overview</h1>
              <p>Real-time analytics and activity across SiteLink network.</p>
            </div>
            <div className="header-search">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search analytics, users, or jobs..."
              />
            </div>
          </div>

          <div className="header-right">

            <button className="icon-btn" onClick={() => navigate('/admin/notifications')}>
              <Bell size={18} />
            </button>

            <div className="user-menu">
              <div className="user-avatar">
                <img
                  src={profile.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Admin')}&background=2b3f57&color=fff`}
                  alt="Admin"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'Admin')}&background=2b3f57&color=fff`;
                  }}
                />
              </div>
              <div className="user-info">
                <p className="user-name">{profile.name || "Admin"}</p>
                <p className="user-role">{profile.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* PERIOD FILTER */}
        <div className="period-picker">
          <button
            type="button"
            className="period-btn reports-shortcut-btn"
            onClick={() => navigate("/admin/reports")}
          >
            <FileText size={14} />
            Reports
          </button>

          {["1D", "5D", "1M", "1Y"].map((period) => (
            <button
              key={period}
              className={`period-btn ${selectedPeriod === period && !selectedYear ? "active" : ""}`}
              onClick={() => { setSelectedPeriod(period); setSelectedYear(null); setYearDropdownOpen(false); }}
            >
              {period}
            </button>
          ))}

          <div className="year-selector">
            <button
              type="button"
              className={`period-btn year-selector-btn ${selectedYear ? "active" : ""}`}
              onClick={() => setYearDropdownOpen(o => !o)}
            >
              <Calendar size={13} />
              {selectedYear || "Year"}
            </button>
            {yearDropdownOpen && (
              <div className="year-dropdown">
                {yearOptions.map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    className={`year-option ${selectedYear === yr ? "active" : ""}`}
                    onClick={() => { setSelectedYear(yr); setYearDropdownOpen(false); }}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="stats-grid">
          {statCards.map((card) => (
            <button
              key={card.title}
              type="button"
              className={`stat-card ${card.highlight ? "highlight" : ""} ${card.path ? "stat-card-clickable" : ""
                }`}
              onClick={() => card.path && navigate(card.path)}
              disabled={!card.path}
            >
              {card.badge && <div className="stat-badge">{card.badge}</div>}

              <div
                className="stat-icon"
                style={{
                  background: `${card.accent}22`,
                  color: card.accent,
                }}
              >
                <card.icon size={18} />
              </div>

              <div className="stat-info">
                <p className="stat-title">{card.title}</p>
                <div className="stat-number">{formatStatValue(card)}</div>
                <p className="stat-delta">{card.delta}</p>
              </div>

              {card.highlight && <div className="stat-highlight" />}
            </button>
          ))}
        </div>

        {/* CHARTS */}
        <div className="charts-grid">
          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chart-header">
              <h3>Worker Growth</h3>
            </div>
            <div className="bar-chart-container">
              {chartData?.workerGrowth && chartData.workerGrowth.length > 0 ? (() => {
                  const displayData = chartData.workerGrowth;
                  const maxValue = Math.max(...displayData.map(p => p.value), 1);
                  return displayData.map((d, i) => {
                    const widthPercent = (d.value / maxValue) * 100;
                    const date = new Date(d.label);
                    const displayLabel = (selectedYear || selectedPeriod === '1M' || selectedPeriod === '1Y')
                      ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <div key={i} className="bar-chart-row">
                      <span className="bar-chart-label">{displayLabel}</span>
                      <div className="bar-chart-track">
                        <div 
                          className="bar-chart-fill worker-bar"
                          style={{ width: `${Math.max(widthPercent, 5)}%` }}
                        >
                          <span className="bar-chart-value">{d.value}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })() : (
                <div className="chart-no-data">No data available</div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chart-header">
              <h3>Vendor Registrations</h3>
            </div>
            <div className="bar-chart-container">
              {chartData?.vendorRegistrations && chartData.vendorRegistrations.length > 0 ? (() => {
                  const displayData = chartData.vendorRegistrations;
                  const maxValue = Math.max(...displayData.map(p => p.value), 1);
                  return displayData.map((d, i) => {
                    const widthPercent = (d.value / maxValue) * 100;
                    const date = new Date(d.label);
                    const displayLabel = (selectedYear || selectedPeriod === '1M' || selectedPeriod === '1Y')
                      ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <div key={i} className="bar-chart-row">
                      <span className="bar-chart-label">{displayLabel}</span>
                      <div className="bar-chart-track">
                        <div 
                          className="bar-chart-fill vendor-bar"
                          style={{ width: `${Math.max(widthPercent, 5)}%` }}
                        >
                          <span className="bar-chart-value">{d.value}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })() : (
                <div className="chart-no-data">No data available</div>
              )}
            </div>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chart-header">
              <h3>Monthly Revenue</h3>
              <p style={{ margin: '4px 0 0', color: '#7c8ca8', fontSize: '13px', fontWeight: '500' }}>Revenue generated per month (in ₹)</p>
            </div>
            <div className="bar-chart-container">
              {chartData?.monthlyRevenue && chartData.monthlyRevenue.length > 0 ? (() => {
                  const displayData = chartData.monthlyRevenue;
                  const maxValue = Math.max(...displayData.map(p => p.value), 1);
                  return displayData.map((d, i) => {
                    const widthPercent = (d.value / maxValue) * 100;
                    const date = new Date(d.label);
                    const displayLabel = (selectedYear || selectedPeriod === '1M' || selectedPeriod === '1Y')
                      ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  return (
                    <div key={i} className="bar-chart-row">
                      <span className="bar-chart-label">{displayLabel}</span>
                      <div className="bar-chart-track">
                        <div 
                          className="bar-chart-fill revenue-bar"
                          style={{ width: `${Math.max(widthPercent, 5)}%` }}
                        >
                          <span className="bar-chart-value">₹{d.value.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                });
              })() : (
                <div className="chart-no-data">No revenue data available</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}