<script lang="ts">
import { defineComponent, ref } from "vue";

import type { ItineraryDto } from "@/api";
import { useItineraryStore } from '@/stores/itinerary.ts'

export default defineComponent({
  name: 'Itinerary',
  components: {},
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
    }
  },
  computed: {
    itemsFromStore() {
      return this.itineraryStore.itineraries;
    }
  },
  created() {

    this.itineraryStore = useItineraryStore();
    this.itineraryStore.loadItineraries();
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
        this.isCreate = false;
      } else if (action === 'cancel') {
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
    openReadmeInEditor() {
      // userStore.userRegister()
    },
  }
})
</script>

<template>
  <v-card>
    <v-toolbar flat>
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
      <v-btn color="primary" class="ml-2" prepend-icon="mdi-plus" @click="open('create')">
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
  <v-dialog v-model="isDetails" max-width="520">
    <v-card>
      <v-card-title class="text-h6">Itinerary details</v-card-title>
      <v-card-text v-if="selected">
        <v-list lines="one">
          <v-list-item title="Title" :subtitle="selected.title"/>
          <v-list-item title="Destination" :subtitle="selected.destination"/>
          <v-list-item title="Start date of the trip" :subtitle="selected.startDate?.toString() ?? ''"/>
          <v-list-item title="Short description of the trip" :subtitle="selected.shortDescription"/>
          <v-list-item title="Detail description of the trip" :subtitle="selected.detailedDescription"/>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer/>
        <v-btn variant="text" @click="close('closeDetails')">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
</template>
