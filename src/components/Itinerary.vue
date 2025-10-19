<script lang="ts">
import { defineComponent, ref } from "vue";

import type { ItineraryDto } from "@/api";
import { useItineraryStore } from '@/stores/itinerary.ts'
import { useAuthStore} from '@/stores/auth.ts'
import ItineraryDetails from '@/components/ItineraryDetails.vue'

export default defineComponent({
  name: 'Itinerary',
  components: {
    ItineraryDetails
  },
  data() {
    return {
      count: 0,
      search: ref(''),
      isCreate: ref(false),
      isDetails: ref(false),
      selected: ref<ItineraryDto | null>(null),
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
        {title: 'Actions', key: 'actions', sortable: false, align: 'end' as const},
      ],
      itineraryStore: (null as any),
      authStore: (null as any),
    }
  },
  computed: {
    itemsFromStore() {
      return this.itineraryStore.itineraries;
    }
  },
  created() {
    this.authStore = useAuthStore();

    this.itineraryStore = useItineraryStore();
    this.itineraryStore.loadItineraries(this.authStore.user.email);
  },
  methods: {
    open(action: 'create' | 'showDetails', item?: ItineraryDto) {
      if (action === 'create') {
        this.isCreate = true;
      } else if (action === 'showDetails') {
        this.selected = item || null;
        this.isDetails = true;
      }
    },
    close(action: 'submit' | 'cancel' | 'closeDetails') {
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
            <template #item.actions="{ item }">
              <v-btn
                  size="small"
                  variant="text"
                  prepend-icon="mdi-eye"
                  @click="open('showDetails', item)"
              >
                Details
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
            <v-card-title class="text-h6">Create Itinerary</v-card-title>
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
      </v-col>
    </v-row>
  </v-container>
</template>
