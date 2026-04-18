import { useMemo, useState } from 'react';
import { Bell, Briefcase, CreditCard, Download, DollarSign, Search, Users } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import './ReportsPage.css';

const reportCards = [
  {
    key: 'user',
    title: 'User Reports',
    description:
      'Analyze vendor growth, worker verification rates, and platform engagement status.',
    icon: Users,
    iconClass: 'blue',
    formats: ['CSV (Recommended)', 'Excel (.xlsx)', 'PDF Document'],
  },
  {
    key: 'revenue',
    title: 'Revenue Reports',
    description: 'Export transaction logs, monthly recurring revenue (MRR), and earnings distribution.',
    icon: DollarSign,
    iconClass: 'green',
    formats: ['Excel (.xlsx)', 'CSV', 'PDF Document'],
  },
  {
    key: 'subscription',
    title: 'Subscription Reports',
    description: 'Detailed plan distribution, renewal cohorts, and churn analytics for enterprise users.',
    icon: CreditCard,
    iconClass: 'violet',
    formats: ['PDF Document', 'CSV', 'Excel (.xlsx)'],
  },
  {
    key: 'jobs',
    title: 'Job Reports',
    description: 'Monitor job fulfillment rates, application volume, and requirement fulfillment monitoring.',
    icon: Briefcase,
    iconClass: 'amber',
    formats: ['CSV', 'Excel (.xlsx)', 'PDF Document'],
  },
];

const recentExports = [
  {
    reportName: 'Q3_Revenue_Summary_Detailed',
    dateGenerated: 'Oct 12, 2023 10:45 AM',
    status: 'Ready',
    fileType: 'Excel (.xlsx)',
  },
  {
    reportName: 'Subscription_Active_Users_Weekly',
    dateGenerated: 'Oct 11, 2023 02:14 PM',
    status: 'Ready',
    fileType: 'CSV',
  },
  {
    reportName: 'Vendor_Verification_Overview',
    dateGenerated: 'Oct 10, 2023 09:22 AM',
    status: 'Processing',
    fileType: 'PDF Document',
  },
];

export default function ReportsPage() {
  const [formState, setFormState] = useState(() =>
    reportCards.reduce((acc, card) => {
      acc[card.key] = {
        date: '',
        format: card.formats[0],
      };
      return acc;
    }, {})
  );

  const adminUser = useMemo(() => JSON.parse(localStorage.getItem('adminUser') || '{}'), []);

  const updateCardState = (cardKey, field, value) => {
    setFormState((prev) => ({
      ...prev,
      [cardKey]: {
        ...prev[cardKey],
        [field]: value,
      },
    }));
  };

  return (
    <div className="reports-page-shell">
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
                <p className="reports-user-name">{adminUser.name || 'Admin User'}</p>
                <p className="reports-user-role">Admin</p>
              </div>
              <img
                src={`https://ui-avatars.com/api/?name=${adminUser.name || 'Admin User'}&background=f3b86b&color=2b2b2b`}
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
                    <span>Date Range</span>
                    <input
                      type="date"
                      value={formState[card.key].date}
                      onChange={(e) => updateCardState(card.key, 'date', e.target.value)}
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

                <button type="button" className="report-download-btn">
                  <Download size={14} />
                  Generate &amp; Download
                </button>
              </section>
            );
          })}
        </div>

        <section className="recent-exports-card">
          <div className="recent-exports-head">
            <h3>Recent Exports</h3>
            <button type="button">Clear History</button>
          </div>

          <div className="recent-exports-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Report Name</th>
                  <th>Date Generated</th>
                  <th>Status</th>
                  <th>File Type</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentExports.map((item) => (
                  <tr key={item.reportName}>
                    <td>{item.reportName}</td>
                    <td>{item.dateGenerated}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          item.status.toLowerCase() === 'ready' ? 'ready' : 'processing'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td>{item.fileType}</td>
                    <td>
                      <button type="button" aria-label={`Download ${item.reportName}`}>
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
