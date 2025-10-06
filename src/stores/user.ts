import { defineStore } from 'pinia'
import { getApi } from "@/services/api.ts";
import type { UserDto } from "@/api";

export const useUserStore = defineStore('user', () => {
  const user = {}
  const userApi = getApi('UserManagementApi')

  async function userRegister(userDto: { name: string; email: string }): Promise<UserDto> {
    return userApi.userRegisterPost({ userDto })
  }

  return { user, userRegister }
})
