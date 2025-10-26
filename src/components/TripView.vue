<template>
  <div class="d-flex flex-lg-row justify-center align-center gap-4">
    <div class="flex-1 map-pane">
      <TripPlanner
          :locations="locations"
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
import { ref } from 'vue'
import TripPlanner from './TripPlanner.vue'
import TripMap from './TripMap.vue'
import { useNominatim } from './useNominatim'

export type Locations = {
  id: number
  name: string
  start: string
  end: string
  nights: number
  lat?: number | null
  lng?: number | null
  address?: string | null
  transport: { mode: string | null; duration: string | null; distance: string | null }
  accommodation: null | {
    name: string
    address?: string
    url?: string
    image?: string
    pricePerNight?: string
    rating?: number
    notes?: string
  }
}

// Accept optional props
const props = defineProps<{
  shortDescription?: string,
  initialDestinations?: Locations[]
}>()

const emit = defineEmits<{
  (e: 'submit', locations: Locations[]): void
  (e: 'cancel'): void
}>()

const locations = ref<Locations[]>(props.initialDestinations || [
  { id: 1, name: 'Milano',  start: '2025-06-02', end: '2025-06-05', nights: 2, lat: 45.4642, lng: 9.19,    address: 'Milan, Italy',   transport: { mode: null,   duration: '2h 27m', distance: null }, accommodation: null },
  { id: 2, name: 'Venice',  start: '2025-06-05', end: '2025-06-08', nights: 3, lat: 45.4408, lng: 12.3155, address: 'Venezia, Italy', transport: { mode: 'train', duration: '2h 13m', distance: null }, accommodation: { name: 'Canal View Boutique', rating: 4.5, pricePerNight: '€180' } },
  { id: 3, name: 'Florence',start: '2025-06-08', end: '2025-06-12', nights: 3, lat: 43.7696, lng: 11.2558, address: 'Firenze, Italy',  transport: { mode: 'car',   duration: null,    distance: '231 km' }, accommodation: null },
  { id: 4, name: 'Rome',    start: '2025-06-12', end: '2025-06-16', nights: 4, lat: 41.9028, lng: 12.4964, address: 'Roma, Italy',     transport: { mode: 'train', duration: null,    distance: null },    accommodation: null },
])

const { geocode } = useNominatim()

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

const mapExpanded = ref(false)
function onMapExpanded(expanded: boolean) {
  mapExpanded.value = expanded
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
