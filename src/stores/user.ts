import { defineStore } from 'pinia'
import { defaultApi } from "@/services/api.ts";

export const useUserStore = defineStore('user', () => {
  const user = {}

  async function userRegister(userDto: { id: number; name: string; email: string }) {
    await defaultApi.userRegisterPost({userDto})
  }

  return {user}
})
