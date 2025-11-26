<template>
  <div v-if="loading" class="d-flex justify-center align-center pa-8">
    <v-progress-circular indeterminate size="64" color="primary" />
    <span class="ml-4 text-h6">Loading locations...</span>
  </div>
  <div v-else>
    <div class="d-flex my-6 flex-lg-row justify-center align-start gap-4">
      <div class="flex-1 map-pane">
        <TripPlanner
            :locations="locations"
            :itinerary-id="itineraryId"
            :short-description="shortDescription"
            @update:locations="onPlannerUpdate"
            @geocode-request="onGeocodeRequest"
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
  </div>

  <!-- Overlay “dialog” when expanded -->
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
import { ref, onMounted, watch } from 'vue'
import TripPlanner from './TripPlanner.vue'
import TripMap from './TripMap.vue'
import { useNominatim } from './useNominatim'
import { useLocationStore } from '@/stores/location'
import { useItineraryStore } from '@/stores/itinerary'

export type Locations = {
  id: number
  name: string
  start: string
  end: string
  nights: number
  lat?: number | null
  lng?: number | null
  address?: string | null
  shortDescription?: string | null
  images?: string[]
  pendingFiles?: File[]  // Files staged for upload
  transport: { mode: string | null; duration: number | null; distance: number | null }
  accommodation: null | {
    name: string
    url?: string
    image?: string
    pricePerNight?: string
    rating?: number
    notes?: string
  }
}

// Accept props for itinerary ID and optional initial data
const props = defineProps<{
  shortDescription?: string,
  itineraryId?: number,
  initialDestinations?: Locations[]
}>()

const emit = defineEmits<{
  (e: 'submit', locations: Locations[]): void
  (e: 'cancel'): void
}>()

// Initialize stores
const locationStore = useLocationStore()
const itineraryStore = useItineraryStore()
const { geocode } = useNominatim()

// Initialize locations - will be loaded from API if itineraryId is provided
const locations = ref<Locations[]>(props.initialDestinations || [])
const loading = ref(false)

// Load locations from API when component mounts
onMounted(async () => {
  if (props.itineraryId) {
    await loadLocations()
  }
})

// Watch for itineraryId changes and reload locations
watch(() => props.itineraryId, async (newId) => {
  if (newId) {
    await loadLocations()
  }
})

async function loadLocations() {
  if (!props.itineraryId) return

  loading.value = true
  try {
    const loadedLocations = await locationStore.getLocationsForItinerary(props.itineraryId)


    // Convert API LocationDto to our Locations type
    locations.value = loadedLocations.map(loc => ({
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
    console.log('Geocoding loaded locations...')
    for (let i = 0; i < locations.value.length; i++) {
      const loc = locations.value[i]
      if (!loc || !loc.name) continue

      try {
        const hit = await geocode(loc.name)
        if (hit) {
          console.log(`Geocoded ${loc.name}:`, hit.lat, hit.lng)
          loc.lat = hit.lat
          loc.lng = hit.lng
          loc.address = hit.display
        } else {
          console.warn(`Could not geocode location: ${loc.name}`)
        }
      } catch (error) {
        console.error(`Error geocoding ${loc.name}:`, error)
      }
      // Small delay to avoid overwhelming the Nominatim API
      if (i < locations.value.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    console.log('Geocoding complete')
  } catch (error) {
    console.error('Failed to load locations:', error)
    locations.value = []
  } finally {
    loading.value = false
  }
}

function calculateNights(fromDate?: Date, toDate?: Date): number {
  if (!fromDate || !toDate) return 1
  const start = new Date(fromDate)
  const end = new Date(toDate)
  const diffTime = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(1, diffDays)
}

function onPlannerUpdate(next: Locations[]) {
  // Replace array to keep reactivity straightforward across children
  locations.value = next
}

async function onGeocodeRequest(idx: number, query: string) {
  // Nominatim lookup and apply the result to that destination
  const hit = await geocode(query)
  console.log(hit)
  if (!hit) return
  const d = locations.value[idx]

  if (!d) return
  d.name = hit.shortLabel
  d.address = hit.display
  d.lat = hit.lat
  d.lng = hit.lng
}

/**
 * Save all locations to the backend, including uploading any pending images
 * Strategy: Delete all existing locations, then recreate them with current state
 * This ensures order, renames, and all changes are properly saved
 */
async function saveAllLocations(): Promise<boolean> {
  console.log('saveAllLocations called')

  if (!props.itineraryId) {
    console.error('No itinerary ID provided')
    return false
  }

  console.log('Saving locations for itinerary:', props.itineraryId)
  console.log('Number of locations to save:', locations.value.length)

  loading.value = true
  let success = true

  try {
    // Step 1: Get all existing locations from backend
    console.log('Step 1: Fetching existing locations from backend...')
    const existingLocations = await locationStore.getLocationsForItinerary(props.itineraryId)
    console.log('Found', existingLocations.length, 'existing locations')

    // Step 2: Delete all existing locations
    console.log('Step 2: Deleting all existing locations...')
    for (const existingLoc of existingLocations) {
      if (existingLoc.id) {
        console.log('Deleting location ID:', existingLoc.id, 'Name:', existingLoc.name)
        const deleted = await locationStore.deleteLocation(existingLoc.id)
        if (!deleted) {
          console.warn('Failed to delete location:', existingLoc.id)
        }
      }
    }
    console.log('All existing locations deleted')

    // Step 3: Create all locations fresh with current state
    console.log('Step 3: Creating all locations with current state...')
    for (let i = 0; i < locations.value.length; i++) {
      const loc = locations.value[i]
      if (!loc) continue

      console.log(`Creating location ${i + 1}/${locations.value.length}:`, loc.name)

      // Extract existing image filenames (excluding data URLs)
      const existingImageUrls = (loc.images || [])
        .filter(url => !url.startsWith('data:'))
        .map(url => {
          try {
            // Extract filename from signed URL
            const urlObj = new URL(url)
            const pathParts = urlObj.pathname.split('/o/')
            if (pathParts.length > 1 && pathParts[1]) {
              // Decode URI component to get actual filename
              return decodeURIComponent(pathParts[1])
            }
            return url
          } catch (e) {
            console.warn('Failed to parse image URL:', url)
            return url
          }
        })

      // Log file information if there are pending files
      if (loc.pendingFiles && loc.pendingFiles.length > 0) {
        console.log(`  - Uploading ${loc.pendingFiles.length} new file(s)`)
        loc.pendingFiles.forEach((file, idx) => {
          console.log(`    File ${idx + 1}: ${file.name} (${file.size} bytes, ${file.type})`)
        })
      }

      // Parse transport data
      const transportType = loc.transport?.mode || undefined
      const transportDuration = loc.transport?.duration ?? undefined
      const transportDistance = loc.transport?.distance ?? undefined

      // Parse accommodation data
      const accommodationName = loc.accommodation?.name || undefined
      const accommodationPricePerNight = loc.accommodation?.pricePerNight
        ? parseFloat(loc.accommodation.pricePerNight)
        : undefined
      const accommodationRating = loc.accommodation?.rating || undefined
      const accommodationNotes = loc.accommodation?.notes || undefined
      const accommodationImageUrl = loc.accommodation?.image || undefined
      const bookingPageUrl = loc.accommodation?.url || undefined

      // Create new location in backend
      const newLocation = await locationStore.addLocationToItinerary({
        itineraryId: props.itineraryId,
        name: loc.name,
        description: loc.shortDescription || undefined,
        fromDate: new Date(loc.start),
        toDate: new Date(loc.end),
        files: loc.pendingFiles || [],
        transportType,
        transportDuration,
        transportDistance,
        accommodationName,
        accommodationPricePerNight,
        accommodationRating,
        accommodationNotes,
        accommodationImageUrl,
        bookingPageUrl
      })

      if (newLocation) {
        console.log('Location created successfully with ID:', newLocation.id)
        // Update the local ID with the backend ID
        loc.id = newLocation.id!
        // Clear pending files since they've been uploaded
        loc.pendingFiles = []

        // Existierende Bilder wieder hinzufügen
        if (existingImageUrls.length > 0) {
          console.log(`  - Re-adding ${existingImageUrls.length} existing image(s) to location ${newLocation.id}`)
          console.log(`  - Existing URLs to re-add:`, existingImageUrls)

          const added = await locationStore.addImageUrlsToLocation({
            locationId: newLocation.id!,
            imageUrls: existingImageUrls
          })
          console.log(`  - Re-add result:`, added)
          if (!added) {
            console.error('❌ Failed to re-add existing images!')
          } else {
            console.log('✅ Successfully re-added existing images')
          }
        }

        // Update images: hole alle von Backend (bereits in richtiger Reihenfolge)
        console.log(`  - Images from backend:`, newLocation.imageUrls)

        // Backend gibt bereits alle Bilder zurück (neue + re-added), hole sie nochmal
        const refreshedLocation = await locationStore.getLocationById(newLocation.id!)
        if (refreshedLocation?.imageUrls) {
          loc.images = refreshedLocation.imageUrls
          console.log(`  - Refreshed images from backend:`, loc.images)
        } else {
          // Fallback: merge manually
          loc.images = [...existingImageUrls, ...(newLocation.imageUrls || [])]
        }
        console.log(`  - Total images:`, loc.images.length)
      } else {
        success = false
        console.error(`Failed to create location: ${loc.name}`)
      }
    }

    console.log('All locations recreated. Success:', success)
    return success
  } catch (error) {
    console.error('Error saving locations:', error)
    return false
  } finally {
    loading.value = false
  }
}

// Expose the save method so parent can call it
defineExpose({
  saveAllLocations
})

const mapExpanded = ref(false)
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
  place-items: center; /* ← perfectly centered */
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
