<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
  domainPattern: string
  ctaText: string
  isPopular?: boolean
  color: string
  isCurrent?: boolean
}

// Detect current domain and environment
const currentDomain = ref(window.location.hostname)
const currentTier = ref<string | null>(null)
const tenantNumber = ref<string | null>(null)

const detectCurrentTier = () => {
  const hostname = currentDomain.value

  // Freemium detection
  if (hostname.includes('frontend-freemium.dev.tripico.fun')) {
    currentTier.value = 'freemium'
    return
  }
  if (hostname.includes('frontend-freemium.tripico.fun')) {
    currentTier.value = 'freemium'
    return
  }

  // Standard detection (with tenant number)
  const standardDevMatch = hostname.match(/frontend-standard-(\d+)\.dev\.tripico\.fun/)
  if (standardDevMatch) {
    currentTier.value = 'standard'
    tenantNumber.value = standardDevMatch[1]
    return
  }

  const standardProdMatch = hostname.match(/frontend-standard-(\d+)\.tripico\.fun/)
  if (standardProdMatch) {
    currentTier.value = 'standard'
    tenantNumber.value = standardProdMatch[1]
    return
  }

  // Enterprise detection (custom subdomain)
  const enterpriseDevMatch = hostname.match(/^([a-z0-9-]+)\.dev\.tripico\.fun$/)
  const enterpriseProdMatch = hostname.match(/^([a-z0-9-]+)\.tripico\.fun$/)

  if (enterpriseDevMatch && !hostname.includes('frontend-freemium') && !hostname.includes('frontend-standard')) {
    currentTier.value = 'enterprise'
    return
  }
  if (enterpriseProdMatch && !hostname.includes('frontend-freemium') && !hostname.includes('frontend-standard')) {
    currentTier.value = 'enterprise'
    return
  }

  // Default/localhost
  currentTier.value = null
}

onMounted(() => {
  detectCurrentTier()
})

const tiers = computed<PricingTier[]>(() => [
  {
    name: 'Freemium',
    price: 'Free',
    description: 'Perfect for trying out Tripico',
    features: [
      'Itinerary planning',
      'Weather & Travel warnings (shared)',
      'Intelligent recommendations',
      'Limited resources',
      'Shared namespace'
    ],
    domainPattern: 'frontend-freemium.tripico.fun',
    ctaText: currentTier.value === 'freemium' ? 'Current Plan' : 'Get Started',
    color: 'grey',
    isCurrent: currentTier.value === 'freemium'
  },
  {
    name: 'Standard',
    price: '$x.xx',
    description: 'For regular travelers',
    features: [
      'Itinerary planning',
      'Weather & travel warnings (shared)',
      'Intelligent recommendations',
      'Dedicated namespace (standard-N)',
      'Higher resources',
      'Priority support'
    ],
    domainPattern: tenantNumber.value
      ? `frontend-standard-${tenantNumber.value}.tripico.fun`
      : 'frontend-standard-{N}.tripico.fun',
    ctaText: currentTier.value === 'standard' ? 'Current Plan' : 'Subscribe Now',
    isPopular: true,
    color: 'primary',
    isCurrent: currentTier.value === 'standard'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For organizations & teams',
    features: [
      'Custom subdomain',
      'Fully isolated namespace & resources',
      'Dedicated microservices (no shared)',
      'Auto-scaling & load balancing',
      'Private VPC & firewall rules',
      'Custom resource allocation',
      'Dedicated DevOps support'
    ],
    domainPattern: 'frontend.{your-company}.tripico.fun',
    ctaText: currentTier.value === 'enterprise' ? 'Current Plan' : 'Subscribe Now',
    color: 'secondary',
    isCurrent: currentTier.value === 'enterprise'
  }
])

const enterpriseDialog = ref(false)
const enterpriseForm = ref({
  companyName: '',
  email: ''
})
const loading = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const handleTierSelect = async (tier: PricingTier) => {
  // If already on this tier, do nothing
  if (tier.isCurrent) {
    snackbarMessage.value = `You are already on the ${tier.name} plan`
    snackbarColor.value = 'info'
    snackbar.value = true
    return
  }

  // Enterprise can be requested without login
  if (tier.name === 'Enterprise') {
    enterpriseDialog.value = true
    return
  }

  if (!authStore.isAuthenticated) {
    // Save intended tier and redirect to login
    sessionStorage.setItem('intendedTier', tier.name.toLowerCase())
    router.push('/login')
    return
  }

  // Ask for tenant number for Standard tier
  if (tier.name === 'Standard') {
    const nextTenantNumber = await promptForTenantNumber()
    if (!nextTenantNumber) return

    // Mock provisioning for Standard
    loading.value = true
    try {
      await mockProvisionTenant(tier, nextTenantNumber)
      const domain = `frontend-standard-${nextTenantNumber}.tripico.fun`
      snackbarMessage.value = `Successfully subscribed to ${tier.name} plan! Redirecting to ${domain}...`
      snackbarColor.value = 'success'
      snackbar.value = true

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = `https://${domain}`
      }, 2000)
    } catch (error) {
      snackbarMessage.value = 'Failed to provision your instance. Please try again.'
      snackbarColor.value = 'error'
      snackbar.value = true
    } finally {
      loading.value = false
    }
    return
  }

  // Mock provisioning for Freemium
  loading.value = true
  try {
    await mockProvisionTenant(tier)
    const domain = 'frontend-freemium.tripico.fun'
    snackbarMessage.value = `Successfully subscribed to ${tier.name} plan! Redirecting to ${domain}...`
    snackbarColor.value = 'success'
    snackbar.value = true

    // Redirect after 2 seconds
    setTimeout(() => {
      window.location.href = `https://${domain}`
    }, 2000)
  } catch (error) {
    snackbarMessage.value = 'Failed to provision your instance. Please try again.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

const tenantNumberDialog = ref(false)
const selectedTenantNumber = ref('1')

const promptForTenantNumber = (): Promise<string | null> => {
  return new Promise((resolve) => {
    tenantNumberDialog.value = true
    const checkInterval = setInterval(() => {
      if (!tenantNumberDialog.value) {
        clearInterval(checkInterval)
        resolve(selectedTenantNumber.value || null)
      }
    }, 100)
  })
}

const mockProvisionTenant = async (tier: PricingTier, tenantNum?: string) => {
  // Mock API call - will be replaced with real provisioning service
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('Provisioning tenant for tier:', tier.name)
      console.log('User:', authStore.user?.email)
      if (tenantNum) {
        console.log('Tenant Number:', tenantNum)
        console.log('Domain:', `frontend-standard-${tenantNum}.tripico.fun`)
      } else {
        console.log('Domain:', tier.domainPattern)
      }
      resolve(true)
    }, 1500)
  })
}

const submitEnterpriseRequest = async () => {
  if (!enterpriseForm.value.companyName || !enterpriseForm.value.email) {
    snackbarMessage.value = 'Please fill in all required fields'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  // Validate company name format (will be used as subdomain)
  const domainRegex = /^[a-z0-9-]+$/i
  if (!domainRegex.test(enterpriseForm.value.companyName)) {
    snackbarMessage.value = 'Company name must contain only letters, numbers, and hyphens'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  loading.value = true
  try {
    await mockEnterpriseRequest()
    const subdomain = enterpriseForm.value.companyName.toLowerCase()
    const domain = `frontend.${subdomain}.tripico.fun`
    snackbarMessage.value = `Successfully subscribed to Enterprise plan! Redirecting to ${domain}...`
    snackbarColor.value = 'success'
    snackbar.value = true
    enterpriseDialog.value = false

    // Reset form
    enterpriseForm.value = {
      companyName: '',
      email: ''
    }

    // Redirect after 2 seconds
    setTimeout(() => {
      window.location.href = `https://${domain}`
    }, 2000)
  } catch (error) {
    snackbarMessage.value = 'Failed to provision your instance. Please try again.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

const mockEnterpriseRequest = async () => {
  // Mock API call - will be replaced with real provisioning service
  return new Promise((resolve) => {
    setTimeout(() => {
      const subdomain = enterpriseForm.value.companyName.toLowerCase()
      console.log('Provisioning Enterprise tenant for:', enterpriseForm.value.companyName)
      console.log('User:', enterpriseForm.value.email)
      console.log('Domain:', `frontend.${subdomain}.tripico.fun`)
      resolve(true)
    }, 1500)
  })
}
</script>

<template>
  <v-container class="py-8">
    <v-row>
      <v-col cols="12">
        <div class="text-center mb-8">
          <h1 class="text-h3 font-weight-bold mb-4">Choose Your Plan</h1>
          <p class="text-h6 text-medium-emphasis">
            Select the perfect plan for your travel needs
          </p>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="tier in tiers"
        :key="tier.name"
        cols="12"
        md="4"
      >
        <v-card
          :class="{ 'border-primary': tier.isPopular }"
          :elevation="tier.isPopular ? 8 : 2"
          class="h-100 d-flex flex-column"
        >
          <v-card-item>
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="text-h5">{{ tier.name }}</span>
              <div class="d-flex gap-2">
                <v-chip
                  v-if="tier.isPopular"
                  color="primary"
                  size="small"
                  variant="flat"
                >
                  Popular
                </v-chip>
                <v-chip
                  v-if="tier.isCurrent"
                  color="success"
                  size="small"
                  variant="flat"
                >
                  Current
                </v-chip>
              </div>
            </v-card-title>
            <v-card-subtitle class="mt-2">{{ tier.description }}</v-card-subtitle>
          </v-card-item>

          <v-card-text class="flex-grow-1">
            <div class="text-h3 font-weight-bold mb-2">
              {{ tier.price }}
              <span v-if="tier.price !== 'Free' && tier.price !== 'Custom'" class="text-body-1 text-medium-emphasis">/month</span>
            </div>

            <v-divider class="my-4"></v-divider>

            <div class="mb-4">
              <div class="text-subtitle-2 text-medium-emphasis mb-2">Included Features:</div>
              <div
                v-for="feature in tier.features"
                :key="feature"
                class="d-flex align-center mb-2"
              >
                <v-icon color="success" size="small" class="mr-2">mdi-check-circle</v-icon>
                <span class="text-body-2">{{ feature }}</span>
              </div>
            </div>

            <div class="text-caption text-medium-emphasis">
              <v-icon size="small" class="mr-1">mdi-web</v-icon>
              {{ tier.domainPattern }}
            </div>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-btn
              :color="tier.isCurrent ? 'success' : tier.color"
              :variant="tier.isPopular && !tier.isCurrent ? 'flat' : 'outlined'"
              :loading="loading"
              block
              size="large"
              @click="handleTierSelect(tier)"
            >
              <v-icon v-if="tier.isCurrent" start>mdi-check</v-icon>
              {{ tier.ctaText }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tenant Number Selection Dialog -->
    <v-dialog
      v-model="tenantNumberDialog"
      max-width="400"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h5">Select Tenant Number</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="tenantNumberDialog = false; selectedTenantNumber = '1'"
          ></v-btn>
        </v-card-title>

        <v-card-text>
          <v-text-field
            v-model="selectedTenantNumber"
            label="Tenant Number"
            type="number"
            variant="outlined"
            required
            prepend-inner-icon="mdi-numeric"
            hint="Choose a unique tenant number (e.g., 1, 2, 3)"
            persistent-hint
            min="1"
            class="mb-3"
          ></v-text-field>

          <v-alert
            type="info"
            variant="tonal"
            density="compact"
          >
            <div class="text-caption">
              Your instance will be available at: <strong>frontend-standard-{{ selectedTenantNumber }}.tripico.fun</strong>
            </div>
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="tenantNumberDialog = false; selectedTenantNumber = '1'"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="tenantNumberDialog = false"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Enterprise Request Dialog -->
    <v-dialog
      v-model="enterpriseDialog"
      max-width="600"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h5">Enterprise Plan Request</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="enterpriseDialog = false"
          ></v-btn>
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-text-field
              v-model="enterpriseForm.companyName"
              label="Company Name"
              variant="outlined"
              required
              prepend-inner-icon="mdi-domain"
              prefix="frontend."
              suffix=".tripico.fun"
              hint="Will be used as your subdomain (e.g., 'Triden' → frontend.triden.tripico.fun)"
              persistent-hint
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="enterpriseForm.email"
              label="Contact Email"
              type="email"
              variant="outlined"
              required
              prepend-inner-icon="mdi-email"
              class="mb-3"
            ></v-text-field>
          </v-form>

          <v-alert
            type="info"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            <div class="text-caption">
              Your dedicated instance will be provisioned on a custom subdomain with dedicated GKE resources.
            </div>
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="enterpriseDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="submitEnterpriseRequest"
          >
            Subscribe Now
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar"
      :color="snackbarColor"
      :timeout="4000"
      location="top"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>
