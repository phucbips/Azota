// =====================================================
// Firebase SDK Imports
// =====================================================
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  getIdTokenResult
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where,
  addDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";

// =====================================================
// Firebase Configuration with Environment Variables
// =====================================================

// Validate required environment variables
const validateFirebaseConfig = () => {
  const required = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN', 
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing Firebase environment variables:', missing);
    return false;
  }
  return true;
};

// Environment-based Firebase config with fallback
const getFirebaseConfig = () => {
  // Try to get from environment variables first
  const envConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
  };

  // Check if all required environment variables are present
  const hasEnvConfig = validateFirebaseConfig();
  
  if (hasEnvConfig) {
    console.log('✅ Using Firebase config from environment variables');
    return envConfig;
  } else {
    // Fallback to hardcoded config for development
    console.warn('⚠️ Using hardcoded Firebase config (development fallback). Please configure environment variables for production.');
    return {
      apiKey: "AIzaSyBLeBmdJ85IhfeJ7sGBHOlSjUmYJ6V_YIY",
      authDomain: "thpt-chi-linh.firebaseapp.com",
      projectId: "thpt-chi-linh",
      storageBucket: "thpt-chi-linh.firebasestorage.app",
      messagingSenderId: "59436766218",
      appId: "1:59436766218:web:8621e33cc12f6129e6fbf3",
      measurementId: "G-442TZLSK9J"
    };
  }
};

const firebaseConfig = getFirebaseConfig();

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// API URL
const VERCEL_API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:3000');

console.log('🔗 Using API URL:', VERCEL_API_URL); 

// Export Firebase instances
export {
  app,
  auth,
  db,
  VERCEL_API_URL,
  // Auth functions
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  getIdTokenResult,
  // Firestore functions
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  serverTimestamp,
  onAuthStateChanged
};