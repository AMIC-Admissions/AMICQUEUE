
import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { defaultConfig } from '@/config.js';

export const hexToHSL = (hex) => {
  if (!hex) return null;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }
  r /= 255; g /= 255; b /= 255;
  let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin, h = 0, s = 0, l = 0;
  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return `${h} ${+(s * 100).toFixed(1)}% ${+(l * 100).toFixed(1)}%`;
};

export const useSettings = () => {
  const [settings, setSettings] = useState(defaultConfig);
  const [loading, setLoading] = useState(true);

  const applySettingsToDOM = (s) => {
    const root = document.documentElement;
    if (s.colorPrimary) root.style.setProperty('--primary', hexToHSL(s.colorPrimary));
    if (s.colorSecondary) root.style.setProperty('--secondary', hexToHSL(s.colorSecondary));
    if (s.colorBackground) root.style.setProperty('--background', hexToHSL(s.colorBackground));
    if (s.colorText) root.style.setProperty('--foreground', hexToHSL(s.colorText));
    if (s.colorSuccess) root.style.setProperty('--success', hexToHSL(s.colorSuccess));
    if (s.colorWarning) root.style.setProperty('--warning', hexToHSL(s.colorWarning));
    if (s.colorError) root.style.setProperty('--destructive', hexToHSL(s.colorError));
    if (s.colorInfo) root.style.setProperty('--info', hexToHSL(s.colorInfo));
  };

  const fetchSettings = useCallback(async () => {
    try {
      const records = await pb.collection('settings').getFullList({ $autoCancel: false });
      if (records.length > 0) {
        const remoteSet = records[0];
        const merged = {
          ...defaultConfig,
          ...remoteSet,
          branches: remoteSet.branches || defaultConfig.branches,
          services: remoteSet.services || defaultConfig.services,
          buttonTexts: remoteSet.buttonTexts || defaultConfig.buttonTexts,
          serviceDescriptions: remoteSet.serviceDescriptions || defaultConfig.serviceDescriptions
        };
        setSettings(merged);
        applySettingsToDOM(remoteSet);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, refetchSettings: fetchSettings };
};
