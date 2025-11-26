import { defineStore } from 'pinia'
import type { ItineraryDto } from '@/api/backend'
import { getApi } from '@/services/api'
import { useUserTripsStore } from '@/stores/userTrips'
import { useLocationStore } from '@/stores/location'

export const useItineraryStore = defineStore('itinerary', {
  state: () => ({
    itineraries: [] as ItineraryDto[],
    selected: null as ItineraryDto | null,
    // Track which itineraries have travel warnings enabled (stored in localStorage)
    travelWarningsEnabled: new Map<number, boolean>()
  }),

  getters: {
    isTravelWarningsEnabled: (state) => (itineraryId: number) => {
      return state.travelWarningsEnabled.get(itineraryId) || false
    }
  },

  actions: {
    async loadItineraries() {
      const itineraryApi = getApi('ItineraryManagementApi')
      try {
        this.itineraries = await itineraryApi.itineraryGetGet()
        // Load travel warnings preferences from localStorage
        this.loadTravelWarningsPreferences()
      } catch (error) {
        console.error('Failed to load itineraries:', error)
      }
    },

    async addNewItinerary(itineraryDto: ItineraryDto) {
      const itineraryApi = getApi('ItineraryManagementApi')
      try {
         await itineraryApi.itineraryCreatePost({ itineraryDto: itineraryDto })
         // Reload all itineraries to get the newly created one with its backend-assigned ID
         await this.loadItineraries()
       } catch (error) {
         console.error('Failed to add itinerary:', error)
       }
    },

    /**
     * Enable or disable travel warnings for an itinerary
     * This will sync all locations to the travel warnings service
     */
    async toggleTravelWarnings(itineraryId: number, enabled: boolean) {
      try {
        console.log(`[Itinerary] ===== TOGGLE TRAVEL WARNINGS =====`)
        console.log(`[Itinerary] ${enabled ? 'Enabling' : 'Disabling'} travel warnings for itinerary ${itineraryId}`)

        const userTripsStore = useUserTripsStore()
        const locationStore = useLocationStore()

        if (enabled) {
          // Load locations for this itinerary
          console.log(`[Itinerary] Loading locations for itinerary ${itineraryId}...`)
          const locations = await locationStore.getLocationsForItinerary(itineraryId)
          console.log(`[Itinerary] Loaded ${locations.length} locations:`, locations)

          if (locations.length === 0) {
            console.warn('[Itinerary] No locations found for this itinerary')
            // Still enable the preference even if no locations yet
            this.travelWarningsEnabled.set(itineraryId, true)
            this.saveTravelWarningsPreferences()
            return
          }

          // Sync locations to travel warnings service
          console.log(`[Itinerary] Calling syncItineraryLocationsAsTrips...`)
          await userTripsStore.syncItineraryLocationsAsTrips(
            itineraryId,
            locations,
            true
          )
          console.log(`[Itinerary] Sync completed successfully`)
        } else {
          // Remove all trips for this itinerary
          console.log(`[Itinerary] Removing trips for itinerary ${itineraryId}...`)
          await userTripsStore.removeItineraryTrips(itineraryId)
        }

        // Update local state and save to localStorage
        this.travelWarningsEnabled.set(itineraryId, enabled)
        this.saveTravelWarningsPreferences()

        console.log(`[Itinerary] Travel warnings ${enabled ? 'enabled' : 'disabled'} for itinerary ${itineraryId}`)
        console.log(`[Itinerary] ===== TOGGLE COMPLETE =====`)
      } catch (error) {
        console.error('[Itinerary] ===== TOGGLE FAILED =====')
        console.error('[Itinerary] Failed to toggle travel warnings:', error)
        throw error
      }
    },

    /**
     * Load travel warnings preferences from localStorage
     */
    loadTravelWarningsPreferences() {
      try {
        const stored = localStorage.getItem('travelWarningsEnabled')
        if (stored) {
          const data = JSON.parse(stored)
          this.travelWarningsEnabled = new Map(Object.entries(data).map(([k, v]) => [Number(k), v as boolean]))
        }
      } catch (error) {
        console.error('Failed to load travel warnings preferences:', error)
      }
    },

    /**
     * Save travel warnings preferences to localStorage
     */
    saveTravelWarningsPreferences() {
      try {
        const data = Object.fromEntries(this.travelWarningsEnabled)
        localStorage.setItem('travelWarningsEnabled', JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save travel warnings preferences:', error)
      }
    }
  },
})
