import { useEffect } from 'react';
import { Download } from 'lucide-react';
import { useFileDownload } from '../hooks/useFileDownload';
import { getFileUrl } from '../utils/fileUtils';
import './FileViewer.css';

/**
 * FileViewer — in-app modal for images and PDFs.
 * Props:
 *   url     : string | object — Cloudinary (or any) URL or object containing url
 *   name    : string          — display title / download label
 *   onClose : fn              — called when user closes
 */
export default function FileViewer({ url, name, onClose }) {
  const { download, downloading } = useFileDownload();

  const fileUrl = getFileUrl(url);

  // Close on Escape key + lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  if (!fileUrl) return null;

  const isPdf =
    fileUrl.toLowerCase().includes('.pdf') ||
    fileUrl.toLowerCase().includes('/pdf') ||
    fileUrl.toLowerCase().includes('raw/upload');

  // Cloudinary (free account) PDF ka seedha link band rakhta hai (401) —
  // resume / certificate khaali dikhta tha. Wahi file ".jpg" se maango to
  // pehla page photo ban ke aata hai; use dikhate hain.
  const cloudinaryPdf = isPdf && /res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(fileUrl);
  const shownUrl = cloudinaryPdf ? fileUrl.split('?')[0].replace(/\.pdf$/i, '.jpg') : fileUrl;

  const handleDownload = () => {
    // Build a clean label from the name prop (e.g. "PAN Card" → "pan-card")
    const label = name
      ? name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      : undefined;
    download(shownUrl, label);
  };

  return (
    <div className="fv-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fv-modal">
        <div className="fv-header">
          <span className="fv-title">{name || 'Preview'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="fv-download"
              onClick={handleDownload}
              disabled={downloading}
              title="Download file"
              aria-label="Download file"
            >
              <Download size={16} />
              {downloading ? 'Downloading…' : 'Download'}
            </button>
            <button className="fv-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>
        <div className="fv-body">
          {isPdf && !cloudinaryPdf ? (
            <iframe
              src={fileUrl}
              title={name || 'Document'}
              className="fv-iframe"
            />
          ) : (
            <div className="fv-image-scroll">
              {cloudinaryPdf && (
                <p style={{ margin: '0 0 8px', fontSize: 12, color: '#6b7280' }}>
                  PDF — showing page 1.
                </p>
              )}
              <img src={shownUrl} alt={name || 'Preview'} className="fv-image" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
