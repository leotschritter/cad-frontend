<script lang="ts">
import { defineComponent, ref } from "vue";
import type { ItinerarySearchDto, ItinerarySearchResponseDto } from "@/api";
import { getApi } from '@/services/api';
import ItineraryFeed from '@/components/ItineraryFeed.vue';
import ItinerarySearchForm from '@/components/ItinerarySearchForm.vue';

export default defineComponent({
  name: 'ItinerariesSearch',
  components: {
    ItineraryFeed,
    ItinerarySearchForm
  },
  data() {
    return {
      itineraries: [] as ItinerarySearchResponseDto[],
      infoMessage: ref(''),
      errorMessage: ref(''),
      isSearchExpanded: ref(true),
      searchCriteria: {
        title: '',
        destination: '',
        userName: '',
        userEmail: '',
        description: '',
        startDateFrom: null,
        startDateTo: null,
      } as ItinerarySearchDto,
      loading: ref(false),
    }
  },
  methods: {
    async searchItineraries(searchCriteria: ItinerarySearchDto) {
      this.errorMessage = '';
      this.infoMessage = '';

      try {
        const itineraryApi = getApi('ItineraryManagementApi');

        const searchDto: ItinerarySearchDto = {};

        if (searchCriteria.userName?.trim()) {
          searchDto.userName = searchCriteria.userName.trim();
        }
        if (searchCriteria.userEmail?.trim()) {
          searchDto.userEmail = searchCriteria.userEmail.trim();
        }
        if (searchCriteria.title?.trim()) {
          searchDto.title = searchCriteria.title.trim();
        }
        if (searchCriteria.destination?.trim()) {
          searchDto.destination = searchCriteria.destination.trim();
        }
        if (searchCriteria.description?.trim()) {
          searchDto.description = searchCriteria.description.trim();
        }
        if (searchCriteria.startDateFrom) {
          searchDto.startDateFrom = searchCriteria.startDateFrom;
        }
        if (searchCriteria.startDateTo) {
          searchDto.startDateTo = searchCriteria.startDateTo;
        }

        this.loading = true;
        this.itineraries = await itineraryApi.itinerarySearchPost({
          itinerarySearchDto: searchDto
        });
        this.loading = false;

        if (this.itineraries.length === 0) {
          this.infoMessage = 'No itineraries found matching your criteria. Try adjusting your search.';
        } else {
          this.infoMessage = `Found ${this.itineraries.length} ${this.itineraries.length === 1 ? 'itinerary' : 'itineraries'} from other travelers`;
        }

        // Suche automatisch zuklappen nach erfolgreicher Suche
        this.isSearchExpanded = false;
      } catch (error: unknown) {
        console.error('Error searching itineraries:', error);
        this.errorMessage = 'Failed to search itineraries. Please try again.';
        this.itineraries = [];
        this.loading = false;
      }
    },
    clearSearch() {
      this.itineraries = [];
      this.infoMessage = '';
      this.errorMessage = '';
      this.searchCriteria = {
        title: '',
        destination: '',
        userName: '',
        userEmail: '',
        description: '',
        startDateFrom: null,
        startDateTo: null,
      } as ItinerarySearchDto;
    },
    toggleSearch() {
      this.isSearchExpanded = !this.isSearchExpanded;
    }
  }
})
</script>

<template>
  <div class="search-view-container">
    <!-- Fixed Search Form -->
    <div class="search-form-wrapper">
      <!-- Toolbar immer sichtbar -->
      <v-toolbar flat color="primary" dark>
        <v-icon class="ml-2 mr-2">mdi-compass-outline</v-icon>
        <v-toolbar-title>Discover Travel Itineraries</v-toolbar-title>
      </v-toolbar>

      <!-- Collapsible Search Form -->
      <v-expand-transition>
        <div v-show="isSearchExpanded">
          <v-card flat>
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

              <v-row class="mt-2">
                <v-col cols="12" class="d-flex ga-2">
                  <v-btn
                      color="primary"
                      size="large"
                      prepend-icon="mdi-magnify"
                      @click="searchItineraries(searchCriteria)"
                      :loading="loading"
                  >
                    Search
                  </v-btn>
                  <v-btn
                      variant="tonal"
                      size="large"
                      prepend-icon="mdi-refresh"
                      @click="clearSearch"
                  >
                    Clear All
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </div>
      </v-expand-transition>

      <!-- Compact bar mit Filter anpassen Button -->
      <div class="compact-action-bar">
        <v-btn
          @click="toggleSearch"
          :variant="isSearchExpanded ? 'text' : 'outlined'"
          color="primary"
          :prepend-icon="isSearchExpanded ? 'mdi-chevron-up' : 'mdi-tune'"
          size="small"
        >
          {{ isSearchExpanded ? 'Hide Filters' : 'Adjust Filters' }}
        </v-btn>
      </div>
    </div>

    <!-- Scrollable Content -->
    <div class="search-results-wrapper">
      <!-- Messages -->
      <v-container>
        <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>

        <v-alert
            v-if="infoMessage && itineraries.length > 0"
            type="info"
            variant="tonal"
            class="mb-4"
            icon="mdi-information"
        >
          {{ infoMessage }}
        </v-alert>
      </v-container>

      <!-- Feed Component -->
      <ItineraryFeed :itineraries="itineraries" />
    </div>
  </div>
</template>

<style scoped>
.search-view-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.search-form-wrapper {
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.search-toggle-bar {
  padding: 8px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-results-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.compact-action-bar {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
