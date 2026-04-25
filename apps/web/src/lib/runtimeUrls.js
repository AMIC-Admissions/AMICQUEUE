const trimTrailingSlash = (value) => value.replace(/\/$/, '');

export const appBasePath = import.meta.env.BASE_URL === '/'
  ? ''
  : trimTrailingSlash(import.meta.env.BASE_URL);

export function getAppPath(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${appBasePath}${normalizedPath}`;
}

export function getAppUrl(path = '/') {
  return new URL(getAppPath(path), window.location.origin).toString();
}

export function getConfiguredServiceUrl(envValue, sameOriginPath, serviceName) {
  if (envValue) {
    return trimTrailingSlash(envValue);
  }

  if (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')) {
    console.warn(`${serviceName} URL is not configured. Set a Vite environment URL for GitHub Pages builds.`);
  }

  return sameOriginPath;
}
