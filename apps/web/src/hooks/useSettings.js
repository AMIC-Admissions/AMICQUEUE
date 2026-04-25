
import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { defaultConfig } from '@/config.js';

export const hexToHSL = (hex) => {
  if (!hex) return null;
  const color = String(hex).trim().toLowerCase();
  if (color === 'light') return '0 0% 100%';
  if (color === 'dark') return '222.2 84% 4.9%';
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color)) return null;
  let r = 0, g = 0, b = 0;
  if (color.length === 4) {
    r = parseInt(color[1] + color[1], 16);
    g = parseInt(color[2] + color[2], 16);
    b = parseInt(color[3] + color[3], 16);
  } else if (color.length === 7) {
    r = parseInt(color[1] + color[2], 16);
    g = parseInt(color[3] + color[4], 16);
    b = parseInt(color[5] + color[6], 16);
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
    const primary = hexToHSL(s.colorPrimary);
    const secondary = hexToHSL(s.colorSecondary);
    const background = hexToHSL(s.colorBackground);
    const text = hexToHSL(s.colorText);
    const success = hexToHSL(s.colorSuccess);
    const warning = hexToHSL(s.colorWarning);
    const error = hexToHSL(s.colorError);
    const info = hexToHSL(s.colorInfo);

    if (primary) root.style.setProperty('--primary', primary);
    if (secondary) root.style.setProperty('--secondary', secondary);
    if (background) root.style.setProperty('--background', background);
    if (text) root.style.setProperty('--foreground', text);
    if (success) root.style.setProperty('--success', success);
    if (warning) root.style.setProperty('--warning', warning);
    if (error) root.style.setProperty('--destructive', error);
    if (info) root.style.setProperty('--info', info);
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
