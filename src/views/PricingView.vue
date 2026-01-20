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
const standardDialog = ref(false)
const enterpriseForm = ref({
  enterpriseName: '',
  ownerEmail: '',
  ownerPassword: ''
})
const standardForm = ref({
  ownerEmail: '',
  ownerPassword: ''
})
const loading = ref(false)
const snackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Tenant API base URL
const tenantApiBaseUrl = 'https://tenant.tripico.fun'

// Generate UUID for standard tenant name
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

const handleTierSelect = async (tier: PricingTier) => {
  // If already on this tier, do nothing
  if (tier.isCurrent) {
    snackbarMessage.value = `You are already on the ${tier.name} plan`
    snackbarColor.value = 'info'
    snackbar.value = true
    return
  }

  // Standard and Enterprise can be requested without login (they have their own registration form)
  if (tier.name === 'Standard') {
    standardDialog.value = true
    return
  }

  if (tier.name === 'Enterprise') {
    enterpriseDialog.value = true
    return
  }

  // Freemium requires login
  if (!authStore.isAuthenticated) {
    sessionStorage.setItem('intendedTier', tier.name.toLowerCase())
    router.push('/login')
    return
  }

  // Freemium doesn't need tenant creation - redirect to freemium domain
  const domain = 'frontend-freemium.tripico.fun'
  snackbarMessage.value = `Redirecting to ${tier.name} plan at ${domain}...`
  snackbarColor.value = 'info'
  snackbar.value = true

  setTimeout(() => {
    window.location.href = `https://${domain}`
  }, 2000)
}

// Create tenant via API
const createTenant = async (payload: {
  name: string
  ownerEmail: string
  ownerPassword: string
  tier: 'STANDARD' | 'ENTERPRISE'
  enterpriseName?: string
}) => {
  const response = await fetch(`${tenantApiBaseUrl}/api/v1/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Failed to create tenant')
  }

  return response.json()
}

// Submit Standard plan request
const submitStandardRequest = async () => {
  if (!standardForm.value.ownerEmail || !standardForm.value.ownerPassword) {
    snackbarMessage.value = 'Please fill in all required fields'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(standardForm.value.ownerEmail)) {
    snackbarMessage.value = 'Please enter a valid email address'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  loading.value = true
  try {
    const tenantName = generateUUID()
    const response = await createTenant({
      name: tenantName,
      ownerEmail: standardForm.value.ownerEmail,
      ownerPassword: standardForm.value.ownerPassword,
      tier: 'STANDARD'
    })

    snackbarMessage.value = response.message || 'Your Standard tenant is being created!'
    snackbarColor.value = 'success'
    snackbar.value = true
    standardDialog.value = false

    // Reset form
    standardForm.value = {
      ownerEmail: '',
      ownerPassword: ''
    }
  } catch (error: any) {
    snackbarMessage.value = error.message || 'Failed to create tenant. Please try again.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

// Submit Enterprise plan request
const submitEnterpriseRequest = async () => {
  if (!enterpriseForm.value.enterpriseName || !enterpriseForm.value.ownerEmail || !enterpriseForm.value.ownerPassword) {
    snackbarMessage.value = 'Please fill in all required fields'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  // Validate enterprise name format (will be used as subdomain)
  const domainRegex = /^[a-z0-9-]+$/i
  if (!domainRegex.test(enterpriseForm.value.enterpriseName)) {
    snackbarMessage.value = 'Enterprise name must contain only letters, numbers, and hyphens'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(enterpriseForm.value.ownerEmail)) {
    snackbarMessage.value = 'Please enter a valid email address'
    snackbarColor.value = 'error'
    snackbar.value = true
    return
  }

  loading.value = true
  try {
    const enterpriseName = enterpriseForm.value.enterpriseName.toLowerCase()
    const response = await createTenant({
      name: enterpriseName,
      ownerEmail: enterpriseForm.value.ownerEmail,
      ownerPassword: enterpriseForm.value.ownerPassword,
      tier: 'ENTERPRISE',
      enterpriseName: enterpriseName
    })

    snackbarMessage.value = response.message || 'Your Enterprise tenant is being created!'
    snackbarColor.value = 'success'
    snackbar.value = true
    enterpriseDialog.value = false

    // Reset form
    enterpriseForm.value = {
      enterpriseName: '',
      ownerEmail: '',
      ownerPassword: ''
    }
  } catch (error: any) {
    snackbarMessage.value = error.message || 'Failed to create tenant. Please try again.'
    snackbarColor.value = 'error'
    snackbar.value = true
  } finally {
    loading.value = false
  }
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

    <!-- Standard Plan Registration Dialog -->
    <v-dialog
      v-model="standardDialog"
      max-width="500"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h5">Standard Plan Registration</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="standardDialog = false"
          ></v-btn>
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-text-field
              v-model="standardForm.ownerEmail"
              label="Email"
              type="email"
              variant="outlined"
              required
              prepend-inner-icon="mdi-email"
              hint="Your email address for account access"
              persistent-hint
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="standardForm.ownerPassword"
              label="Password"
              type="password"
              variant="outlined"
              required
              prepend-inner-icon="mdi-lock"
              hint="Choose a secure password"
              persistent-hint
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
              After registration, you will receive an email once your deployment is ready.
            </div>
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="standardDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="submitStandardRequest"
          >
            Register
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Enterprise Plan Registration Dialog -->
    <v-dialog
      v-model="enterpriseDialog"
      max-width="600"
      persistent
    >
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span class="text-h5">Enterprise Plan Registration</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="enterpriseDialog = false"
          ></v-btn>
        </v-card-title>

        <v-card-text>
          <v-form>
            <v-text-field
              v-model="enterpriseForm.enterpriseName"
              label="Enterprise Name (Subdomain)"
              variant="outlined"
              required
              prepend-inner-icon="mdi-domain"
              suffix=".tripico.fun"
              hint="Your subdomain - only lowercase letters, numbers, and hyphens allowed"
              persistent-hint
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="enterpriseForm.ownerEmail"
              label="Email"
              type="email"
              variant="outlined"
              required
              prepend-inner-icon="mdi-email"
              hint="Your email address for account access"
              persistent-hint
              class="mb-3"
            ></v-text-field>

            <v-text-field
              v-model="enterpriseForm.ownerPassword"
              label="Password"
              type="password"
              variant="outlined"
              required
              prepend-inner-icon="mdi-lock"
              hint="Choose a secure password"
              persistent-hint
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
              After registration, you will receive an email once your dedicated enterprise deployment is ready.
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
            Register
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
