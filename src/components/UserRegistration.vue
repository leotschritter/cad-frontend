<!-- src/components/UserRegistration.vue -->
<script lang="ts">
import { defineComponent } from 'vue'
import { useUserStore } from "@/stores/user.ts";
import { useAuthStore } from "@/stores/auth.ts";
import type { UserDto } from "@/api";
import "vue-router/dist/vue-router";

type RegistrationPayload = {
  name: string
  email: string
}

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
      },
      userStore: (null as any),
      authStore: (null as any),
    }
  },
  methods: {
    // --- rules ---
    required(v: any) { return (!!v || v === 0) || 'Required' },
    emailRule(v: string) { return /.+@.+\..+/.test(v) || 'Invalid email' },

    async onSubmit() {
      this.errorMsg = null
      const formEl = this.$refs.formRef as any
      const res = await formEl?.validate()
      if (!res?.valid) return

      this.loading = true
      let user: UserDto | any = null
      try {
        const payload: RegistrationPayload = {
          name: this.form.firstName + ' ' + this.form.lastName,
          email: this.form.email,
        }
        user = await this.userStore.userRegister(payload)

        formEl.reset()
      } catch (e: any) {
        this.errorMsg = e?.message ?? 'Registration failed'
      } finally {
        if (!user) return
        this.authStore.login(user)
        this.$router.push({
          name: 'home',
          query: { email: user.email },
        })

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
    this.userStore = useUserStore()
    this.authStore = useAuthStore()
  },
  beforeUnmount() {
    // cleanup if needed
  },
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
