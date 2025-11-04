<!-- TripPlanner.vue -->
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
      <Draggable
          v-model="itemsModel"
          item-key="id"
          handle=".drag-handle"
          ghost-class="ghost"
          tag="div"
          @end="emitUpdate"
      >
        <template #item="{ element, index }">
          <v-expansion-panel :key="element.id" class="destination-panel">
            <v-expansion-panel-title>
              <div class="d-flex align-center w-100">
                <v-btn
                    icon
                    variant="text"
                    class="mr-2 drag-handle"
                    :ripple="false"
                    :title="`Drag ${element.name || 'Destination'}`"
                >
                  <v-icon icon="mdi-drag" />
                </v-btn>

                <v-avatar size="28" class="mr-3" color="primary" variant="tonal">
                  <span class="text-body-2 font-weight-bold">{{ index + 1 }}</span>
                </v-avatar>

                <div class="flex-1">
                  <!-- Display name when collapsed -->
                  <div class="text-h6 font-weight-medium">
                    {{ element.name || 'New Destination' }}
                  </div>
                  <div class="text-caption text-grey-darken-1 mt-1">
                    {{ formatDate(element.start) }} – {{ formatDate(element.end) }}
                  </div>
                </div>

                <!-- Nights +/- buttons -->
                <div class="d-flex align-center mr-4">
                  <v-btn
                      icon
                      size="small"
                      variant="text"
                      @click.stop="decNights(element)"
                      :disabled="element.nights <= 1"
                  >
                    <v-icon size="20">mdi-minus</v-icon>
                  </v-btn>
                  <div class="px-3 text-body-1 font-weight-bold" style="min-width: 3rem; text-align: center;">
                    {{ element.nights }}
                  </div>
                  <v-btn
                      icon
                      size="small"
                      variant="text"
                      @click.stop="incNights(element)"
                  >
                    <v-icon size="20">mdi-plus</v-icon>
                  </v-btn>
                </div>

                <!-- Transport icon and duration -->
                <div class="d-none d-md-flex align-center justify-center mr-2" style="min-width: 100px;">
                  <v-chip v-if="element.transport?.mode || element.transport?.duration" size="small" class="mr-2" variant="tonal">
                    <v-icon v-if="element.transport?.mode" :start="!!element.transport?.duration" :icon="transportIcon(element.transport.mode)" size="18" />
                    {{ element.transport?.duration + ' min' }}
                  </v-chip>
                </div>

                <!-- Delete button -->
                <v-btn
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    @click.stop="openDeleteDialog(element)"
                    title="Delete destination"
                >
                  <v-icon size="20">mdi-delete</v-icon>
                </v-btn>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div class="px-2 py-1 d-flex flex-column gap-4">
                <!-- Editable location name + geocode lookup -->
                <div>
                  <div class="text-subtitle-2 mb-2">Location</div>
                  <div class="d-flex align-center" style="gap:.75rem;">
                    <v-text-field
                        v-model="element.name"
                        density="comfortable"
                        placeholder="Enter destination name"
                        hide-details
                        class="flex-1"
                        @blur="emitUpdate"
                    />
                    <v-btn
                        size="default"
                        variant="tonal"
                        prepend-icon="mdi-crosshairs-gps"
                        @click="$emit('geocode-request', index, element.name || '')"
                    >
                      Lookup
                    </v-btn>
                  </div>
                </div>

                <v-divider />

                <!-- Short Description -->
                <div>
                  <div class="text-subtitle-2 mb-2">Short Description</div>
                  <v-textarea
                      v-model="element.shortDescription"
                      density="comfortable"
                      placeholder="Add a brief description of this location..."
                      rows="2"
                      auto-grow
                      hide-details
                      @blur="emitUpdate"
                  />
                </div>

                <v-divider />

                <!-- Images Section -->
                <div>
                  <div class="text-subtitle-2 mb-2">Images</div>

                  <!-- Image Gallery -->
                  <div v-if="element.images && element.images.length > 0" class="image-gallery mb-3">
                    <div class="d-flex flex-wrap gap-2">
                      <div v-for="(imageUrl, imgIndex) in element.images" :key="imgIndex" class="image-card">
                        <v-img
                            :src="imageUrl"
                            cover
                            height="120"
                            width="120"
                            class="rounded"
                        >
                          <template #placeholder>
                            <div class="d-flex align-center justify-center fill-height">
                              <v-progress-circular indeterminate size="24" />
                            </div>
                          </template>
                        </v-img>
                        <v-btn
                            icon
                            size="x-small"
                            class="image-delete-btn"
                            color="error"
                            @click="removeImage(element, imgIndex)"
                        >
                          <v-icon size="16">mdi-close</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </div>

                  <!-- Upload Image Input -->
                  <div class="d-flex align-center" style="gap:.75rem;">
                    <v-file-input
                        :ref="el => fileInputRefs[element.id] = el"
                        v-model="selectedFiles[element.id]"
                        density="comfortable"
                        placeholder="Choose image files..."
                        prepend-inner-icon="mdi-camera"
                        prepend-icon=""
                        accept="image/*"
                        multiple
                        hide-details
                        class="flex-1"
                        :loading="uploadingImages[element.id]"
                        :disabled="uploadingImages[element.id]"
                        @update:model-value="onFileSelected(element)"
                    >
                      <template #selection="{ fileNames }">
                        <template v-if="fileNames.length === 1">
                          {{ fileNames[0] }}
                        </template>
                        <template v-else>
                          {{ fileNames.length }} files selected
                        </template>
                      </template>
                    </v-file-input>
                    <v-btn
                        size="default"
                        variant="tonal"
                        prepend-icon="mdi-upload"
                        @click="uploadImages(element)"
                        :disabled="!selectedFiles[element.id] || selectedFiles[element.id]?.length === 0 || uploadingImages[element.id]"
                        :loading="uploadingImages[element.id]"
                    >
                      Upload
                    </v-btn>
                  </div>

                  <div class="text-caption text-grey-darken-1 mt-2">
                    <v-icon size="14" icon="mdi-information-outline" />
                    Upload images (max 5MB each, JPG, PNG, GIF supported)
                  </div>
                </div>

                <v-divider />

                <!-- Dates & nights -->
                <div class="d-flex flex-column flex-sm-row gap-4 align-start">
                  <v-text-field
                      v-model="element.start"
                      label="Start date"
                      type="date"
                      density="comfortable"
                      class="flex-1"
                      @change="recomputeNights(element)"
                  />
                  <v-text-field
                      v-model="element.end"
                      label="End date"
                      type="date"
                      density="comfortable"
                      class="flex-1"
                      @change="recomputeNights(element)"
                  />
                  <v-text-field
                      v-model.number="element.nights"
                      label="Nights"
                      type="number"
                      density="comfortable"
                      min="1"
                      class="flex-1"
                      @change="syncEndFromNights(element)"
                  />
                </div>

                <v-divider />

                <!-- Transport from previous location -->
                <div>
                  <div class="text-subtitle-2 mb-2">Transport from previous stop</div>
                  <div class="d-flex flex-column flex-sm-row gap-4">
                    <v-select
                        v-model="element.transport.mode"
                        :items="transportModes"
                        label="Mode"
                        density="comfortable"
                        class="flex-1"
                        :item-title="m => prettyMode(m)"
                        :item-value="m => m"
                        clearable
                        @update:modelValue="emitUpdate"
                    >
                      <template #prepend-item>
                        <div class="px-4 py-2 text-caption text-grey-darken-1">
                          Choose transport mode
                        </div>
                        <v-divider />
                      </template>
                      <template #selection="{ item }">
                        <v-icon start :icon="transportIcon(item.value)" />
                        {{ prettyMode(item.value) }}
                      </template>
                      <template #item="{ props, item }">
                        <v-list-item v-bind="props">
                          <template #prepend>
                            <v-icon :icon="transportIcon(item.value)" />
                          </template>
                        </v-list-item>
                      </template>
                    </v-select>

                    <v-number-input
                        v-model="element.transport.duration"
                        label="Duration (min)"
                        density="comfortable"
                        class="flex-1"
                        @blur="emitUpdate"
                    />
                    <v-number-input
                        v-model="element.transport.distance"
                        label="Distance (km)"
                        density="comfortable"
                        class="flex-1"
                        @blur="emitUpdate"
                    />
                  </div>
                </div>

                <v-divider />

                <!-- Single Accommodation (fancy) -->
                <div>
                  <div class="text-subtitle-2 mb-2">Accommodation</div>

                  <!-- Show selected accommodation -->
                  <v-card v-if="element.accommodation"  class="acc-card">
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
                            {{ element.accommodation.pricePerNight }}€/night
                          </v-chip>
                        </div>

                        <div class="mt-2 d-flex align-center">
                          <v-rating
                              :model-value="element.accommodation.rating ?? 0"
                              @update:model-value="(val) => { element.accommodation.rating = typeof val === 'number' ? val : undefined; emitUpdate(); }"
                              density="comfortable"
                              size="20"
                              half-increments
                          />
                          <span
                              class="text-caption ml-2"
                              v-if="element.accommodation.rating != null && element.accommodation.rating > 0"
                          >
                            {{ element.accommodation.rating.toFixed(1) }}
                          </span>
                        </div>

                        <div class="mt-2" v-if="element.accommodation.url">
                          <v-btn
                              size="small"
                              variant="text"
                              :href="element.accommodation.url"
                              target="_blank"
                              prepend-icon="mdi-open-in-new"
                          >
                            Open booking page
                          </v-btn>
                        </div>

                        <div class="mt-3 d-flex gap-2">
                          <v-btn
                              size="small"
                              variant="tonal"
                              prepend-icon="mdi-pencil"
                              @click="openAccDialog(element)"
                          >
                            Edit
                          </v-btn>
                          <v-btn
                              size="small"
                              variant="text"
                              color="error"
                              prepend-icon="mdi-delete"
                              @click="removeAccommodation(element)"
                          >
                            Remove
                          </v-btn>
                        </div>
                      </div>
                    </div>
                  </v-card>

                  <!-- Empty state -->
                  <v-sheet
                      v-else
                      class="d-flex flex-column align-center justify-center pa-6 acc-empty"
                      rounded="lg"
                      color="grey-lighten-4"
                  >
                    <v-icon size="40" icon="mdi-home-plus-outline" />
                    <div class="text-body-2 mt-2 mb-3 text-center">No accommodation selected yet</div>
                    <v-btn prepend-icon="mdi-plus" variant="tonal" @click="openAccDialog(element)">
                      Add accommodation
                    </v-btn>
                  </v-sheet>
                </div>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </template>
      </Draggable>
    </v-expansion-panels>

    <v-divider class="my-2" />

    <!-- Add new destination -->
    <div class="px-4 pb-4 d-flex align-start">
      <v-text-field
          v-model="newName"
          placeholder="Add new destination…"
          density="comfortable"
          class="flex-1 mr-2"
          @keyup.enter="addDestination"
      />
      <v-btn prepend-icon="mdi-plus" @click="addDestination" :disabled="!newName || !newName.trim()">Add</v-btn>
    </div>
  </v-card>

  <!-- Accommodation dialog -->
  <v-dialog v-model="accDialog.open" max-width="640">
    <v-card>
      <v-card-title class="text-h6">
        {{ accDialog.model?.accommodation ? 'Edit accommodation' : 'Add accommodation' }}
      </v-card-title>
      <v-card-text>
        <div class="d-flex flex-column gap-3">
          <v-text-field v-model="accForm.name" label="Name" />
          <v-text-field v-model="accForm.url" label="Booking URL (optional)" prepend-inner-icon="mdi-link-variant" />
          <v-text-field v-model="accForm.image" label="Image URL (optional)" prepend-inner-icon="mdi-image" />
          <div class="d-flex gap-3">
            <v-text-field v-model="accForm.pricePerNight" label="Price per night (optional)" class="flex-1" />
            <div class="flex-1 d-flex align-center">
              <span class="mr-3 text-body-2">Rating</span>
              <v-rating
                  :model-value="accForm.rating ?? 0"
                  @update:model-value="(val) => accForm.rating = typeof val === 'number' ? val : undefined"
                  half-increments
                  hover
                  size="22"
              />
            </div>
          </div>
          <v-textarea v-model="accForm.notes" label="Notes (optional)" rows="2" auto-grow />
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="accDialog.open = false">Cancel</v-btn>
        <v-btn variant="flat" @click="saveAccommodation">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete confirmation dialog -->
  <v-dialog v-model="deleteDialog.open" max-width="400">
    <v-card>
      <v-card-title class="text-h6 bg-primary">
        <v-icon class="mr-2">mdi-delete</v-icon>
        Confirm Deletion
      </v-card-title>
      <v-card-text>
        Are you sure you want to delete this destination? This action cannot be undone.
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="deleteDialog.open = false">Cancel</v-btn>
        <v-btn variant="flat" color="error" @click="confirmDelete">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import Draggable from 'vuedraggable'
import type { Locations } from './TripView.vue'
import { useLocationStore } from '@/stores/location'

/** Props & emits */
const props = defineProps<{
  locations: Locations[],
  shortDescription?: string,
  itineraryId?: number,
}>()
const emit = defineEmits<{
  (e: 'update:locations', value: Locations[]): void
  (e: 'geocode-request', index: number, query: string): void
}>()

// Initialize location store
const locationStore = useLocationStore()

/** v-model proxy for the prop so Draggable always has a real array */
const itemsModel = computed<Locations[]>({
  get: () => props.locations ?? [],
  set: (val) => emit('update:locations', val ?? []),
})

/** Top chip total */
const totalNights = computed(() =>
    itemsModel.value.reduce((sum, d) => sum + (Number(d.nights) || 0), 0)
)

/** Local UI state */
const newName = ref('')

const newImageUrl = ref<{ [key: number]: string }>({})

const selectedFiles = ref<{ [key: number]: File[] }>({})

const uploadingImages = ref<{ [key: number]: boolean }>({})

const fileInputRefs = ref<{ [key: number]: any }>({})

/** Shared helpers */
const placeholderImg =
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop'

const transportModes = ['walk', 'bicycle', 'car', 'train', 'plane', 'bus', 'boat']

function emitUpdate() {
  // force a new array reference to notify parent
  itemsModel.value = [...itemsModel.value]
}

/** Nights & date helpers */
function incNights(d: Locations) {
  d.nights = Number(d.nights || 0) + 1
  syncEndFromNights(d)
  emitUpdate()
}
function decNights(d: Locations) {
  d.nights = Math.max(1, Number(d.nights || 0) - 1)
  syncEndFromNights(d)
  emitUpdate()
}
function dateDiffInNights(start?: string, end?: string) {
  if (!start || !end) return 1
  const s = new Date(start)
  const e = new Date(end)
  const ms = e.getTime() - s.getTime()
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)))
}
function recomputeNights(d: Locations) {
  if (d.start && d.end) d.nights = dateDiffInNights(d.start, d.end)
  emitUpdate()
}
function syncEndFromNights(d: Locations) {
  if (!d.start || !d.nights) return
  const s = new Date(d.start)
  const e = new Date(s)
  e.setDate(s.getDate() + Number(d.nights))
  d.end = e.toISOString().slice(0, 10)
}

/** Add destination (owned by parent via itemsModel) */
function addDestination() {
  const name = newName.value?.trim()
  if (!name) return
  const last = itemsModel.value[itemsModel.value.length - 1]
  const start = last?.end || new Date().toISOString().slice(0, 10)
  const d: Locations = {
    id: Date.now(),
    name,
    start,
    end: start,
    nights: 1,
    transport: { mode: null, duration: null, distance: null },
    accommodation: null,
  }
  syncEndFromNights(d)
  const newIdx = itemsModel.value.length
  itemsModel.value = [...itemsModel.value, d]   // updates parent
  newName.value = ''
  // ask parent to geocode the just-added row
  nextTick(() => {
  // guard: if user reordered quickly, fall back to searching by id
    const idx = itemsModel.value.findIndex(x => x.id === d.id)
    const safeIdx = idx === -1 ? newIdx : idx
    // emit to parent (TripView)
    // @ts-ignore - TS doesn't track emit types well in diff snippets
    emit('geocode-request', safeIdx, d.name)
  })
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
  return d || '—'
}

/** Accommodation dialog state */
const accDialog = ref<{ open: boolean; model: Locations | null }>({ open: false, model: null })
const accForm = ref({
  name: '',
  url: '',
  image: '',
  pricePerNight: '',
  rating: undefined as number | undefined,
  notes: '',
})

function openAccDialog(destination: Locations) {
  accDialog.value = { open: true, model: destination }
  const cur: any = destination.accommodation ?? {}
  accForm.value = {
    name: cur.name ?? '',
    url: cur.url ?? '',
    image: cur.image ?? '',
    pricePerNight: cur.pricePerNight ?? '',
    rating: cur.rating ?? undefined,
    notes: cur.notes ?? '',
  }
}
function saveAccommodation() {
  if (!accDialog.value.model) return
  accDialog.value.model.accommodation = { ...accForm.value }
  accDialog.value.open = false
  emitUpdate()
}
function removeAccommodation(destination: Locations) {
  destination.accommodation = null
  emitUpdate()
}

/** Delete confirmation dialog state */
const deleteDialog = ref<{ open: boolean; model: Locations | null }>({ open: false, model: null })

function openDeleteDialog(destination: Locations) {
  deleteDialog.value = { open: true, model: destination }
}
async function confirmDelete() {
  if (!deleteDialog.value.model) return

  const destination = deleteDialog.value.model
  const index = itemsModel.value.findIndex(item => item.id === destination.id)

  if (index === -1) {
    deleteDialog.value.open = false
    return
  }

  // Just remove locally - the backend sync happens when user clicks "Save Changes"
  itemsModel.value.splice(index, 1)
  emitUpdate()

  deleteDialog.value.open = false
}

/** Image URL handling */
function addImage(destination: Locations) {
  const url = newImageUrl.value[destination.id]?.trim()
  if (!url) return
  if (!destination.images) destination.images = []
  destination.images.push(url)
  newImageUrl.value[destination.id] = ''
  emitUpdate()
}
async function removeImage(destination: Locations, index: number) {
  if (!destination.images) return

  const imageUrl = destination.images[index]

  // If location has a backend ID, delete from server
  if (destination.id && destination.id >= 100000 && imageUrl) {
    try {
      const success = await locationStore.deleteImageFromLocation({
        locationId: destination.id,
        imageUrl: imageUrl
      })

      if (success) {
        destination.images.splice(index, 1)
        emitUpdate()
      } else {
        alert('Failed to delete image from server')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image')
    }
  } else {
    // Just remove locally if not yet saved to backend
    destination.images.splice(index, 1)
    emitUpdate()
  }
}

/** File upload handling */
function onFileSelected(destination: Locations) {
  // Just update the file selection, don't preview yet
  // The actual upload happens when user clicks Upload button
}

async function uploadImages(location: Locations) {
  const files = selectedFiles.value[location.id] || []
  if (files.length === 0) return

  uploadingImages.value[location.id] = true

  try {
    // Validate file types and sizes
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        uploadingImages.value[location.id] = false
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is larger than 5MB`)
        uploadingImages.value[location.id] = false
        return
      }
    }

    // Convert files to data URLs for preview (don't upload yet)
    const dataUrls: string[] = []
    for (const file of files) {
      const dataUrl = await readFileAsDataURL(file)
      dataUrls.push(dataUrl)
    }

    // Add the data URLs to the location for preview
    if (!location.images) location.images = []
    location.images.push(...dataUrls)

    // Store the actual files for later upload (when saving the whole itinerary)
    if (!location.pendingFiles) {
      location.pendingFiles = []
    }
    location.pendingFiles.push(...files)

    // Clear the selected files
    selectedFiles.value[location.id] = []

    emitUpdate()

    console.log(`Staged ${dataUrls.length} image(s) for upload`)
  } catch (error: any) {
    console.error('Error staging images:', error)
    alert(`Failed to stage images: ${error.message || 'Unknown error'}`)
  } finally {
    uploadingImages.value[location.id] = false
  }
}

// Helper function to read file as data URL
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
</script>

<style scoped>
.destination-panel + .destination-panel {
  border-top: 1px solid rgba(0,0,0,.06);
}
.ghost {
  opacity: 0.5;
  transform: scale(0.99);
}
.w-8 { width: 2rem; }
.w-32 { width: 8rem; }
.w-48 { width: 12rem; }
.flex-1 { flex: 1 1 auto; }
.gap-4 { gap: 1rem; }

.acc-card { overflow: hidden; }
.acc-thumb { min-width: 220px; }
.acc-empty { border: 1px dashed rgba(0,0,0,0.2); }

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
.image-delete-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
}
</style>
