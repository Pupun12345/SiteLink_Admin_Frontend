import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/axios';

// ═══════════════════════════════════════════════════════════════════
//  LOCATION PICKER — job ki jagah naksha par
// ═══════════════════════════════════════════════════════════════════
// Naksha OpenStreetMap (free, koi key nahi). Search aur pin → pata admin
// backend ke /api/geo se (Google key server par). Worker app isi
// lat / lng se "Get Directions" karta hai.
//
// value:    { lat, lng } | null
// onChange: ({ lat, lng, address }) => void  (address search/reverse se)
const INDIA = [22.5, 79];

// Leaflet ka default marker icon bundler me toot jaata hai — khud SVG pin.
const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="34" height="46" viewBox="0 0 24 34" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.3 0 11.9 0 20.8 12 34 12 34s12-13.2 12-22.1C24 5.3 18.6 0 12 0z" fill="#e11d48"/>
    <circle cx="12" cy="12" r="4.5" fill="#fff"/></svg>`,
  iconSize: [34, 46],
  iconAnchor: [17, 46],
});

export default function LocationPicker({ value, onChange }) {
  const boxRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState('');

  // Pin lagao / hilao + pata nikaalo
  const place = async (lat, lng, address) => {
    const map = mapRef.current;
    if (!map) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(map);
      markerRef.current.on('dragend', (e) => {
        const p = e.target.getLatLng();
        place(p.lat, p.lng);
      });
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    let addr = address;
    if (!addr) {
      try {
        const r = await api.get('/geo/reverse', { params: { lat, lng } });
        addr = r.data?.data?.address || '';
      } catch { addr = ''; }
    }
    onChangeRef.current?.({ lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)), address: addr });
  };

  useEffect(() => {
    if (mapRef.current || !boxRef.current) return;
    const start = value?.lat && value?.lng ? [value.lat, value.lng] : INDIA;
    const map = L.map(boxRef.current).setView(start, value?.lat ? 15 : 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    map.on('click', (e) => place(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;
    if (value?.lat && value?.lng) place(value.lat, value.lng, '');
    // Form ke andar size baad me set hota hai — tiles poore dikhein.
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const search = async () => {
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setMsg('');
    try {
      const r = await api.get('/geo/search', { params: { q } });
      const list = r.data?.data || [];
      setResults(list);
      if (!list.length) setMsg('No place found. Try a nearby town or landmark.');
    } catch (e) {
      setMsg(e.response?.data?.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const pick = (r) => {
    setResults([]);
    setQuery(r.address);
    mapRef.current?.setView([r.lat, r.lng], 16);
    place(r.lat, r.lng, r.address);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setMsg('Location not supported in this browser');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        mapRef.current?.setView([p.coords.latitude, p.coords.longitude], 16);
        place(p.coords.latitude, p.coords.longitude);
      },
      () => setMsg('Could not get your location'),
    );
  };

  const clear = () => {
    if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; }
    onChangeRef.current?.(null);
  };

  return (
    <div className="lp-wrap">
      <div className="lp-search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }}
          placeholder="Search site / area / landmark, e.g. Jindal Stainless Jajpur"
        />
        <button type="button" onClick={search} disabled={searching}>{searching ? 'Searching…' : 'Search'}</button>
        <button type="button" onClick={useMyLocation} title="Use my current location">📍 My location</button>
        {value && <button type="button" onClick={clear} className="lp-clear">Clear pin</button>}
      </div>
      {results.length > 0 && (
        <ul className="lp-results">
          {results.map((r, i) => (
            <li key={i} onClick={() => pick(r)}>{r.address}</li>
          ))}
        </ul>
      )}
      {msg && <div className="lp-msg">{msg}</div>}
      <div ref={boxRef} className="lp-map" />
      <div className="lp-hint">
        {value
          ? `📌 Pin set: ${value.lat}, ${value.lng} — workers can tap "Get Directions" to reach here. Drag the pin to adjust.`
          : 'Click on the map (or search) to drop a pin at the exact job site.'}
      </div>
    </div>
  );
}
