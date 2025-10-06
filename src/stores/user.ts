import { defineStore } from 'pinia'
import { getApi } from "@/services/api.ts";

export const useUserStore = defineStore('user', () => {
  const user = {}
  const userApi = getApi('UserManagementApi')

  async function userRegister(userDto: { name: string; email: string }) {
    await userApi.userRegisterPost({ userDto })
  }

  return { user, userRegister }
})
