// src/stores/auth.ts
import { defineStore } from 'pinia'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User
} from 'firebase/auth'
import { auth } from '@/config/firebase'
import { useUserStore } from '@/stores/user'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    idToken: null as string | null,
    profileImageUrl: null as string | null,
    loading: false,
    error: null as string | null,
    initialized: false
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
    isEmailVerified: (state) => state.user?.emailVerified ?? false,
    getIdToken: (state) => state.idToken,
    getProfileImageUrl: (state) => state.profileImageUrl || 'https://randomuser.me/api/portraits/lego/1.jpg'
  },

  actions: {
    /**
     * Initialize Firebase auth listener
     * Call this once on app startup
     */
    async initializeAuth(): Promise<void> {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          this.user = firebaseUser;
          if (firebaseUser) {
            this.idToken = await firebaseUser.getIdToken();
            // Fetch profile image URL from backend
            await this.fetchProfileImageUrl();
          } else {
            this.idToken = null;
            this.profileImageUrl = null;
          }
          this.initialized = true;
          resolve();
        });
      });
    },

    /**
     * Register a new user with email and password
     */
    async register(email: string, password: string, displayName: string): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update the user profile with display name
        await updateProfile(userCredential.user, {
          displayName: displayName
        });

        // Reload to get updated profile
        await userCredential.user.reload();
        this.user = auth.currentUser;
        this.idToken = await userCredential.user.getIdToken();
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Login with email and password
     */
    async login(email: string, password: string): Promise<void> {
      this.loading = true;
      this.error = null;
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        this.user = userCredential.user;
        this.idToken = await userCredential.user.getIdToken();
        // Fetch profile image URL from backend
        await this.fetchProfileImageUrl();
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Logout the current user
     */
    async logout(): Promise<void> {
      this.loading = true;
      try {
        await signOut(auth);
        this.user = null;
        this.idToken = null;
        this.profileImageUrl = null;
      } catch (error: any) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Refresh the ID token
     */
    async refreshToken(): Promise<void> {
      if (this.user) {
        this.idToken = await this.user.getIdToken(true);
      }
    },

    /**
     * Send email verification to the current user
     */
    async sendVerificationEmail(): Promise<void> {
      if (this.user && !this.user.emailVerified) {
        await sendEmailVerification(this.user);
      }
    },

    /**
     * Reload the current user to check email verification status
     */
    async reloadUser(): Promise<void> {
      if (this.user) {
        await this.user.reload();
        this.user = auth.currentUser;
        // Refresh profile image URL from backend
        await this.fetchProfileImageUrl();
      }
    },

    /**
     * Fetch profile image URL from backend
     */
    async fetchProfileImageUrl(): Promise<void> {
      try {
        const userStore = useUserStore();

        this.profileImageUrl = await userStore.userGetProfileImage();
      } catch (error) {
        console.error('Error fetching profile image URL:', error);
        this.profileImageUrl = null;
      }
    }
  }
});
