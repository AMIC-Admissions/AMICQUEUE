import { normalizeBranch } from '@/lib/branchOptions.js';

export const getCounterNumberValue = (value) => Number(value?.counterNumber ?? value?.counter ?? 0);
const inferBranchFromName = (name) => {
  const normalizedName = String(name || '').trim().toLowerCase();
  if (!normalizedName) return null;

  if (normalizedName.includes('kids') || normalizedName.includes('gate') || normalizedName.includes('بوابة')) {
    return 'KIDS';
  }

  if (normalizedName.includes('ajyal') || normalizedName.includes('ajial') || normalizedName.includes('أجيال')) {
    return 'AMIS';
  }

  return null;
};

export const getCounterBranchValue = (value) => normalizeBranch(value?.branch || inferBranchFromName(value?.name));

export const getCounterKey = (value) => `${getCounterBranchValue(value)}:${getCounterNumberValue(value)}`;

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
      branch: getCounterBranchValue(counter),
      counterNumber,
      name: String(counter?.name || '').trim() || `Counter ${counterNumber}`,
      status: normalizeCounterStatus(counter?.status),
    };

    const counterKey = getCounterKey(normalizedCounter);
    const existing = byNumber.get(counterKey);
    if (!existing) {
      byNumber.set(counterKey, normalizedCounter);
      return;
    }

    const existingScore = getCounterScore(existing);
    const nextScore = getCounterScore(normalizedCounter);

    if (nextScore > existingScore || (nextScore === existingScore && getCounterTimestamp(normalizedCounter) > getCounterTimestamp(existing))) {
      byNumber.set(counterKey, normalizedCounter);
    }
  });

  return Array.from(byNumber.values()).sort((left, right) => {
    const branchDelta = getCounterBranchValue(left).localeCompare(getCounterBranchValue(right));
    if (branchDelta !== 0) return branchDelta;
    return left.counterNumber - right.counterNumber;
  });
};

export const isCounterActive = (counter) => {
  if (!counter) return false;
  const status = normalizeCounterStatus(counter.status);
  return status === 'active';
};

export const getCounterOptions = (counters, { branch = null, includeInactive = false, fallbackCount = 10 } = {}) => {
  const canonicalCounters = getCanonicalCounters(counters);
  const normalizedBranch = branch ? normalizeBranch(branch) : null;
  const hasConfiguredCounters = canonicalCounters.length > 0;
  const branchCounters = normalizedBranch
    ? canonicalCounters.filter((counter) => counter.branch === normalizedBranch)
    : canonicalCounters;
  const hasConfiguredBranchCounters = branchCounters.length > 0;

  const configured = hasConfiguredCounters
    ? branchCounters
      .filter(Boolean)
      .filter((counter) => includeInactive || isCounterActive(counter))
      .map((counter) => Number(counter.counterNumber))
      .filter((counterNumber) => Number.isFinite(counterNumber) && counterNumber > 0)
    : [];

  const fallback = Array.from({ length: fallbackCount }, (_, index) => index + 1);
  const source = configured.length > 0 || hasConfiguredBranchCounters ? configured : fallback;
  return Array.from(new Set(source)).sort((a, b) => a - b);
};

export const getNextCounterNumber = (counters, { branch = null } = {}) => {
  const numbers = getCounterOptions(counters, { branch, includeInactive: true, fallbackCount: 0 });
  return numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
};
