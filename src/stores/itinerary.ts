import { defineStore } from 'pinia'
import type { ItineraryDto } from '@/api/models'
import { getApi } from '@/services/api'

export const useItineraryStore = defineStore('itinerary', {
  state: () => ({
    itineraries: [] as ItineraryDto[],
    selected: null as ItineraryDto | null
  }),

  actions: {
    async loadItineraries(email: string) {
      const itineraryApi = getApi('ItineraryManagementApi')
      try {
        this.itineraries = await itineraryApi.itineraryGetEmailGet({ email })
      } catch (error) {
        console.error('Failed to load itineraries:', error)
      }
    },

    async addNewItinerary(email: string, itineraryDto: ItineraryDto) {
      const itineraryApi = getApi('ItineraryManagementApi')
      try {
         await itineraryApi.itineraryCreateEmailPost({email: email, itineraryDto: itineraryDto})
         this.itineraries.push(itineraryDto)
       } catch (error) {
         console.error('Failed to add itinerary:', error)
       }
    }
  },
})
