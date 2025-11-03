<template>
  <div v-if="loading" class="d-flex justify-center align-center pa-8">
    <v-progress-circular indeterminate size="64" color="primary" />
    <span class="ml-4 text-h6">Loading locations...</span>
  </div>
  <div v-else class="d-flex my-6 flex-lg-row justify-center align-start gap-4">
    <div class="flex-1 map-pane">
      <TripPlannerReadOnly
          :locations="locations"
          :short-description="shortDescription"
      />
    </div>
    <!-- Inline (collapsed) map -->
    <div v-if="!mapExpanded" class="flex-1" style="height: 560px;">
      <TripMap
          :locations="locations"
          v-model:expanded="mapExpanded"
      />
    </div>
  </div>

  <!-- Overlay "dialog" when expanded -->
  <div v-if="mapExpanded" class="map-overlay" @click.self="mapExpanded = false">
    <div class="map-dialog" role="dialog" aria-modal="true">
      <TripMap
          :locations="locations"
          v-model:expanded="mapExpanded"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import TripPlannerReadOnly from './TripPlannerReadOnly.vue'
import TripMap from './TripMap.vue'
import type { Locations } from './TripView.vue'
import { useLocationStore } from '@/stores/location'
import { useNominatim } from './useNominatim'

// Accept props for displaying someone else's trip
const props = defineProps<{
  shortDescription?: string,
  locations?: Locations[],
  itineraryId?: number
}>()

const mapExpanded = ref(false)
const localLocations = ref<Locations[]>([])
const loading = ref(false)

// Initialize stores
const locationStore = useLocationStore()
const { geocode } = useNominatim()

// Computed property: use provided locations or loaded ones
const locations = computed<Locations[]>(() => {
  if (props.locations && props.locations.length > 0) return props.locations
  return localLocations.value
})

// Load locations from API when component mounts
onMounted(async () => {
  if (props.itineraryId && (!props.locations || props.locations.length === 0)) {
    await loadLocations()
  }
})

// Watch for itineraryId changes and reload locations
watch(() => props.itineraryId, async (newId) => {
  if (newId && (!props.locations || props.locations.length === 0)) {
    await loadLocations()
  }
})

function calculateNights(fromDate?: string | Date, toDate?: string | Date): number {
  if (!fromDate || !toDate) return 0
  const start = new Date(fromDate)
  const end = new Date(toDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

async function loadLocations() {
  if (!props.itineraryId) return

  loading.value = true
  try {
    const apiLocations = await locationStore.getLocationsForItinerary(props.itineraryId)

    // Convert API LocationDto to our Locations type
    localLocations.value = apiLocations.map(loc => ({
      id: loc.id || Date.now(),
      name: loc.name || 'Unnamed Location',
      start: loc.fromDate ? new Date(loc.fromDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      end: loc.toDate ? new Date(loc.toDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      nights: calculateNights(loc.fromDate, loc.toDate),
      lat: null,
      lng: null,
      address: null,
      shortDescription: loc.description || null,
      images: loc.imageUrls || [],
      transport: {
        mode: loc.transportDto?.transportType || null,
        duration: loc.transportDto?.duration ?? null,
        distance: loc.transportDto?.distance ?? null
      },
      accommodation: loc.accommodationDto ? {
        name: loc.accommodationDto.name || '',
        url: loc.accommodationDto.bookingPageUrl || undefined,
        image: loc.accommodationDto.accommodationImageUrl || undefined,
        pricePerNight: loc.accommodationDto.pricePerNight ? `${loc.accommodationDto.pricePerNight}` : undefined,
        rating: loc.accommodationDto.rating ?? undefined,
        notes: loc.accommodationDto.notes || undefined
      } : null
    }))

    // After loading, geocode all locations to get their coordinates for the map
    for (let i = 0; i < localLocations.value.length; i++) {
      const location = localLocations.value[i]
      if (location && location.name) {
        try {
          const hit = await geocode(location.name)
          if (hit) {
            location.lat = hit.lat
            location.lng = hit.lng
            location.address = hit.display
          }
        } catch (error) {
          console.error(`Error geocoding ${location.name}:`, error)
        }
        // Small delay to avoid overwhelming the Nominatim API
        if (i < localLocations.value.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
  } catch (error) {
    console.error('Failed to load locations:', error)
    localLocations.value = []
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.gap-4 { gap: 1rem; }

.map-pane {
  aspect-ratio: 16 / 10;
}

.map-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.45);
  z-index: 2000;
  display: grid;
  place-items: center;
}
.map-dialog {
  width: min(1200px, 92vw);
  height: min(85vh, 900px);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.35);
  overflow: hidden;
}
.map-dialog :deep(.map-wrapper) { height: 100%; }
.map-dialog :deep(.map-wrapper.expanded) { height: 100%; }
.map-dialog :deep(.map-el) { width: 100%; height: 100%; }
</style>

