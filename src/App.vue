<script lang="ts">
import { RouterView } from 'vue-router'
import { defineComponent } from "vue";
import { useAuthStore } from "@/stores/auth.ts";

export default defineComponent({
  name: 'App',
  components: {
    RouterView
  },
  mounted() {
    const auth = useAuthStore()
    auth.restore()
    // Keep tabs in sync (logout everywhere when one tab logs out)
    window.addEventListener('storage', (e) => {
      if (e.key === 'auth' && e.newValue === null) {
        auth.logout()
      }
    })
  }
})
</script>

<template>
  <v-app>
    <v-navigation-drawer
        expand-on-hover
        permanent
        rail
    >
      <v-list>
        <v-list-item
            prepend-avatar="https://randomuser.me/api/portraits/women/85.jpg"
            subtitle="sandra_a88@gmailcom"
            title="Sandra Adams"
        ></v-list-item>
      </v-list>

      <v-divider />

      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-home" title="Home" to="/" />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar flat>
      <v-app-bar-title>Travel App</v-app-bar-title>
    </v-app-bar>

    <v-main style="min-height: 100vh; min-width: 100%">
      <router-view v-slot="{ Component }">
        <v-fade-transition mode="out-in">
          <component :is="Component" />
        </v-fade-transition>
      </router-view>
    </v-main>
  </v-app>
</template>