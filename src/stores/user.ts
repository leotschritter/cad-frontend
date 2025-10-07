import { defineStore } from 'pinia'
import { getApi } from "@/services/api.ts";
import type { UserDto } from "@/api";

const userApi = getApi('UserManagementApi')

export const useUserStore = defineStore('user',{
  state: () => ({
    user: null as UserDto | null,
  }),
  actions: {
    async userRegister(payload: { name: string; email: string }): Promise<UserDto> {
      this.user = userApi.userRegisterPost({ payload })
      return this.user
    },
    async userLogin(email: string): Promise<UserDto | null> {
      try {
        this.user = await userApi.userGetGet({ email })
        return this.user
      } catch (err: any) {
        this.user = null
        const status = err?.response?.status
        if (status === 404) {
          return null
        } else {
          throw err
        }
      }
    }
  }
})
