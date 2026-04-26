import Pocketbase from 'pocketbase';
import { getConfiguredServiceUrl } from './runtimeUrls.js';
import { createLocalPocketbaseClient } from './localPocketbaseClient.js';

const shouldUseLocalDatabase = import.meta.env.VITE_USE_LOCAL_DB === 'true'
  || (!import.meta.env.VITE_POCKETBASE_URL && typeof window !== 'undefined' && window.location.hostname.endsWith('github.io'));

const pocketbaseClient = shouldUseLocalDatabase
  ? createLocalPocketbaseClient()
  : new Pocketbase(getConfiguredServiceUrl(
    import.meta.env.VITE_POCKETBASE_URL,
    "/hcgi/platform",
    "PocketBase",
  ));

pocketbaseClient.autoCancellation?.(false);

export default pocketbaseClient;

export { pocketbaseClient };
export const isUsingLocalDatabase = shouldUseLocalDatabase;
