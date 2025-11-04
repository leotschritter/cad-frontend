<!-- src/components/UserRegistration.vue -->
<script lang="ts">
import { defineComponent } from 'vue'
import { useAuthStore } from "@/stores/auth.ts";
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors';
import { getApi } from '@/services/api';

export default defineComponent({
  name: 'UserRegistration',

  data() {
    return {
      valid: false as boolean,
      loading: false as boolean,
      errorMsg: null as string | null,
      form: {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      authStore: (null as any),
      userApi: getApi('UserManagementApi'),
      showPassword: false,
      showConfirmPassword: false
    }
  },
  methods: {
    // --- rules ---
    required(v: any) { return (!!v || v === 0) || 'Required' },
    emailRule(v: string) { return /.+@.+\..+/.test(v) || 'Invalid email' },
    passwordMinLength(v: string) { return v.length >= 6 || 'Password must be at least 6 characters' },
    passwordsMatch(v: string) { return v === this.form.password || 'Passwords do not match' },

    async onSubmit() {
      this.errorMsg = null
      const formEl = this.$refs.formRef as any
      const res = await formEl?.validate()
      if (!res?.valid) return

      this.loading = true

      try {
        const displayName = `${this.form.firstName} ${this.form.lastName}`
        
        // 1. Register with Firebase (creates Firebase Auth user)
        await this.authStore.register(this.form.email, this.form.password, displayName)
        
        // 2. Create user in backend database (for profile images, etc.)
        try {
          await this.userApi.userRegisterPost({
            userDto: {
              name: displayName,
              email: this.form.email
            }
          })
        } catch (dbError: any) {
          // Log but don't fail - Firebase user is already created
          console.warn('Failed to sync user to backend database:', dbError)
        }
        
        // 3. Send verification email
        await this.authStore.sendVerificationEmail()
        
        // 4. Redirect to verification page
        this.$router.push({ name: 'verify-email' })
      } catch (err: any) {
        this.errorMsg = getFirebaseErrorMessage(err)
      } finally {
        this.loading = false
      }
    },
  },
  mounted() {
    // explicit lifecycle hook: focus first field
    this.$nextTick(() => {
      const first = this.$refs.firstNameField as any
      first?.focus?.()
    })
  },
  created() {
    // initialize store
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
            <v-toolbar-title>Register</v-toolbar-title>
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
                  ref="firstNameField"
                  v-model="form.firstName"
                  label="First name"
                  :rules="[required]"
                  autocomplete="given-name"
              />
              <v-text-field
                  v-model="form.lastName"
                  label="Last name"
                  :rules="[required]"
                  autocomplete="family-name"
              />
              <v-text-field
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
                  :rules="[required, passwordMinLength]"
                  autocomplete="new-password"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
              />
              <v-text-field
                  v-model="form.confirmPassword"
                  label="Confirm Password"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :rules="[required, passwordsMatch]"
                  autocomplete="new-password"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
              />

              <div class="d-flex align-center justify-end mt-2">
                <v-btn color="primary" type="submit" :disabled="!valid || loading">
                  Create account
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
