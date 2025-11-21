import { defineStore } from 'pinia'
import { getApi } from "@/services/api.ts";

const userApi = getApi('UserManagementApi')

export const useUserStore = defineStore('user',{
  state: () => ({
    // This store is no longer needed for authentication (Firebase handles that)
    // But keeping it for profile image management
  }),
  actions: {
    async userUploadProfileImage(payload: { file: Blob}): Promise<string | null> {
      try {
        const response = await userApi.userProfileImagePost({ file: payload.file });
        return response.imageUrl ?? null;
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 404) {
          return null
        } else {
          throw err
        }
      }
    },
    async userGetProfileImage(): Promise<string | null> {
      try {
        const response = await userApi.userProfileImageGet();
        return response.imageUrl ?? null;
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 400 || status === 404) {
          return null
        } else {
          throw err
        }
      }
    },
    async getUserProfileImageByEmail(email: string): Promise<string | null> {
      try {
        const response = await userApi.userEmailProfileImageGet({ email });
        return response.imageUrl ?? null;
      } catch (err: any) {
        const status = err?.response?.status
        if (status === 400 || status === 404) {
          return null
        } else {
          throw err
        }
      }
    }
  }
})
