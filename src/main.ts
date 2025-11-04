import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { vuetify } from "./plugins/vuetify.ts";
import { useAuthStore } from '@/stores/auth';

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

// Initialize Firebase auth before mounting the app
const authStore = useAuthStore()
authStore.initializeAuth().then(() => {
  app.mount('#app')
})
