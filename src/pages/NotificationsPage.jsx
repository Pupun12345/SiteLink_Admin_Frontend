import { useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  CircleHelp,
  Eye,
  Mail,
  Settings,
  ShieldAlert,
  Trash2,
  UserCheck,
  WalletCards,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import './NotificationsPage.css';

const tabs = ['All Notifications', 'System', 'Verifications', 'Subscriptions'];

const notificationsSeed = [
  {
    id: 1,
    type: 'Verification',
    group: 'Verifications',
    message: 'Worker ID #4492 pending manual review for safety certification documents.',
    dateTime: 'Oct 24, 2023 • 10:30 AM',
    status: 'Unread',
  },
  {
    id: 2,
    type: 'System',
    group: 'System',
    message: 'Scheduled database maintenance will occur at 02:00 UTC. Estimated downtime 15m.',
    dateTime: 'Oct 23, 2023 • 04:15 PM',
    status: 'Read',
  },
  {
    id: 3,
    type: 'Subscription',
    group: 'Subscriptions',
    message: "Vendor 'BuildCorp' has successfully renewed their Enterprise Pro plan.",
    dateTime: 'Oct 23, 2023 • 09:00 AM',
    status: 'Read',
  },
  {
    id: 4,
    type: 'Verification',
    group: 'Verifications',
    message: "New Vendor 'SteelWorks' submitted onboarding documents for verification.",
    dateTime: 'Oct 22, 2023 • 02:45 PM',
    status: 'Archived',
  },
  {
    id: 5,
    type: 'System',
    group: 'System',
    message: 'High failed login attempts detected from IP 192.168.1.104. Monitoring active.',
    dateTime: 'Oct 22, 2023 • 11:12 AM',
    status: 'Unread',
  },
];

const typeConfig = {
  Verification: { icon: UserCheck, className: 'verification' },
  System: { icon: ShieldAlert, className: 'system' },
  Subscription: { icon: WalletCards, className: 'subscription' },
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('All Notifications');

  const adminUser = useMemo(() => JSON.parse(localStorage.getItem('adminUser') || '{}'), []);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'All Notifications') {
      return notificationsSeed;
    }
    return notificationsSeed.filter((item) => item.group === activeTab);
  }, [activeTab]);

  const unreadCount = notificationsSeed.filter((item) => item.status === 'Unread').length;
  const verificationCount = notificationsSeed.filter((item) => item.type === 'Verification').length;

  return (
    <div className="notifications-page-shell">
      <Sidebar />

      <main className="notifications-content">
        <header className="notifications-topbar">
          <h1>Notifications Management</h1>

          <div className="notifications-topbar-right">
            <div className="notifications-search">
              <Bell size={16} />
              <input type="search" placeholder="Search notifications..." />
            </div>

            <button type="button" className="mini-icon-btn" aria-label="Notification center">
              <Bell size={15} />
            </button>
            <button type="button" className="mini-icon-btn" aria-label="Help">
              <CircleHelp size={15} />
            </button>
          </div>
        </header>

        <section className="notifications-title-row">
          <div>
            <h2>Alert History</h2>
            <p>Manage and track all system and user alerts across the platform.</p>
          </div>

          <div className="title-actions">
            <button type="button" className="ghost-action-btn">
              <CheckCheck size={15} />
              Mark all as read
            </button>
            <button type="button" className="primary-action-btn">
              <Settings size={15} />
              Notification Settings
            </button>
          </div>
        </section>

        <section className="notification-panel">
          <div className="notification-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="notifications-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Notification Type</th>
                  <th>Message</th>
                  <th>Date &amp; Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotifications.map((item) => {
                  const config = typeConfig[item.type] || typeConfig.System;
                  const TypeIcon = config.icon;

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="type-cell">
                          <span className={`type-icon ${config.className}`}>
                            <TypeIcon size={13} />
                          </span>
                          {item.type}
                        </div>
                      </td>
                      <td className="message-cell">{item.message}</td>
                      <td>{item.dateTime}</td>
                      <td>
                        <span className={`status-chip ${item.status.toLowerCase()}`}>{item.status}</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button type="button" aria-label={`View notification ${item.id}`}>
                            <Eye size={14} />
                          </button>
                          <button type="button" aria-label={`Delete notification ${item.id}`}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="notification-footer">
            <p>Showing 1 to {filteredNotifications.length} of 42 notifications</p>
            <div className="pagination">
              <button type="button">Previous</button>
              <button type="button" className="active">
                1
              </button>
              <button type="button">2</button>
              <button type="button">3</button>
              <button type="button">Next</button>
            </div>
          </div>
        </section>

        <section className="notification-stats-grid">
          <article className="small-stat-card">
            <span className="small-stat-icon blue">
              <Mail size={17} />
            </span>
            <div>
              <p>Unread Notifications</p>
              <strong>{unreadCount}</strong>
            </div>
          </article>

          <article className="small-stat-card">
            <span className="small-stat-icon amber">
              <UserCheck size={17} />
            </span>
            <div>
              <p>Pending Verifications</p>
              <strong>{verificationCount}</strong>
            </div>
          </article>

          <article className="small-stat-card">
            <span className="small-stat-icon green">
              <CheckCheck size={17} />
            </span>
            <div>
              <p>System Health</p>
              <strong>Optimal</strong>
            </div>
          </article>
        </section>

        <footer className="notifications-user-footer">
          <span>{adminUser.name || 'Admin User'}</span>
          <p>System Admin</p>
        </footer>
      </main>
    </div>
  );
}
