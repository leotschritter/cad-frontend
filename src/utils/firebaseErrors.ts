import { FirebaseError } from 'firebase/app';

export function getFirebaseErrorMessage(error: any): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/email-already-in-use':
        return 'This email is already registered';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      case 'auth/expired-action-code':
        return 'This verification link has expired';
      case 'auth/invalid-action-code':
        return 'This verification link is invalid';
      default:
        return `An error occurred: ${error.message}`;
    }
  }
  return error?.message || 'An unknown error occurred. Please try again.';
}
