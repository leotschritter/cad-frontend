import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { useAuthStore } from "@/stores/auth.ts";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      meta: { requiresAuth: true },
      component: HomeView,
    },
    {
      path: '/search',
      name: 'search',
      meta: { requiresAuth: true },
      component: () => import('../views/SearchItinerariesView.vue'),
    },
    {
      path: '/feed',
      name: 'feed',
      meta: { requiresAuth: true },
      component: () => import('../views/FeedView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      meta: { requiresAuth: true },
      component: () => import('../views/ProfileView.vue'),
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      meta: { requiresAuth: true, skipVerification: true },
      component: () => import('../views/EmailVerificationView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      meta: { requiresGuest: true },
      component: () => import('../components/UserRegistration.vue'),
    },
    {
      path: '/login',
      name: 'login',
      meta: { requiresGuest: true },
      component: () => import('../components/UserLogin.vue'),
    },
    {
      path: '/password-reset',
      name: 'password-reset',
      meta: { requiresGuest: true },
      component: () => import('../views/PasswordResetView.vue'),
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Wait for Firebase auth to initialize
  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }

  const isAuthenticated = authStore.isAuthenticated
  const isEmailVerified = authStore.isEmailVerified
  const requiresAuth = to.meta.requiresAuth
  const requiresGuest = to.meta.requiresGuest
  const skipVerification = to.meta.skipVerification

  // Redirect to login if route requires auth and user is not authenticated
  if (requiresAuth && !isAuthenticated) {
    return next('/login')
  }

  // Redirect to home if route requires guest and user is authenticated
  if (requiresGuest && isAuthenticated) {
    return next('/')
  }

  // Email verification disabled - users can log in without verifying
  // Uncomment below to re-enable email verification requirement:
  // if (isAuthenticated && !isEmailVerified && !skipVerification) {
  //   return next('/verify-email')
  // }

  next()
})

export default router
