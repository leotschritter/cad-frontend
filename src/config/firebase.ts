import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Type declaration for runtime config (injected via runtime-config.js)
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      FIREBASE_TENANT_ID?: string;
      API_BASE_URL?: string;
    };
  }
}

/**
 * Get runtime config value with fallback to build-time env var
 * Runtime config takes precedence (for containerized deployments)
 * Build-time env vars are used for local development
 */
function getRuntimeConfig(key: string, buildTimeValue: string | undefined): string | undefined {
  const runtimeValue = window.__RUNTIME_CONFIG__?.[key as keyof typeof window.__RUNTIME_CONFIG__];
  // Runtime value takes precedence, but ignore placeholder values like "${VAR}"
  if (runtimeValue && !runtimeValue.startsWith('${')) {
    return runtimeValue;
  }
  return buildTimeValue;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
};

if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  throw new Error(
    'Missing required Firebase configuration. Please ensure VITE_FIREBASE_API_KEY, ' +
    'VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID are set in your .env.local file.'
  );
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

/**
 * Multi-tenancy support for Identity Platform
 *
 * Tenant ID can come from:
 * 1. Runtime config (window.__RUNTIME_CONFIG__.FIREBASE_TENANT_ID) - for containerized deployments
 * 2. Build-time env var (VITE_FIREBASE_TENANT_ID) - for local development
 *
 * This enables user isolation between tiers:
 * - Freemium: No tenant ID (uses default Identity Platform)
 * - Standard: Tenant ID specific to this standard instance (e.g., std-standard-1)
 * - Enterprise: Tenant ID specific to this enterprise instance (e.g., ent-acme-corp)
 *
 * Users registered in one tenant cannot authenticate to services of another tenant.
 */
const tenantId = getRuntimeConfig('FIREBASE_TENANT_ID', import.meta.env.VITE_FIREBASE_TENANT_ID);
if (tenantId) {
  auth.tenantId = tenantId;
  console.log(`Firebase Auth configured for tenant: ${tenantId}`);
}

export { auth };
