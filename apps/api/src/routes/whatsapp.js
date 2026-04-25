import express from 'express';
import logger from '../utils/logger.js';

const router = express.Router();

// Validate phone number format (international format with country code)
function validatePhoneNumber(phoneNumber) {
  // Accept formats like: +1234567890, +1 (234) 567-8900, etc.
  // Must start with + and contain at least 10 digits
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber.replace(/[\s\-()]/g, ''));
}

// Construct WhatsApp message based on language
function constructMessage(language, ticketNumber, trackingLink) {
  if (language === 'ar') {
    return `مرحبا! رقم التذكرة الخاص بك: ${ticketNumber}\nرابط التتبع: ${trackingLink}`;
  }
  // Default to English
  return `Hello! Your ticket number is: ${ticketNumber}\nTracking link: ${trackingLink}`;
}

router.post('/', async (req, res) => {
  const { phoneNumber, message, ticketNumber, trackingLink, language } = req.body;

  // Input validation
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return res.status(400).json({ error: 'phoneNumber is required and must be a string' });
  }

  if (!ticketNumber || typeof ticketNumber !== 'string') {
    return res.status(400).json({ error: 'ticketNumber is required and must be a string' });
  }

  if (!trackingLink || typeof trackingLink !== 'string') {
    return res.status(400).json({ error: 'trackingLink is required and must be a string' });
  }

  if (language && !['ar', 'en'].includes(language)) {
    return res.status(400).json({ error: 'language must be either "ar" or "en"' });
  }

  // Validate phone number format
  const cleanPhoneNumber = phoneNumber.replace(/[\s\-()]/g, '');
  if (!validatePhoneNumber(cleanPhoneNumber)) {
    return res.status(400).json({ error: 'Invalid phone number format. Use international format (e.g., +1234567890)' });
  }

  // Construct the message
  const finalLanguage = language || 'en';
  const whatsappMessage = message || constructMessage(finalLanguage, ticketNumber, trackingLink);

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(whatsappMessage);

  // Construct WhatsApp URL
  const whatsappUrl = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;

  logger.info(`WhatsApp URL generated for phone: ${cleanPhoneNumber}, ticket: ${ticketNumber}`);

  res.json({
    success: true,
    whatsappUrl,
    message: whatsappMessage,
  });
});

export default router;
