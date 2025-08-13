// Firebase Configuration for React Native
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDgbUwnnlEK2nH5DFMVYNDJAslBwDN_-Tc",
  authDomain: "ourchecksplitter.firebaseapp.com",
  projectId: "ourchecksplitter",
  storageBucket: "ourchecksplitter.firebasestorage.app",
  messagingSenderId: "998611774052",
  appId: "1:998611774052:web:11d59ba60fe86448c7cd71",
  measurementId: "G-KDPF83DE5F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with AsyncStorage for persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export default app;