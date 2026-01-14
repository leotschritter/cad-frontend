import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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
 * If VITE_FIREBASE_TENANT_ID is set, configure Firebase Auth to use that tenant.
 * This enables user isolation between tiers:
 * - Freemium: No tenant ID (uses default Identity Platform)
 * - Standard: Tenant ID specific to this standard instance
 * - Enterprise: Tenant ID specific to this enterprise instance
 *
 * Users registered in one tenant cannot authenticate to services of another tenant.
 */
const tenantId = import.meta.env.VITE_FIREBASE_TENANT_ID;
if (tenantId) {
  auth.tenantId = tenantId;
  console.log(`Firebase Auth configured for tenant: ${tenantId}`);
}

export { auth };
