<script lang="ts">
import { defineComponent, ref } from "vue";

import type { ItineraryDto } from "@/api";
import { useItineraryStore } from '@/stores/itinerary.ts'
import { useAuthStore} from '@/stores/auth.ts'
import ItineraryDetails from '@/components/ItineraryDetails.vue'
import TripView, { type Locations } from '@/components/TripView.vue'
import TripViewReadOnly from "@/components/TripViewReadOnly.vue";
import { getApi } from "@/services/api";

export default defineComponent({
  name: 'Itinerary',
  components: {
    TripViewReadOnly,
    ItineraryDetails,
    TripView
  },
  data() {
    return {
      count: 0,
      search: ref(''),
      isCreate: ref(false),
      isDetails: ref(false),
      isEditLocations: ref(false),
      isShowLocations: ref(false),
      selected: ref<ItineraryDto | null>(null),
      editingItinerary: ref<ItineraryDto | null>(null),
      valid: ref(false),
      newItinerary: {
        title: '',
        destination: '',
        startDate: null as Date | null,
        shortDescription: '',
        detailedDescription: '',
      },
      headers: [
        {title: 'Title', key: 'title'},
        {title: 'Destination', key: 'destination'},
        {title: 'Start date of the trip', key: 'startDate'},
        {title: 'Likes', key: 'likes', align: 'center' as const},
        {title: 'Actions', key: 'actions', sortable: false, align: 'end' as const},
      ],
      itineraryStore: (null as any),
      authStore: (null as any),
      likeApi: getApi('LikeManagementApi'),
      likesMap: ref<Record<number, number>>({}),
      locations: ref<Locations[]>([
        { id: 1, name: 'Milano',  start: '2025-06-02', end: '2025-06-05', nights: 2, lat: 45.4642, lng: 9.19,    address: 'Milan, Italy',   transport: { mode: null,   duration: '2h 27m', distance: null }, accommodation: null },
        { id: 2, name: 'Venice',  start: '2025-06-05', end: '2025-06-08', nights: 3, lat: 45.4408, lng: 12.3155, address: 'Venezia, Italy', transport: { mode: 'train', duration: '2h 13m', distance: null }, accommodation: { name: 'Canal View Boutique', rating: 4.5, pricePerNight: '€180' } },
        { id: 3, name: 'Florence',start: '2025-06-08', end: '2025-06-12', nights: 3, lat: 43.7696, lng: 11.2558, address: 'Firenze, Italy',  transport: { mode: 'car',   duration: null,    distance: '231 km' }, accommodation: null },
        { id: 4, name: 'Rome',    start: '2025-06-12', end: '2025-06-16', nights: 4, lat: 41.9028, lng: 12.4964, address: 'Roma, Italy',     transport: { mode: 'train', duration: null,    distance: null },    accommodation: null },
      ])
    }
  },
  computed: {
    itemsFromStore() {
      return this.itineraryStore.itineraries.map((item: ItineraryDto) => ({
        ...item,
        likes: this.likesMap[item.id || 0] || 0
      }));
    }
  },
  created() {
    this.authStore = useAuthStore();

    this.itineraryStore = useItineraryStore();
    this.itineraryStore.loadItineraries(this.authStore.user.email);
  },
  watch: {
    'itineraryStore.itineraries': {
      handler() {
        this.loadLikesForAllItineraries();
      }
    }
  },
  methods: {
    async loadLikesForAllItineraries() {
      if (!this.itineraryStore || !this.itineraryStore.itineraries) {
        return;
      }

      const itineraries = this.itineraryStore.itineraries;

      for (const itinerary of itineraries) {
        if (itinerary.id) {
          try {
            const likeResponse = await this.likeApi.likeItineraryItineraryIdGet({
              itineraryId: itinerary.id
            });
            this.likesMap[itinerary.id] = likeResponse.likeCount || 0;
          } catch (err) {
            console.error(`Failed to load likes for itinerary ${itinerary.id}:`, err);
            this.likesMap[itinerary.id] = 0;
          }
        }
      }
    },
    open(action: 'create' | 'showDetails' | 'editLocations' | 'showLocations', item?: ItineraryDto) {
      if (action === 'create') {
        this.isCreate = true;
      } else if (action === 'showDetails') {
        this.selected = item || null;
        this.isDetails = true;
      } else if (action === 'editLocations') {
        this.editingItinerary = item || null;
        this.isEditLocations = true;
      } else if (action === 'showLocations') {
        this.isShowLocations = true;
      }
    },
    close(action: 'submit' | 'cancel' | 'closeDetails' | 'submitLocations' | 'cancelLocations' | 'cancelReadonlyLocations') {
      if (action === 'submit') {
        this.itineraryStore.addNewItinerary(this.authStore.user.email, this.newItinerary as ItineraryDto);
        this.clearItinerary();
        this.isCreate = false;
      } else if (action === 'cancel') {
        this.clearItinerary();
        this.isCreate = false;
      } else if (action === 'closeDetails') {
        this.isDetails = false;
        this.selected = null;
      } else if (action === 'submitLocations') {
        // Handle saving the locations data here
        // You can update the itinerary in the store
        this.isEditLocations = false;
        this.editingItinerary = null;
      } else if (action === 'cancelLocations') {
        this.isEditLocations = false;
        this.editingItinerary = null;
      } else if (action === 'cancelReadonlyLocations') {
        this.isShowLocations = false;
      }
    },
    clearItinerary() {
      this.newItinerary = {
        title: '',
        destination: '',
        startDate: null,
        shortDescription: '',
        detailedDescription: '',
      };
    },
    fmtDate(d: string | Date | null | undefined): string {
      if (!d) return ''
      const date = d instanceof Date ? d : new Date(d)
      if (isNaN(date.getTime())) return ''
      return new Intl.DateTimeFormat(
          navigator.language || 'de-DE',
          { dateStyle: 'short' }
      ).format(date)
    },
  }
})
</script>

<template>
  <v-container class="py-8" fluid>
    <v-row justify="center">
      <v-col cols="12" sm="10" lg="8">
        <v-card>
          <v-toolbar flat color="primary" dark>
            <v-icon class="ml-2 mr-2">mdi-map-search</v-icon>
            <v-toolbar-title>Itineraries</v-toolbar-title>
            <v-spacer/>
            <v-text-field
                v-model="search"
                density="compact"
                variant="outlined"
                placeholder="Search"
                prepend-inner-icon="mdi-magnify"
                hide-details
                style="max-width: 260px"
            />
            <v-btn color="white" variant="text" class="ml-2" prepend-icon="mdi-plus" @click="open('create')">
              Create
            </v-btn>
          </v-toolbar>

          <v-data-table
              :headers="headers"
              :items="itemsFromStore"
              :search="search"
              density="comfortable"
              item-key="id"
          >
            <template #item.startDate="{ item }">
              {{ fmtDate(item.startDate) }}
            </template>
            <template #item.likes="{ item }">
              <v-chip
                size="small"
                :color="(item.likes ?? 0) > 0 ? 'pink' : 'grey-lighten-2'"
                prepend-icon="mdi-heart"
              >
                {{ item.likes || 0 }}
              </v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn
                  size="small"
                  variant="text"
                  prepend-icon="mdi-eye"
                  @click="open('showDetails', item)"
              >
                Details
              </v-btn>
              <v-btn
                  size="small"
                  variant="text"
                  prepend-icon="mdi-map-marker-path"
                  @click="open('editLocations', item)"
              >
                Edit Locations
              </v-btn>
              <v-btn
                  size="small"
                  variant="text"
                  prepend-icon="mdi-eye"
                  @click="open('showLocations', item)"
              >
                Show Locations
              </v-btn>
            </template>
          </v-data-table>
        </v-card>

        <!-- Details dialog -->
        <ItineraryDetails
            v-model="isDetails"
            :itinerary="selected"
            @close="close('closeDetails')"
        />

        <!-- Create dialog -->
        <v-dialog v-model="isCreate" max-width="520">
          <v-card>
            <v-card-title class="text-h6 bg-primary">
              <v-icon class="mr-2">mdi-plus-box</v-icon>
              Create Itinerary
            </v-card-title>
            <v-card-text>
              <v-form v-model="valid" @submit.prevent="close('submit')">
                <v-text-field
                    v-model="newItinerary.title"
                    label="Title"
                    :rules="[v => !!v || 'Required']"
                    required
                />
                <v-text-field
                    v-model="newItinerary.destination"
                    label="Destination"
                    :rules="[v => !!v || 'Required']"
                    required
                />
                <v-date-input
                    v-model="newItinerary.startDate"
                    label="Start date of the trip"
                    :rules="[v => !!v || 'Required']"
                    required
                />
                <v-text-field
                    v-model="newItinerary.shortDescription"
                    label="Short description of the trip"
                    :rules="[v => !!v || 'Required']"
                    required
                />
                <v-textarea
                    v-model="newItinerary.detailedDescription"
                    label="Detail description of the trip"
                    :rules="[v => !!v || 'Required']"
                    required
                />
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer/>
              <v-btn variant="text" @click="close('cancel')">Cancel</v-btn>
              <v-btn color="primary" :disabled="!valid" @click="close('submit')">Create</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Edit Locations dialog -->
        <v-dialog v-model="isEditLocations" max-width="90vw" persistent>
          <v-card style="max-height: 90vh;">
            <v-card-title class="text-h6 bg-primary d-flex align-center">
              <v-icon class="mr-2">mdi-map-marker-path</v-icon>
              Edit Locations - {{ editingItinerary?.title || '' }}
              <v-chip v-if="editingItinerary?.destination" size="small" class="ml-3" variant="tonal">
                {{ editingItinerary.destination }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-4" style="height: calc(90vh - 140px); overflow-y: auto;">
              <TripView
                  v-if="editingItinerary"
                  :short-description="editingItinerary.shortDescription"
                  @submit="close('submitLocations')"
                  @cancel="close('cancelLocations')"
              />
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer/>
              <v-btn variant="text" size="large" @click="close('cancelLocations')">Cancel</v-btn>
              <v-btn color="primary" variant="flat" size="large" @click="close('submitLocations')">Save Changes</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
        <!-- Edit Locations dialog -->
        <v-dialog v-model="isShowLocations" max-width="90vw" persistent>
          <v-card style="max-height: 90vh;">
            <v-card-title class="text-h6 bg-primary d-flex align-center">
              <v-icon class="mr-2">mdi-map-marker-path</v-icon>
              Show Locations - {{ editingItinerary?.title || '' }}
              <v-chip v-if="editingItinerary?.destination" size="small" class="ml-3" variant="tonal">
                {{ editingItinerary.destination }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-4" style="height: calc(90vh - 140px); overflow-y: auto;">
              <TripViewReadOnly
                  :locations="locations"
                  @cancel="close('cancelLocations')"
              />
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer/>
              <v-btn variant="text" size="large" @click="close('cancelReadonlyLocations')">Cancel</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>
