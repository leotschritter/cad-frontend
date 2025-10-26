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

        this.itineraries = await itineraryApi.itinerarySearchPost({
          itinerarySearchDto: searchDto
        });

        if (this.itineraries.length === 0) {
          this.infoMessage = 'No itineraries found matching your criteria. Try adjusting your search.';
        } else {
          this.infoMessage = `Found ${this.itineraries.length} ${this.itineraries.length === 1 ? 'itinerary' : 'itineraries'} from other travelers`;
        }
      } catch (error: unknown) {
        console.error('Error searching itineraries:', error);
        this.errorMessage = 'Failed to search itineraries. Please try again.';
        this.itineraries = [];
      }
    },
    clearSearch() {
      this.itineraries = [];
      this.infoMessage = '';
      this.errorMessage = '';
    }
  }
})
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- Search Form Component -->
    <ItinerarySearchForm
      @search="searchItineraries"
      @clear="clearSearch"
    />

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
  </v-container>
</template>

<style scoped>
.search-panel {
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
