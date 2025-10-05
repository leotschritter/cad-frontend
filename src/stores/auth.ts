// src/stores/auth.ts
import { defineStore } from 'pinia'
import { setWithExpiry, getWithExpiry, removeItem } from '@/utils/ttlStorage'
// import router from '@/router' // optional

type User = { email: string }
type AuthPayload = { token: string; user: User }
const KEY = 'auth'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    exp: 0 as number,
    _timer: 0 as number | undefined
  }),

  actions: {
    login(payload: AuthPayload, ttlMs: number) {
      this.user = payload.user
      this.token = payload.token
      this.exp = Date.now() + ttlMs
      setWithExpiry(KEY, { ...payload, exp: this.exp }, ttlMs)
      this._scheduleLogout()
    },

    restore(): boolean {
      const saved = getWithExpiry<{ token: string; user: User; exp: number }>(KEY)
      if (!saved) return false
      this.user = saved.user
      this.token = saved.token
      this.exp = saved.exp
      this._scheduleLogout()
      return true
    },

    logout() {
      this.user = null
      this.token = null
      this.exp = 0
      if (this._timer) window.clearTimeout(this._timer)
      removeItem(KEY)
      // router.push('/login') // uncomment if you want redirect
    },

    _scheduleLogout() {
      if (this._timer) window.clearTimeout(this._timer)
      const ms = Math.max(0, this.exp - Date.now())
      this._timer = window.setTimeout(() => this.logout(), ms)
    }
  }
})
