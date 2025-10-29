import { defineStore } from 'pinia'
import { getApi } from "@/services/api.ts";
import type { LocationDto } from "@/api";

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
      files?: Array<Blob | File>
    }): Promise<LocationDto | null> {
      try {
        // Ensure files are properly converted to Blob array if needed
        const requestPayload = {
          ...payload,
          files: payload.files ? payload.files.map(f => f as Blob) : undefined
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
