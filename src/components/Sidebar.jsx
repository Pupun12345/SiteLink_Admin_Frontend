import { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePermissions, hasPermission } from '../hooks/usePermissions';
import {
  LayoutGrid,
  Bell,
  Activity,
  Users,
  Store,
  Shield,
  Briefcase,
  BarChart2,
  DollarSign,
  SlidersHorizontal,
  Settings,
  HelpCircle,
  BaggageClaim,
  FileText,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import './Sidebar.css';

const mainItems = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: LayoutGrid,
  },
  {
    label: 'User Management',
    path: '/admin/user-management',
    icon: Users,
  },
  {
    label: 'Requirements',
    path: '/admin/requirements',
    icon: BaggageClaim,
  },
  {
    label: 'Workers',
    path: '/admin/workers',
    icon: Users,
  },
  {
    label: 'Vendors',
    path: '/admin/vendors',
    icon: Store,
  },
  {
    label: 'Verifications',
    path: '/admin/verifications',
    icon: Shield,
  },
  {
    label: 'Create Post',
    path: '/admin/create-post',
    icon: FileText,
  },
  {
    label: 'Reports',
    path: '/admin/reports',
    icon: BarChart2,
  },
];

const systemItems = [
  {
    label: 'System Monitoring',
    path: '/admin/system-monitoring',
    icon: Activity,
  },
  {
    label: 'Notifications',
    path: '/admin/notifications',
    icon: Bell,
  },
  {
    label: 'Platform Settings',
    path: '/admin/platform-settings',
    icon: SlidersHorizontal,
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: Settings,
  },
];

const financeItems = [
  {
    label: 'Revenue',
    path: '/admin/revenue',
    icon: DollarSign,
  },
];

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const permissions = usePermissions();
  const adminUser = localStorage.getItem('adminUser');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const filteredMainItems = mainItems.filter(item => {
    if (!adminUser) return true;
    if (item.path === '/admin/verifications' || item.path === "/admin/vendors" || item.path === "/admin/workers") {
      return hasPermission(permissions, 'canVerifyUsers');
    }

    return true;
  });

  const filteredFinanceItems = financeItems.filter(item => {
    if (!adminUser) return true;
    if (item.path === '/admin/revenue') {
      return hasPermission(permissions, 'canAccessRevenue');
    }
    return true;
  });

  const filteredSystemItems = systemItems.filter(item => {
    if (!adminUser) return true;
    if (item.path === '/admin/platform-settings') {
      return hasPermission(permissions, 'canAccessPlatformSettings');
    }
    return true;
  });

  const allItems = [...filteredMainItems, ...filteredFinanceItems, ...filteredSystemItems];

  const activePath = useMemo(() => {
    return allItems.find((item) => location.pathname.startsWith(item.path))?.path;
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');

    if (onLogout) {
      onLogout();
    }
    
    navigate('/admin/login');
  };

  return (
    <>
      <button 
        className={`hamburger-menu-btn ${isMobileMenuOpen ? 'menu-open' : ''}`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isMobileMenuOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`app-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">
          <img src="/SiteLinkIcon.png" alt="SiteLink Logo" />
        </div>
        <div className="brand-text">
          <div className="brand">SiteLink</div>
          <div className="brand-sub">Admin Console</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        <p className="sidebar-group-label">Main</p>
        {filteredMainItems.map((item) => {
          const Icon = item.icon;
          const active = activePath === item.path;
          return (
            <button
              key={item.path}
              className={`sidebar-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}

        {filteredFinanceItems.length > 0 && (
          <>
            <p className="sidebar-group-label sidebar-group-label-finance">Finance</p>
            {filteredFinanceItems.map((item) => {
          const Icon = item.icon;
          const active = activePath === item.path;
          return (
            <button
              key={item.path}
              className={`sidebar-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
          </>
        )}

        <p className="sidebar-group-label sidebar-group-label-finance">System</p>
        {filteredSystemItems.map((item) => {
          const Icon = item.icon;
          const active = activePath === item.path;
          return (
            <button
              key={item.path}
              className={`sidebar-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={() => navigate('/admin/support')}>
          <HelpCircle size={17} />
          <span>Support</span>
        </button>
        <button className="sidebar-item logout-btn" onClick={handleLogout}>
          <LogOut size={17} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
}
