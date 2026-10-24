import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../components/ToastProvider';

// ═══════════════════════════════════════════════════════════════════
//  ADMIN ALERTS — app jaisa "naya alert aaya" admin panel me
// ═══════════════════════════════════════════════════════════════════
// Pehle panel khud kabhi nahi poochta tha ki naya alert aaya ya nahi —
// admin ko Notifications page khud kholna padta tha. Ab har 30s par
// unread alerts ginte hain:
//   • sidebar me "Notifications" ke aage laal ginti
//   • naya alert aate hi screen par popup (toast)
//   • browser ne permission di ho to system notification bhi
//
// "Naya" = jo pichhli baar dekhe gaye sabse naye alert ke baad aaya.
// Wo time localStorage me rehta hai, taaki page badalne / refresh par
// wahi alert dobara popup na kare.

const POLL_MS = 30000;
const SEEN_KEY = 'adminAlertsLastSeen';

function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function writeSeen(value) {
  try {
    localStorage.setItem(SEEN_KEY, value);
  } catch {
    // storage band ho to bas popup dobara aa sakta hai — koi baat nahi
  }
}

export default function useAdminAlerts() {
  const [count, setCount] = useState(0);
  const toast = useToast();
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    let cancelled = false;

    // Browser notification ki permission — ek hi baar poochta hai.
    if (typeof window !== 'undefined' && 'Notification' in window
      && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const check = async () => {
      try {
        const { data } = await api.get('/notifications/unread-alerts');
        if (cancelled || !data?.success) return;
        const { count: unread = 0, latest = [] } = data.data || {};
        setCount(unread);

        const newestAt = latest[0]?.createdAt;
        if (!newestAt) return;
        const seen = readSeen();
        // Pehli baar panel khula — purane alerts ka popup nahi, sirf badge.
        if (!seen) {
          writeSeen(newestAt);
          return;
        }
        const fresh = latest.filter((n) => new Date(n.createdAt) > new Date(seen));
        if (!fresh.length) return;
        writeSeen(newestAt);

        // Purane se naye ki taraf dikhao.
        fresh.slice().reverse().forEach((n) => {
          toast.showToast(`🔔 ${n.title}`, {
            type: n.priority === 'high' || n.priority === 'critical' ? 'error' : 'info',
            duration: 8000,
          });
          if ('Notification' in window && Notification.permission === 'granted') {
            const sys = new Notification(n.title, { body: n.message, icon: '/SiteLinkIcon.png' });
            sys.onclick = () => {
              window.focus();
              navigateRef.current(n.actionUrl || '/admin/notifications');
              sys.close();
            };
          }
        });
      } catch {
        // Network / auth error — agli baar phir koshish
      }
    };

    check();
    const timer = setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [toast]);

  return count;
}
