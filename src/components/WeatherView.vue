<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import type { WeatherForecastResponse } from '@/api/weather-forecast-service'

interface Location {
  id?: number
  name?: string
  latitude?: number
  longitude?: number
  description?: string
  fromDate?: Date
  toDate?: Date
  imageUrls?: string[]
}

// Import all weather icons using Vite's glob import
const weatherIcons = import.meta.glob<{ default: string }>('@/assets/images/weather-icons/*.png', { eager: true })

export default defineComponent({
  name: 'WeatherView',
  props: {
    locations: {
      type: Array as () => Location[],
      required: true
    },
    itineraryTitle: {
      type: String,
      default: 'Itinerary'
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const weatherStore = useWeatherStore()
    const loading = ref(false)
    const selectedLocation = ref<Location | null>(null)
    const showOnlyTripDates = ref(true) // Toggle between trip dates and all dates

    // Debug: Log available weather icons
    console.log('Available weather icons:', Object.keys(weatherIcons))

    const locationWeatherMap = computed(() => {
      const map = new Map<string, WeatherForecastResponse | null>()
      props.locations.forEach(loc => {
        if (loc.name) {
          const forecast = weatherStore.getWeatherByLocation(loc.name)
          map.set(loc.name, forecast || null)
        }
      })
      return map
    })

    const selectedWeatherData = computed(() => {
      if (!selectedLocation.value?.name) return null
      return locationWeatherMap.value.get(selectedLocation.value.name) || null
    })

    // Filter weather data based on trip dates
    const filteredWeatherData = computed(() => {
      console.log('=== Filtering Weather Data ===')
      console.log('showOnlyTripDates:', showOnlyTripDates.value)
      console.log('selectedWeatherData:', selectedWeatherData.value)
      console.log('selectedLocation:', selectedLocation.value)

      if (!selectedWeatherData.value) {
        console.log('No weather data available')
        return null
      }

      // If showing all dates, return all data
      if (!showOnlyTripDates.value) {
        console.log('Showing ALL weather data')
        return selectedWeatherData.value
      }

      const loc = selectedLocation.value
      if (!loc?.fromDate || !loc?.toDate) {
        console.log('No trip dates available, showing all data')
        return selectedWeatherData.value
      }

      // Convert dates to timestamps for comparison
      const fromTime = new Date(loc.fromDate).getTime()
      const toTime = new Date(loc.toDate).getTime()
      console.log('Trip dates:', new Date(fromTime), 'to', new Date(toTime))

      // Filter hourly forecasts
      const filteredHourly = selectedWeatherData.value.hourlyForecasts?.filter(hour => {
        if (!hour.date) return false
        const hourTime = new Date(hour.date).getTime()
        const isInRange = hourTime >= fromTime && hourTime <= toTime + 86400000 // +1 day to include toDate
        return isInRange
      })

      // Filter daily forecasts
      const filteredDaily = selectedWeatherData.value.dailyForecasts?.filter(day => {
        if (!day.date) return false
        const dayTime = new Date(day.date).getTime()
        const isInRange = dayTime >= fromTime && dayTime <= toTime
        return isInRange
      })

      console.log('Filtered hourly:', filteredHourly?.length, '/', selectedWeatherData.value.hourlyForecasts?.length)
      console.log('Filtered daily:', filteredDaily?.length, '/', selectedWeatherData.value.dailyForecasts?.length)

      const result = {
        ...selectedWeatherData.value,
        hourlyForecasts: filteredHourly,
        dailyForecasts: filteredDaily
      }

      console.log('Filtered result:', result)
      return result
    })

    const loadAllWeather = async () => {
      console.log('=== WeatherView: Loading weather for locations ===')
      console.log('Locations:', props.locations)

      loading.value = true
      try {
        const locationsWithCoords = props.locations.filter(loc => loc.latitude && loc.longitude && loc.name)
        console.log(`Found ${locationsWithCoords.length} locations with coordinates`)

        if (locationsWithCoords.length === 0) {
          console.warn('No locations with latitude/longitude found!')
          return
        }

        for (const loc of locationsWithCoords) {
          const forecast = await weatherStore.fetchAndStoreWeather({
            latitude: loc.latitude!,
            longitude: loc.longitude!,
            location: loc.name!
          })

          if (forecast) {
            console.log(`Weather loaded for ${loc.name}:`, {
              hourlyForecasts: forecast.hourlyForecasts?.length,
              dailyForecasts: forecast.dailyForecasts?.length,
              firstHourlyIcon: forecast.hourlyForecasts?.[0]?.weatherIcon,
              firstDailyIcon: forecast.dailyForecasts?.[0]?.weatherIcon
            })
          }
        }

        console.log('Weather data loaded:', weatherStore.weatherForecasts)
      } catch (error) {
        console.error('Failed to load weather:', error)
      } finally {
        loading.value = false
      }
    }

    const refreshWeather = async (loc: Location) => {
      if (!loc.latitude || !loc.longitude || !loc.name) return

      loading.value = true
      try {
        await weatherStore.refreshWeather({
          latitude: loc.latitude,
          longitude: loc.longitude,
          location: loc.name
        })
      } catch (error) {
        console.error('Failed to refresh weather:', error)
      } finally {
        loading.value = false
      }
    }

    const selectLocation = (location: Location) => {
      selectedLocation.value = location
    }

    const getWeatherIcon = (iconString?: string | number): string => {
      // Icons can be strings like "1", "2", ..., "36" or numbers 1-36
      let iconNumber = typeof iconString === 'number'
        ? iconString
        : iconString ? parseInt(iconString, 10) : 0

      if (!iconNumber || iconNumber < 1 || iconNumber > 36) {
        console.warn(`Invalid weather icon: ${iconString}, using default icon 1`)
        iconNumber = 1
      }

      try {
        // Use glob imported icons
        const iconPath = `/src/assets/images/weather-icons/${iconNumber}.png`
        const icon = weatherIcons[iconPath]

        if (icon && icon.default) {
          return icon.default
        }

        console.error(`Weather icon not found: ${iconPath}`)
        return weatherIcons['/src/assets/images/weather-icons/1.png']?.default || ''
      } catch (error) {
        console.error(`Failed to load weather icon ${iconNumber}:`, error)
        return weatherIcons['/src/assets/images/weather-icons/1.png']?.default || ''
      }
    }

    const formatTime = (timeStr: string): string => {
      try {
        const date = new Date(timeStr)
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
      } catch {
        return timeStr
      }
    }

    const formatDate = (dateStr: string): string => {
      try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
      } catch {
        return dateStr
      }
    }

    const formatLastUpdated = (date?: Date): string => {
      if (!date) return 'Never'
      try {
        const d = new Date(date)
        return d.toLocaleString('de-DE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch {
        return 'Unknown'
      }
    }

    const formatWeather = (weather?: string): string => {
      if (!weather) return ''
      return weather.replace(/_/g, ' ')
    }

    const getCurrentWeather = (forecast: WeatherForecastResponse | null) => {
      if (!forecast?.hourlyForecasts || forecast.hourlyForecasts.length === 0) return null
      // Return the first hourly forecast as current weather
      return forecast.hourlyForecasts[0]
    }

    const close = () => {
      emit('close')
    }

    onMounted(() => {
      loadAllWeather()
      if (props.locations.length > 0) {
        selectedLocation.value = props.locations[0]
      }
    })

    return {
      loading,
      selectedLocation,
      locationWeatherMap,
      selectedWeatherData,
      filteredWeatherData,
      showOnlyTripDates,
      loadAllWeather,
      refreshWeather,
      selectLocation,
      getWeatherIcon,
      formatTime,
      formatDate,
      formatLastUpdated,
      formatWeather,
      getCurrentWeather,
      close
    }
  }
})
</script>

<template>
  <v-container fluid class="pa-0">
    <v-row>
      <!-- Location List -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="bg-primary text-white">
            <v-icon class="mr-2">mdi-map-marker</v-icon>
            Locations
          </v-card-title>

          <!-- Date Filter Toggle -->
          <v-card-subtitle class="pt-3 pb-0">
            <v-switch
              v-model="showOnlyTripDates"
              color="primary"
              density="compact"
              hide-details
            >
              <template v-slot:label>
                <span class="text-caption">
                  {{ showOnlyTripDates ? 'Ony Tripdates' : 'Current Weather' }}
                </span>
              </template>
            </v-switch>
          </v-card-subtitle>

          <v-list>
            <v-list-item
              v-for="(item, index) in locations"
              :key="index"
              :active="selectedLocation?.name === item.name"
              @click="selectLocation(item)"
            >
              <template v-slot:prepend>
                <v-avatar size="40">
                  <v-img
                    v-if="locationWeatherMap.get(item.name || '')?.hourlyForecasts?.[0]?.weatherIcon"
                    :src="getWeatherIcon(locationWeatherMap.get(item.name || '')?.hourlyForecasts?.[0]?.weatherIcon)"
                    cover
                  />
                  <v-icon v-else>mdi-weather-partly-cloudy</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ item.name }}</v-list-item-title>
              <v-list-item-subtitle v-if="locationWeatherMap.get(item.name || '')?.hourlyForecasts?.[0]">
                {{ Math.round(locationWeatherMap.get(item.name || '')?.hourlyForecasts?.[0]?.temperature || 0) }}°C
              </v-list-item-subtitle>
              <v-list-item-subtitle v-else>
                Loading...
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <v-card-actions>
            <v-btn
              @click="loadAllWeather"
              :loading="loading"
              prepend-icon="mdi-refresh"
              variant="text"
              block
            >
              Refresh All
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Weather Details -->
      <v-col cols="12" md="8">
        <v-card v-if="selectedLocation && filteredWeatherData">
          <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
            <div>
              <v-icon class="mr-2">mdi-weather-partly-cloudy</v-icon>
              Weather for {{ selectedLocation.name }}
            </div>
            <v-btn
              icon="mdi-refresh"
              variant="text"
              @click="refreshWeather(selectedLocation)"
              :loading="loading"
              size="small"
            />
          </v-card-title>

          <!-- Trip Dates Info -->
          <v-card-subtitle v-if="showOnlyTripDates && selectedLocation?.fromDate && selectedLocation?.toDate" class="pt-2 pb-0">
            <v-chip size="small" color="info" variant="tonal" class="mr-2">
              <v-icon start size="small">mdi-calendar-range</v-icon>
              {{ formatDate(selectedLocation.fromDate.toString()) }} - {{ formatDate(selectedLocation.toDate.toString()) }}
            </v-chip>
          </v-card-subtitle>

          <!-- Last Updated Info -->
          <v-card-subtitle v-if="filteredWeatherData.lastUpdated" class="pt-2">
            Last updated: {{ formatLastUpdated(filteredWeatherData.lastUpdated) }}
          </v-card-subtitle>

          <!-- Current Weather -->
          <v-card-text v-if="getCurrentWeather(filteredWeatherData)" class="pa-4">
            <div class="d-flex align-center mb-2">
              <v-avatar size="100" class="mr-4">
                <v-img
                  :src="getWeatherIcon(getCurrentWeather(filteredWeatherData)?.weatherIcon)"
                  cover
                />
              </v-avatar>
              <div>
                <div class="text-h3">{{ Math.round(getCurrentWeather(filteredWeatherData)?.temperature || 0) }}°C</div>
                <div class="text-subtitle-1 text-medium-emphasis">
                  {{ formatWeather(getCurrentWeather(filteredWeatherData)?.weather) || 'Current conditions' }}
                </div>
                <div v-if="getCurrentWeather(filteredWeatherData)?.summary" class="text-caption">
                  {{ getCurrentWeather(filteredWeatherData)?.summary }}
                </div>
              </div>
            </div>
          </v-card-text>

          <!-- Hourly Forecast -->
          <v-card-text v-if="filteredWeatherData.hourlyForecasts && filteredWeatherData.hourlyForecasts.length > 0">
            <div class="text-h6 mb-3">Hourly Forecast</div>
            <v-sheet class="d-flex overflow-x-auto pa-2" rounded>
              <v-card
                v-for="(hour, index) in filteredWeatherData.hourlyForecasts.slice(0, 24)"
                :key="index"
                class="mr-3 flex-shrink-0"
                width="120"
                variant="tonal"
              >
                <v-card-text class="text-center pa-2">
                  <div class="text-caption text-medium-emphasis">{{ formatTime(hour.date || '') }}</div>
                  <v-avatar size="56" class="mx-auto my-2">
                    <v-img
                      :src="getWeatherIcon(hour.weatherIcon)"
                      cover
                    />
                  </v-avatar>
                  <div class="text-h6 font-weight-bold">{{ Math.round(hour.temperature || 0) }}°</div>
                  <div v-if="hour.weather" class="text-caption">{{ formatWeather(hour.weather) }}</div>
                  <div v-if="hour.precipitationTotal" class="text-caption">
                    <v-icon size="small">mdi-water</v-icon> {{ hour.precipitationTotal }}mm
                  </div>
                  <div v-if="hour.windSpeed" class="text-caption">
                    <v-icon size="small">mdi-weather-windy</v-icon> {{ Math.round(hour.windSpeed) }}km/h
                  </div>
                </v-card-text>
              </v-card>
            </v-sheet>
          </v-card-text>

          <!-- Daily Forecast -->
          <v-card-text v-if="filteredWeatherData.dailyForecasts && filteredWeatherData.dailyForecasts.length > 0">
            <div class="text-h6 mb-3">Daily Forecast</div>
            <v-list lines="three">
              <v-list-item
                v-for="(day, index) in filteredWeatherData.dailyForecasts"
                :key="index"
                class="daily-forecast-item"
              >
                <template v-slot:prepend>
                  <v-avatar size="56">
                    <v-img
                      :src="getWeatherIcon(day.weatherIcon)"
                      cover
                    />
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">{{ formatDate(day.date || '') }}</v-list-item-title>
                <v-list-item-subtitle class="daily-subtitle">
                  <div>{{ formatWeather(day.weather) }}</div>
                  <div v-if="day.summary" class="text-caption text-medium-emphasis summary-text">{{ day.summary }}</div>
                </v-list-item-subtitle>
                <template v-slot:append>
                  <div class="text-right">
                    <div class="d-flex align-center justify-end mb-1">
                      <v-icon size="small" color="error">mdi-arrow-up</v-icon>
                      <span class="ml-1 font-weight-medium">{{ Math.round(day.temperatureHigh || 0) }}°</span>
                    </div>
                    <div class="d-flex align-center justify-end mb-1">
                      <v-icon size="small" color="primary">mdi-arrow-down</v-icon>
                      <span class="ml-1">{{ Math.round(day.temperatureLow || 0) }}°</span>
                    </div>
                    <div v-if="day.precipitationProbability" class="text-caption">
                      <v-icon size="small">mdi-water-percent</v-icon> {{ day.precipitationProbability }}%
                    </div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>

          <!-- Loading State -->
          <v-card-text v-else-if="loading" class="text-center pa-8">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
            <div class="mt-4">Loading weather data...</div>
          </v-card-text>

          <!-- No Data -->
          <v-card-text v-else class="text-center pa-8">
            <v-icon size="64" color="grey">mdi-weather-cloudy-alert</v-icon>
            <div class="mt-4 text-medium-emphasis">No weather data available</div>
            <v-btn
              class="mt-4"
              @click="refreshWeather(selectedLocation)"
              prepend-icon="mdi-refresh"
            >
              Load Weather
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- No Location Selected -->
        <v-card v-else>
          <v-card-text class="text-center pa-8">
            <v-icon size="64" color="grey">mdi-map-marker-question</v-icon>
            <div class="mt-4 text-medium-emphasis">Select a location to view weather</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.overflow-x-auto {
  overflow-x: auto;
  white-space: nowrap;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-wrap {
  white-space: normal;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Daily forecast styling */
.daily-forecast-item {
  min-height: 80px;
  align-items: flex-start !important;
}

.daily-subtitle {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: clip !important;
  max-height: none !important;
  height: auto !important;
}

.summary-text {
  white-space: normal !important;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: block;
  margin-top: 4px;
  line-height: 1.4;
}
</style>
