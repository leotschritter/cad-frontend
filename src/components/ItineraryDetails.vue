<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { ItineraryDto, ItinerarySearchResponseDto } from "@/api/backend";

export default defineComponent({
  name: 'ItineraryDetails',
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    itinerary: {
      type: Object as PropType<ItineraryDto | ItinerarySearchResponseDto | null>,
      default: null
    },
    showUserName: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'close'],
  computed: {
    isOpen: {
      get(): boolean {
        return this.modelValue;
      },
      set(value: boolean) {
        this.$emit('update:modelValue', value);
        if (!value) {
          this.$emit('close');
        }
      }
    },
    userName(): string | undefined {
      if (this.showUserName && this.itinerary && 'userName' in this.itinerary) {
        return this.itinerary.userName;
      }
      return undefined;
    }
  },
  methods: {
    onDialogChange(value: boolean) {
      if (!value) {
        this.$emit('close');
      }
    },
    closeDialog() {
      this.$emit('close');
      this.$emit('update:modelValue', false);
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
  <v-dialog v-model="isOpen" max-width="600">
    <v-card>
      <v-card-title class="text-h6 bg-primary">
        <v-icon class="mr-2">mdi-map-marker</v-icon>
        Itinerary Details
      </v-card-title>
      <v-card-text v-if="itinerary" class="pt-4">
        <v-list lines="two">
          <v-list-item v-if="showUserName && userName">
            <template #prepend>
              <v-icon>mdi-account</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">Created by</v-list-item-title>
            <v-list-item-subtitle>{{ userName }}</v-list-item-subtitle>
          </v-list-item>

          <v-divider v-if="showUserName && userName" class="my-2" />

          <v-list-item>
            <template #prepend>
              <v-icon>mdi-format-title</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">Title</v-list-item-title>
            <v-list-item-subtitle>{{ itinerary.title }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-icon>mdi-map-marker</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">Destination</v-list-item-title>
            <v-list-item-subtitle>{{ itinerary.destination }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-icon>mdi-calendar</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">Start date</v-list-item-title>
            <v-list-item-subtitle>{{ fmtDate(itinerary.startDate) }}</v-list-item-subtitle>
          </v-list-item>

          <v-divider class="my-2" />

          <v-list-item>
            <template #prepend>
              <v-icon>mdi-text-short</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">Short description</v-list-item-title>
            <v-list-item-subtitle class="text-wrap">{{ itinerary.shortDescription }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-icon>mdi-text-long</v-icon>
            </template>
            <v-list-item-title class="font-weight-bold">Detailed description</v-list-item-title>
            <v-list-item-subtitle class="text-wrap">{{ itinerary.detailedDescription }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
            color="primary"
            variant="text"
            @click="closeDialog"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.text-wrap {
  white-space: normal;
  word-wrap: break-word;
}
</style>
