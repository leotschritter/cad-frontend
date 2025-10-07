import { defineStore } from 'pinia'
import type { ItineraryDto } from '@/api/models'
import { getApi } from '@/services/api'
import type { ItineraryCreateEmailPostRequest, ItineraryGetEmailGetRequest } from '@/api/apis/ItineraryManagementApi'

export const useItineraryStore = defineStore('itinerary', {
  state: () => ({
    itineraries: [] as ItineraryDto[],
    selected: null as ItineraryDto | null
  }),

  actions: {
    /*
    setItineraries(list: ItineraryDto[]) {
      this.itineraries = list
    },

    addItinerary(itinerary: ItineraryDto) {
      this.itineraries.push(itinerary)
    },

    removeItinerary(title: string) {
      this.itineraries = this.itineraries.filter(i => i.title !== title)
    },
    */
    async loadItineraries(email: string) {
      const itineraryApi = getApi('ItineraryManagementApi')
      const request: ItineraryGetEmailGetRequest = {
        email: email
      }
      try {
      const response = await itineraryApi.itineraryGetEmailGetRaw({ request})
        this.itineraries = response.data
      } catch (error) {
        console.error('Failed to load itineraries:', error)
      }
    },

    async addNewItinerary(email: string, itineraryDto: ItineraryDto) {
      const itineraryApi = getApi('ItineraryManagementApi')
      const request: ItineraryCreateEmailPostRequest = {
        email: email,
        itineraryDto: itineraryDto
      }
      try {
         const response = await itineraryApi.itineraryCreateEmailPost({ request })
         this.itineraries.push(itineraryDto)
        if (response.status !== 200) {
          console.error('Failed to add itinerary, status code:', response.status)
        }
       } catch (error) {
         console.error('Failed to add itinerary:', error)
       }
    }
  },
})
