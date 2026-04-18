import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Store, ArrowRight, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import './VerificationOverview.css';

export default function VerificationOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    workers: { total: 0, pending: 0, approved: 0, rejected: 0 },
    vendors: { total: 0, pending: 0, approved: 0, rejected: 0 }
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [workersRes, vendorsRes] = await Promise.all([
        api.get('/admin/users', { params: { userType: 'worker', status: 'all', limit: 1000 } }),
        api.get('/admin/users', { params: { userType: 'vendor', status: 'all', limit: 1000 } })
      ]);

      const workers = workersRes.data.data || [];
      const vendors = vendorsRes.data.data || [];

      setStats({
        workers: {
          total: workers.length,
          pending: workers.filter(w => w.status === 'Pending').length,
          approved: workers.filter(w => w.status === 'Verified').length,
          rejected: workers.filter(w => w.status === 'Rejected').length
        },
        vendors: {
          total: vendors.length,
          pending: vendors.filter(v => v.status === 'Pending').length,
          approved: vendors.filter(v => v.status === 'Verified').length,
          rejected: vendors.filter(v => v.status === 'Rejected').length
        }
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    
    navigate('/admin/login');
  };

  const workerBarHeights = [
    stats.workers.total > 0 ? (stats.workers.approved / stats.workers.total) * 100 : 20,
    stats.workers.total > 0 ? (stats.workers.pending / stats.workers.total) * 100 : 40,
    stats.workers.total > 0 ? (stats.workers.rejected / stats.workers.total) * 100 : 15,
    stats.workers.total > 0 ? (stats.workers.approved / stats.workers.total) * 80 : 60,
    stats.workers.total > 0 ? (stats.workers.pending / stats.workers.total) * 90 : 35
  ];

  const vendorLineHeights = [
    stats.vendors.total > 0 ? (stats.vendors.approved / stats.vendors.total) * 100 : 50,
    stats.vendors.total > 0 ? (stats.vendors.pending / stats.vendors.total) * 100 : 30,
    stats.vendors.total > 0 ? (stats.vendors.approved / stats.vendors.total) * 80 : 40,
    stats.vendors.total > 0 ? (stats.vendors.pending / stats.vendors.total) * 70 : 35,
    stats.vendors.total > 0 ? (stats.vendors.approved / stats.vendors.total) * 60 : 25
  ];


  return (
    <div className="verification-overview-page">
      <Sidebar onLogout={handleLogout} />

      <main className="verification-overview-main">
        <header className="verification-overview-header">
          <div className="verification-overview-title">
            <h1>Verification Center</h1>
            <p>Track verification queues and jump directly into worker or vendor review flows.</p>
          </div>
        </header>

        <section className="verification-overview-grid">
          <motion.article
            className="verification-chart-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="chart-card-head">
              <div className="chart-icon worker">
                <Users size={18} />
              </div>
              <div>
                <h2>Worker Verification</h2>
                <p>Identity checks, certificates and skills validation</p>
              </div>
            </div>

            <div className="chart-visual worker-bars" aria-hidden="true">
              {workerBarHeights.map((height, index) => (
                <span key={index} style={{ height: `${Math.max(10, height)}%` }} />
              ))}
            </div>

            <button
              type="button"
              className="chart-link-btn-worker"
              onClick={() => navigate('/admin/workers')}
            >
              Open Worker Verification
              <ArrowRight size={16} />
            </button>
          </motion.article>

          <motion.article
            className="verification-chart-card"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.08 }}
          >
            <div className="chart-card-head">
              <div className="chart-icon vendor">
                <Store size={18} />
              </div>
              <div>
                <h2>Vendor Verification</h2>
                <p>Business docs, compliance and profile approval tracking</p>
              </div>
            </div>

            <div className="chart-visual worker-bars" aria-hidden="true">
              {vendorLineHeights.map((height, index) => (
                <span key={index} style={{ height: `${Math.max(10, height)}%` }} />
              ))}
            </div>

            <button
              type="button"
              className="chart-link-btn-worker"
              onClick={() => navigate('/admin/vendors')}
            >
              Open Worker Verification
              <ArrowRight size={16} />
            </button>

          </motion.article>
        </section>
      </main>
    </div>
  );
}
