<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'AppFooter',
  data() {
    return {
      teamName: 'Bermuda Dreieck',
      projectName: 'Travel App',
      team: [
        { name: 'Benedikt Scheffel',   email: 'be121sch@htwg-konstanz.de' },
        { name: 'Dennis Hoang',      email: 'de121hoa@htwg-konstanz.de' },
        { name: 'Leo Tschritter',   email: 'le121tsc@htwg-konstanz.de' },
      ],
      repos: [
        { label: 'Frontend', url: 'https://github.com/leotschritter/cad-frontend' },
        { label: 'Backend',  url: 'https://github.com/leotschritter/cad-backend'  },
      ],
      year: new Date().getFullYear(),
    }
  },
})
</script>

<template>
  <v-footer app elevation="0" border="t" class="footer-styles pa-6">
    <v-container fluid>
      <v-row>
        <!-- Brand / Tagline -->
        <v-col cols="12" md="4" class="d-flex flex-column justify-center mb-4 mb-md-0">
          <div class="text-h6 mb-1">{{ projectName }}</div>
          <div class="text-body-2 opacity-80">
            This App is driven by:
          </div>

          <div class="mt-4 d-flex align-center ga-2">
            <v-icon>mdi-vuejs</v-icon>
            <span>Vue 3</span>
            <v-icon>mdi-vuetify</v-icon>
            <span>Vuetify</span>
            <v-icon>mdi-language-java</v-icon>
            <span>Java</span>
          </div>
        </v-col>

        <!-- Team contacts -->
        <v-col cols="12" md="4">
          <div class="text-subtitle-1 mb-2">Contacts</div>
          <v-list density="compact" bg-color="transparent" class="text-white">
            <v-list-item
                v-for="m in team"
                :key="m.email"
                :title="m.name"
                prepend-icon="mdi-account"
                class="rounded-lg"
            >
              <!-- render subtitle yourself so the button can sit right next to the email -->
              <template #subtitle>
                <div class="subtitle-inline">
                  <span class="email-text">{{ m.email }}</span>
                  <v-btn
                      :href="`mailto:${m.email}`"
                      density="compact"
                      size="x-small"
                      variant="text"
                      icon
                      aria-label="Email"
                      class="email-btn"
                  >
                    <v-icon icon="mdi-email-outline" />
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-col>

        <!-- Repos -->
        <v-col cols="12" md="4">
          <div class="text-subtitle-1 mb-2">Repositories</div>
          <v-list density="compact" bg-color="transparent" class="text-white">
            <v-list-item
                v-for="r in repos"
                :key="r.url"
                :title="r.label"
                :href="r.url"
                target="_blank"
                rel="noopener"
                prepend-icon="mdi-github"
                class="rounded-lg"
            />
          </v-list>
        </v-col>
      </v-row>

      <v-divider class="my-4" color="white" opacity="0.2" />

      <div class="d-flex flex-wrap align-center justify-space-between">
        <div class="text-body-2 opacity-80">
          © {{ year }} • {{ teamName }}
        </div>
      </div>
    </v-container>
  </v-footer>
</template>

<style scoped>
.footer-styles {
  background: linear-gradient(135deg, #1976d2 0%, #009ffd 100%);
  color: white;
  position: absolute;
}

.opacity-80 { opacity: .8; }

.subtitle-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;          /* tighten spacing */
}

.email-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* stays tidy on narrow screens */
}

/* optional: make the tiny icon button visually tighter */
.email-btn {
  margin-inline-start: 2px;
}

</style>
