import { defineStore } from 'pinia'
import { getApi } from '@/services/api'
import type { UserTripDto } from '@/api/travel-warnings-service'
import { useAuthStore } from '@/stores/auth'

// Get API instance - will be initialized with correct config when called
const getUserTripsApi = () => getApi('UserTripsApi')

export const useUserTripsStore = defineStore('userTrips', {
  state: () => ({
    trips: [] as UserTripDto[],
    currentTrip: null as UserTripDto | null,
    userWarnings: [] as any[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getTripById: (state) => (tripId: number) => {
      return state.trips.find(t => t.id === tripId)
    },

    activeTripsByEmail: (state) => (email: string) => {
      const now = new Date()
      return state.trips.filter(trip =>
        trip.email === email &&
        trip.endDate &&
        new Date(trip.endDate) >= now
      )
    },

    upcomingTrips: (state) => {
      const now = new Date()
      return state.trips.filter(trip =>
        trip.startDate &&
        new Date(trip.startDate) > now
      ).sort((a, b) => {
        const dateA = a.startDate ? new Date(a.startDate).getTime() : 0
        const dateB = b.startDate ? new Date(b.startDate).getTime() : 0
        return dateA - dateB
      })
    },

    currentTrips: (state) => {
      const now = new Date()
      return state.trips.filter(trip => {
        const start = trip.startDate ? new Date(trip.startDate) : null
        const end = trip.endDate ? new Date(trip.endDate) : null
        return start && end && start <= now && now <= end
      })
    },

    pastTrips: (state) => {
      const now = new Date()
      return state.trips.filter(trip =>
        trip.endDate &&
        new Date(trip.endDate) < now
      ).sort((a, b) => {
        const dateA = a.endDate ? new Date(a.endDate).getTime() : 0
        const dateB = b.endDate ? new Date(b.endDate).getTime() : 0
        return dateB - dateA // Most recent first
      })
    },

    tripsWithNotifications: (state) => {
      return state.trips.filter(trip => trip.notificationsEnabled === true)
    },

    tripsByCountry: (state) => (countryCode: string) => {
      return state.trips.filter(trip => trip.countryCode === countryCode)
    },
  },

  actions: {
    /**
     * Create a new trip
     * @param tripData - Trip data without ID
     */
    async createTrip(tripData: Omit<UserTripDto, 'id'>): Promise<UserTripDto> {
      this.loading = true
      this.error = null
      try {
        const userTripsApi = getUserTripsApi()
        console.log('[UserTrips] Creating new trip:', tripData.tripName)
        console.log('[UserTrips] Trip data:', JSON.stringify(tripData, null, 2))
        console.log('[UserTrips] API instance:', userTripsApi)
        console.log('[UserTrips] API base path:', (userTripsApi as any).configuration?.basePath)

        const response = await userTripsApi.warningsTripsPost({
          userTripDto: tripData
        })

        console.log('[UserTrips] Trip created successfully:', response)
        this.currentTrip = response

        // Add to trips array if not already present
        if (response.id && !this.trips.find(t => t.id === response.id)) {
          this.trips.push(response)
        }

        return response
      } catch (err: unknown) {
        console.error('[UserTrips] Failed to create trip:', err)
        console.error('[UserTrips] Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          error: err
        })
        this.error = err instanceof Error ? err.message : 'Failed to create trip'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch all trips for a user by email
     * @param email - User email address
     */
    async fetchUserTrips(email?: string): Promise<UserTripDto[]> {
      this.loading = true
      this.error = null
      try {
        const userTripsApi = getUserTripsApi()
        // Use email from parameter or get from auth store
        const userEmail = email || useAuthStore().user?.email
        if (!userEmail) {
          throw new Error('No email provided and user not authenticated')
        }

        console.log(`[UserTrips] Fetching trips for user: ${userEmail}`)

        const response = await userTripsApi.warningsTripsUserEmailGet({
          email: userEmail
        })

        this.trips = Array.isArray(response) ? response : []
        return this.trips
      } catch (err: unknown) {
        console.error('Failed to fetch user trips:', err)
        this.error = err instanceof Error ? err.message : 'Failed to fetch trips'
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          this.trips = []
          return []
        }
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch a specific trip by ID
     * @param tripId - Trip ID
     */
    async fetchTripById(tripId: number): Promise<UserTripDto | null> {
      this.loading = true
      this.error = null
      try {
        const userTripsApi = getUserTripsApi()
        console.log(`[UserTrips] Fetching trip with ID: ${tripId}`)

        const response = await userTripsApi.warningsTripsTripIdGet({
          tripId
        })

        this.currentTrip = response

        // Update in trips array if exists
        const existingIndex = this.trips.findIndex(t => t.id === tripId)
        if (existingIndex >= 0) {
          this.trips[existingIndex] = response
        } else {
          this.trips.push(response)
        }

        return response
      } catch (err: unknown) {
        console.error(`Failed to fetch trip ${tripId}:`, err)
        this.error = err instanceof Error ? err.message : 'Failed to fetch trip'
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          return null
        }
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Update an existing trip
     * @param tripId - Trip ID
     * @param tripData - Updated trip data
     */
    async updateTrip(tripId: number, tripData: Omit<UserTripDto, 'id'>): Promise<UserTripDto> {
      this.loading = true
      this.error = null
      try {
        const userTripsApi = getUserTripsApi()
        console.log(`[UserTrips] Updating trip ${tripId}:`, tripData.tripName)

        const response = await userTripsApi.warningsTripsTripIdPut({
          tripId,
          userTripDto: tripData
        })

        this.currentTrip = response

        // Update in trips array
        const existingIndex = this.trips.findIndex(t => t.id === tripId)
        if (existingIndex >= 0) {
          this.trips[existingIndex] = response
        }

        return response
      } catch (err: unknown) {
        console.error(`Failed to update trip ${tripId}:`, err)
        this.error = err instanceof Error ? err.message : 'Failed to update trip'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Delete a trip
     * @param tripId - Trip ID
     */
    async deleteTrip(tripId: number): Promise<void> {
      this.loading = true
      this.error = null
      try {
        const userTripsApi = getUserTripsApi()
        console.log(`[UserTrips] Deleting trip ${tripId}`)

        await userTripsApi.warningsTripsTripIdDelete({
          tripId
        })

        // Remove from trips array
        const index = this.trips.findIndex(t => t.id === tripId)
        if (index >= 0) {
          this.trips.splice(index, 1)
        }

        // Clear current trip if it was the deleted one
        if (this.currentTrip?.id === tripId) {
          this.currentTrip = null
        }
      } catch (err: unknown) {
        console.error(`Failed to delete trip ${tripId}:`, err)
        this.error = err instanceof Error ? err.message : 'Failed to delete trip'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Toggle notifications for a trip
     * @param tripId - Trip ID
     * @param enabled - Enable or disable notifications
     */
    async toggleNotifications(tripId: number, enabled: boolean): Promise<UserTripDto> {
      this.loading = true
      this.error = null
      try {
        const userTripsApi = getUserTripsApi()
        console.log(`[UserTrips] ${enabled ? 'Enabling' : 'Disabling'} notifications for trip ${tripId}`)

        const response = await userTripsApi.warningsTripsTripIdNotificationsPatch({
          tripId,
          enabled
        })

        // Update in trips array
        const existingIndex = this.trips.findIndex(t => t.id === tripId)
        if (existingIndex >= 0) {
          this.trips[existingIndex] = response
        }

        // Update current trip if it matches
        if (this.currentTrip?.id === tripId) {
          this.currentTrip = response
        }

        return response
      } catch (err: unknown) {
        console.error(`Failed to toggle notifications for trip ${tripId}:`, err)
        this.error = err instanceof Error ? err.message : 'Failed to toggle notifications'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch all active warnings for user's trips
     * @param email - User email address
     */
    async fetchUserWarnings(email?: string): Promise<any[]> {
      this.loading = true
      this.error = null
      try {
        const userTripsApi = getUserTripsApi()
        // Use email from parameter or get from auth store
        const userEmail = email || useAuthStore().user?.email
        if (!userEmail) {
          throw new Error('No email provided and user not authenticated')
        }

        console.log(`[UserTrips] Fetching warnings for user's trips: ${userEmail}`)

        const response = await userTripsApi.warningsTripsUserEmailWarningsGet({
          email: userEmail
        })

        this.userWarnings = Array.isArray(response) ? response : []
        return this.userWarnings
      } catch (err: unknown) {
        console.error('Failed to fetch user warnings:', err)
        this.error = err instanceof Error ? err.message : 'Failed to fetch warnings'
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          this.userWarnings = []
          return []
        }
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear current trip
     */
    clearCurrentTrip() {
      this.currentTrip = null
    },

    /**
     * Sync locations from an itinerary to travel warnings as trips
     * This will create/update trips for each location with notifications enabled
     * @param itineraryId - The itinerary ID
     * @param locations - Array of locations from the itinerary
     * @param notificationsEnabled - Whether to enable notifications for these trips
     */
    async syncItineraryLocationsAsTrips(
      itineraryId: number,
      locations: any[],
      notificationsEnabled: boolean
    ): Promise<void> {
      this.loading = true
      this.error = null

      try {
        const userEmail = useAuthStore().user?.email
        if (!userEmail) {
          throw new Error('User not authenticated')
        }

        console.log(`[UserTrips] ===== START SYNC =====`)
        console.log(`[UserTrips] Syncing ${locations.length} locations from itinerary ${itineraryId}`)
        console.log(`[UserTrips] User email:`, userEmail)
        console.log(`[UserTrips] Locations:`, locations)

        // Process each location that has country information
        for (let i = 0; i < locations.length; i++) {
          const location = locations[i]
          console.log(`[UserTrips] Processing location ${i + 1}/${locations.length}: ${location.name}`)

          // Skip locations without coordinates or country info
          if (!location.latitude || !location.longitude) {
            console.warn(`[UserTrips] Skipping location ${location.name} - missing coordinates (lat: ${location.latitude}, lon: ${location.longitude})`)
            continue
          }

          console.log(`[UserTrips] Location ${location.name} has coordinates: lat=${location.latitude}, lon=${location.longitude}`)

          // Use Nominatim or a geocoding service to get country code
          console.log(`[UserTrips] Calling reverse geocoding for ${location.name}...`)
          const countryInfo = await this.getCountryFromCoordinates(
            location.latitude,
            location.longitude
          )

          if (!countryInfo) {
            console.warn(`[UserTrips] Skipping location ${location.name} - could not determine country`)
            continue
          }

          console.log(`[UserTrips] Got country info for ${location.name}:`, countryInfo)

          // Check if a trip already exists for this location
          const existingTrip = this.trips.find(
            t => t.countryCode === countryInfo.countryCode &&
                 t.startDate === location.fromDate &&
                 t.endDate === location.toDate
          )

          const tripData = {
            email: userEmail,
            countryCode: countryInfo.countryCode,
            countryName: countryInfo.countryName,
            startDate: location.fromDate,
            endDate: location.toDate,
            tripName: `${location.name || 'Location'} (Itinerary #${itineraryId})`,
            notificationsEnabled
          }

          console.log(`[UserTrips] Prepared trip data:`, tripData)

          if (existingTrip && existingTrip.id) {
            // Update existing trip
            console.log(`[UserTrips] Updating existing trip ${existingTrip.id}`)
            await this.updateTrip(existingTrip.id, tripData)
          } else {
            // Create new trip
            console.log(`[UserTrips] Creating new trip for ${location.name}`)
            await this.createTrip(tripData)
          }
        }

        // Refresh user warnings after syncing
        console.log(`[UserTrips] Fetching user warnings...`)
        await this.fetchUserWarnings()

        console.log(`[UserTrips] ===== SYNC COMPLETE =====`)
      } catch (err: unknown) {
        console.error('[UserTrips] ===== SYNC FAILED =====')
        console.error('[UserTrips] Failed to sync itinerary locations:', err)
        this.error = err instanceof Error ? err.message : 'Failed to sync locations'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Get country information from coordinates using Nominatim
     * @param latitude - Latitude coordinate
     * @param longitude - Longitude coordinate
     */
    async getCountryFromCoordinates(
      latitude: number,
      longitude: number
    ): Promise<{ countryCode: string; countryName: string } | null> {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`
        console.log(`[UserTrips] Geocoding request: ${url}`)

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'TravelWarningsApp/1.0'
          }
        })

        console.log(`[UserTrips] Geocoding response status: ${response.status}`)

        if (!response.ok) {
          console.warn(`[UserTrips] Geocoding failed with status ${response.status}`)
          return null
        }

        const data = await response.json()
        console.log(`[UserTrips] Geocoding data:`, data)

        if (data.address && data.address.country_code && data.address.country) {
          const result = {
            countryCode: data.address.country_code.toUpperCase(),
            countryName: data.address.country
          }
          console.log(`[UserTrips] Extracted country info:`, result)
          return result
        }

        console.warn(`[UserTrips] No country info in geocoding response`)
        return null
      } catch (err) {
        console.error('[UserTrips] Failed to reverse geocode:', err)
        return null
      }
    },

    /**
     * Remove all trips associated with an itinerary
     * @param itineraryId - The itinerary ID
     */
    async removeItineraryTrips(itineraryId: number): Promise<void> {
      this.loading = true
      this.error = null

      try {
        console.log(`[UserTrips] Removing trips for itinerary ${itineraryId}`)

        // Find all trips that belong to this itinerary
        const itineraryTrips = this.trips.filter(
          t => t.tripName?.includes(`(Itinerary #${itineraryId})`)
        )

        // Delete each trip
        for (const trip of itineraryTrips) {
          if (trip.id) {
            await this.deleteTrip(trip.id)
          }
        }

        console.log(`[UserTrips] Removed ${itineraryTrips.length} trips`)
      } catch (err: unknown) {
        console.error('Failed to remove itinerary trips:', err)
        this.error = err instanceof Error ? err.message : 'Failed to remove trips'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear all trips and warnings from state
     */
    clearAllTrips() {
      this.trips = []
      this.currentTrip = null
      this.userWarnings = []
      this.error = null
    },
  },
})

