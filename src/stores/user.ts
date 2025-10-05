import { defineStore } from 'pinia'
import { defaultApi } from "@/services/api.ts";

export const useUserStore = defineStore('user', () => {
  const user = {}

  async function userRegister() {
    const userDto = {
      id: "1",
      name: "John Doe",
      email: "john@doe.com",
    }
    await defaultApi.userRegisterPost({userDto})
  }

  return {user}
})
