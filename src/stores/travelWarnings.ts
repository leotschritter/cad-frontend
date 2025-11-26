import { defineStore } from 'pinia'
import { getApi } from '@/services/api'

const travelWarningsApi = getApi('TravelWarningsApi')

interface TravelWarning {
  contentId?: string
  countryCode?: string
  countryName?: string
  title?: string
  summary?: string
  lastModified?: string | number
  effective?: string | number
  situation?: string
  warningLevel?: string
  severity?: string
  severityDisplay?: string
  active?: boolean
  [key: string]: any
}

interface DetailedTravelWarning extends TravelWarning {
  categorizedContent?: {
    safety?: string[]
    health?: string[]
    entry?: string[]
    infrastructure?: string[]
    general?: string[]
    [key: string]: string[] | undefined
  }
}

const normalizeEpochSeconds = (value?: number | string | null): string | number | undefined => {
  if (value === undefined || value === null) return undefined
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined
  const millis = numeric < 1e12 ? numeric * 1000 : numeric
  return new Date(millis).toISOString()
}

const normalizeWarning = (warning: TravelWarning | null): TravelWarning | null => {
  if (!warning) return warning
  const normalized: TravelWarning = { ...warning }
  const normalizedLastModified = normalizeEpochSeconds(normalized.lastModified)
  if (normalizedLastModified) normalized.lastModified = normalizedLastModified
  const normalizedEffective = normalizeEpochSeconds(normalized.effective)
  if (normalizedEffective) normalized.effective = normalizedEffective

  if (!normalized.warningLevel) {
    normalized.warningLevel = normalized.severity || normalized.severityDisplay || normalized.level || undefined
  }

  if (!normalized.situation) {
    normalized.situation = normalized.summary || normalized.title || (normalized.countryName ? `Travel advisory for ${normalized.countryName}` : 'No situation details provided')
  }

  return normalized
}

export const useTravelWarningsStore = defineStore('travelWarnings', {
  state: () => ({
    warnings: [] as TravelWarning[],
    currentWarning: null as TravelWarning | null,
    detailedWarning: null as DetailedTravelWarning | null,
    batchWarnings: [] as TravelWarning[],
    loading: false,
    error: null as string | null,
  }),

  getters: {
    getWarningByCountryCode: (state) => (countryCode: string) => {
      return state.warnings.find(w => w.countryCode === countryCode)
    },

    getWarningByContentId: (state) => (contentId: string) => {
      return state.warnings.find(w => w.contentId === contentId)
    },

    activeWarnings: (state) => {
      return state.warnings.filter(w => w.active === true)
    },

    warningsByLevel: (state) => (level: string) => {
      return state.warnings.filter(w => w.warningLevel === level)
    },
  },

  actions: {
    /**
     * Fetch all travel warnings
     * @param activeOnly - If true, only fetch active warnings
     */
    async fetchAllWarnings(activeOnly: boolean = false): Promise<TravelWarning[]> {
      this.loading = true
      this.error = null
      try {
        console.log(`[TravelWarnings] Fetching all warnings (activeOnly: ${activeOnly})`)

        const response = await travelWarningsApi.warningsTravelWarningsGet({
          activeOnly
        })

        const normalized = Array.isArray(response)
          ? response.map(item => normalizeWarning(item)).filter((item): item is TravelWarning => !!item)
          : []

        this.warnings = normalized
        return this.warnings
      } catch (err: unknown) {
        console.error('Failed to fetch all warnings:', err)
        this.error = err instanceof Error ? err.message : 'Failed to fetch warnings'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch travel warning by country code
     * @param countryCode - ISO country code (e.g., 'US', 'DE')
     */
    async fetchWarningByCountryCode(countryCode: string): Promise<TravelWarning | null> {
      this.loading = true
      this.error = null
      try {
        console.log(`[TravelWarnings] Fetching warning for country: ${countryCode}`)

        const response = await travelWarningsApi.warningsTravelWarningsCountryCountryCodeGet({
          countryCode
        })

        const normalized = normalizeWarning(response)
        this.currentWarning = normalized

        // Update in warnings array if exists
        const existingIndex = this.warnings.findIndex(w => w.countryCode === countryCode)
        if (existingIndex >= 0) {
          this.warnings[existingIndex] = normalized || response
        } else if (normalized) {
          this.warnings.push(normalized)
        }

        return normalized
      } catch (err: unknown) {
        console.error(`Failed to fetch warning for country ${countryCode}:`, err)
        this.error = err instanceof Error ? err.message : 'Failed to fetch warning'
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
     * Fetch detailed travel warning with categorized content
     * @param countryCode - ISO country code
     */
    async fetchDetailedWarning(countryCode: string): Promise<DetailedTravelWarning | null> {
      this.loading = true
      this.error = null
      try {
        console.log(`[TravelWarnings] Fetching detailed warning for country: ${countryCode}`)

        const response = await travelWarningsApi.warningsTravelWarningsCountryCountryCodeDetailGet({
          countryCode
        })

        if (response?.warning) {
          response.warning = normalizeWarning(response.warning)
        }

        this.detailedWarning = response
        return response
      } catch (err: unknown) {
        console.error(`Failed to fetch detailed warning for country ${countryCode}:`, err)
        this.error = err instanceof Error ? err.message : 'Failed to fetch detailed warning'
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
     * Fetch travel warning by content ID
     * @param contentId - Auswärtiges Amt content ID
     */
    async fetchWarningByContentId(contentId: string): Promise<TravelWarning | null> {
      this.loading = true
      this.error = null
      try {
        console.log(`[TravelWarnings] Fetching warning for content ID: ${contentId}`)

        const response = await travelWarningsApi.warningsTravelWarningsContentIdGet({
          contentId
        })

        const normalized = normalizeWarning(response)
        this.currentWarning = normalized

        // Update in warnings array if exists
        const existingIndex = this.warnings.findIndex(w => w.contentId === contentId)
        if (existingIndex >= 0) {
          this.warnings[existingIndex] = normalized || response
        } else if (normalized) {
          this.warnings.push(normalized)
        }

        return normalized
      } catch (err: unknown) {
        console.error(`Failed to fetch warning for content ID ${contentId}:`, err)
        this.error = err instanceof Error ? err.message : 'Failed to fetch warning'
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
     * Fetch warnings for multiple countries at once
     * @param countryCodes - Array of ISO country codes
     */
    async fetchBatchWarnings(countryCodes: string[]): Promise<TravelWarning[]> {
      this.loading = true
      this.error = null
      try {
        console.log(`[TravelWarnings] Fetching batch warnings for ${countryCodes.length} countries`)

        const response = await travelWarningsApi.warningsTravelWarningsBatchPost({
          requestBody: countryCodes
        })

        this.batchWarnings = Array.isArray(response) ? response : []

        // Merge into main warnings array
        this.batchWarnings.forEach(warning => {
          const existingIndex = this.warnings.findIndex(w =>
            w.countryCode === warning.countryCode || w.contentId === warning.contentId
          )
          if (existingIndex >= 0) {
            this.warnings[existingIndex] = warning
          } else {
            this.warnings.push(warning)
          }
        })

        return this.batchWarnings
      } catch (err: unknown) {
        console.error('Failed to fetch batch warnings:', err)
        this.error = err instanceof Error ? err.message : 'Failed to fetch batch warnings'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Manually refresh travel warnings from Auswärtiges Amt API
     * This triggers a backend update of the warnings data
     */
    async refreshWarnings(): Promise<void> {
      this.loading = true
      this.error = null
      try {
        console.log('[TravelWarnings] Triggering manual refresh from Auswärtiges Amt API')

        await travelWarningsApi.warningsTravelWarningsRefreshPost()

        // After refresh, fetch updated warnings
        await this.fetchAllWarnings()
      } catch (err: unknown) {
        console.error('Failed to refresh warnings:', err)
        this.error = err instanceof Error ? err.message : 'Failed to refresh warnings'
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Clear current warning
     */
    clearCurrentWarning() {
      this.currentWarning = null
      this.detailedWarning = null
    },

    /**
     * Clear all warnings from state
     */
    clearAllWarnings() {
      this.warnings = []
      this.currentWarning = null
      this.detailedWarning = null
      this.batchWarnings = []
      this.error = null
    },
  },
})
