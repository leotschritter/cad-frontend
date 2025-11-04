<script lang="ts">
import { defineComponent } from 'vue'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/config/firebase'
import { getFirebaseErrorMessage } from '@/utils/firebaseErrors'

export default defineComponent({
  name: 'PasswordResetView',

  data() {
    return {
      valid: false as boolean,
      loading: false as boolean,
      errorMsg: null as string | null,
      successMsg: null as string | null,
      email: ''
    }
  },

  methods: {
    required(v: any) { return (!!v || v === 0) || 'Required' },
    emailRule(v: string) { return /.+@.+\..+/.test(v) || 'Invalid email' },

    async onSubmit() {
      this.errorMsg = null
      this.successMsg = null
      
      const formEl = this.$refs.formRef as any
      const res = await formEl?.validate()
      if (!res?.valid) return

      this.loading = true

      try {
        await sendPasswordResetEmail(auth, this.email)
        this.successMsg = 'Password reset email sent! Check your inbox.'
        this.email = '' // Clear the form
      } catch (err: any) {
        this.errorMsg = getFirebaseErrorMessage(err)
      } finally {
        this.loading = false
      }
    },
  },

  mounted() {
    this.$nextTick(() => {
      const el = this.$refs.emailField as any
      el?.focus?.()
    })
  }
})
</script>

<template>
  <v-container class="py-8" fluid>
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card :loading="loading">
          <v-toolbar flat color="primary">
            <v-icon class="mr-2">mdi-lock-reset</v-icon>
            <v-toolbar-title class="text-white">Reset Password</v-toolbar-title>
          </v-toolbar>

          <v-divider />

          <v-card-text>
            <v-alert
                v-if="successMsg"
                type="success"
                variant="tonal"
                class="mb-4"
                :text="successMsg"
                closable
                @click:close="successMsg = null"
            />

            <v-alert
                v-if="errorMsg"
                type="error"
                variant="tonal"
                class="mb-4"
                :text="errorMsg"
                closable
                @click:close="errorMsg = null"
            />

            <p class="text-body-2 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <v-form ref="formRef" v-model="valid" @submit.prevent="onSubmit">
              <v-text-field
                  ref="emailField"
                  v-model="email"
                  label="Email"
                  type="email"
                  :rules="[required, emailRule]"
                  autocomplete="email"
                  prepend-inner-icon="mdi-email"
              />

              <div class="d-flex align-center justify-space-between mt-4">
                <v-btn variant="text" :to="{ name: 'login' }">
                  <v-icon class="mr-1">mdi-arrow-left</v-icon>
                  Back to Login
                </v-btn>
                <v-btn color="primary" type="submit" :disabled="!valid || loading">
                  Send Reset Link
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

