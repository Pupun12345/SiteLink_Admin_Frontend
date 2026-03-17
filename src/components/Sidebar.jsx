import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import './Sidebar.css';

const mainItems = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: LayoutGrid,
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
    label: 'Jobs',
    path: '/admin/jobs',
    icon: Briefcase,
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

  const allItems = [...mainItems, ...financeItems, ...systemItems];

  const activePath = useMemo(() => {
    return allItems.find((item) => location.pathname.startsWith(item.path))?.path;
  }, [location.pathname]);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon" />
        <div className="brand-text">
          <div className="brand-name">SiteLink</div>
          <div className="brand-sub">Admin Console</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        <p className="sidebar-group-label">Main</p>
        {mainItems.map((item) => {
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

        <p className="sidebar-group-label sidebar-group-label-finance">Finance</p>
        {financeItems.map((item) => {
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

        <p className="sidebar-group-label sidebar-group-label-finance">System</p>
        {systemItems.map((item) => {
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
      </div>
    </aside>
  );
}
