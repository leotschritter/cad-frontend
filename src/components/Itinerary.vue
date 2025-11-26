<script lang="ts">
import { defineComponent, ref } from "vue";

import type { ItineraryDto } from "@/api/backend";
import { useItineraryStore } from '@/stores/itinerary.ts'
import { useAuthStore} from '@/stores/auth.ts'
import { useLocationStore } from '@/stores/location.ts'
import ItineraryDetails from '@/components/ItineraryDetails.vue'
import TripView from '@/components/TripView.vue'
import TripViewReadOnly from "@/components/TripViewReadOnly.vue";
import WeatherView from "@/components/WeatherView.vue";
import ItineraryTravelWarnings from '@/components/ItineraryTravelWarnings.vue';
import { getApi } from "@/services/api";

export default defineComponent({
  name: 'Itinerary',
  components: {
    TripViewReadOnly,
    ItineraryDetails,
    TripView,
    WeatherView,
    ItineraryTravelWarnings
  },
  data() {
    return {
      count: 0,
      search: ref(''),
      isCreate: ref(false),
      isDetails: ref(false),
      isEditLocations: ref(false),
      isShowLocations: ref(false),
      isShowWeather: ref(false),
      isShowWarnings: ref(false),
      selected: ref<ItineraryDto | null>(null),
      warningsItinerary: ref<ItineraryDto | null>(null),
      warningsLocations: ref<any[]>([]),
      editingItinerary: ref<ItineraryDto | null>(null),
      weatherItinerary: ref<ItineraryDto | null>(null),
      weatherLocations: ref<any[]>([]),
      valid: ref(false),
      tripViewRef: ref<any>(null),  // Reference to TripView component
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
      locationStore: (null as any),
      likeApi: getApi('LikeManagementApi'),
      likesMap: ref<Record<number, number>>({}),
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
    this.locationStore = useLocationStore();

    this.itineraryStore = useItineraryStore();
    this.itineraryStore.loadItineraries();

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
    async open(action: 'create' | 'showDetails' | 'editLocations' | 'showLocations' | 'showWeather' | 'showWarnings', item?: ItineraryDto) {
      if (action === 'create') {
        this.isCreate = true;
      } else if (action === 'showDetails') {
        this.selected = item || null;
        this.isDetails = true;
      } else if (action === 'editLocations') {
        this.editingItinerary = item || null;
        this.isEditLocations = true;
      } else if (action === 'showLocations') {
        this.editingItinerary = item || null;
        this.isShowLocations = true;
      } else if (action === 'showWeather') {
        this.weatherItinerary = item || null;
        // Load locations for this itinerary
        if (item?.id) {
          try {
            const locations = await this.locationStore.getLocationsForItinerary(item.id);
            console.log('Loaded locations with coordinates:', locations);
            // Locations now have latitude and longitude from the database
            this.weatherLocations = locations;
          } catch (error) {
            console.error('Failed to load locations for weather:', error);
            this.weatherLocations = [];
          }
        }
        this.isShowWeather = true;
      } else if (action === 'showWarnings') {
        this.warningsItinerary = item || null;
        // Load locations for travel warnings
        if (item?.id) {
          try {
            const locations = await this.locationStore.getLocationsForItinerary(item.id);
            console.log('Loaded locations for travel warnings:', locations);
            this.warningsLocations = locations;
          } catch (error) {
            console.error('Failed to load locations for warnings:', error);
            this.warningsLocations = [];
          }
        }
        this.isShowWarnings = true;
      }
    },
    async close(action: 'submit' | 'cancel' | 'closeDetails' | 'submitLocations' | 'cancelLocations' | 'cancelReadonlyLocations' | 'closeWeather' | 'closeWarnings') {
      if (action === 'submit') {
        this.itineraryStore.addNewItinerary(this.newItinerary as ItineraryDto);
        this.clearItinerary();
        this.isCreate = false;
      } else if (action === 'cancel') {
        this.clearItinerary();
        this.isCreate = false;
      } else if (action === 'closeDetails') {
        this.isDetails = false;
        this.selected = null;
      } else if (action === 'submitLocations') {
        // Save all locations to the backend (including pending images)
        const tripView = this.$refs.tripViewRef as any;
        if (tripView && tripView.saveAllLocations) {
          const success = await tripView.saveAllLocations();
          if (success) {
            this.isEditLocations = false;
            this.editingItinerary = null;
          } else {
            alert('Some locations or images failed to save. Please try again.');
          }
        } else {
          console.error('TripView ref not found or saveAllLocations method not available');
          this.isEditLocations = false;
          this.editingItinerary = null;
        }
      } else if (action === 'cancelLocations') {
        this.isEditLocations = false;
        this.editingItinerary = null;
      } else if (action === 'cancelReadonlyLocations') {
        this.isShowLocations = false;
        this.editingItinerary = null;
      } else if (action === 'closeWeather') {
        this.isShowWeather = false;
        this.weatherItinerary = null;
        this.weatherLocations = [];
      } else if (action === 'closeWarnings') {
        this.isShowWarnings = false;
        this.warningsItinerary = null;
        this.warningsLocations = [];
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
    }
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
              <v-btn
                  size="small"
                  variant="text"
                  prepend-icon="mdi-weather-partly-cloudy"
                  @click="open('showWeather', item)"
                  color="blue"
              >
                Show Weather
              </v-btn>
              <v-btn
                  size="small"
                  variant="text"
                  prepend-icon="mdi-alert-circle-outline"
                  @click="open('showWarnings', item)"
                  color="orange"
              >
                Show Warnings
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
                  ref="tripViewRef"
                  :itinerary-id="editingItinerary.id"
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
                  :itinerary-id="editingItinerary?.id"
                  :short-description="editingItinerary?.shortDescription"
                  @cancel="close('cancelLocations')"
              />
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer/>
              <v-btn variant="text" size="large" @click="close('cancelReadonlyLocations')">Cancel</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Weather dialog -->
        <v-dialog v-model="isShowWeather" max-width="95vw" persistent>
          <v-card style="max-height: 90vh;">
            <v-card-title class="text-h6 bg-primary d-flex align-center">
              <v-icon class="mr-2">mdi-weather-partly-cloudy</v-icon>
              Weather Forecast - {{ weatherItinerary?.title || '' }}
              <v-chip v-if="weatherItinerary?.destination" size="small" class="ml-3" variant="tonal">
                {{ weatherItinerary.destination }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-4" style="height: calc(90vh - 140px); overflow-y: auto;">
              <WeatherView
                  v-if="weatherLocations.length > 0"
                  :locations="weatherLocations"
                  :itinerary-title="weatherItinerary?.title || 'Itinerary'"
                  @close="close('closeWeather')"
              />
              <v-alert v-else type="info" variant="tonal" class="ma-4">
                <v-alert-title>No Locations Found</v-alert-title>
                Please add locations to this itinerary first before viewing weather forecasts.
              </v-alert>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer/>
              <v-btn variant="text" size="large" @click="close('closeWeather')">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Travel Warnings dialog -->
        <v-dialog v-model="isShowWarnings" max-width="95vw" persistent scrollable>
          <v-card style="max-height: 90vh;">
            <v-card-title class="text-h6 bg-orange d-flex align-center">
              <v-icon class="mr-2">mdi-alert-circle-outline</v-icon>
              Travel Warnings - {{ warningsItinerary?.title || '' }}
              <v-chip v-if="warningsItinerary?.destination" size="small" class="ml-3" variant="tonal">
                {{ warningsItinerary.destination }}
              </v-chip>
            </v-card-title>
            <v-card-text class="pa-4" style="height: calc(90vh - 140px); overflow-y: auto;">
              <ItineraryTravelWarnings
                  v-if="warningsLocations.length > 0"
                  :locations="warningsLocations"
                  :notifications-enabled="true"
              />
              <v-alert v-else type="info" variant="tonal" class="ma-4">
                <v-alert-title>No Locations Found</v-alert-title>
                Please add locations to this itinerary first before viewing travel warnings.
              </v-alert>
            </v-card-text>
            <v-card-actions class="pa-4">
              <v-spacer/>
              <v-btn variant="text" size="large" @click="close('closeWarnings')">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>
