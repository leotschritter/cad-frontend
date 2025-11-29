<script lang="ts">
import { defineComponent, ref } from "vue";
import type { ItinerarySearchResponseDto } from "@/api/backend";
import type { ItineraryEventDTO } from "@/api/recommendation-service";
import { ItineraryEventDTOFromJSON } from "@/api/recommendation-service/models";
import { getApi } from '@/services/api';
import ItineraryFeed from '@/components/ItineraryFeed.vue';
import { useAuthStore } from "@/stores/auth.ts";

export default defineComponent({
  name: 'Feed',
  components: {
    ItineraryFeed
  },
  data() {
    return {
      loading: ref(false),
      itineraries: [] as ItinerarySearchResponseDto[],
      infoMessage: ref(''),
      errorMessage: ref(''),
      authStore: useAuthStore(),
    }
  },
  async created() {
    await this.loadFeed();
  },
  methods: {
    async loadFeed() {
      this.loading = true;
      this.errorMessage = '';
      this.infoMessage = '';

      try {
        const feedApi = getApi('FeedApi');
        const itineraryApi = getApi('ItineraryManagementApi');

        // Fetch personalized feed recommendations
        let recommendations: ItineraryEventDTO[] = [];
        try {
          const response = await feedApi.feedGetRaw();
          const jsonValue = await response.raw.json();
          
          // Handle case where response might not be an array
          if (Array.isArray(jsonValue)) {
            recommendations = jsonValue.map((item: any) => ItineraryEventDTOFromJSON(item));
          } else {
            console.warn('Feed API returned non-array response:', jsonValue);
            recommendations = [];
          }
        } catch (feedError: any) {
          console.error('Error fetching feed:', feedError);
          // If the service returns error, show appropriate message
          this.infoMessage = 'No recommendations available at the moment. The recommendation service may be unavailable or you may need to add some visited/planned destinations first.';
          this.itineraries = [];
          return;
        }

        if (!recommendations || recommendations.length === 0) {
          this.infoMessage = 'No recommendations available at the moment. Check back later for personalized travel inspiration!';
          this.itineraries = [];
          return;
        }

        // Get all available itineraries to match with recommendations
        // Using empty search to get all public itineraries
        const allItineraries = await itineraryApi.itinerarySearchPost({
          itinerarySearchDto: {}
        });

        // Create a map of itinerary IDs to full itinerary details
        const itineraryMap = new Map<number, ItinerarySearchResponseDto>();
        allItineraries.forEach(it => {
          if (it.id) {
            itineraryMap.set(it.id, it);
          }
        });

        // Match recommendations with full itinerary details
        const matchedItineraries: ItinerarySearchResponseDto[] = [];

        // Process recommendations in order to maintain relevance ranking
        for (const rec of recommendations) {
          if (!rec.itineraryId) continue;

          const fullItinerary = itineraryMap.get(rec.itineraryId);
          if (fullItinerary) {
            matchedItineraries.push(fullItinerary);
          } else {
            // Fallback: create basic itinerary from recommendation data
            matchedItineraries.push({
              id: rec.itineraryId,
              title: rec.title || 'Untitled Itinerary',
              destination: rec.locationNames?.[0] || 'Unknown Destination',
              shortDescription: rec.description || '',
              detailedDescription: rec.description || '',
              userName: 'Unknown',
              userEmail: '',
            } as ItinerarySearchResponseDto);
          }
        }

        this.itineraries = matchedItineraries;

        if (this.itineraries.length === 0) {
          this.infoMessage = 'No recommendations available at the moment. Check back later for personalized travel inspiration!';
        } else {
          this.infoMessage = `Showing ${this.itineraries.length} personalized recommendation${this.itineraries.length === 1 ? '' : 's'}`;
        }
      } catch (error: unknown) {
        console.error('Error loading feed:', error);
        this.errorMessage = 'Failed to load personalized feed. Please try again.';
        this.itineraries = [];
      } finally {
        this.loading = false;
      }
    },
  }
})
</script>

<template>
  <v-card>
    <v-toolbar flat color="primary" dark>
      <v-icon class="ml-2 mr-2">mdi-rss</v-icon>
      <v-toolbar-title>Personalized Feed</v-toolbar-title>
    </v-toolbar>

    <v-card-text class="pt-6">
      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <div class="mt-4 text-body-1">Loading personalized recommendations...</div>
      </div>

      <!-- Error Message -->
      <v-alert
        v-if="errorMessage && !loading"
        type="error"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>

      <!-- Info Message -->
      <v-alert
        v-if="infoMessage && !loading && !errorMessage"
        type="info"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="infoMessage = ''"
      >
        {{ infoMessage }}
      </v-alert>

      <!-- Feed Content -->
      <div v-if="!loading">
        <ItineraryFeed :itineraries="itineraries" />
      </div>
    </v-card-text>
  </v-card>
</template>

