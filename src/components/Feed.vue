<script lang="ts">
import { defineComponent } from "vue";
import type { ItinerarySearchResponseDto } from "@/api/backend";
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
      loading: false,
      itineraries: [] as ItinerarySearchResponseDto[],
      infoMessage: '',
      errorMessage: '',
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

        // Fetch personalized feed recommendations
        try {
          const response = await feedApi.feedGetRaw();
          const jsonValue = await response.raw.json();

          console.log('Feed API raw response:', jsonValue);

          // Handle different response structures
          if (Array.isArray(jsonValue)) {
            // Direct array response - already full itinerary objects
            this.itineraries = jsonValue;
            console.log('Parsed itineraries from array:', this.itineraries);
          } else if (jsonValue && Array.isArray(jsonValue.items)) {
            // Object with items array (paginated response) - already full itinerary objects
            this.itineraries = jsonValue.items;
            console.log('Parsed itineraries from items:', this.itineraries);
          } else {
            console.warn('Feed API returned unexpected response format:', jsonValue);
            this.itineraries = [];
          }
        } catch (feedError: any) {
          console.error('Error fetching feed:', feedError);
          // If the service returns error, show appropriate message
          this.infoMessage = 'No recommendations available at the moment. The recommendation service may be unavailable or you may need to add some visited/planned destinations first.';
          this.itineraries = [];
          return;
        }

        if (!this.itineraries || this.itineraries.length === 0) {
          console.log('No itineraries found in feed');
          this.infoMessage = 'No recommendations available at the moment. Check back later for personalized travel inspiration!';
          this.itineraries = [];
          return;
        }

        console.log('Loaded', this.itineraries.length, 'itineraries from feed');
        this.infoMessage = `Showing ${this.itineraries.length} personalized recommendation${this.itineraries.length === 1 ? '' : 's'}`;
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

