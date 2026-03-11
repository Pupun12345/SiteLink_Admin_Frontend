import { useLocation } from 'react-router-dom';
import './PlaceholderPage.css';

export default function PlaceholderPage() {
  const location = useLocation();
  const title = location.pathname.replace('/admin/', '').replace(/\//g, ' ').trim();
  return (
    <div className="placeholder-container">
      <div className="placeholder-card">
        <h1>{title ? title.charAt(0).toUpperCase() + title.slice(1) : 'Page'}</h1>
        <p>This section is coming soon. Use the sidebar to switch between pages.</p>
      </div>
    </div>
  );
}
