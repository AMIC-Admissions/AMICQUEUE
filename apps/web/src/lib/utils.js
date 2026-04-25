
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const validatePhoneNumber = (phone) => {
  if (!phone) return true; // Optional by default
  const cleanPhone = phone.replace(/\s/g, '');
  const phoneRegex = /^(05|\+9665)\d{8}$/;
  return phoneRegex.test(cleanPhone);
};

export const sanitizePhoneNumber = (phone) => {
  if (!phone) return '';
  const cleanPhone = phone.replace(/\s/g, '');
  if (cleanPhone.startsWith('05')) {
    return `+966${cleanPhone.substring(1)}`;
  }
  return cleanPhone;
};

export const checkTicketRateLimit = () => {
  const rateLimitStr = localStorage.getItem('ticket_creation_history');
  let history = rateLimitStr ? JSON.parse(rateLimitStr) : [];
  const oneHourAgo = Date.now() - 3600000;
  
  history = history.filter(time => time > oneHourAgo);
  
  if (history.length >= 5) {
    return false; // Limit exceeded
  }
  
  return true; // Allowed
};

export const recordTicketCreation = () => {
  const rateLimitStr = localStorage.getItem('ticket_creation_history');
  let history = rateLimitStr ? JSON.parse(rateLimitStr) : [];
  const oneHourAgo = Date.now() - 3600000;
  
  history = history.filter(time => time > oneHourAgo);
  history.push(Date.now());
  
  localStorage.setItem('ticket_creation_history', JSON.stringify(history));
};
