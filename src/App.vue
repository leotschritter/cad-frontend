<script lang="ts">
import { RouterView } from 'vue-router'
import { defineComponent } from "vue";
import { useAuthStore } from "@/stores/auth.ts";

export default defineComponent({
  name: 'App',
  data() {
    return {
      authStore: null as any
    }
  },
  components: {
    RouterView
  },
  mounted() {
    this.authStore = useAuthStore()
    this.authStore.restore()
  },
  computed: {
    getEmail(): string {
      return this.authStore?.user?.email ?? 'Log in to see email'
    },
    getName(): string {
      return this.authStore?.user?.name ?? 'Log in to see name'
    }
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
            prepend-avatar="https://randomuser.me/api/portraits/lego/1.jpg"
            :subtitle="getEmail"
            :title="getName"
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