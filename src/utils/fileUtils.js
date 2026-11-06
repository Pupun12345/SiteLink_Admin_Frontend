/**
 * fileUtils — Robust utilities for safely parsing, normalizing, and handling file URLs & filenames.
 */

/**
 * Safely extracts a string URL from various possible data types:
 * - string (e.g. "https://res.cloudinary.com/...")
 * - object with url, secure_url, path, fileUrl, viewLink, or downloadLink
 * - nested objects
 * Returns a valid URL string or "" if null/invalid/empty.
 *
 * @param {any} fileSource
 * @returns {string}
 */
export const getFileUrl = (fileSource) => {
  if (!fileSource) return '';

  if (typeof fileSource === 'string') {
    return fileSource.trim();
  }

  if (typeof fileSource === 'object') {
    // If it's a File or Blob instance (e.g. during local upload preview)
    if (typeof window !== 'undefined' && (fileSource instanceof Blob || fileSource instanceof File)) {
      try {
        return URL.createObjectURL(fileSource);
      } catch {
        return '';
      }
    }

    const candidate =
      fileSource.url ||
      fileSource.secure_url ||
      fileSource.viewLink ||
      fileSource.downloadLink ||
      fileSource.path ||
      fileSource.fileUrl ||
      fileSource.src ||
      fileSource.uri;

    if (candidate) {
      if (typeof candidate === 'string') {
        return candidate.trim();
      }
      if (typeof candidate === 'object') {
        return getFileUrl(candidate);
      }
    }
  }

  return '';
};

/**
 * Safely extracts the filename or a clean display name from a file source (string or object).
 * Never throws TypeError: .split is not a function.
 *
 * @param {any} fileSource
 * @param {string} [fallback='Document']
 * @returns {string}
 */
export const getFileName = (fileSource, fallback = 'Document') => {
  if (!fileSource) return fallback;

  // If the object itself has a valid filename property (e.g. { name: 'pan.pdf' })
  if (typeof fileSource === 'object' && typeof fileSource.name === 'string' && fileSource.name.includes('.')) {
    return fileSource.name;
  }

  const url = getFileUrl(fileSource);
  if (!url || typeof url !== 'string') return fallback;

  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);
    const lastSegment = segments.pop();
    if (!lastSegment) return fallback;

    return decodeURIComponent(lastSegment);
  } catch {
    return fallback;
  }
};

