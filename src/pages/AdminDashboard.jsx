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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("1M");
  const [selectedPeriod, setSelectedPeriod] = useState("1M");

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
    fetchStats();
    fetchAdminProfile();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      fetchChartData();
    }
  }, [selectedPeriod]);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/stats/overview");
      setStats(data.data);
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
      const { data } = await api.get(`/stats/chart-data?period=${selectedPeriod}`);
      setChartData(data.data);
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
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
      value: overview?.pendingVendors ?? 0,
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
      title: "Subscriptions",
      value: overview?.budgetUtilization
        ? `${overview.budgetUtilization.toFixed(0)}%`
        : "––",
      delta: "Stable",
      icon: CreditCard,
      accent: "#7c3aed",
    },
    {
      title: "Total Revenue",
      value: overview?.totalRevenue
        ? `₹${overview.totalRevenue.toLocaleString()}`
        : "₹124,000",
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
      <Sidebar onLogout={handleLogout} />

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
                  src={`${profile.imageUrl}`}
                  alt="Admin"
                />
              </div>
              <div className="user-info">
                <p className="user-name">{profile.name || "Admin"}</p>
                <p className="user-role">Super Admin</p>
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
              className={`period-btn ${selectedPeriod === period ? "active" : ""
                }`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </button>
          ))}
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
            <div className="chart-placeholder chart-line" style={{ position: 'relative' }}>
              {chartData?.workerGrowth && chartData.workerGrowth.length > 1 && (
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    points={chartData.workerGrowth.map((d, i) => {
                      const maxValue = Math.max(...chartData.workerGrowth.map(p => p.value), 1);
                      const x = (i / Math.max(chartData.workerGrowth.length - 1, 1)) * 100;
                      const y = 100 - ((d.value / maxValue) * 60 + 20);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#2f63db"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                    opacity="1"
                  />
                </svg>
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
            <div className="chart-placeholder chart-bars">
              {chartData?.vendorRegistrations && chartData.vendorRegistrations.length > 0 ? (
                <>
                  {chartData.vendorRegistrations.slice(0, 6).map((d, i, arr) => {
                    const maxValue = Math.max(...arr.map(p => p.value), 1);
                    const height = Math.max((d.value / maxValue * 100), 10);
                    const isMiddle = i === Math.floor(arr.length / 2);
                    const totalBars = arr.length;
                    const barWidth = 12;
                    const totalWidth = totalBars * barWidth + (totalBars - 1) * 4;
                    const leftPosition = 8 + ((84 - totalWidth) / 2) + (i * (barWidth + 4));
                    
                    return (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${leftPosition}%`,
                          bottom: '16%',
                          width: `${barWidth}%`,
                          height: `${height * 0.72}%`,
                          background: isMiddle ? '#2f63db' : '#e9eef7',
                          borderRadius: '8px 8px 0 0'
                        }}
                      />
                    );
                  })}
                </>
              ) : null}
            </div>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chart-header">
              <h3>Monthly Revenue</h3>
            </div>
            <div className="chart-placeholder chart-line" style={{ position: 'relative' }}>
              {chartData?.monthlyRevenue && chartData.monthlyRevenue.length > 1 && (
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                  <polyline
                    points={chartData.monthlyRevenue.map((d, i) => {
                      const maxValue = Math.max(...chartData.monthlyRevenue.map(p => p.value), 1);
                      const x = (i / Math.max(chartData.monthlyRevenue.length - 1, 1)) * 100;
                      const y = 100 - ((d.value / maxValue) * 60 + 20);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#2f63db"
                    strokeWidth="3"
                    vectorEffect="non-scaling-stroke"
                    opacity="1"
                  />
                </svg>
              )}
            </div>
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chart-header">
              <h3>User Distribution</h3>
            </div>

            <div className="chart-placeholder chart-donut">
              <div className="chart-donut-inner" />
              <div className="chart-donut-label">{chartData?.userDistribution?.total || '0'}</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}