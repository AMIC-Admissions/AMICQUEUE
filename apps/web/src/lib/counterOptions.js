export const getCounterNumberValue = (value) => Number(value?.counterNumber ?? value?.counter ?? 0);

export const isCounterActive = (counter) => {
  if (!counter) return false;
  const status = String(counter.status || 'active').toLowerCase();
  return status === 'active';
};

export const getCounterOptions = (counters, { includeInactive = false, fallbackCount = 10 } = {}) => {
  const hasConfiguredCounters = Array.isArray(counters) && counters.length > 0;

  const configured = hasConfiguredCounters
    ? counters
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
