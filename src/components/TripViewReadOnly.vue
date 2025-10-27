<template>
  <div class="d-flex flex-lg-row justify-center align-center gap-4">
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
import { ref } from 'vue'
import TripPlannerReadOnly from './TripPlannerReadOnly.vue'
import TripMap from './TripMap.vue'
import type { Locations } from './TripView.vue'

// Accept props for displaying someone else's trip
const props = defineProps<{
  shortDescription?: string,
  locations: Locations[]
}>()

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

