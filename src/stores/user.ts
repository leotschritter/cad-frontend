import { defineStore } from 'pinia'
import { getApi } from "@/services/api.ts";
import type { ProfileImageUploadResponseDto, UserDto } from "@/api";

const userApi = getApi('UserManagementApi')

export const useUserStore = defineStore('user',{
  state: () => ({
    user: null as UserDto | null,
  }),
  actions: {
    async userRegister(payload: { name: string; email: string }): Promise<UserDto | null> {
      try {
        this.user = await userApi.userRegisterPost({ userDto: payload })
        return this.user
      } catch (err: any) {
        this.user = null
        const status = err?.response?.status
        if (status === 400) {
          return null
        } else {
          throw err
        }
      }
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
    },
    async userUploadProfileImage(payload: { email: string, file: Blob}): Promise<UserDto | null> {
      const email = payload.email;
      try {
        const response = await userApi.userEmailProfileImagePost(payload);
        if (!this.user) {
          this.user = await userApi.userGetGet({ email });
          if (!this.user) return null;
          this.user.profileImageUrl = response.imageUrl ?? undefined;
        } else {
          this.user.profileImageUrl = response.imageUrl ?? undefined;
        }
        return this.user;
      } catch (err: any) {
        if (this.user) {
          this.user.profileImageUrl = undefined;
        }
        const status = err?.response?.status
        if (status === 404) {
          return null
        } else {
          throw err
        }
      }
    },
    async userGetProfileImage(email: string): Promise<UserDto | null> {
      try {
        const response = await userApi.userEmailProfileImageGet({ email });
        if (this.user) {
          this.user.profileImageUrl = response.imageUrl ?? undefined;
          return this.user;
        } else {
          return null;
        }
      } catch (err: any) {
        if (this.user) {
          this.user.profileImageUrl = undefined;
        }
        const status = err?.response?.status
        if (status === 400) {
          return null
        } else {
          throw err
        }
      }
    }
  }
})
