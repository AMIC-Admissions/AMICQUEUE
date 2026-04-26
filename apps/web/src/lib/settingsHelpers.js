export const defaultNotificationSettings = {
  soundEnabled: true,
  autoLogout: 30,
  defaultLanguage: 'en',
};

const parseLegacySettingsString = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const candidates = [
    trimmed,
    trimmed
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\bNone\b/g, 'null')
      .replace(/'/g, '"'),
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next normalized form.
    }
  }

  return null;
};

export const normalizeNotificationSettings = (value) => {
  const parsed = typeof value === 'string'
    ? parseLegacySettingsString(value)
    : value;

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ...defaultNotificationSettings };
  }

  const autoLogout = Number(parsed.autoLogout);

  return {
    ...defaultNotificationSettings,
    ...parsed,
    soundEnabled: parsed.soundEnabled !== false,
    autoLogout: Number.isFinite(autoLogout) && autoLogout >= 5 ? autoLogout : defaultNotificationSettings.autoLogout,
    defaultLanguage: parsed.defaultLanguage === 'ar' ? 'ar' : 'en',
  };
};
