import { useState, useEffect } from 'react';
import { Bell, Calendar, Download, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import api from '../api/axios';
import './SystemMonitoring.css';

export default function SystemMonitoring() {
  const [systemData, setSystemData] = useState(null);
  const [apiStats, setApiStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch all system data
  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const [healthRes, statsRes, logsRes, alertsRes] = await Promise.all([
        api.get('/system/health'),
        api.get(`/system/api-stats?timeframe=${timeframe}`),
        api.get(`/system/logs?limit=10&timeframe=${timeframe}`),
        api.get('/system/alerts')
      ]);

      if (healthRes.data.success) setSystemData(healthRes.data.data);
      if (statsRes.data.success) setApiStats(statsRes.data.data);
      if (logsRes.data.success) setLogs(logsRes.data.data);
      if (alertsRes.data.success) setAlerts(alertsRes.data.data);
      
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch system data:', err);
      setError('Failed to load system monitoring data');
    } finally {
      setLoading(false);
    }
  };

  // Export system report
  const handleExportReport = async () => {
    try {
      const response = await api.get(`/system/export-report?timeframe=${timeframe}&format=json`);
      if (response.data.success) {
        const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
          type: 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Failed to export report:', err);
      alert('Failed to export report');
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  // Auto-refresh functionality
  useEffect(() => {
    fetchSystemData();
  }, [timeframe]);

  useEffect(() => {
    let interval;
    if (autoRefresh) {
      interval = setInterval(fetchSystemData, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, timeframe]);

  // Format uptime
  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'resolved':
        return <CheckCircle size={16} className="status-icon success" />;
      case 'warning':
      case 'acknowledged':
        return <AlertTriangle size={16} className="status-icon warning" />;
      case 'critical':
      case 'error':
      case 'pending':
        return <XCircle size={16} className="status-icon error" />;
      default:
        return <CheckCircle size={16} className="status-icon" />;
    }
  };

  if (loading && !systemData) {
    return (
      <div className="dashboard-page monitor-page">
        <Sidebar />
        <main className="dashboard-content monitor-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading system monitoring data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error && !systemData) {
    return (
      <div className="dashboard-page monitor-page">
        <Sidebar />
        <main className="dashboard-content monitor-content">
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchSystemData} className="retry-btn">
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Prepare cards data
  const cards = systemData ? [
    { 
      title: 'Server Health', 
      value: systemData.server?.status === 'healthy' ? `${systemData.server.uptimePercent}% Up` : 'Issues Detected',
      delta: systemData.server?.uptimeFormatted || 'N/A',
      tone: systemData.server?.status === 'healthy' ? 'good' : 'warn',
      icon: getStatusIcon(systemData.server?.status)
    },
    { 
      title: 'API Usage', 
      value: apiStats?.summary ? `${(apiStats.summary.totalRequests / 1000000).toFixed(1)}M req` : 'Loading...',
      delta: apiStats?.summary ? `${apiStats.summary.successRate}% success` : 'N/A',
      tone: 'info'
    },
    { 
      title: 'Database Status', 
      value: systemData.database?.status || 'Unknown',
      delta: systemData.database?.connected ? 'Connected' : 'Disconnected',
      tone: systemData.database?.connected ? 'good' : 'warn',
      icon: getStatusIcon(systemData.database?.status)
    },
    { 
      title: 'Active Alerts', 
      value: `${alerts.filter(a => a.status === 'Active').length} active`,
      delta: `${alerts.filter(a => a.level === 'Critical').length} critical`,
      tone: alerts.filter(a => a.status === 'Active').length > 0 ? 'warn' : 'good'
    },
  ] : [];

  // Prepare system usage data
  const systemUsage = systemData ? [
    { 
      label: 'CPU Usage', 
      value: systemData.cpu?.usagePercent || 0, 
      color: '#2f63db' 
    },
    { 
      label: 'Memory Usage', 
      value: systemData.memory?.usagePercent || 0, 
      color: '#7f8ca6' 
    },
    { 
      label: 'Disk Usage', 
      value: systemData.disk?.usagePercent || 0, 
      color: '#20c47a' 
    },
  ] : [];

  return (
    <div className="dashboard-page monitor-page">
      <Sidebar />

      <main className="dashboard-content monitor-content">
        <header className="monitor-header">
          <div>
            <h1>System Monitoring</h1>
            <p>Real-time infrastructure health and performance overview.</p>
            {lastUpdated && (
              <p className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {autoRefresh && <span className="auto-refresh-indicator">• Auto-refreshing</span>}
              </p>
            )}
          </div>

          <div className="monitor-header-actions">
            <div className="timeframe-selector">
              <button 
                type="button" 
                className={`monitor-light-btn ${timeframe === '1h' ? 'active' : ''}`}
                onClick={() => handleTimeframeChange('1h')}
              >
                1 Hour
              </button>
              <button 
                type="button" 
                className={`monitor-light-btn ${timeframe === '24h' ? 'active' : ''}`}
                onClick={() => handleTimeframeChange('24h')}
              >
                <Calendar size={15} />
                24 Hours
              </button>
              <button 
                type="button" 
                className={`monitor-light-btn ${timeframe === '7d' ? 'active' : ''}`}
                onClick={() => handleTimeframeChange('7d')}
              >
                7 Days
              </button>
            </div>
            <button 
              type="button" 
              className="monitor-primary-btn"
              onClick={handleExportReport}
            >
              <Download size={15} />
              Export Report
            </button>
            <button 
              type="button" 
              className={`monitor-icon-btn ${autoRefresh ? 'active' : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              <RefreshCw size={16} className={autoRefresh ? 'spinning' : ''} />
            </button>
            <button 
              type="button" 
              className="monitor-icon-btn" 
              onClick={fetchSystemData}
              title="Refresh now"
            >
              <Bell size={16} />
            </button>
          </div>
        </header>

        <section className="monitor-cards-grid">
          {cards.map((card) => (
            <article key={card.title} className="monitor-stat-card">
              <div className="monitor-stat-top">
                <div className="card-title-with-icon">
                  {card.icon}
                  <span className="monitor-card-title">{card.title}</span>
                </div>
                <span className={`monitor-chip ${card.tone}`}>{card.delta}</span>
              </div>
              <strong>{card.value}</strong>
            </article>
          ))}
        </section>

        <section className="monitor-mid-grid">
          <article className="monitor-panel traffic-chart-panel">
            <h3>API Traffic ({timeframe})</h3>
            <div className="traffic-bars" aria-hidden="true">
              {apiStats?.traffic ? 
                apiStats.traffic.slice(-9).map((data, idx) => (
                  <span 
                    key={idx} 
                    style={{ height: `${Math.min((data.requests / 5000) * 100, 100)}%` }}
                    title={`${data.requests} requests at ${new Date(data.timestamp).toLocaleTimeString()}`}
                  />
                )) :
                [24, 38, 30, 56, 44, 52, 24, 38, 19].map((height, idx) => (
                  <span key={idx} style={{ height: `${height}%` }} />
                ))
              }
            </div>
            {apiStats?.summary && (
              <div className="traffic-summary">
                <div className="traffic-stat">
                  <span className="stat-label">Total Requests</span>
                  <span className="stat-value">{apiStats.summary.totalRequests.toLocaleString()}</span>
                </div>
                <div className="traffic-stat">
                  <span className="stat-label">Success Rate</span>
                  <span className="stat-value">{apiStats.summary.successRate}%</span>
                </div>
                <div className="traffic-stat">
                  <span className="stat-label">Avg Response</span>
                  <span className="stat-value">{apiStats.summary.averageResponseTime}ms</span>
                </div>
              </div>
            )}
          </article>

          <article className="monitor-panel">
            <h3>System Resources</h3>
            <div className="usage-list">
              {systemUsage.map((item) => (
                <div key={item.label} className="usage-row">
                  <div className="usage-row-head">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="usage-track">
                    <div 
                      style={{ 
                        width: `${item.value}%`, 
                        background: item.color,
                        backgroundColor: item.value > 80 ? '#dc2626' : item.value > 60 ? '#d97706' : item.color
                      }} 
                    />
                  </div>
                </div>
              ))}
            </div>
            {systemData && (
              <div className="system-info">
                <div className="info-row">
                  <span>Platform:</span>
                  <span>{systemData.system?.platform} ({systemData.system?.arch})</span>
                </div>
                <div className="info-row">
                  <span>Node.js:</span>
                  <span>{systemData.system?.nodeVersion}</span>
                </div>
                <div className="info-row">
                  <span>Memory:</span>
                  <span>{formatBytes(systemData.memory?.used)} / {formatBytes(systemData.memory?.total)}</span>
                </div>
                <div className="info-row">
                  <span>Uptime:</span>
                  <span>{formatUptime(systemData.server?.uptime)}</span>
                </div>
              </div>
            )}
          </article>
        </section>

        <section className="monitor-panel monitor-table-panel">
          <div className="table-header">
            <h3>Recent System Logs</h3>
            <button type="button" onClick={() => window.open('/admin/logs', '_blank')}>
              View All Logs
            </button>
          </div>

          <div className="monitor-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Service</th>
                  <th>Level</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
<<<<<<< HEAD
                {logs.length > 0 ? logs.map((log) => (
                  <tr key={log.id}>
=======
                {logs.length > 0 ? logs.map((log, idx) => (
                  <tr key={`${log.id}_${idx}`}>
>>>>>>> db216af (Support Page has been added)
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.service}</td>
                    <td>
                      <span className={`level-chip ${log.level.toLowerCase()}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="log-message" title={log.message}>
                      {log.message.length > 60 ? `${log.message.substring(0, 60)}...` : log.message}
                    </td>
                    <td>
                      <span className={`status-chip ${log.status.toLowerCase()}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      {loading ? 'Loading logs...' : 'No logs available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {alerts.length > 0 && (
          <section className="monitor-panel alerts-panel">
            <div className="table-header">
              <h3>Active Alerts</h3>
              <span className="alert-count">
                {alerts.filter(a => a.status === 'Active').length} active
              </span>
            </div>
            <div className="alerts-list">
              {alerts.filter(a => a.status === 'Active').map((alert) => (
                <div key={alert.id} className={`alert-item ${alert.level.toLowerCase()}`}>
                  <div className="alert-header">
                    <div className="alert-title">
                      {getStatusIcon(alert.level)}
                      <span>{alert.title}</span>
                    </div>
                    <span className="alert-time">
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="alert-message">{alert.message}</p>
                  <div className="alert-footer">
                    <span className="alert-service">{alert.service}</span>
                    <span className={`alert-level ${alert.level.toLowerCase()}`}>
                      {alert.level}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}