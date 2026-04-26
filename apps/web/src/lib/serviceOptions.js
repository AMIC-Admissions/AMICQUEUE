import { defaultConfig } from '@/config.js';

const getServiceScore = (service) => {
  let score = 0;
  if (service?.isActive !== false) score += 3;
  if (service?.description) score += 1;
  if (service?.nameAr) score += 1;
  return score;
};

const getServiceTimestamp = (service) => {
  const timestamp = Date.parse(service?.updated || service?.created || '');
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const compareServices = (left, right) => {
  const orderDelta = Number(left?.order || 0) - Number(right?.order || 0);
  if (orderDelta !== 0) return orderDelta;

  const nameDelta = String(left?.name || '').localeCompare(String(right?.name || ''));
  if (nameDelta !== 0) return nameDelta;

  return getServiceTimestamp(right) - getServiceTimestamp(left);
};

export const getAvailableServices = (services, fallbackServices = defaultConfig.services) => {
  const normalizedFallback = Array.isArray(fallbackServices)
    ? fallbackServices.filter(Boolean).map((name, index) => ({
        id: `fallback-${name}`,
        name,
        nameAr: '',
        description: '',
        order: index + 1,
        isActive: true,
      }))
    : [];

  if (!Array.isArray(services) || services.length === 0) {
    return normalizedFallback;
  }

  const byName = new Map();

  services.forEach((service) => {
    const name = String(service?.name || '').trim();
    if (!name) return;

    const normalizedService = {
      ...service,
      name,
      nameAr: String(service?.nameAr || '').trim(),
      description: String(service?.description || '').trim(),
      order: Number.isFinite(Number(service?.order)) ? Number(service.order) : 999,
      isActive: service?.isActive !== false,
    };

    const key = name.toLowerCase();
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, normalizedService);
      return;
    }

    const existingScore = getServiceScore(existing);
    const nextScore = getServiceScore(normalizedService);

    if (nextScore > existingScore || (nextScore === existingScore && compareServices(normalizedService, existing) < 0)) {
      byName.set(key, normalizedService);
    }
  });

  const activeServices = Array.from(byName.values()).filter((service) => service.isActive !== false);
  if (activeServices.length === 0) {
    return normalizedFallback;
  }

  const remaining = new Map(activeServices.map((service) => [service.name.toLowerCase(), service]));
  const orderedServices = [];

  normalizedFallback.forEach((fallbackService) => {
    const key = fallbackService.name.toLowerCase();
    if (!remaining.has(key)) return;
    orderedServices.push(remaining.get(key));
    remaining.delete(key);
  });

  const additionalServices = Array.from(remaining.values()).sort(compareServices);
  return [...orderedServices, ...additionalServices];
};
