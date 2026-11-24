// ═══════════════════════════════════════════════════════════════════
//  EXPERIENCE — Fresher chalega / Experienced (kam se kam N saal)
// ═══════════════════════════════════════════════════════════════════
// Backend experience ko saal ki ginti (String) me rakhta hai. Fresher =
// "0" — alag field nahi. Job post aur job edit dono yahi use karte hain.

/// "0" → "Fresher", "3" → "3+ yrs" (job) ya "3 yrs" (worker).
export function experienceText(value, { plus = false } = {}) {
  const raw = value == null ? '' : String(value).trim();
  if (!raw) return '';
  const n = Number(raw);
  if (Number.isNaN(n)) return raw; // purana free text (jaise "2+ years")
  if (n <= 0) return 'Fresher';
  return `${n}${plus ? '+' : ''} ${n === 1 ? 'yr' : 'yrs'}`;
}

/// value: job.experience ("0" = Fresher), onChange(newValue: string)
export default function ExperienceField({ value, onChange }) {
  const raw = value == null ? '' : String(value);
  const fresher = raw.trim() === '0';
  const btn = (active) => ({
    flex: 1,
    padding: '9px 12px',
    borderRadius: 8,
    border: `1.5px solid ${active ? '#f97316' : '#e5e7eb'}`,
    background: active ? '#fff7ed' : '#fff',
    color: active ? '#c2410c' : '#374151',
    fontWeight: active ? 700 : 500,
    fontSize: 13,
    cursor: 'pointer',
  });
  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" style={btn(fresher)} onClick={() => onChange('0')}>
          🎓 Fresher OK
        </button>
        <button
          type="button"
          style={btn(!fresher)}
          onClick={() => onChange(fresher ? '' : raw)}
        >
          🧰 Experienced
        </button>
      </div>
      {!fresher && (
        <input
          type="number"
          min="1"
          max="60"
          value={raw}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, '').slice(0, 2))}
          placeholder="Minimum experience in years, e.g. 2"
          required
          style={{ marginTop: 8, width: '100%', boxSizing: 'border-box' }}
        />
      )}
      <small style={{ display: 'block', marginTop: 4, fontSize: 12, color: '#6b7280' }}>
        {fresher ? 'Freshers (no experience) can apply.' : 'Workers will see "N+ yrs" as the minimum experience.'}
      </small>
    </div>
  );
}
