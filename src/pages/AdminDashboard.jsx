import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Bell,
  BarChart2,
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
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("1M");
  const [selectedPeriod, setSelectedPeriod] = useState("1M");

  const navigate = useNavigate();

  const adminUser = JSON.parse(localStorage.getItem("adminUser") || "{}");

  useEffect(() => {
    fetchStats();
  }, []);

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
    },
    {
      title: "Total Vendors",
      value: overview?.totalVendors ?? 0,
      delta: overview
        ? `↗ ${((overview.totalVendors || 0) * 0.03).toFixed(0)}% from last week`
        : "↗ 3% from last week",
      icon: ShoppingBag,
      accent: "#0ea5e9",
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
        ? `$${overview.totalRevenue.toLocaleString()}`
        : "$124,000",
      delta: "↗ 12% this month",
      icon: BarChart2,
      accent: "#0ea5e9",
      highlight: true,
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
            <button className="primary-btn invite-btn">
              <UserPlus size={18} />
              Invite User
            </button>

            <button className="icon-btn">
              <Bell size={18} />
            </button>

            <div className="user-menu">
              <div className="user-avatar">
                <img
                  src={`https://ui-avatars.com/api/?name=${adminUser.name || "Admin"
                    }&background=3b82f6&color=fff`}
                  alt="Admin"
                />
              </div>
              <div className="user-info">
                <p className="user-name">{adminUser.name || "Admin"}</p>
                <p className="user-role">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* PERIOD FILTER */}
        <div className="period-picker">
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
            <div
              key={card.title}
              className={`stat-card ${card.highlight ? "highlight" : ""}`}
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
            </div>
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
            <div className="chart-placeholder chart-line" />
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chart-header">
              <h3>Vendor Registrations</h3>
            </div>
            <div className="chart-placeholder chart-bars" />
          </motion.div>

          <motion.div
            className="chart-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="chart-header">
              <h3>Monthly Revenue</h3>
            </div>
            <div className="chart-placeholder chart-line" />
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
              <div className="chart-donut-label">14.7k</div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}