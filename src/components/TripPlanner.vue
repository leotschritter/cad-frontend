<!-- TripPlanner.vue -->
<template>
  <v-card class="mx-auto my-6" max-width="900">
    <v-toolbar flat density="comfortable">
      <v-toolbar-title>An Italian Adventure</v-toolbar-title>
      <v-spacer />
      <v-chip variant="elevated">Nights planned: {{ totalNights }}</v-chip>
    </v-toolbar>

    <v-divider />

    <div class="px-4 py-2 text-grey-darken-1 text-caption d-none d-md-flex">
      <div class="w-8 mr-2"></div>
      <div class="flex-1 font-medium">Destination</div>
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

                <v-avatar size="24" class="mr-3" color="primary" variant="tonal">
                  <span class="text-caption">{{ index + 1 }}</span>
                </v-avatar>

                <div class="flex-1">
                  <!-- Editable name + lookup (geocode) -->
                  <div class="d-flex align-center" style="gap:.5rem;">
                    <v-text-field
                        v-model="element.name"
                        variant="outlined"
                        density="comfortable"
                        label="Location"
                        hide-details
                        class="flex-1"
                        @blur="emitUpdate"
                    />
                    <v-btn
                        size="small"
                        variant="tonal"
                        prepend-icon="mdi-crosshairs-gps"
                        @click.stop="$emit('geocode-request', index, element.name || '')"
                    >
                      Lookup
                    </v-btn>
                  </div>

                  <div class="text-caption text-grey-darken-1 mt-1">
                    {{ formatDate(element.start) }} – {{ formatDate(element.end) }}
                  </div>
                </div>

                <div class="w-32 d-flex align-center justify-center mr-4">
                  <v-btn
                      size="small"
                      variant="text"
                      icon
                      :disabled="(element.nights || 1) <= 1"
                      @click.stop="decNights(element)"
                  >
                    <v-icon icon="mdi-minus" />
                  </v-btn>
                  <v-chip class="mx-1" variant="outlined" size="small">{{ element.nights }}</v-chip>
                  <v-btn size="small" variant="text" icon @click.stop="incNights(element)">
                    <v-icon icon="mdi-plus" />
                  </v-btn>
                </div>

                <div class="w-48 d-none d-md-flex align-center justify-center mr-2">
                  <v-chip v-if="element.transport?.mode" size="small" class="mr-2" variant="tonal">
                    <v-icon start :icon="transportIcon(element.transport.mode)" />
                    {{ prettyMode(element.transport.mode) }}
                  </v-chip>
                  <span v-if="element.transport?.duration" class="text-caption mr-2">
                    {{ element.transport.duration }}
                  </span>
                  <span v-if="element.transport?.distance" class="text-caption">
                    {{ element.transport.distance }}
                  </span>
                </div>

<!--                <v-btn icon variant="text">
                  <v-icon icon="mdi-chevron-down" />
                </v-btn>-->
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <div class="px-2 py-1 d-flex flex-column gap-4">
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
                          <v-list-item-title>{{ prettyMode(item.value) }}</v-list-item-title>
                        </v-list-item>
                      </template>
                    </v-select>

                    <v-text-field
                        v-model="element.transport.duration"
                        label="Duration (e.g., 2h 30m)"
                        class="flex-1"
                        @blur="emitUpdate"
                    />
                    <v-text-field
                        v-model="element.transport.distance"
                        label="Distance (e.g., 231 km)"
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
                  <v-card v-if="element.accommodation" variant="outlined" class="acc-card">
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

                        <div class="mt-2 d-flex align-center">
                          <v-rating
                              v-model="element.accommodation.rating"
                              density="comfortable"
                              size="20"
                              half-increments
                              @update:model-value="emitUpdate"
                          />
                          <span
                              class="text-caption ml-2"
                              v-if="element.accommodation?.rating != null"
                          >
                            {{ Number(element.accommodation.rating).toFixed(1) }}
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
    <div class="px-4 pb-4 d-flex align-center">
      <v-text-field
          v-model="newName"
          placeholder="Add new destination…"
          density="comfortable"
          variant="outlined"
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
          <v-text-field v-model="accForm.address" label="Address (optional)" />
          <v-text-field v-model="accForm.url" label="Booking URL (optional)" prepend-inner-icon="mdi-link-variant" />
          <v-text-field v-model="accForm.image" label="Image URL (optional)" prepend-inner-icon="mdi-image" />
          <div class="d-flex gap-3">
            <v-text-field v-model="accForm.pricePerNight" label="Price per night (optional)" class="flex-1" />
            <div class="flex-1 d-flex align-center">
              <span class="mr-3 text-body-2">Rating</span>
              <v-rating v-model="accForm.rating" half-increments hover size="22" />
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
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import Draggable from 'vuedraggable'
import type { Destination } from './TripView.vue'

/** Props & emits */
const props = defineProps<{ destinations: Destination[] }>()
const emit = defineEmits<{
  (e: 'update:destinations', value: Destination[]): void
  (e: 'geocode-request', index: number, query: string): void
}>()

/** v-model proxy for the prop so Draggable always has a real array */
const itemsModel = computed<Destination[]>({
  get: () => props.destinations ?? [],
  set: (val) => emit('update:destinations', val ?? []),
})

/** Top chip total */
const totalNights = computed(() =>
    itemsModel.value.reduce((sum, d) => sum + (Number(d.nights) || 0), 0)
)

/** Local UI state */
const newName = ref('')

/** Shared helpers */
const placeholderImg =
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop'

const transportModes = ['walk', 'car', 'train', 'plane', 'bus', 'boat']

function emitUpdate() {
  // force a new array reference to notify parent
  itemsModel.value = [...itemsModel.value]
}

/** Nights & date helpers */
function incNights(d: Destination) {
  d.nights = Number(d.nights || 0) + 1
  syncEndFromNights(d)
  emitUpdate()
}
function decNights(d: Destination) {
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
function recomputeNights(d: Destination) {
  if (d.start && d.end) d.nights = dateDiffInNights(d.start, d.end)
  emitUpdate()
}
function syncEndFromNights(d: Destination) {
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
  const d: Destination = {
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
const accDialog = ref<{ open: boolean; model: Destination | null }>({ open: false, model: null })
const accForm = ref({
  name: '',
  address: '',
  url: '',
  image: '',
  pricePerNight: '',
  rating: 0 as number | null,
  notes: '',
})

function openAccDialog(destination: Destination) {
  accDialog.value = { open: true, model: destination }
  const cur: any = destination.accommodation ?? {}
  accForm.value = {
    name: cur.name ?? '',
    address: cur.address ?? '',
    url: cur.url ?? '',
    image: cur.image ?? '',
    pricePerNight: cur.pricePerNight ?? '',
    rating: cur.rating ?? 0,
    notes: cur.notes ?? '',
  }
}
function saveAccommodation() {
  if (!accDialog.value.model) return
  accDialog.value.model.accommodation = { ...accForm.value }
  accDialog.value.open = false
  emitUpdate()
}
function removeAccommodation(destination: Destination) {
  destination.accommodation = null
  emitUpdate()
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
</style>
