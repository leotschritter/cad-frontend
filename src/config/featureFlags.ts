/**
 * Feature Flags Configuration
 *
 * This file contains feature flags for enabling/disabling application features.
 * Features can be toggled via environment variables or default values.
 */

interface FeatureFlags {
  weather: boolean
  recommendations: boolean
  travelWarnings: boolean
}

// Helper function to parse boolean from environment variable
const parseEnvBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value === undefined) return defaultValue
  return value.toLowerCase() === 'true'
}

// Load feature flags from environment variables with defaults
export const featureFlags: FeatureFlags = {
  weather: parseEnvBoolean(import.meta.env.VITE_FEATURE_WEATHER, true),
  recommendations: parseEnvBoolean(import.meta.env.VITE_FEATURE_RECOMMENDATIONS, true),
  travelWarnings: parseEnvBoolean(import.meta.env.VITE_FEATURE_TRAVEL_WARNINGS, true)
}

// Helper functions to check individual features
export const isWeatherEnabled = (): boolean => featureFlags.weather
export const isRecommendationsEnabled = (): boolean => featureFlags.recommendations
export const isTravelWarningsEnabled = (): boolean => featureFlags.travelWarnings

// Log feature flags on initialization (useful for debugging)
if (import.meta.env.DEV) {
  console.log('Feature Flags:', featureFlags)
}

export default featureFlags