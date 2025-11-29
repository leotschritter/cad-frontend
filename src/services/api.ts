// src/services/api.ts
import { Configuration } from '@/api/backend';
import * as BackendApis from '@/api/backend/apis';
import * as WeatherApis from '@/api/weather-forecast-service/apis';
import * as TravelWarningsApis from "@/api/travel-warnings-service/apis";
import { Configuration as RecommendationConfiguration } from '@/api/recommendation-service/runtime';
import * as RecommendationApis from '@/api/recommendation-service/apis';
import { useAuthStore } from '@/stores/auth';

// Prefer Vite env var, fallback to local dev
const basePath =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

const weatherBasePath =
  import.meta.env.VITE_API_WEATHER_BASE_URL ?? 'http://localhost:8081';

const travelWarningsBasePath =
  import.meta.env.VITE_API_TRAVEL_WARNINGS_BASE_URL ?? 'http://localhost:8082';

const recommendationBasePath =
  import.meta.env.VITE_API_RECOMMENDATION_BASE_URL ?? 'http://localhost:8080';

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

export const weatherApiConfig = new Configuration({
  basePath: weatherBasePath,
  middleware: [createAuthMiddleware()], // Weather API requires authentication
});

export const travelWarningsApiConfig = new Configuration({
  basePath: travelWarningsBasePath,
  middleware: [createAuthMiddleware()], // Travel Warnings API requires authentication
});

export const recommendationApiConfig = new RecommendationConfiguration({
  basePath: recommendationBasePath,
  middleware: [createAuthMiddleware()], // Recommendation API requires authentication
});

// Helper to grab a specific API class once (tree-shakable)
// Supports backend APIs, weather APIs, travel warnings APIs, and recommendation APIs
export const getApi = <T extends keyof typeof BackendApis | keyof typeof WeatherApis | keyof typeof TravelWarningsApis | keyof typeof RecommendationApis>(key: T) => {
  // Check if it's a weather API
  if (key in WeatherApis) {
    const ApiCtor = WeatherApis[key as keyof typeof WeatherApis] as any;
    return new ApiCtor(weatherApiConfig);
  }

  // Check if it's a Travel warnings API
  if (key in TravelWarningsApis) {
    const ApiCtor = TravelWarningsApis[key as keyof typeof TravelWarningsApis] as any;
    return new ApiCtor(travelWarningsApiConfig);
  }

  // Check if it's a Recommendation API
  if (key in RecommendationApis) {
    const ApiCtor = RecommendationApis[key as keyof typeof RecommendationApis] as any;
    return new ApiCtor(recommendationApiConfig);
  }

  // Otherwise it's a backend API
  const ApiCtor = BackendApis[key as keyof typeof BackendApis] as any;
  return new ApiCtor(apiConfig);
};
