import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from "@/stores/auth.ts";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // meta: { requiresAuth: true },
      component: HomeView,
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../components/UserRegistration.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../components/UserLogin.vue'),
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.token) return next('/login')
  next()
})

export default router
