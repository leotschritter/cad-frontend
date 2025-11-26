<template>
  <v-card class="comprehensive-safety-info">
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-avatar :color="getSeverityColor(warning?.warningLevel)" size="40" class="mr-3">
          <v-icon color="white">mdi-shield-alert</v-icon>
        </v-avatar>
        <div class="flex-1">
          <div class="text-h5">{{ countryName }}</div>
          <div class="text-caption text-grey">
            Last updated: {{ formatDate(warning?.lastModified) }}
          </div>
        </div>
        <v-btn
          icon="mdi-refresh"
          variant="text"
          @click="refresh"
          :loading="loading"
        ></v-btn>
      </div>
      <v-btn
        icon="mdi-close"
        variant="text"
        @click="closeDialog"
      ></v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <!-- Loading State with Skeleton -->
    <div v-if="loading" class="pa-4">
      <div class="text-center mb-6">
        <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
        <p class="mt-3 text-body-1">Loading safety information...</p>
      </div>

      <!-- Skeleton Loader for Summary -->
      <v-skeleton-loader
        type="article, article"
        class="mb-4"
      ></v-skeleton-loader>

      <!-- Skeleton Loader for Categories -->
      <v-skeleton-loader
        type="list-item-three-line, list-item-three-line, list-item-three-line"
      ></v-skeleton-loader>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" class="ma-4">
      {{ error }}
    </v-alert>

    <!-- Content -->
    <div v-else-if="warning">
      <!-- Quick Summary Section (User Story 2) -->
      <v-card-text>
        <v-alert
          :type="getAlertType(warning.warningLevel)"
          :color="getSeverityColor(warning.warningLevel)"
          variant="tonal"
          prominent
          border="start"
          class="mb-4"
        >
          <template #prepend>
            <v-icon size="40">{{ getSeverityIcon(warning.warningLevel) }}</v-icon>
          </template>

          <v-alert-title class="text-h6 mb-2">
            {{ warning.warningLevel || 'Travel Advisory' }}
          </v-alert-title>

          <!-- What Changed -->
          <div class="mb-3">
            <h4 class="font-weight-bold mb-2">
              <v-icon size="20" class="mr-1">mdi-clipboard-text</v-icon>
              Current Situation
            </h4>
            <p class="text-body-1">{{ warning.situation || 'No specific situation details available' }}</p>
          </div>

          <!-- When -->
          <div class="mb-3">
            <h4 class="font-weight-bold mb-2">
              <v-icon size="20" class="mr-1">mdi-clock-outline</v-icon>
              Last Updated
            </h4>
            <p>{{ formatDetailedDate(warning.lastModified) }}</p>
          </div>

          <!-- Recommended Actions -->
          <div v-if="quickActions.length > 0">
            <h4 class="font-weight-bold mb-2">
              <v-icon size="20" class="mr-1">mdi-lightbulb-on</v-icon>
              Recommended Actions
            </h4>
            <v-chip-group column>
              <v-chip
                v-for="(action, index) in quickActions"
                :key="index"
                size="small"
                variant="outlined"
                prepend-icon="mdi-chevron-right"
              >
                {{ action }}
              </v-chip>
            </v-chip-group>
          </div>
        </v-alert>

        <!-- Comprehensive Categories Overview (User Story 3) -->
        <h3 class="text-h6 mb-3 mt-6">
          <v-icon class="mr-2">mdi-file-document-multiple</v-icon>
          Comprehensive Safety Categories
        </h3>

        <v-expansion-panels variant="accordion" multiple>
          <!-- Security Category -->
          <v-expansion-panel v-if="hasCategory('security')">
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-avatar color="error" size="32" class="mr-3">
                  <v-icon color="white" size="18">mdi-shield-alert</v-icon>
                </v-avatar>
                <span class="font-weight-medium">Security</span>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="category-content" v-html="sanitizeHtml(getCategoryContent('security'))"></div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Nature & Climate Category -->
          <v-expansion-panel v-if="hasCategory('natureAndClimate')">
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-avatar color="green" size="32" class="mr-3">
                  <v-icon color="white" size="18">mdi-weather-partly-cloudy</v-icon>
                </v-avatar>
                <span class="font-weight-medium">Nature & Climate</span>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="category-content" v-html="sanitizeHtml(getCategoryContent('natureAndClimate'))"></div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- General Travel Information -->
          <v-expansion-panel v-if="hasCategory('travelInfo')">
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-avatar color="blue" size="32" class="mr-3">
                  <v-icon color="white" size="18">mdi-information</v-icon>
                </v-avatar>
                <span class="font-weight-medium">Travel Information</span>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="category-content" v-html="sanitizeHtml(getCategoryContent('travelInfo'))"></div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Entry Requirements -->
          <v-expansion-panel v-if="hasCategory('documentsAndCustoms')">
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-avatar color="purple" size="32" class="mr-3">
                  <v-icon color="white" size="18">mdi-passport</v-icon>
                </v-avatar>
                <span class="font-weight-medium">Documents & Customs</span>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="category-content" v-html="sanitizeHtml(getCategoryContent('documentsAndCustoms'))"></div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Health Information -->
          <v-expansion-panel v-if="hasCategory('health')">
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-avatar color="red-lighten-1" size="32" class="mr-3">
                  <v-icon color="white" size="18">mdi-medical-bag</v-icon>
                </v-avatar>
                <span class="font-weight-medium">Health</span>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="category-content" v-html="sanitizeHtml(getCategoryContent('health'))"></div>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Other Information -->
          <v-expansion-panel v-if="hasCategory('others')">
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-avatar color="grey" size="32" class="mr-3">
                  <v-icon color="white" size="18">mdi-dots-horizontal</v-icon>
                </v-avatar>
                <span class="font-weight-medium">Other Information</span>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="category-content" v-html="sanitizeHtml(getCategoryContent('others'))"></div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Detailed Parsed Sections (shows ALL content from HTML) -->
        <div v-if="parsedSections.length > 0" class="mt-6">
          <h3 class="text-h6 mb-4">
            <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
            Detailed Information by Section
          </h3>

          <v-expansion-panels variant="accordion">
            <v-expansion-panel
              v-for="(section, index) in parsedSections"
              :key="index"
            >
              <v-expansion-panel-title>
                <div class="d-flex align-center">
                  <v-icon v-if="section.icon" class="mr-3" :color="section.level === 2 ? 'primary' : 'grey'">
                    {{ section.icon }}
                  </v-icon>
                  <span :class="section.level === 2 ? 'font-weight-bold' : 'font-weight-medium'">
                    {{ section.title }}
                  </span>
                </div>
              </v-expansion-panel-title>

              <v-expansion-panel-text>
                <div v-html="sanitizeHtml(section.content)" class="category-content"></div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Official Source Link -->
      <v-card-actions class="pa-4">
        <v-btn
          variant="outlined"
          color="primary"
          prepend-icon="mdi-open-in-new"
          @click="openOfficialAdvisory"
          block
          size="large"
        >
          View Full Official Travel Advisory
        </v-btn>
      </v-card-actions>

      <!-- Emergency Contacts -->
      <v-card-text class="pt-0">
        <v-alert type="info" variant="tonal" density="compact">
          <v-alert-title>
            <v-icon class="mr-2">mdi-phone</v-icon>
            Emergency Contacts
          </v-alert-title>
          <p class="text-body-2 mt-2">
            In case of emergency, contact your country's embassy or consulate in {{ countryName }}.
          </p>
        </v-alert>
      </v-card-text>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useTravelWarningsStore } from '@/stores/travelWarnings'

interface Props {
  countryCode: string
  countryName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const warningsStore = useTravelWarningsStore()
const warning = ref<any>(null)
const detailedWarning = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)

function closeDialog() {
  emit('close')
}

interface ContentSection {
  title: string
  level: number // 2 for h2, 3 for h3
  content: string
  icon?: string
}

const parsedSections = computed<ContentSection[]>(() => {
  if (!detailedWarning.value?.content) return []

  const parser = new DOMParser()
  const doc = parser.parseFromString(detailedWarning.value.content, 'text/html')
  const sections: ContentSection[] = []

  // Get all h2 and h3 elements
  const headings = doc.querySelectorAll('h2, h3, h4')

  headings.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1))
    const title = heading.textContent?.trim() || ''

    // Skip empty or very short titles
    if (!title || title.length < 3) return

    // Get content until next heading
    let content = ''
    let currentElement = heading.nextElementSibling

    while (currentElement && !['H2', 'H3', 'H4'].includes(currentElement.tagName)) {
      content += currentElement.outerHTML
      currentElement = currentElement.nextElementSibling
    }

    if (content.trim()) {
      sections.push({
        title,
        level,
        content: content.trim(),
        icon: getSectionIcon(title, level)
      })
    }
  })

  return sections
})

const getSectionIcon = (title: string, level: number): string => {
  const lowerTitle = title.toLowerCase()

  // Main sections (h2)
  if (level === 2) {
    if (lowerTitle.includes('aktuell')) return 'mdi-newspaper-variant-outline'
    if (lowerTitle.includes('sicherheit') || lowerTitle.includes('security')) return 'mdi-shield-alert'
    if (lowerTitle.includes('natur') || lowerTitle.includes('klima') || lowerTitle.includes('nature')) return 'mdi-weather-partly-cloudy'
    if (lowerTitle.includes('reiseinfo') || lowerTitle.includes('travel')) return 'mdi-airplane-takeoff'
    if (lowerTitle.includes('einreise') || lowerTitle.includes('zoll') || lowerTitle.includes('entry')) return 'mdi-passport'
    if (lowerTitle.includes('gesundheit') || lowerTitle.includes('health')) return 'mdi-medical-bag'
  }

  // War and conflict (h3/h4)
  if (lowerTitle.includes('kampf') || lowerTitle.includes('krieg') || lowerTitle.includes('war') || lowerTitle.includes('combat')) return 'mdi-bomb'
  if (lowerTitle.includes('angriff') || lowerTitle.includes('attack') || lowerTitle.includes('luftangriff')) return 'mdi-airplane-alert'
  if (lowerTitle.includes('mobilmach') || lowerTitle.includes('mobilization')) return 'mdi-account-alert'
  if (lowerTitle.includes('mine') || lowerTitle.includes('munition') || lowerTitle.includes('sprengfall')) return 'mdi-mine'
  if (lowerTitle.includes('ausgangssp') || lowerTitle.includes('curfew')) return 'mdi-clock-alert'

  // Subsections (h3/h4)
  if (lowerTitle.includes('terror')) return 'mdi-alert-octagon'
  if (lowerTitle.includes('kriminal') || lowerTitle.includes('crime')) return 'mdi-alert-circle'
  if (lowerTitle.includes('feuer') || lowerTitle.includes('brand') || lowerTitle.includes('fire')) return 'mdi-fire'
  if (lowerTitle.includes('erdbeben') || lowerTitle.includes('earthquake')) return 'mdi-waves'
  if (lowerTitle.includes('vulkan') || lowerTitle.includes('volcano')) return 'mdi-volcano'
  if (lowerTitle.includes('sturm') || lowerTitle.includes('hurricane') || lowerTitle.includes('storm')) return 'mdi-weather-hurricane'
  if (lowerTitle.includes('verkehr') || lowerTitle.includes('traffic') || lowerTitle.includes('infrastruktur')) return 'mdi-car'
  if (lowerTitle.includes('maut') || lowerTitle.includes('toll')) return 'mdi-cash-multiple'
  if (lowerTitle.includes('führerschein') || lowerTitle.includes('license')) return 'mdi-card-account-details'
  if (lowerTitle.includes('impf') || lowerTitle.includes('vaccin')) return 'mdi-needle'
  if (lowerTitle.includes('dengue') || lowerTitle.includes('malaria')) return 'mdi-bug'
  if (lowerTitle.includes('hiv') || lowerTitle.includes('aids')) return 'mdi-virus'
  if (lowerTitle.includes('tollwut') || lowerTitle.includes('rabies')) return 'mdi-dog'
  if (lowerTitle.includes('radioaktiv') || lowerTitle.includes('tschernobyl') || lowerTitle.includes('chernobyl')) return 'mdi-radioactive'
  if (lowerTitle.includes('dokument') || lowerTitle.includes('document') || lowerTitle.includes('visum')) return 'mdi-file-document'
  if (lowerTitle.includes('minderjährig') || lowerTitle.includes('minor') || lowerTitle.includes('kinder')) return 'mdi-account-child'
  if (lowerTitle.includes('tier') || lowerTitle.includes('pet') || lowerTitle.includes('animal')) return 'mdi-paw'
  if (lowerTitle.includes('lgbtiq')) return 'mdi-human-male-female'
  if (lowerTitle.includes('geld') || lowerTitle.includes('money') || lowerTitle.includes('kredit') || lowerTitle.includes('devisen')) return 'mdi-credit-card'
  if (lowerTitle.includes('fahrzeug') || lowerTitle.includes('vehicle') || lowerTitle.includes('kfz')) return 'mdi-car-multiple'
  if (lowerTitle.includes('kulturgut') || lowerTitle.includes('ausfuhr') || lowerTitle.includes('export')) return 'mdi-package-variant'
  if (lowerTitle.includes('krim') || lowerTitle.includes('crimea') || lowerTitle.includes('donezk') || lowerTitle.includes('luhansk')) return 'mdi-map-marker-alert'
  if (lowerTitle.includes('innenpolit') || lowerTitle.includes('domestic')) return 'mdi-home-alert'

  // Default icons by level
  if (level === 2) return 'mdi-book-open-page-variant'
  if (level === 3) return 'mdi-chevron-right'
  return 'mdi-circle-small'
}


const quickActions = computed(() => {
  const level = (warning.value?.warningLevel || '').toLowerCase()
  if (level === 'none') {
    return ['Safe to travel', 'Review general travel advice', 'Keep documents ready']
  } else if (level.includes('critical') || level.includes('4')) {
    return ['Avoid all travel', 'Contact embassy', 'Review insurance']
  } else if (level.includes('severe') || level.includes('3')) {
    return ['Reconsider travel', 'Register with embassy', 'Have exit plan']
  } else if (level.includes('moderate') || level.includes('2')) {
    return ['Exercise caution', 'Stay informed', 'Keep documents secure']
  }
  return ['Normal precautions', 'Stay aware', 'Emergency contacts ready']
})

onMounted(async () => {
  await loadWarningData()
})

watch(() => props.countryCode, async () => {
  await loadWarningData()
})

async function loadWarningData() {
  loading.value = true
  error.value = null

  try {
    // Load basic warning
    warning.value = await warningsStore.fetchWarningByCountryCode(props.countryCode)

    // Load detailed categorized warning
    detailedWarning.value = await warningsStore.fetchDetailedWarning(props.countryCode)
  } catch (err) {
    console.error('Failed to load warning data:', err)
    error.value = 'Failed to load safety information'
  } finally {
    loading.value = false
  }
}

async function refresh() {
  await loadWarningData()
}

function hasCategory(category: string): boolean {
  if (!detailedWarning.value?.categories) return false
  const content = detailedWarning.value.categories[category]
  return content && content.length > 0
}

function getCategoryContent(category: string): string {
  if (!detailedWarning.value?.categories) return ''
  return detailedWarning.value.categories[category] || ''
}

function sanitizeHtml(html: string): string {
  if (!html) return '<p class="text-grey">No information available</p>'

  // Basic HTML sanitization and formatting
  return html
    // Remove potentially dangerous tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Ensure links open in new tab
    .replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ')
    // Add spacing for readability
    .replace(/<p>/g, '<p class="mb-3">')
    .replace(/<ul/g, '<ul class="ml-4 mb-3"')
    .replace(/<li>/g, '<li class="mb-1">')
    .replace(/<h2>/g, '<h2 class="text-h6 font-weight-bold mt-4 mb-2">')
    .replace(/<h3>/g, '<h3 class="text-subtitle-1 font-weight-bold mt-3 mb-2">')
    .replace(/<h4>/g, '<h4 class="text-subtitle-2 font-weight-medium mt-2 mb-1">')
}

function getSeverityColor(level: string): string {
  const l = (level || '').toLowerCase()
  if (l === 'none') return 'success'
  if (l.includes('critical') || l.includes('extreme') || l.includes('4')) return 'error'
  if (l.includes('severe') || l.includes('high') || l.includes('3')) return 'deep-orange'
  if (l.includes('moderate') || l.includes('medium') || l.includes('2')) return 'warning'
  return 'info'
}

function getSeverityIcon(level: string): string {
  const l = (level || '').toLowerCase()
  if (l === 'none') return 'mdi-check-circle'
  if (l.includes('critical') || l.includes('extreme')) return 'mdi-alert-octagon'
  if (l.includes('severe') || l.includes('high')) return 'mdi-alert'
  if (l.includes('moderate') || l.includes('medium')) return 'mdi-alert-circle'
  return 'mdi-information'
}

function getAlertType(level: string): 'error' | 'warning' | 'info' | 'success' {
  const l = (level || '').toLowerCase()
  if (l === 'none') return 'success'
  if (l.includes('critical') || l.includes('extreme')) return 'error'
  if (l.includes('severe') || l.includes('high')) return 'warning'
  return 'info'
}

function formatDate(date: any): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function formatDetailedDate(date: any): string {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function openOfficialAdvisory() {
  if (!detailedWarning.value) return
  const url = detailedWarning.value.officialLink
  window.open(url, '_blank')
}
</script>

<style scoped>
.comprehensive-safety-info {
  max-width: 900px;
}

.category-content {
  line-height: 1.6;
}

.category-content :deep(p) {
  margin-bottom: 1rem;
}

.category-content :deep(ul) {
  margin-left: 1.5rem;
  margin-bottom: 1rem;
  list-style-type: disc;
}

.category-content :deep(li) {
  margin-bottom: 0.5rem;
}

.category-content :deep(h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: rgb(33, 33, 33);
}

.category-content :deep(h3) {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  color: rgb(66, 66, 66);
}

.category-content :deep(h4) {
  font-size: 1rem;
  font-weight: 500;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
  color: rgb(97, 97, 97);
}

.category-content :deep(a) {
  color: rgb(25, 118, 210);
  text-decoration: none;
}

.category-content :deep(a:hover) {
  text-decoration: underline;
}

.category-content :deep(strong) {
  font-weight: 600;
}

.category-content :deep(blockquote) {
  border-left: 4px solid rgb(158, 158, 158);
  padding-left: 1rem;
  margin: 1rem 0;
  color: rgb(97, 97, 97);
}
</style>

