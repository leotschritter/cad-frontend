<script lang="ts">
import { defineComponent } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from "@/stores/user.ts";

export default defineComponent({
  name: 'ProfileView',
  data() {
    return {
      authStore: useAuthStore(),
      userStore: useUserStore(),
      imageFile: null as File | null | undefined,
      imagePreview: null as string | null,
      loading: false,
      successMessage: '',
      errorMessage: ''
    }
  },
  computed: {
    name(): string {
      return this.authStore.user?.name || ''
    },
    email(): string {
      return this.authStore.user?.email || ''
    },
    profileImageUrl(): string {
      return this.authStore.user?.profileImageUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'
    },
    currentProfileImage(): string {
      // Use the preview if available (user selected a new image), otherwise use the profile image URL
      return this.imagePreview || this.profileImageUrl
    },
  },
  mounted() {
    // Initialize the preview with the current profile image
    this.imagePreview = this.profileImageUrl
  },
  methods: {
    onFileChange(event: Event) {
      const target = event.target as HTMLInputElement
      const files = target.files
      if (files && files.length > 0) {
        const file = files[0]
        if (file) {
          this.imageFile = file

          // Create preview
          const reader = new FileReader()
          reader.onload = (e) => {
            this.imagePreview = e.target?.result as string
          }
          reader.readAsDataURL(file)
        }
      }
    },
    triggerFileInput() {
      const fileInput = this.$refs.fileInput as HTMLInputElement
      fileInput?.click()
    },
    async saveProfile() {
      this.loading = true
      this.successMessage = ''
      this.errorMessage = ''

      try {
        if (!this.imageFile) {
          this.errorMessage = 'Please select an image first'
          this.loading = false
          return
        }

        if (!this.email) {
          this.errorMessage = 'User email not found'
          this.loading = false
          return
        }

        // Call the API to upload the profile image
        const updatedUser = await this.userStore.userUploadProfileImage({
          email: this.email,
          file: this.imageFile
        })

        if (updatedUser) {
          // Update the auth store with the new profile image URL
          if (this.authStore.user) {
            this.authStore.user.profileImageUrl = updatedUser.profileImageUrl
            // Persist to localStorage
            this.authStore.login(this.authStore.user)
          }

          // Update preview to show the new uploaded image
          if (updatedUser.profileImageUrl) {
            this.imagePreview = updatedUser.profileImageUrl
          }

          // Clear the file input and reset the hidden file input element
          this.imageFile = null
          const fileInput = this.$refs.fileInput as HTMLInputElement
          if (fileInput) {
            fileInput.value = ''
          }

          this.successMessage = 'Profile picture updated successfully!'
          setTimeout(() => {
            this.successMessage = ''
          }, 3000)
        } else {
          this.errorMessage = 'Failed to update profile picture. Please try again.'
        }
      } catch (error) {
        console.error('Error updating profile:', error)
        this.errorMessage = 'Failed to update profile picture. Please try again.'
      } finally {
        this.loading = false
      }
    },
    resetChanges() {
      this.imagePreview = this.profileImageUrl
      this.imageFile = null
      // Also reset the file input
      const fileInput = this.$refs.fileInput as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    }
  }
})
</script>

<template>
  <v-container fluid class="pa-0">
    <v-toolbar flat color="primary" dark>
      <v-icon class="ml-2 mr-2">mdi-account</v-icon>
      <v-toolbar-title>My Profile</v-toolbar-title>
    </v-toolbar>

    <v-container class="py-6">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <v-card elevation="2" class="profile-card">
            <v-card-text class="pa-6">
              <!-- Success/Error Messages -->
              <v-alert
                v-if="successMessage"
                type="success"
                variant="tonal"
                class="mb-4"
                closable
                @click:close="successMessage = ''"
              >
                {{ successMessage }}
              </v-alert>

              <v-alert
                v-if="errorMessage"
                type="error"
                variant="tonal"
                class="mb-4"
                closable
                @click:close="errorMessage = ''"
              >
                {{ errorMessage }}
              </v-alert>

              <!-- Profile Image Section -->
              <div class="text-center mb-6">
                <v-avatar
                  size="120"
                  class="profile-avatar mb-3"
                >
                  <v-img
                    :src="currentProfileImage"
                    alt="Profile Picture"
                    cover
                  >
                    <template v-slot:placeholder>
                      <v-row class="fill-height ma-0" align="center" justify="center">
                        <v-progress-circular indeterminate color="primary"></v-progress-circular>
                      </v-row>
                    </template>
                  </v-img>
                </v-avatar>

                <div>
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="onFileChange"
                  />
                  <v-btn
                    color="primary"
                    variant="outlined"
                    prepend-icon="mdi-camera"
                    size="small"
                    @click="triggerFileInput"
                  >
                    Change Picture
                  </v-btn>
                </div>
              </div>

              <v-divider class="mb-4"></v-divider>

              <!-- Profile Information -->
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    :model-value="name"
                    label="Name"
                    variant="outlined"
                    prepend-inner-icon="mdi-account"
                    density="comfortable"
                    readonly
                    hide-details
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    :model-value="email"
                    label="Email"
                    type="email"
                    variant="outlined"
                    prepend-inner-icon="mdi-email"
                    density="comfortable"
                    readonly
                    hide-details
                  ></v-text-field>
                </v-col>
              </v-row>

              <!-- Action Buttons -->
              <v-row class="mt-4" v-if="profileImageUrl">
                <v-col cols="12" class="d-flex gap-2">
                  <v-btn
                    color="primary"
                    size="large"
                    prepend-icon="mdi-content-save"
                    @click="saveProfile"
                    :loading="loading"
                    :disabled="loading"
                  >
                    Save Changes
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    size="large"
                    prepend-icon="mdi-refresh"
                    @click="resetChanges"
                    :disabled="loading"
                  >
                    Cancel
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<style scoped>
.profile-card {
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.profile-avatar {
  border: 3px solid #1976d2;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.2);
}

.v-toolbar {
  background: linear-gradient(135deg, #1976d2 0%, #009ffd 100%) !important;
}
</style>
