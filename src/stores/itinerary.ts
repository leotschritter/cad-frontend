import { defineStore } from 'pinia'
import type { ItineraryDto } from '@/api/models'
import { getApi } from '@/services/api'
import itinerary from '@/components/Itinerary.vue'



export const useItineraryStore = defineStore('itinerary', {

  state: () => ({
    itineraries: [] as ItineraryDto[],
    selected: null as ItineraryDto | null
  }),

  actions: {
    const itineraryApi = getApi('ItineraryManagementApi'),
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
    async function loadItineraries(email: string) {
      try {
      const response = await itineraryApi.itineraryGetGet({ userId })
        this.itineraries = response.data
      } catch (error) {
        console.error('Failed to load itineraries:', error)
      }
    },

    async function addNewItinerary(userId: number, itineraryDto: ItineraryDto) {
       try {
         const response = await itineraryApi.itineraryCreatePost({ userId, itineraryDto })
         this.Itineraries.push(itineraryDto)
       } catch (error) {
         console.error('Failed to add itinerary:', error)
       }
    }
  },


})
