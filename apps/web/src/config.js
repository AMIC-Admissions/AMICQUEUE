export const SERVICES = [
  'Inquiry',
  'New Registration',
  'Full-Year Fee Payment',
  'Instalment Payment',
  'Book Collection',
  'Uniform Purchase',
  'Uniform Collection',
  'Leave Request',
  'Document Submission',
  'Student File Update'
];

export const defaultConfig = {
  systemTitle: 'Admissions & Registration Office',
  systemSubtitle: 'Queue Management System',
  services: SERVICES,
  backgroundImagePath: '',
  logoPath: '',
  notificationSettings: {
    soundEnabled: true,
    autoLogout: 30,
    defaultLanguage: 'en'
  },
  footerText: '(c) 2026 AMIC. All rights reserved.',
  colorPrimary: '#3b82f6',
  colorSecondary: '#8b5cf6',
  colorBackground: '#ffffff',
  colorText: '#0a0a0a',
  branches: ['AMIS', 'KIDS']
};
