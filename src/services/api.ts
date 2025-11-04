// src/services/api.ts
import { Configuration } from '@/api';
import * as AllApis from '@/api/apis';
import { useAuthStore } from '@/stores/auth';

// Prefer Vite env var, fallback to local dev
const basePath =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

// Create a custom middleware to add the Firebase token
const createAuthMiddleware = () => ({
  pre: async (context: any) => {
    const authStore = useAuthStore();
    if (authStore.idToken) {
      context.init.headers = {
        ...context.init.headers,
        Authorization: `Bearer ${authStore.idToken}`,
      };
    }
    return context;
  },
  post: async (context: any) => {
    const authStore = useAuthStore();

    // Handle token expiration (401 errors)
    if (context.response.status === 401) {
      try {
        await authStore.refreshToken();
        // Retry the request with the new token
        context.init.headers = {
          ...context.init.headers,
          Authorization: `Bearer ${authStore.idToken}`,
        };
        const retryResponse = await fetch(context.url, context.init);
        return retryResponse;
      } catch (refreshError) {
        await authStore.logout();
        window.location.href = '/login';
      }
    }

    // For all other status codes, pass through the original response
    // (returning undefined/null keeps the original response)
  },
});

export const apiConfig = new Configuration({
  basePath,
  middleware: [createAuthMiddleware()],
});

// Helper to grab a specific API class once (tree-shakable)
export const getApi = <T extends keyof typeof AllApis>(key: T) => {
  const ApiCtor = AllApis[key] as any;
  return new ApiCtor(apiConfig);
};
