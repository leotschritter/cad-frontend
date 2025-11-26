<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon left>mdi-alert-circle-outline</v-icon>
      Travel Warnings for This Trip
    </v-card-title>

    <v-card-text>
      <!-- Loading State with Skeleton -->
      <div v-if="loading || isLoadingWarnings" class="py-4">
        <div class="text-center mb-4">
          <v-progress-circular indeterminate color="primary" size="40"></v-progress-circular>
          <p class="mt-2 text-body-2">Loading travel warnings...</p>
        </div>

        <!-- Loading Skeletons -->
        <v-expansion-panels>
          <v-expansion-panel v-for="i in 3" :key="i">
            <v-expansion-panel-title>
              <div class="d-flex align-center w-100">
                <v-skeleton-loader type="avatar" class="mr-3"></v-skeleton-loader>
                <div class="flex-1">
                  <v-skeleton-loader type="text" width="150px"></v-skeleton-loader>
                  <v-skeleton-loader type="text" width="100px" class="mt-1"></v-skeleton-loader>
                </div>
                <v-skeleton-loader type="chip" width="60px"></v-skeleton-loader>
              </div>
            </v-expansion-panel-title>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- Error State -->
      <v-alert v-else-if="error" type="error" class="mb-4">
        {{ error }}
      </v-alert>

      <!-- No Locations -->
      <v-alert v-else-if="!locations || locations.length === 0" type="info">
        No locations added to this itinerary yet. Add locations to see travel warnings.
      </v-alert>

      <!-- Warnings for Locations -->
      <div v-else>
        <v-alert
          v-if="warningCount === 0"
          type="success"
          class="mb-4"
        >
          <v-icon left>mdi-check-circle</v-icon>
          No active travel warnings for your destinations!
        </v-alert>

        <v-alert
          v-else
          type="warning"
          class="mb-4"
        >
          <v-icon left>mdi-alert</v-icon>
          {{ warningCount }} active warning(s) detected for your destinations
        </v-alert>

        <!-- List of Locations with Warnings -->
        <v-expansion-panels>
          <v-expansion-panel
            v-for="(location, index) in locationsWithWarningStatus"
            :key="index"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center w-100">
                <v-avatar
                  :color="getWarningLevelColor(location.warning?.warningLevel)"
                  size="32"
                  class="mr-3"
                >
                  <v-icon
                    :icon="getWarningLevelIcon(location.warning?.warningLevel, location.hasWarning)"
                    color="white"
                    size="20"
                  ></v-icon>
                </v-avatar>

                <div class="flex-1">
                  <div class="font-weight-medium">{{ location.name }}</div>
                  <div class="text-caption text-grey">
                    {{ location.countryName || 'Unknown Country' }}
                  </div>
                </div>

                <v-chip
                  v-if="location.warning"
                  :color="getWarningLevelColor(location.warning.warningLevel)"
                  size="small"
                >
                  {{ location.warning.warningLevel?.toLowerCase() === 'none' ? 'Safe' : location.warning.warningLevel }}
                </v-chip>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div v-if="location.warning">
                <v-list density="compact">
                  <v-list-item>
                    <template #prepend>
                      <v-icon>mdi-calendar</v-icon>
                    </template>
                    <v-list-item-title>Last Updated</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ formatDate(location.warning.lastModified) }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item v-if="location.warning.situation">
                    <template #prepend>
                      <v-icon>mdi-information-outline</v-icon>
                    </template>
                    <v-list-item-title>Situation</v-list-item-title>
                    <v-list-item-subtitle class="text-wrap">
                      {{ location.warning.situation }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <v-btn
                  variant="text"
                  color="primary"
                  prepend-icon="mdi-open-in-new"
                  @click="viewDetailedWarning(location)"
                  class="mt-2"
                >
                  View Full Details
                </v-btn>
              </div>

              <v-alert v-else type="success" density="compact">
                No active warnings for this destination
              </v-alert>

              <v-divider class="my-3"></v-divider>

              <div class="text-caption text-grey">
                <strong>Travel Dates:</strong>
                {{ formatDate(location.fromDate) }} - {{ formatDate(location.toDate) }}
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-card-text>

    <v-card-actions v-if="locations && locations.length > 0">
      <v-btn
        prepend-icon="mdi-refresh"
        @click="loadWarningsForLocations(locations)"
        :loading="loading || isLoadingWarnings"
        variant="text"
      >
        Refresh Warnings
      </v-btn>
    </v-card-actions>

    <!-- Comprehensive Safety Information Dialog -->
    <v-dialog v-model="detailDialog" max-width="1000" scrollable>
      <ComprehensiveSafetyInfo
        v-if="selectedLocation"
        :country-code="selectedLocation.countryCode"
        :country-name="selectedLocation.countryName"
        @close="detailDialog = false"
      />
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTravelWarningsStore } from '@/stores/travelWarnings'
import type { LocationDto } from '@/api/backend'
import ComprehensiveSafetyInfo from './ComprehensiveSafetyInfo.vue'

interface Props {
  locations: LocationDto[]
  notificationsEnabled: boolean
  loading?: boolean
  error?: string | null
}

const props = defineProps<Props>()


const warningsStore = useTravelWarningsStore()

const detailDialog = ref(false)
const selectedLocation = ref<any>(null)
const isLoadingWarnings = ref(false)

// Normalize various API fields (severity, warningLevel, etc.) into a single warning level string
const normalizeWarningLevel = (warning: any): string | undefined => {
  if (!warning) return undefined
  return (
    warning.warningLevel ||
    warning.severity ||
    warning.severityDisplay ||
    warning.level ||
    warning.warningStatus ||
    undefined
  )
}

// Track warnings for each location
const locationWarnings = ref<Map<string, any>>(new Map())

const locationsWithWarningStatus = computed(() => {
  return props.locations.map(location => {
    const key = `${location.latitude},${location.longitude}`
    const warning = locationWarnings.value.get(key)
    return {
      ...location,
      warning,
      hasWarning: !!warning,
      countryName: warning?.countryName || location.name?.split(',').pop()?.trim() || 'Unknown',
      countryCode: warning?.countryCode || ''
    }
  })
})

const warningCount = computed(() => {
  return locationsWithWarningStatus.value.filter(l => {
    if (!l.hasWarning) return false
    // Don't count NONE severity as a warning
    const level = (l.warning?.warningLevel || '').toLowerCase()
    return level !== 'none'
  }).length
})

// Function to get country from coordinates (must be before loadWarningsForLocations)
const getCountryFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<{ countryCode: string; countryName: string } | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'TravelWarningsApp/1.0'
        }
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    if (data.address && data.address.country_code && data.address.country) {
      return {
        countryCode: data.address.country_code.toUpperCase(),
        countryName: data.address.country
      }
    }

    return null
  } catch (err) {
    console.error('Failed to reverse geocode:', err)
    return null
  }
}

// Function to load warnings for all locations (must be after getCountryFromCoordinates)
const loadWarningsForLocations = async (locations: LocationDto[]) => {
  isLoadingWarnings.value = true
  try {
    // Get unique country codes from locations by reverse geocoding
    for (const location of locations) {
      if (location.latitude && location.longitude) {
        try {
          // Use Nominatim to get country code
          const countryInfo = await getCountryFromCoordinates(location.latitude, location.longitude)
          if (countryInfo?.countryCode) {
            // Fetch warning for this country
            const warning = await warningsStore.fetchWarningByCountryCode(countryInfo.countryCode)
            if (warning) {
              const key = `${location.latitude},${location.longitude}`
              const normalizedLevel = normalizeWarningLevel(warning)
              locationWarnings.value.set(key, {
                ...warning,
                warningLevel: normalizedLevel,
                severity: normalizedLevel ?? warning.severity,
                countryName: countryInfo.countryName,
                countryCode: countryInfo.countryCode
              })
            }
          }
        } catch (err) {
          console.error(`Failed to load warning for location ${location.name}:`, err)
        }
      }
    }
  } finally {
    isLoadingWarnings.value = false
  }
}

// Load warnings when locations change
watch(() => props.locations, async (newLocations) => {
  if (newLocations && newLocations.length > 0) {
    await loadWarningsForLocations(newLocations)
  }
}, { immediate: true })

const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getWarningLevelColor = (level: string | undefined) => {
  if (!level) return 'success'  // Default to success (green) when no warning loaded yet
  const lowerLevel = level.toLowerCase()
  if (lowerLevel === 'none') return 'success'
  if (lowerLevel.includes('critical') || lowerLevel.includes('4')) return 'error'
  if (lowerLevel.includes('high') || lowerLevel.includes('severe') || lowerLevel.includes('extreme') || lowerLevel.includes('3')) return 'error'
  if (lowerLevel.includes('medium') || lowerLevel.includes('moderate') || lowerLevel.includes('2')) return 'warning'
  return 'info'
}

const getWarningLevelIcon = (level: string | undefined, hasWarning: boolean = false) => {
  // If no level provided and no warning, show default check
  if (!level) return hasWarning ? 'mdi-alert-circle-outline' : 'mdi-check'

  const lowerLevel = level.toLowerCase()
  if (lowerLevel === 'none') return 'mdi-check-circle'
  if (lowerLevel.includes('critical') || lowerLevel.includes('extreme') || lowerLevel.includes('4')) return 'mdi-close-octagon'
  if (lowerLevel.includes('severe') || lowerLevel.includes('high') || lowerLevel.includes('3')) return 'mdi-alert'
  if (lowerLevel.includes('moderate') || lowerLevel.includes('medium') || lowerLevel.includes('2')) return 'mdi-alert-circle'
  if (lowerLevel.includes('minor') || lowerLevel.includes('low') || lowerLevel.includes('1')) return 'mdi-information'
  return 'mdi-alert-circle-outline'
}

const viewDetailedWarning = (location: any) => {
  selectedLocation.value = location
  detailDialog.value = true
}
</script>

<style scoped>
.text-wrap {
  white-space: normal;
  word-wrap: break-word;
}
</style>
