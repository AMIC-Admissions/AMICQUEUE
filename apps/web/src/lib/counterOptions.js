export const getCounterNumberValue = (value) => Number(value?.counterNumber ?? value?.counter ?? 0);

export const normalizeCounterStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  return normalized || 'active';
};

const getCounterScore = (counter) => {
  const status = normalizeCounterStatus(counter?.status);
  let score = 0;

  if (String(counter?.name || '').trim()) score += 4;
  if (status === 'active') score += 3;
  else if (status === 'available') score += 2;
  else score += 1;

  if (counter?.lastUpdated || counter?.updated) score += 1;
  return score;
};

const getCounterTimestamp = (counter) => {
  const timestamp = Date.parse(counter?.updated || counter?.lastUpdated || '');
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const getCanonicalCounters = (counters) => {
  if (!Array.isArray(counters) || counters.length === 0) return [];

  const byNumber = new Map();

  counters.forEach((counter) => {
    const counterNumber = getCounterNumberValue(counter);
    if (!Number.isFinite(counterNumber) || counterNumber <= 0) return;

    const normalizedCounter = {
      ...counter,
      counterNumber,
      name: String(counter?.name || '').trim() || `Counter ${counterNumber}`,
      status: normalizeCounterStatus(counter?.status),
    };

    const existing = byNumber.get(counterNumber);
    if (!existing) {
      byNumber.set(counterNumber, normalizedCounter);
      return;
    }

    const existingScore = getCounterScore(existing);
    const nextScore = getCounterScore(normalizedCounter);

    if (nextScore > existingScore || (nextScore === existingScore && getCounterTimestamp(normalizedCounter) > getCounterTimestamp(existing))) {
      byNumber.set(counterNumber, normalizedCounter);
    }
  });

  return Array.from(byNumber.values()).sort((a, b) => a.counterNumber - b.counterNumber);
};

export const isCounterActive = (counter) => {
  if (!counter) return false;
  const status = normalizeCounterStatus(counter.status);
  return status === 'active';
};

export const getCounterOptions = (counters, { includeInactive = false, fallbackCount = 10 } = {}) => {
  const canonicalCounters = getCanonicalCounters(counters);
  const hasConfiguredCounters = canonicalCounters.length > 0;

  const configured = hasConfiguredCounters
    ? canonicalCounters
      .filter(Boolean)
      .filter((counter) => includeInactive || isCounterActive(counter))
      .map((counter) => Number(counter.counterNumber))
      .filter((counterNumber) => Number.isFinite(counterNumber) && counterNumber > 0)
    : [];

  const fallback = Array.from({ length: fallbackCount }, (_, index) => index + 1);
  const source = configured.length > 0 || hasConfiguredCounters ? configured : fallback;
  return Array.from(new Set(source)).sort((a, b) => a - b);
};

export const getNextCounterNumber = (counters) => {
  const numbers = getCounterOptions(counters, { includeInactive: true, fallbackCount: 0 });
  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
};
