import { defineStore } from 'pinia'
import { getApi } from '@/services/api'
import type { WeatherForecastResponse } from '@/api/weather-forecast-service'

const weatherApi = getApi('WeatherForecastApi')

export const useWeatherStore = defineStore('weather', {
  state: () => ({
    weatherForecasts: [] as WeatherForecastResponse[],
    currentForecast: null as WeatherForecastResponse | null,
  }),

  getters: {
    getWeatherByLocation: (state) => (location: string) => {
      return state.weatherForecasts.find(w => w.location === location)
    },
  },

  actions: {
    /**
     * Fetch/Update weather by coordinates
     * POST to Meteo API - creates new entry OR updates existing entry in DB
     * Use this for both initial fetch and refresh
     */
    async fetchAndStoreWeather(payload: {
      latitude: number
      longitude: number
      location: string
    }): Promise<WeatherForecastResponse | null> {
      try {
        console.log(`[Weather] POST: Fetching/Updating weather from Meteo API for ${payload.location}`)

        // POST to fetch from external Meteo API and store/update in DB
        // This endpoint creates new OR updates existing weather data
        await weatherApi.apiWeatherForecastCoordinatesPost({
          lat: payload.latitude,
          lon: payload.longitude,
          location: payload.location
        })

        // Now GET the stored/updated data
        const forecast = await this.getWeatherByCoordinates(payload.latitude, payload.longitude)

        if (forecast) {
          // Update local state
          const existingIndex = this.weatherForecasts.findIndex(w => w.location === payload.location)
          if (existingIndex >= 0) {
            this.weatherForecasts[existingIndex] = forecast
          } else {
            this.weatherForecasts.push(forecast)
          }
          this.currentForecast = forecast
        }

        return forecast
      } catch (err: unknown) {
        console.error('Failed to fetch and store weather:', err)
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 400 || status === 404) {
          return null
        } else {
          throw err
        }
      }
    },

    /**
     * Get weather by coordinates - retrieves from DB if available
     */
    async getWeatherByCoordinates(
      latitude: number,
      longitude: number
    ): Promise<WeatherForecastResponse | null> {
      try {
        console.log(`[Weather] GET: Getting weather from DB for coordinates (${latitude}, ${longitude})`)

        const response = await weatherApi.apiWeatherForecastCoordinatesGet({
          lat: latitude,
          lon: longitude
        })

        // API returns an array, take the first element
        const forecast = Array.isArray(response) && response.length > 0 ? response[0] : null

        if (forecast) {
          this.currentForecast = forecast
          return forecast
        }

        return null
      } catch (err: unknown) {
        console.error('Failed to get weather by coordinates:', err)
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          // Not found in DB - return null so caller can call fetchAndStoreWeather
          return null
        } else {
          throw err
        }
      }
    },

    /**
     * Get weather by location name - retrieves from DB
     */
    async getWeatherByLocationName(location: string): Promise<WeatherForecastResponse | null> {
      try {
        console.log(`[Weather] GET: Getting weather from DB for location "${location}"`)

        const response = await weatherApi.apiWeatherForecastLocationGet({
          location
        })

        // API returns an array, take the first element
        const forecast = Array.isArray(response) && response.length > 0 ? response[0] : null

        if (forecast) {
          this.currentForecast = forecast
          return forecast
        }

        return null
      } catch (err: unknown) {
        console.error('Failed to get weather by location name:', err)
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          return null
        } else {
          throw err
        }
      }
    },

    /**
     * Get or fetch weather for a location
     * First tries to get from DB, if not found, fetches from external API
     */
    async getOrFetchWeather(payload: {
      latitude: number
      longitude: number
      location: string
    }): Promise<WeatherForecastResponse | null> {
      // Try to get from DB first
      let forecast = await this.getWeatherByLocationName(payload.location)

      // If not in DB, fetch from external API
      if (!forecast) {
        console.log(`[Weather] Not in DB, fetching from external API...`)
        forecast = await this.fetchAndStoreWeather(payload)
      } else {
        console.log(`[Weather] Found in DB, lastUpdated: ${forecast.lastUpdated}`)

        // Update local state
        const existingIndex = this.weatherForecasts.findIndex(w => w.location === payload.location)
        if (existingIndex >= 0) {
          this.weatherForecasts[existingIndex] = forecast
        } else {
          this.weatherForecasts.push(forecast)
        }
      }

      return forecast
    },

    /**
     * Refresh weather data (force update from external API)
     * Same as fetchAndStoreWeather - POST updates existing data
     */
    async refreshWeather(payload: {
      latitude: number
      longitude: number
      location: string
    }): Promise<WeatherForecastResponse | null> {
      console.log(`[Weather] Refreshing weather for ${payload.location}`)
      // POST endpoint automatically updates if data exists
      return await this.fetchAndStoreWeather(payload)
    },

    /**
     * Get all weather forecasts from DB
     */
    async getAllWeatherForecasts(): Promise<WeatherForecastResponse[]> {
      try {
        const response = await weatherApi.apiWeatherForecastsGet()
        // API should return an array
        const forecasts = Array.isArray(response) ? response : []
        this.weatherForecasts = forecasts
        return forecasts
      } catch (err: unknown) {
        console.error('Failed to get all weather forecasts:', err)
        return []
      }
    },

    /**
     * Delete weather forecast by location
     */
    async deleteWeatherForecast(location: string): Promise<boolean> {
      try {
        await weatherApi.apiWeatherForecastLocationDelete({ location })

        // Remove from local state
        this.weatherForecasts = this.weatherForecasts.filter(w => w.location !== location)
        if (this.currentForecast?.location === location) {
          this.currentForecast = null
        }

        return true
      } catch (err: unknown) {
        console.error('Failed to delete weather forecast:', err)
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          return false
        } else {
          throw err
        }
      }
    },

    /**
     * Clear all weather forecasts from state
     */
    clearWeatherForecasts() {
      this.weatherForecasts = []
      this.currentForecast = null
    }
  }
})
