import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Users,
  FileText,
  Receipt,
  ShieldCheck,
  Settings,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: Home,
  },
  {
    label: 'Vendors',
    path: '/admin/vendors',
    icon: Users,
  },
  {
    label: 'Contracts',
    path: '/admin/contracts',
    icon: FileText,
  },
  {
    label: 'Invoices',
    path: '/admin/invoices',
    icon: Receipt,
  },
  {
    label: 'Compliance',
    path: '/admin/compliance',
    icon: ShieldCheck,
  },
  {
    label: 'Settings',
    path: '/admin/settings',
    icon: Settings,
  },
];

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const activePath = useMemo(() => {
    return menuItems.find((item) => location.pathname.startsWith(item.path))?.path;
  }, [location.pathname]);

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon" />
        <div className="brand-text">
          <div className="brand-name">SiteLink</div>
          <div className="brand-sub">Enterprise Admin</div>
        </div>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = activePath === item.path;
          return (
            <button
              key={item.path}
              className={`sidebar-item ${active ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-item" onClick={() => onLogout?.() || navigate('/admin/login')}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
        <button className="sidebar-support" onClick={() => navigate('/admin/support')}>
          <HelpCircle size={16} />
          <span>Support</span>
        </button>
      </div>
    </aside>
  );
}
