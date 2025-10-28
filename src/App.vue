<script lang="ts">
import { RouterView } from 'vue-router'
import { defineComponent } from "vue";
import { useAuthStore } from "@/stores/auth.ts";
import AppFooter from "@/components/AppFooter.vue";
import logo from '@/assets/images/tripico-logo.png'

export default defineComponent({
  name: 'App',
  data() {
    return {
      authStore: null as any,
      logo: logo
    }
  },
  components: {
    AppFooter,
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
    },
    getProfileImageUrl(): string {
      return this.authStore?.user?.profileImageUrl ?? 'https://randomuser.me/api/portraits/lego/1.jpg'
    },
    isLoggedIn(): boolean {
      return this.authStore?.user != null;
    }
  },
  methods: {
    logout() {
      this.authStore.logout();
      this.$router.push({ name: 'login' });
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
        class="navigation-drawer-styles"
    >
      <v-list>
        <v-list-item
            :prepend-avatar="getProfileImageUrl"
            :subtitle="getEmail"
            :title="getName"
            class="user-profile-item"
            @click="$router.push('/profile')"
        >
          <template v-slot:append>
            <v-icon class="edit-icon">mdi-pencil</v-icon>
          </template>
        </v-list-item>
      </v-list>

      <v-divider />

      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-routes" title="My Itineraries" to="/" />
        <v-list-item prepend-icon="mdi-magnify" title="Search Itineraries" to="/search" />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar class="app-bar-styles" flat>
      <v-img
          :src="logo"
          max-height="60"
          max-width="60"
          class="ml-4"
          contain
      />
      <v-app-bar-title class="d-flex align-center">
        <span class="brand-name">Tripico</span>
        <span class="brand-slogan ml-2">– Discover. Share. Feel.</span>
      </v-app-bar-title>

      <v-spacer />
      <v-btn v-if="isLoggedIn" prepend-icon="mdi-logout" variant="text" @click="logout">
        Logout
      </v-btn>
    </v-app-bar>

    <v-main style="min-height: 100vh; min-width: 100%">
      <router-view v-slot="{ Component }">
        <v-fade-transition mode="out-in">
          <component :is="Component" />
        </v-fade-transition>
      </router-view>
    </v-main>

    <AppFooter />
  </v-app>
</template>

<style scoped>
.navigation-drawer-styles {
  /*background-color: #1976d2;*/
  background-color: rgb(238, 238, 238);
  color: black;
}
.app-bar-styles {
  background-color: rgb(238, 238, 238);
  color: black;
}

@font-face {
  font-family: 'Mouldism';
  src: url('@/assets/fonts/D3MouldismR.TTF') format('truetype');
  font-weight: normal;
  font-style: normal;
}

.brand-name {
  font-family: 'Mouldism', sans-serif;
  font-weight: normal;
  font-size: 1.8rem;
  letter-spacing: 1.5px;
  color: #1976d2;
}

.brand-slogan {
  font-family: 'Quicksand', sans-serif;
  font-weight: 400;
  font-size: 0.95rem;
  color: #666;
  font-style: italic;
}

.user-profile-item {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.user-profile-item:hover {
  background-color: rgba(25, 118, 210, 0.08);
}

.user-profile-item .edit-icon {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.user-profile-item:hover .edit-icon {
  opacity: 1;
}
</style>
