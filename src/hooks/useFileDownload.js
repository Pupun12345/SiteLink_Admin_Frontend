import { useState, useRef } from 'react';
import api from '../api/axios';
import { getFileUrl } from '../utils/fileUtils';

export function useFileDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const inFlightRef = useRef(false);

  const download = async (fileUrl, label) => {
    const rawUrl = getFileUrl(fileUrl);
    if (!rawUrl) {
      setError('File not available');
      return;
    }

    // Prevent duplicate concurrent requests
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setDownloading(true);
    setError(null);

    try {
      const response = await api.get('/files/download', {
        params: {
          // Axios automatically encodes query parameters
          url: rawUrl,
          ...(label ? { label } : {}),
        },
        responseType: 'blob',
      });

      // Default filename
      let filename = label ? `${label}.bin` : 'document';

      const disposition = response.headers['content-disposition'];

      if (disposition) {
        // RFC 5987 filename*
        const rfcMatch = disposition.match(
          /filename\*\s*=\s*UTF-8''([^;]+)/i
        );

        // Standard filename
        const plainMatch = disposition.match(
          /filename\s*=\s*"?([^";]+)"?/i
        );

        if (rfcMatch) {
          try {
            filename = decodeURIComponent(rfcMatch[1].trim());
          } catch {
            filename = rfcMatch[1].trim();
          }
        } else if (plainMatch) {
          filename = plainMatch[1].trim();
        }
      }

      // Create temporary download URL
      const objectUrl = URL.createObjectURL(response.data);

      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.style.display = 'none';

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Revoke URL after download starts
      setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 10000);

    } catch (err) {
      let msg = 'Download failed. Please try again.';

      if (err.response?.data instanceof Blob) {
        try {
          const errorText = await err.response.data.text();
          const errorData = JSON.parse(errorText);
          msg = errorData.message || msg;
        } catch {
          // Keep default error message
        }
      } else {
        msg =
          err.response?.data?.message ||
          err.message ||
          msg;
      }

      setError(msg);
      console.error('[useFileDownload]', msg, err);

    } finally {
      setDownloading(false);
      inFlightRef.current = false;
    }
  };

  return { download, downloading, error };
}
