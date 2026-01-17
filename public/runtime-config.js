// Runtime configuration - values are injected at container startup
// This file is substituted by the container entrypoint script
window.__RUNTIME_CONFIG__ = {
  // Identity Platform tenant ID for multi-tenancy
  // Empty for freemium, set for standard/enterprise tiers
  FIREBASE_TENANT_ID: "${VITE_FIREBASE_TENANT_ID}",

  // API Gateway base URLs (can also be overridden at runtime if needed)
  API_BASE_URL: "${VITE_API_BASE_URL}",
};
