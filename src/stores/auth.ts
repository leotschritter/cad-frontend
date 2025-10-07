// src/stores/auth.ts
import { defineStore } from 'pinia'
import type { UserDto } from '@/api'

const KEY = 'auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as UserDto | null,
  }),

  actions: {
    login(user: UserDto) {
      this.user = user
      localStorage.setItem(KEY, JSON.stringify(user))
    },

    /** Load user from localStorage (call once on app start) */
    restore(): boolean {
      const raw = localStorage.getItem(KEY)
      if (!raw) return false
      try {
        this.user = JSON.parse(raw) as UserDto
        return true
      } catch {
        localStorage.removeItem(KEY)
        this.user = null
        return false
      }
    },

    /** Clear everything */
    logout() {
      this.user = null
      localStorage.removeItem(KEY)
    },
  },
})
