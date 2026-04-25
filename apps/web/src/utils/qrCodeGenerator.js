
import { getAppUrl } from '@/lib/runtimeUrls.js';

export const generateQRCodeUrl = (ticketNumber) => {
  if (!ticketNumber) return '';
  const trackingUrl = getAppUrl(`/track?ticket=${encodeURIComponent(ticketNumber)}`);
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(trackingUrl)}&margin=10`;
};
