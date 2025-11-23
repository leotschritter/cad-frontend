import { defineStore } from 'pinia'
import { getApi } from "@/services/api.ts";
import type { LocationDto } from "@/api/backend";
import { formatDate } from "@/utils/dateUtils.ts";
import { useNominatim } from '@/components/useNominatim.ts'

const locationApi = getApi('LocationManagementApi')

export const useLocationStore = defineStore('location', {
  state: () => ({
    locations: [] as LocationDto[],
    currentLocation: null as LocationDto | null,
  }),
  actions: {
    /**
     * Get all locations for a specific itinerary
     */
    async getLocationsForItinerary(itineraryId: number): Promise<LocationDto[]> {
      try {
        this.locations = await locationApi.locationItineraryItineraryIdGet({ itineraryId })
        return this.locations
      } catch (err: any) {
        this.locations = []
        const status = err?.response?.status
        if (status === 404) {
          return []
        } else {
          throw err
        }
      }
    },

    /**
     * Add a new location to an itinerary with optional images
     */
    async addLocationToItinerary(payload: {
      itineraryId: number,
      name?: string,
      description?: string,
      fromDate?: Date,
      toDate?: Date,
      files?: Array<Blob | File>,
      transportType?: string,
      transportDuration?: number,
      transportDistance?: number,
      accommodationName?: string,
      accommodationPricePerNight?: number,
      accommodationRating?: number,
      accommodationNotes?: string,
      accommodationImageUrl?: string,
      bookingPageUrl?: string
    }): Promise<LocationDto | null> {
      try {
        // Ensure files are properly converted to Blob array if needed
        const { geocode } = useNominatim()
        const coords = await geocode(payload.name || '')

        const requestPayload = {
          itineraryId: payload.itineraryId,
          name: payload.name,
          latitude: coords?.lat,
          longitude: coords?.lng,
          description: payload.description,
          fromDate: payload.fromDate ? formatDate(payload.fromDate) : undefined,
          toDate: payload.toDate ? formatDate(payload.toDate) : undefined,
          files: payload.files ? payload.files.map(f => f as Blob) : undefined,
          transportType: payload.transportType,
          transportDuration: payload.transportDuration,
          transportDistance: payload.transportDistance,
          accommodationName: payload.accommodationName,
          accommodationPricePerNight: payload.accommodationPricePerNight,
          accommodationRating: payload.accommodationRating,
          accommodationNotes: payload.accommodationNotes,
          accommodationImageUrl: payload.accommodationImageUrl,
          bookingPageUrl: payload.bookingPageUrl
        }

        const location = await locationApi.locationItineraryItineraryIdPost(requestPayload)
        // Add to local state
        this.locations.push(location)
        this.currentLocation = location
        return location
      } catch (err: any) {
        console.error('Error adding location to itinerary:', err)
        const status = err?.response?.status
        if (status === 400 || status === 404) {
          return null
        } else {
          throw err
        }
      }
    },

    /**
     * Get a specific location by ID
     */
    async getLocationById(locationId: number): Promise<LocationDto | null> {
      try {
        this.currentLocation = await locationApi.locationLocationIdGet({ locationId })
        return this.currentLocation
      } catch (err: any) {
        this.currentLocation = null
        const status = err?.response?.status
        if (status === 404) {
          return null
        } else {
          throw err
        }
      }
    },

    /**
     * Delete a location
     */
    async deleteLocation(locationId: number): Promise<boolean> {
      try {
        await locationApi.locationLocationIdDelete({ locationId })
        // Remove from local state
        this.locations = this.locations.filter(loc => loc.id !== locationId)
        if (this.currentLocation?.id === locationId) {
          this.currentLocation = null
        }
        return true
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 404) {
          return false
        } else {
          throw err
        }
      }
    },

    /**
     * Upload images to a location
     */
    async uploadImagesToLocation(payload: {
      locationId: number,
      files: Array<Blob | File>
    }): Promise<{ imageUrls?: string[] } | null> {
      try {
        // Ensure files are properly converted to Blob array if needed
        const requestPayload = {
          locationId: payload.locationId,
          files: payload.files.map(f => f as Blob)
        }

        const response = await locationApi.locationLocationIdImagesPost(requestPayload)

        // Update the location in local state with new image URLs
        if (response.imageUrls) {
          const location = this.locations.find(loc => loc.id === payload.locationId)
          if (location) {
            location.imageUrls = [...(location.imageUrls || []), ...response.imageUrls]
          }
          if (this.currentLocation?.id === payload.locationId) {
            this.currentLocation.imageUrls = [...(this.currentLocation.imageUrls || []), ...response.imageUrls]
          }
        }

        return response.imageUrls
      } catch (err: any) {
        console.error('Error uploading images to location:', err)
        const status = err?.response?.status
        if (status === 400 || status === 404) {
          return null
        } else {
          throw err
        }
      }
    },

    /**
     * Add existing image URLs to a location (re-link images that already exist in storage)
     */
    async addImageUrlsToLocation(payload: {
      locationId: number,
      imageUrls: Array<string>
    }): Promise<boolean> {
      try {
        await locationApi.locationLocationIdImageUrlsPost({
          locationId: payload.locationId,
          requestBody: payload.imageUrls
        })

        // Update local state
        const location = this.locations.find(loc => loc.id === payload.locationId)
        if (location) {
          console.log('   Updating local state - before:', location.imageUrls)
          location.imageUrls = [...(location.imageUrls || []), ...payload.imageUrls]
          console.log('   Updating local state - after:', location.imageUrls)
        }
        if (this.currentLocation?.id === payload.locationId) {
          this.currentLocation.imageUrls = [...(this.currentLocation.imageUrls || []), ...payload.imageUrls]
        }

        return true
      } catch (err: any) {
        console.error('Error adding image URLs to location:', err)
        return false
      }
    },

    /**
     * Delete an image from a location
     */
    async deleteImageFromLocation(payload: {
      locationId: number,
      imageUrl: string
    }): Promise<boolean> {
      try {
        await locationApi.locationLocationIdImagesDelete(payload)

        // Remove the image URL from local state
        const location = this.locations.find(loc => loc.id === payload.locationId)
        if (location && location.imageUrls) {
          location.imageUrls = location.imageUrls.filter(url => url !== payload.imageUrl)
        }
        if (this.currentLocation?.id === payload.locationId && this.currentLocation.imageUrls) {
          this.currentLocation.imageUrls = this.currentLocation.imageUrls.filter(url => url !== payload.imageUrl)
        }

        return true
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 404) {
          return false
        } else {
          throw err
        }
      }
    },

    /**
     * Clear all locations from state
     */
    clearLocations() {
      this.locations = []
      this.currentLocation = null
    }
  }
})
