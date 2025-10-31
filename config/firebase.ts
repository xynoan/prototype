import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
// TODO: Replace with your actual Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDXofPV3M-1irWFJOLCRmeTi_z_jImU13g",
  authDomain: "violationledger-3c82b.firebaseapp.com",
  projectId: "violationledger-3c82b",
  storageBucket: "violationledger-3c82b.firebasestorage.app",
  messagingSenderId: "993907612909",
  appId: "1:993907612909:web:6f496567b2f92aaf7480e4",
  measurementId: "G-F6969LJS4C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);

export default app;