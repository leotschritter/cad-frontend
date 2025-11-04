<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const loading = ref(false);
const error = ref<string | null>(null);
const resendCooldown = ref(0);
const checkInterval = ref<number | null>(null);

// Check email verification status
const checkVerification = async () => {
  try {
    await authStore.reloadUser();
    if (authStore.isEmailVerified) {
      router.push('/');
    }
  } catch (err) {
    console.error('Error checking verification:', err);
  }
};

// Resend verification email
const resendEmail = async () => {
  if (resendCooldown.value > 0) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    await authStore.sendVerificationEmail();
    resendCooldown.value = 60;
    
    const countdown = setInterval(() => {
      resendCooldown.value--;
      if (resendCooldown.value <= 0) {
        clearInterval(countdown);
      }
    }, 1000);
  } catch (err: any) {
    error.value = err?.message || 'Failed to send verification email';
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  // Check verification status every 3 seconds
  checkInterval.value = window.setInterval(checkVerification, 3000);
});

onUnmounted(() => {
  if (checkInterval.value) {
    clearInterval(checkInterval.value);
  }
});
</script>

<template>
  <v-container class="py-8" fluid>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card>
          <v-toolbar flat color="primary">
            <v-toolbar-title class="text-white">
              <v-icon class="mr-2">mdi-email-check</v-icon>
              Verify Your Email
            </v-toolbar-title>
          </v-toolbar>

          <v-divider />

          <v-card-text>
            <v-alert
              type="info"
              variant="tonal"
              class="mb-4"
              icon="mdi-information-outline"
            >
              After clicking the link in your email, you will be automatically redirected to the app.
            </v-alert>

            <v-alert
              v-if="error"
              type="error"
              variant="tonal"
              class="mb-4"
              :text="error"
              closable
              @click:close="error = null"
            />

            <div class="text-body-1 mb-4">
              <p>We've sent a verification email to:</p>
              <p class="font-weight-bold text-primary">{{ authStore.user?.email }}</p>
            </div>

            <v-divider class="my-4" />

            <div class="d-flex flex-column gap-2">
              <v-btn
                color="primary"
                variant="outlined"
                :disabled="resendCooldown > 0 || loading"
                @click="resendEmail"
                block
              >
                <v-icon class="mr-2">mdi-email-fast</v-icon>
                {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email' }}
              </v-btn>

              <v-btn
                color="secondary"
                variant="outlined"
                @click="checkVerification"
                :loading="loading"
                block
              >
                <v-icon class="mr-2">mdi-refresh</v-icon>
                Check Verification Status
              </v-btn>

              <v-btn
                variant="text"
                @click="authStore.logout().then(() => router.push('/login'))"
                block
              >
                <v-icon class="mr-2">mdi-logout</v-icon>
                Logout
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.gap-2 {
  gap: 0.5rem;
}
</style>
