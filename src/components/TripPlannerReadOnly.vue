<!-- TripPlannerReadOnly.vue -->
<template>
  <v-card class="mx-auto" max-width="750">
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>{{ shortDescription }}</v-toolbar-title>
      <v-spacer />
      <v-chip class="ma-2" variant="elevated">Nights planned: {{ totalNights }}</v-chip>
    </v-toolbar>

    <v-divider />

    <div class="px-4 py-2 text-grey-darken-1 text-caption d-none d-md-flex">
      <div class="w-8 mr-2"></div>
      <div class="flex-1 font-medium">Location</div>
      <div class="w-32 text-center font-medium">Nights</div>
      <div class="w-48 text-center font-medium">Transport (from previous)</div>
    </div>

    <v-expansion-panels multiple>
      <v-expansion-panel
          v-for="(element, index) in locations"
          :key="element.id"
          class="destination-panel"
      >
        <v-expansion-panel-title>
          <div class="d-flex align-center w-100">
            <v-avatar size="28" class="mr-3" color="primary" variant="tonal">
              <span class="text-body-2 font-weight-bold">{{ index + 1 }}</span>
            </v-avatar>

            <div class="flex-1">
              <!-- Display name when collapsed -->
              <div class="text-h6 font-weight-medium">
                {{ element.name || 'Destination' }}
              </div>
              <div class="text-caption text-grey-darken-1 mt-1">
                {{ formatDate(element.start) }} – {{ formatDate(element.end) }}
              </div>
            </div>

            <!-- Nights display -->
            <div class="d-flex align-center mr-4">
              <div class="px-3 text-body-1 font-weight-bold" style="min-width: 3rem; text-align: center;">
                {{ element.nights }} {{ element.nights === 1 ? 'night' : 'nights' }}
              </div>
            </div>

            <!-- Transport icon and duration -->
            <div class="d-none d-md-flex align-center justify-center mr-2" style="min-width: 100px;">
              <v-chip v-if="element.transport?.mode || element.transport?.duration" size="small" class="mr-2" variant="tonal">
                <v-icon v-if="element.transport?.mode" :start="!!element.transport?.duration" :icon="transportIcon(element.transport.mode)" size="18" />
                {{ element.transport?.duration }}
              </v-chip>
            </div>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="px-2 py-1 d-flex flex-column gap-4">
            <!-- Location info (read-only) -->
            <div v-if="element.name">
              <div class="text-subtitle-2 mb-2">Location</div>
              <div class="text-body-1">{{ element.name }}</div>
              <div v-if="element.address" class="text-caption text-grey-darken-1 mt-2">
                <v-icon size="14" icon="mdi-map-marker" />
                {{ element.address }}
              </div>
            </div>

            <v-divider v-if="element.shortDescription || element.images?.length" />

            <!-- Short Description (read-only) -->
            <div v-if="element.shortDescription">
              <div class="text-subtitle-2 mb-2">Description</div>
              <div class="text-body-2 text-grey-darken-1" style="white-space: pre-wrap;">
                {{ element.shortDescription }}
              </div>
            </div>

            <v-divider v-if="element.images && element.images.length > 0" />

            <!-- Images Gallery (read-only) -->
            <div v-if="element.images && element.images.length > 0">
              <div class="text-subtitle-2 mb-2">Images</div>
              <div class="image-gallery">
                <div class="d-flex flex-wrap gap-2">
                  <div v-for="(imageUrl, imgIndex) in element.images" :key="imgIndex" class="image-card">
                    <v-img
                        :src="imageUrl"
                        cover
                        height="120"
                        width="120"
                        class="rounded cursor-pointer"
                        @click="openImageDialog(imageUrl)"
                    >
                      <template #placeholder>
                        <div class="d-flex align-center justify-center fill-height">
                          <v-progress-circular indeterminate size="24" />
                        </div>
                      </template>
                    </v-img>
                  </div>
                </div>
              </div>
            </div>

            <v-divider />

            <!-- Dates & nights (read-only) -->
            <div class="d-flex flex-column flex-sm-row gap-4 align-start">
              <div class="flex-1">
                <div class="text-subtitle-2 mb-1">Start date</div>
                <div class="text-body-1">{{ formatDate(element.start) }}</div>
              </div>
              <div class="flex-1">
                <div class="text-subtitle-2 mb-1">End date</div>
                <div class="text-body-1">{{ formatDate(element.end) }}</div>
              </div>
              <div class="flex-1">
                <div class="text-subtitle-2 mb-1">Nights</div>
                <div class="text-body-1">{{ element.nights }}</div>
              </div>
            </div>

            <v-divider v-if="element.transport?.mode || element.transport?.duration || element.transport?.distance" />

            <!-- Transport from previous location (read-only) -->
            <div v-if="element.transport?.mode || element.transport?.duration || element.transport?.distance">
              <div class="text-subtitle-2 mb-2">Transport from previous stop</div>
              <div class="d-flex flex-column flex-sm-row gap-4">
                <div v-if="element.transport.mode" class="flex-1">
                  <div class="text-caption text-grey-darken-1 mb-1">Mode</div>
                  <div class="text-body-1">
                    <v-icon start :icon="transportIcon(element.transport.mode)" />
                    {{ prettyMode(element.transport.mode) }}
                  </div>
                </div>
                <div v-if="element.transport.duration" class="flex-1">
                  <div class="text-caption text-grey-darken-1 mb-1">Duration</div>
                  <div class="text-body-1">{{ element.transport.duration }}</div>
                </div>
                <div v-if="element.transport.distance" class="flex-1">
                  <div class="text-caption text-grey-darken-1 mb-1">Distance</div>
                  <div class="text-body-1">{{ element.transport.distance }}</div>
                </div>
              </div>
            </div>

            <v-divider v-if="element.accommodation" />

            <!-- Accommodation (read-only) -->
            <div v-if="element.accommodation">
              <div class="text-subtitle-2 mb-2">Accommodation</div>

              <v-card class="acc-card">
                <div class="d-flex flex-column flex-sm-row">
                  <v-img
                      :src="element.accommodation.image || placeholderImg"
                      class="acc-thumb"
                      cover
                      height="140"
                      width="220"
                  >
                    <template #placeholder>
                      <div class="d-flex align-center justify-center fill-height">
                        <v-icon size="36" icon="mdi-home-outline" />
                      </div>
                    </template>
                  </v-img>

                  <div class="flex-1 pa-3">
                    <div class="d-flex align-center">
                      <div class="text-subtitle-1 font-medium">
                        {{ element.accommodation.name }}
                      </div>
                      <v-chip
                          v-if="element.accommodation.pricePerNight"
                          size="small"
                          class="ml-3"
                          variant="tonal"
                      >
                        {{ element.accommodation.pricePerNight }}/night
                      </v-chip>
                    </div>

                    <div
                        class="text-caption text-grey-darken-1 mt-1"
                        v-if="element.accommodation.address"
                    >
                      <v-icon start size="16" icon="mdi-map-marker-outline" />
                      {{ element.accommodation.address }}
                    </div>

                    <div class="mt-2 d-flex align-center" v-if="element.accommodation.rating">
                      <v-rating
                          :model-value="element.accommodation.rating"
                          density="comfortable"
                          size="20"
                          half-increments
                          readonly
                      />
                      <span class="text-caption ml-2">
                        {{ Number(element.accommodation.rating).toFixed(1) }}
                      </span>
                    </div>

                    <div class="mt-2" v-if="element.accommodation.notes">
                      <div class="text-caption text-grey-darken-1">Notes:</div>
                      <div class="text-body-2 mt-1" style="white-space: pre-wrap;">
                        {{ element.accommodation.notes }}
                      </div>
                    </div>

                    <div class="mt-2" v-if="element.accommodation.url">
                      <v-btn
                          size="small"
                          variant="text"
                          :href="element.accommodation.url"
                          target="_blank"
                          prepend-icon="mdi-open-in-new"
                      >
                        View booking page
                      </v-btn>
                    </div>
                  </div>
                </div>
              </v-card>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>

  <!-- Image viewer dialog -->
  <v-dialog v-model="imageDialog.open" max-width="900">
    <v-card>
      <v-card-text class="pa-0">
        <v-img :src="imageDialog.url" contain max-height="80vh">
          <template #placeholder>
            <div class="d-flex align-center justify-center fill-height">
              <v-progress-circular indeterminate size="48" />
            </div>
          </template>
        </v-img>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="imageDialog.open = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Locations } from './TripView.vue'

/** Props */
const props = defineProps<{
  locations: Locations[],
  shortDescription?: string,
}>()

/** Computed */
const totalNights = computed(() =>
    (props.locations ?? []).reduce((sum, d) => sum + (Number(d.nights) || 0), 0)
)

/** Shared helpers */
const placeholderImg =
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop'

/** Image viewer dialog */
const imageDialog = ref<{ open: boolean; url: string }>({ open: false, url: '' })

function openImageDialog(url: string) {
  imageDialog.value = { open: true, url }
}

/** Icons & formatting */
function transportIcon(mode?: string | null) {
  return (
      {
        walk: 'mdi-walk',
        car: 'mdi-car',
        train: 'mdi-train',
        plane: 'mdi-airplane',
        bus: 'mdi-bus',
        boat: 'mdi-ferry',
        bicycle: 'mdi-bike',
      }[mode as string] || 'mdi-dots-horizontal'
  )
}

function prettyMode(mode?: string | null) {
  if (!mode) return '—'
  return mode.charAt(0).toUpperCase() + mode.slice(1)
}

function formatDate(d?: string) {
  if (!d) return '—'
  // Try to format as a more readable date
  try {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return d
  }
}
</script>

<style scoped>
.destination-panel + .destination-panel {
  border-top: 1px solid rgba(0,0,0,.06);
}

.w-8 { width: 2rem; }
.w-32 { width: 8rem; }
.w-48 { width: 12rem; }
.flex-1 { flex: 1 1 auto; }
.gap-4 { gap: 1rem; }

.acc-card { overflow: hidden; }
.acc-thumb { min-width: 220px; }

.image-gallery {
  max-width: calc(100% + 1rem);
  margin: 0 -0.5rem;
}

.image-card {
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
  flex: 0 0 calc(25% - 0.5rem);
  max-width: calc(25% - 0.5rem);
}

.image-card img {
  object-fit: cover;
  object-position: center;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  opacity: 0.9;
  transition: opacity 0.2s;
}
</style>

