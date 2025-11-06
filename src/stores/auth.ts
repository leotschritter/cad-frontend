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
            
            // Fetch profile image URL from backend (non-blocking)
            // Don't let backend errors prevent auth initialization
            this.fetchProfileImageUrl().catch(err => {
              console.warn('Profile image fetch failed during auth init, but auth initialized:', err);
            });
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
        
        // Fetch profile image URL from backend (non-blocking)
        // Don't let backend errors prevent login
        this.fetchProfileImageUrl().catch(err => {
          console.warn('Profile image fetch failed during login, but login succeeded:', err);
        });
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
      if (!this.user) {
        const error = 'Cannot send verification email: No user is currently signed in';
        console.error(error);
        throw new Error(error);
      }
      
      if (this.user.emailVerified) {
        console.warn('Email is already verified, skipping verification email');
        return;
      }

      try {
        console.log('Sending verification email to:', this.user.email);
        
        // Note: actionCodeSettings requires the domain to be allowlisted in Firebase Console
        // Go to Firebase Console → Authentication → Settings → Authorized domains
        // Add: localhost (for development) and your production domain
        const actionCodeSettings = {
          url: window.location.origin + '/verify-email',
          handleCodeInApp: false
        };
        
        await sendEmailVerification(this.user, actionCodeSettings);
        console.log('Verification email sent successfully');
      } catch (error: any) {
        console.error('Failed to send verification email:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        throw new Error(`Failed to send verification email: ${error.message || error}`);
      }
    },

    /**
     * Reload the current user to check email verification status
     */
    async reloadUser(): Promise<void> {
      if (this.user) {
        await this.user.reload();
        this.user = auth.currentUser;
        
        // Refresh profile image URL from backend (non-blocking)
        // Don't let backend errors prevent user reload
        this.fetchProfileImageUrl().catch(err => {
          console.warn('Profile image fetch failed during user reload, but reload succeeded:', err);
        });
      }
    },

    /**
     * Fetch profile image URL from backend
     */
    async fetchProfileImageUrl(): Promise<void> {
      // Only attempt to fetch if we have a user
      if (!this.user) {
        this.profileImageUrl = null;
        return;
      }

      try {
        const userStore = useUserStore();
        this.profileImageUrl = await userStore.userGetProfileImage();
        console.log('Profile image fetched successfully');
      } catch (error: any) {
        // Backend errors should not break the auth flow
        // Silently fail - don't spam console on every poll
        this.profileImageUrl = null;
      }
    }
  }
});
