import pb from '@/lib/pocketbaseClient.js';
import { getAppPath } from '@/lib/runtimeUrls.js';

const isLocalFilesystemPath = (value) => {
  if (!value) return false;
  return /^[a-zA-Z]:[\\/]/.test(value) || value.startsWith('\\\\') || value.startsWith('file:') || value.startsWith('blob:');
};

const normalizePublishedPath = (value) => {
  if (!value || typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || isLocalFilesystemPath(trimmed)) return null;

  if (/^data:image\//i.test(trimmed) || /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }

  if (trimmed.startsWith('assets/')) {
    return getAppPath(`/${trimmed}`);
  }

  return getAppPath(trimmed.startsWith('./') ? trimmed.slice(1) : trimmed);
};

export const resolvePublishedAssetUrl = ({ record, fileField, pathField, fallbackPath }) => {
  const rawUploadedFile = record?.[fileField];
  const uploadedFile = Array.isArray(rawUploadedFile)
    ? rawUploadedFile.find((item) => typeof item === 'string' && item.trim())
    : rawUploadedFile;

  if (record && typeof uploadedFile === 'string' && uploadedFile.trim()) {
    try {
      const uploadedUrl = pb.files?.getUrl?.(record, uploadedFile);
      if (typeof uploadedUrl === 'string' && uploadedUrl.trim()) {
        return uploadedUrl;
      }
    } catch {
      // Fall through to published path or static fallback when local storage cannot resolve file URLs.
    }
  }

  const publishedPath = normalizePublishedPath(record?.[pathField]);
  if (publishedPath) {
    return publishedPath;
  }

  return getAppPath(fallbackPath);
};
