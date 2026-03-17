import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Store, ArrowRight, ShieldCheck } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import './VerificationOverview.css';

export default function VerificationOverview() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  return (
    <div className="verification-overview-page">
      <Sidebar onLogout={handleLogout} />

      <main className="verification-overview-main">
        <header className="verification-overview-header">
          <div className="verification-overview-title">
            <h1>Verification Center</h1>
            <p>Track verification queues and jump directly into worker or vendor review flows.</p>
          </div>

          <div className="verification-overview-badge">
            <ShieldCheck size={16} />
            Unified Verification Queue
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
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>

            <button
              type="button"
              className="chart-link-btn"
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

            <div className="chart-visual vendor-line" aria-hidden="true">
              <svg viewBox="0 0 260 120" preserveAspectRatio="none">
                <path d="M8 102 C 42 92, 66 85, 92 76 C 132 64, 154 52, 178 48 C 210 42, 232 28, 252 14" />
              </svg>
            </div>

            <button
              type="button"
              className="chart-link-btn"
              onClick={() => navigate('/admin/vendors')}
            >
              Open Vendor Verification
              <ArrowRight size={16} />
            </button>
          </motion.article>
        </section>
      </main>
    </div>
  );
}
