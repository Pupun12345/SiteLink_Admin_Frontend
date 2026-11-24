import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Eye, RefreshCw, Users, Store, Clock } from 'lucide-react';
import api from '../api/axios';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/ToastProvider';
import { getFileUrl } from '../utils/fileUtils';
import { hasPermission, usePermissions } from '../hooks/usePermissions';
import './PendingVerifications.css';
import { experienceText } from '../components/ExperienceField';

// ═══════════════════════════════════════════════════════════════════
//  PENDING VERIFICATIONS — dashboard card se khulta hai
// ═══════════════════════════════════════════════════════════════════
// Jinka verification baaki hai un sab workers + vendors ki ek list.
// Yahin se "Verify" (seedha approve) ya "View" (documents dekh ke
// approve / reject — worker / vendor detail page).
const TABS = [
  { key: 'all', label: 'All' },
  { key: 'worker', label: 'Workers' },
  { key: 'vendor', label: 'Vendors' },
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function PendingVerifications() {
  const navigate = useNavigate();
  const toast = useToast();
  const permissions = usePermissions();
  // Main admin (adminUser nahi) hamesha; sub-admin ko 'canVerifyUsers' chahiye.
  const canVerify = !localStorage.getItem('adminUser') || hasPermission(permissions, 'canVerifyUsers');

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirm, setConfirm] = useState(null); // item jise verify karna hai

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, v] = await Promise.all([
        api.get('/admin/workers/pending'),
        api.get('/admin/vendors/pending'),
      ]);
      const workers = (w.data?.data || []).map((u) => ({
        id: u._id,
        type: 'worker',
        title: u.name || 'Worker',
        subtitle: [u.primarySkill || u.role, experienceText(u.experience) || null].filter(Boolean).join(' · '),
        phone: u.phone,
        place: [u.city, u.workState].filter(Boolean).join(', '),
        image: u.profileImage,
        docsReady: !!u.governmentID,
        docsLabel: u.governmentID ? 'Government ID uploaded' : 'Government ID missing',
        createdAt: u.createdAt,
      }));
      const vendors = (v.data?.data || []).map((u) => ({
        id: u._id,
        type: 'vendor',
        title: u.companyName || u.name || 'Vendor',
        subtitle: u.companyName && u.name ? u.name : '',
        phone: u.phone,
        place: [u.city, u.workState].filter(Boolean).join(', '),
        image: u.companyLogo,
        docsReady: !!(u.panCardImage && u.gstCertificate),
        docsLabel: [u.panCardImage ? 'PAN ✓' : 'PAN missing', u.gstCertificate ? 'GST ✓' : 'GST missing'].join(' · '),
        createdAt: u.createdAt,
      }));
      setItems([...workers, ...vendors].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
    } catch (e) {
      toast.showToast(e.response?.data?.message || 'Failed to load pending verifications', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => ({
    all: items.length,
    worker: items.filter((i) => i.type === 'worker').length,
    vendor: items.filter((i) => i.type === 'vendor').length,
  }), [items]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => (tab === 'all' || i.type === tab)
      && (!q || [i.title, i.subtitle, i.phone, i.place].some((s) => String(s || '').toLowerCase().includes(q))));
  }, [items, tab, search]);

  const openDetail = (i) => navigate(i.type === 'worker' ? `/admin/workers/${i.id}` : `/admin/vendors/${i.id}`);

  const verify = async (i) => {
    setBusyId(i.id);
    try {
      await api.put(i.type === 'worker' ? `/admin/workers/${i.id}/verify` : `/admin/vendors/${i.id}/verify`);
      setItems((prev) => prev.filter((x) => x.id !== i.id));
      toast.showToast(`${i.title} verified`, { type: 'success' });
    } catch (e) {
      toast.showToast(e.response?.data?.message || 'Verification failed', { type: 'error' });
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  return (
    <div className="pv-page">
      <Sidebar />
      <main className="pv-main">
        <header className="pv-header">
          <div>
            <h1><Clock size={22} /> Pending Verifications</h1>
            <p>Workers and vendors waiting for approval. Verify directly, or open a profile to check documents first.</p>
          </div>
          <button type="button" className="pv-refresh" onClick={load} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'pv-spin' : ''} /> Refresh
          </button>
        </header>

        <div className="pv-toolbar">
          <div className="pv-tabs">
            {TABS.map((t) => (
              <button key={t.key} type="button" className={`pv-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label} <span className="pv-count">{counts[t.key]}</span>
              </button>
            ))}
          </div>
          <input
            className="pv-search"
            type="search"
            placeholder="Search name, company, phone, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="pv-empty">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="pv-empty">
            <CheckCircle size={40} color="#16a34a" />
            <p>No pending verifications{tab !== 'all' ? ` for ${tab}s` : ''}. All caught up!</p>
          </div>
        ) : (
          <div className="pv-list">
            {visible.map((i) => (
              <div className="pv-row" key={`${i.type}-${i.id}`}>
                <div className="pv-avatar">
                  {i.image
                    ? <img src={getFileUrl(i.image)} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    : (i.type === 'worker' ? <Users size={20} /> : <Store size={20} />)}
                </div>
                <div className="pv-info">
                  <div className="pv-name">
                    {i.title}
                    <span className={`pv-type ${i.type}`}>{i.type === 'worker' ? 'Worker' : 'Vendor'}</span>
                  </div>
                  {i.subtitle && <div className="pv-sub">{i.subtitle}</div>}
                  <div className="pv-meta">
                    {i.phone && <span>📞 {i.phone}</span>}
                    {i.place && <span>📍 {i.place}</span>}
                    <span>🗓 {fmtDate(i.createdAt)}</span>
                  </div>
                  <div className={`pv-docs ${i.docsReady ? 'ok' : 'missing'}`}>{i.docsLabel}</div>
                </div>
                <div className="pv-actions">
                  <button type="button" className="pv-btn view" onClick={() => openDetail(i)}>
                    <Eye size={15} /> View
                  </button>
                  {canVerify && (
                    <button
                      type="button"
                      className="pv-btn verify"
                      disabled={busyId === i.id}
                      onClick={() => setConfirm(i)}
                    >
                      <CheckCircle size={15} /> {busyId === i.id ? 'Verifying…' : 'Verify'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {confirm && (
        <div className="pv-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirm(null); }}>
          <div className="pv-modal">
            <h3>Verify {confirm.type === 'worker' ? 'worker' : 'vendor'}?</h3>
            <p><b>{confirm.title}</b> will be marked verified{confirm.type === 'worker' ? ' and can apply to jobs and buy a plan' : ''}. They will get a notification.</p>
            {!confirm.docsReady && (
              <p className="pv-warn">⚠ {confirm.docsLabel}. Open the profile to check before verifying.</p>
            )}
            <div className="pv-modal-actions">
              <button type="button" className="pv-btn view" onClick={() => setConfirm(null)}>Cancel</button>
              <button type="button" className="pv-btn view" onClick={() => { const c = confirm; setConfirm(null); openDetail(c); }}>Check documents</button>
              <button type="button" className="pv-btn verify" disabled={busyId === confirm.id} onClick={() => verify(confirm)}>
                <CheckCircle size={15} /> Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
