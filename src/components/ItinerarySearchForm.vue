<script lang="ts">
import { defineComponent, ref } from "vue";
import type { ItinerarySearchDto } from "@/api";

export default defineComponent({
  name: 'ItinerarySearchForm',
  props: {
    compactMode: {
      type: Boolean,
      default: false
    },
    showActionButtons: {
      type: Boolean,
      default: true
    }
  },
  emits: ['search', 'clear'],
  data() {
    return {
      loading: ref(false),
      searchCriteria: {
        userName: '',
        userEmail: '',
        title: '',
        destination: '',
        description: '',
        startDateFrom: null as Date | null,
        startDateTo: null as Date | null,
      } as ItinerarySearchDto,
    }
  },
  methods: {
    handleSearch() {
      this.loading = true;
      this.$emit('search', this.searchCriteria);
      // Loading wird vom Parent zurückgesetzt
      setTimeout(() => {
        this.loading = false;
      }, 500);
    },
    handleClear() {
      this.searchCriteria = {
        userName: '',
        userEmail: '',
        title: '',
        destination: '',
        description: '',
        startDateFrom: undefined,
        startDateTo: undefined,
      };
      this.$emit('clear');
    }
  }
})
</script>

<template>
  <!-- Compact Mode: nur Buttons -->
  <div v-if="compactMode" class="compact-buttons">
    <!-- Keine Buttons im Compact Mode -->
  </div>

  <!-- Full Mode: komplettes Formular -->
  <v-card v-else flat class="search-panel">
    <v-toolbar flat color="primary" dark>
      <v-icon class="ml-2 mr-2">mdi-compass-outline</v-icon>
      <v-toolbar-title>Discover Travel Itineraries</v-toolbar-title>
    </v-toolbar>

    <v-card-text class="pt-6">
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
              v-model="searchCriteria.title"
              label="Trip Title"
              placeholder="e.g., Summer Adventure..."
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-text"
              clearable
              hide-details
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
              v-model="searchCriteria.destination"
              label="Destination"
              placeholder="e.g., Paris, Tokyo, New York..."
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-map-marker"
              clearable
              hide-details
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
              v-model="searchCriteria.userName"
              label="Traveler Name"
              placeholder="Search by traveler..."
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account"
              clearable
              hide-details
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
              v-model="searchCriteria.userEmail"
              label="User Email"
              placeholder="e.g., user@example.com"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-email"
              clearable
              hide-details
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-date-input
              v-model="searchCriteria.startDateFrom"
              label="Start date from"
              prepend-icon="mdi-calendar-start"
              clearable
              hide-details
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-date-input
              v-model="searchCriteria.startDateTo"
              label="Start date to"
              prepend-icon="mdi-calendar-end"
              clearable
              hide-details
          />
        </v-col>

        <v-col cols="12">
          <v-text-field
              v-model="searchCriteria.description"
              label="Description"
              placeholder="e.g., beach, museum, culture..."
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-text-long"
              clearable
              hide-details
          />
        </v-col>
      </v-row>

      <!-- Buttons entfernt -->
    </v-card-text>
  </v-card>
</template>

<style scoped>
.search-panel {
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.compact-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
