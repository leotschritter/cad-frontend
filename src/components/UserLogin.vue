<!-- src/components/UserLogin.vue -->
<script lang="ts">
import { defineComponent } from 'vue'
import { useAuthStore } from "@/stores/auth.ts";
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { getApi } from '@/services/api';

export default defineComponent({
  name: 'UserLogin',

  data() {
    return {
      valid: false as boolean,
      loading: false as boolean,
      errorMsg: null as string | null,
      form: {
        email: '',
        password: ''
      },
      authStore: (null as any),
      userApi: getApi('UserManagementApi'),
      showPassword: false
    }
  },

  methods: {
    // rules
    required(v: any) { return (!!v || v === 0) || 'Required' },
    emailRule(v: string) { return /.+@.+\..+/.test(v) || 'Invalid email' },

    async onSubmit() {
      this.errorMsg = null
      const formEl = this.$refs.formRef as any
      const res = await formEl?.validate()
      if (!res?.valid) return

      this.loading = true

      try {
        await this.authStore.login(this.form.email, this.form.password)
        
        // Sync user to backend database if not already there
        // (for users who registered before Firebase migration or missed the sync)
        if (this.authStore.user?.displayName && this.authStore.user?.email) {
          try {
            await this.userApi.userRegisterPost({
              userDto: {
                name: this.authStore.user.displayName,
                email: this.authStore.user.email
              }
            })
          } catch (dbError: any) {
            // Ignore 400 errors (user already exists in database)
            const status = dbError?.response?.status
            if (status !== 400) {
              console.warn('Failed to sync user to backend database:', dbError)
            }
          }
        }
        
        // Email verification disabled - go straight to home
        this.$router.push({ name: 'home' })
      } catch (err: any) {
        this.errorMsg = getFirebaseErrorMessage(err)
      } finally {
        this.loading = false
      }
    },
  },
  mounted() {
    // focus email field explicitly
    this.$nextTick(() => {
      const el = this.$refs.emailField as any
      el?.focus?.()
    })
  },
  created() {
    this.authStore = useAuthStore()
  }
})
</script>

<template>
  <v-container class="py-8" fluid>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card :loading="loading">
          <v-toolbar flat>
            <v-toolbar-title>Login</v-toolbar-title>
          </v-toolbar>

          <v-divider />

          <v-card-text>
            <v-alert
                v-if="errorMsg"
                type="error"
                variant="tonal"
                class="mb-4"
                :text="errorMsg"
                closable
                @click:close="errorMsg = null"
            />

            <v-form ref="formRef" v-model="valid" @submit.prevent="onSubmit">
              <v-text-field
                  ref="emailField"
                  v-model="form.email"
                  label="Email"
                  type="email"
                  :rules="[required, emailRule]"
                  autocomplete="email"
              />

              <v-text-field
                  v-model="form.password"
                  label="Password"
                  :type="showPassword ? 'text' : 'password'"
                  :rules="[required]"
                  autocomplete="current-password"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
              />

              <!-- Forgot Password Link -->
              <div class="text-right mb-2">
                <v-btn variant="text" size="small" :to="{ name: 'password-reset' }">
                  Forgot Password?
                </v-btn>
              </div>

              <div class="d-flex align-center justify-space-between mt-2">
                <!-- Redirect to Register component -->
                <v-btn variant="text" :to="{ name: 'register' }">
                  Create account
                </v-btn>
                <v-btn color="primary" type="submit" :disabled="!valid || loading">
                  Sign in
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
