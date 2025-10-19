<script lang="ts">
import { defineComponent, ref } from "vue";
import type { ItinerarySearchDto, ItinerarySearchResponseDto } from "@/api";
import { getApi } from '@/services/api';
import ItineraryDetails from '@/components/ItineraryDetails.vue';

export default defineComponent({
  name: 'SearchItineraries',
  components: {
    ItineraryDetails
  },
  data() {
    return {
      loading: ref(false),
      itineraries: [] as ItinerarySearchResponseDto[],
      selected: ref<ItinerarySearchResponseDto | null>(null),
      isDetails: ref(false),
      infoMessage: ref(''),
      errorMessage: ref(''),
      // Suchkriterien basierend auf ItinerarySearchDto
      searchCriteria: {
        userName: '',
        userEmail: '',
        title: '',
        destination: '',
        description: '',
        startDateFrom: null as Date | null,
        startDateTo: null as Date | null,
      } as ItinerarySearchDto,
      headers: [
        {title: 'Title', key: 'title'},
        {title: 'Destination', key: 'destination'},
        {title: 'Start Date', key: 'startDate'},
        {title: 'User', key: 'userName'},
        {title: 'Short Description', key: 'shortDescription'},
        {title: 'Actions', key: 'actions', sortable: false, align: 'end' as const},
      ],
    }
  },
  methods: {
    async searchItineraries() {
      this.loading = true;
      this.errorMessage = '';
      this.infoMessage = '';

      try {
        const itineraryApi = getApi('ItineraryManagementApi');

        const searchDto: ItinerarySearchDto = {};

        if (this.searchCriteria.userName?.trim()) {
          searchDto.userName = this.searchCriteria.userName.trim();
        }
        if (this.searchCriteria.userEmail?.trim()) {
          searchDto.userEmail = this.searchCriteria.userEmail.trim();
        }
        if (this.searchCriteria.title?.trim()) {
          searchDto.title = this.searchCriteria.title.trim();
        }
        if (this.searchCriteria.destination?.trim()) {
          searchDto.destination = this.searchCriteria.destination.trim();
        }
        if (this.searchCriteria.description?.trim()) {
          searchDto.description = this.searchCriteria.description.trim();
        }
        if (this.searchCriteria.startDateFrom) {
          searchDto.startDateFrom = this.searchCriteria.startDateFrom;
        }
        if (this.searchCriteria.startDateTo) {
          searchDto.startDateTo = this.searchCriteria.startDateTo;
        }

        this.itineraries = await itineraryApi.itinerarySearchPost({
          itinerarySearchDto: searchDto
        });

        if (this.itineraries.length === 0) {
          this.infoMessage = 'No itineraries found matching your criteria. Try adjusting your search.';
        } else {
          this.infoMessage = `Found ${this.itineraries.length} itinerary/itineraries matching your search.`;
        }
      } catch (error: unknown) {
        console.error('Error searching itineraries:', error);
        this.errorMessage = 'Failed to search itineraries. Please try again.';
        this.itineraries = [];
      } finally {
        this.loading = false;
      }
    },
    clearSearch() {
      this.searchCriteria = {
        userName: '',
        userEmail: '',
        title: '',
        destination: '',
        description: '',
        startDateFrom: undefined,
        startDateTo: undefined,
      };
      this.itineraries = [];
      this.infoMessage = '';
      this.errorMessage = '';
    },
    openDetails(item: ItinerarySearchResponseDto) {
      this.selected = item;
      this.isDetails = true;
    },
    closeDetails() {
      this.isDetails = false;
      this.selected = null;
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
  <v-card>
    <v-toolbar flat color="primary" dark>
      <v-icon class="ml-2 mr-2">mdi-magnify</v-icon>
      <v-toolbar-title>Search Itineraries</v-toolbar-title>
    </v-toolbar>

    <v-card-text class="pt-6">
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
              v-model="searchCriteria.userName"
              label="User Name"
              placeholder="e.g., John Doe"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-account"
              clearable
              hint="Search by user name"
              persistent-hint
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
              hint="Search by user email"
              persistent-hint
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
              v-model="searchCriteria.title"
              label="Title"
              placeholder="e.g., Summer in Paris"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-format-title"
              clearable
              hint="Search by itinerary title"
              persistent-hint
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
              v-model="searchCriteria.destination"
              label="Destination"
              placeholder="e.g., Paris, France"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-map-marker"
              clearable
              hint="Search by destination"
              persistent-hint
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-date-input
              v-model="searchCriteria.startDateFrom"
              label="Start date from"
              prepend-icon="mdi-calendar-start"
              clearable
              hint="Search from this date (optional)"
              persistent-hint
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-date-input
              v-model="searchCriteria.startDateTo"
              label="Start date to"
              prepend-icon="mdi-calendar-end"
              clearable
              hint="Search until this date (optional)"
              persistent-hint
          />
        </v-col>

        <v-col cols="12">
          <v-text-field
              v-model="searchCriteria.description"
              label="Description"
              placeholder="e.g., beach, museum, culture"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-text"
              clearable
              hint="Search in description (short or detailed)"
              persistent-hint
          />
        </v-col>
      </v-row>

      <v-row class="mt-2">
        <v-col cols="12" class="d-flex gap-2">
          <v-btn
              color="primary"
              size="large"
              prepend-icon="mdi-magnify"
              @click="searchItineraries"
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

      <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mt-4"
          closable
          @click:close="errorMessage = ''"
      >
        {{ errorMessage }}
      </v-alert>

      <v-alert
          v-if="infoMessage"
          type="success"
          variant="tonal"
          class="mt-4"
      >
        {{ infoMessage }}
      </v-alert>
    </v-card-text>

    <v-divider v-if="itineraries.length > 0" />

    <v-card-text v-if="itineraries.length > 0" class="pt-4">
      <v-data-table
          :headers="headers"
          :items="itineraries"
          density="comfortable"
          item-key="title"
          :items-per-page="10"
      >
        <template v-slot:[`item.startDate`]="{ item }">
          {{ fmtDate(item.startDate) }}
        </template>
        <template v-slot:[`item.shortDescription`]="{ item }">
          <span class="text-truncate" style="max-width: 300px; display: inline-block;">
            {{ item.shortDescription }}
          </span>
        </template>
        <template v-slot:[`item.actions`]="{ item }">
          <v-btn
              size="small"
              variant="text"
              prepend-icon="mdi-eye"
              @click="openDetails(item)"
          >
            Details
          </v-btn>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>

  <ItineraryDetails
      v-model="isDetails"
      :itinerary="selected"
      :show-user-name="true"
      @close="closeDetails"
  />
</template>

<style scoped>
.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

