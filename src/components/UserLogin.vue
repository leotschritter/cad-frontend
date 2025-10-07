<!-- src/components/LoginForm.vue -->
<script lang="ts">
import { defineComponent } from 'vue'
import { useUserStore } from "@/stores/user.ts";
import { useAuthStore } from "@/stores/auth.ts";
import type { UserDto } from "@/api";

export default defineComponent({
  name: 'UserLogin',

  data() {
    return {
      valid: false as boolean,
      loading: false as boolean,
      errorMsg: null as string | null,
      form: {
        email: '',
      },
      userStore: (null as any),
      authStore: (null as any),
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
        const user: UserDto | null = await this.userStore.userLogin(this.form.email)
        if (user) {
          this.authStore.login(user)
          this.$router.push({ name: 'home' })
        } else {
          this.errorMsg = 'User not found'
        }
      } catch (err: any) {
        this.errorMsg = err?.message ?? 'Login failed'
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
    this.userStore = useUserStore()
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
