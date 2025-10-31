import * as Crypto from 'expo-crypto';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    User
} from 'firebase/auth';
import {
    doc,
    getDoc,
    setDoc,
    Timestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Hash password using SHA-256
export const hashPassword = async (password: string): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password
  );
};

// Verify password
export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  const newHash = await hashPassword(password);
  return newHash === hashedPassword;
};

// User data interface
export interface UserData {
  email: string;
  hashedPassword: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
}

// Sign up new user
// export const signUp = async (email: string, password: string): Promise<User> => {
//   try {
//     // Create user with Firebase Auth (Firebase will handle the password securely)
//     const userCredential = await createUserWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;

//     // Hash the password for Firestore storage
//     const hashedPassword = await hashPassword(password);

//     // Create user document in Firestore
//     const userData: UserData = {
//       email: user.email!,
//       hashedPassword: hashedPassword,
//       createdAt: Timestamp.now(),
//     };

//     await setDoc(doc(db, 'accounts', user.uid), userData);

//     return user;
//   } catch (error: any) {
//     console.error('Error signing up:', error);
//     throw new Error(error.message || 'Failed to sign up');
//   }
// };

// Sign in user
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login timestamp in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      await setDoc(userDocRef, { lastLogin: Timestamp.now() }, { merge: true });
    }

    return user;
  } catch (error: any) {
    console.error('Error signing in:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign out user
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
