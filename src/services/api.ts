// src/services/api.ts
import { Configuration } from '@/api';
import * as AllApis from '@/api/apis'; // will contain e.g. DefaultApi, FruitsApi, UsersApi, ...

// Prefer Vite env var, fallback to local dev
const basePath =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const apiConfig = new Configuration({
  basePath,
});

// Helper to grab a specific API class once (tree-shakable)
export const getApi = <T extends keyof typeof AllApis>(key: T) => {
  const ApiCtor = AllApis[key] as any;
  return new ApiCtor(apiConfig);
};

// Example convenience exports
export const defaultApi = getApi('DefaultApi' as keyof typeof AllApis);
