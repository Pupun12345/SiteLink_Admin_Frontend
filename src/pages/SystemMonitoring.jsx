import { Bell, Calendar, Download } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import './SystemMonitoring.css';

const cards = [
  { title: 'Server Health', value: '99.9% Up', delta: '+0.01%', tone: 'good' },
  { title: 'API Usage', value: '1.2M req', delta: '+12%', tone: 'info' },
  { title: 'Database Status', value: 'Optimal', delta: 'Stable', tone: 'stable' },
  { title: 'Error Logs', value: '12 pending', delta: '+5%', tone: 'warn' },
];

const systemUsage = [
  { label: 'Core Processor Load', value: 64, color: '#2f63db' },
  { label: 'RAM (Heap Memory)', value: 42, color: '#7f8ca6' },
  { label: 'Disk Storage Utilization', value: 28, color: '#20c47a' },
];

const logRows = [
  {
    timestamp: '2023-10-24 14:22:01',
    service: 'Auth-Service',
    level: 'Critical',
    message: 'Unexpected token in JSON parsing at payload index.',
    status: 'Pending',
  },
  {
    timestamp: '2023-10-24 14:18:45',
    service: 'Billing-Worker',
    level: 'Warning',
    message: 'Database connection timeout, retrying with fallback pool.',
    status: 'Resolved',
  },
  {
    timestamp: '2023-10-24 13:55:12',
    service: 'API-Gateway',
    level: 'Info',
    message: 'Rate limit exceeded for client-id: 998234.',
    status: 'Ignored',
  },
  {
    timestamp: '2023-10-24 13:42:01',
    service: 'Storage-S3',
    level: 'Critical',
    message: 'Access denied due to invalid IAM credentials.',
    status: 'Pending',
  },
];

export default function SystemMonitoring() {
  return (
    <div className="dashboard-page monitor-page">
      <Sidebar />

      <main className="dashboard-content monitor-content">
        <header className="monitor-header">
          <div>
            <h1>System Monitoring</h1>
            <p>Real-time infrastructure health and performance overview.</p>
          </div>

          <div className="monitor-header-actions">
            <button type="button" className="monitor-light-btn">
              <Calendar size={15} />
              Last 24 Hours
            </button>
            <button type="button" className="monitor-primary-btn">
              <Download size={15} />
              Export Report
            </button>
            <button type="button" className="monitor-icon-btn" aria-label="Notifications">
              <Bell size={16} />
            </button>
          </div>
        </header>

        <section className="monitor-cards-grid">
          {cards.map((card) => (
            <article key={card.title} className="monitor-stat-card">
              <div className="monitor-stat-top">
                <span className="monitor-card-title">{card.title}</span>
                <span className={`monitor-chip ${card.tone}`}>{card.delta}</span>
              </div>
              <strong>{card.value}</strong>
            </article>
          ))}
        </section>

        <section className="monitor-mid-grid">
          <article className="monitor-panel traffic-chart-panel">
            <h3>Traffic Analytics</h3>
            <div className="traffic-bars" aria-hidden="true">
              {[24, 38, 30, 56, 44, 52, 24, 38, 19].map((height, idx) => (
                <span key={idx} style={{ height: `${height}%` }} />
              ))}
            </div>
          </article>

          <article className="monitor-panel">
            <h3>System Usage</h3>
            <div className="usage-list">
              {systemUsage.map((item) => (
                <div key={item.label} className="usage-row">
                  <div className="usage-row-head">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="usage-track">
                    <div style={{ width: `${item.value}%`, background: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="monitor-panel monitor-table-panel">
          <div className="table-header">
            <h3>Recent Error Logs</h3>
            <button type="button">View All Logs</button>
          </div>

          <div className="monitor-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Service</th>
                  <th>Error Level</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logRows.map((row) => (
                  <tr key={`${row.timestamp}-${row.service}`}>
                    <td>{row.timestamp}</td>
                    <td>{row.service}</td>
                    <td>
                      <span className={`level-chip ${row.level.toLowerCase()}`}>{row.level}</span>
                    </td>
                    <td>{row.message}</td>
                    <td>
                      <span className={`status-chip ${row.status.toLowerCase()}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}