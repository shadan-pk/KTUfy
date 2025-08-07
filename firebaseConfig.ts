import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Try to import environment variables, fallback to hardcoded values
let FIREBASE_API_KEY = "AIzaSyAmY_IqguUIlHKJeJtenCC3LLvqVh-0N_w";
let FIREBASE_AUTH_DOMAIN = "ktufy-8428e.firebaseapp.com";
let FIREBASE_PROJECT_ID = "ktufy-8428e";
let FIREBASE_STORAGE_BUCKET = "ktufy-8428e.firebasestorage.app";
let FIREBASE_MESSAGING_SENDER_ID = "1043675641047";
let FIREBASE_APP_ID = "1:1043675641047:web:728321a7a7cd6eb159ec92";
let FIREBASE_MEASUREMENT_ID = "G-4Q4E331XCF";

// Try to load from environment variables
try {
  const env = require('@env');
  if (env.FIREBASE_API_KEY) {
    FIREBASE_API_KEY = env.FIREBASE_API_KEY;
    FIREBASE_AUTH_DOMAIN = env.FIREBASE_AUTH_DOMAIN;
    FIREBASE_PROJECT_ID = env.FIREBASE_PROJECT_ID;
    FIREBASE_STORAGE_BUCKET = env.FIREBASE_STORAGE_BUCKET;
    FIREBASE_MESSAGING_SENDER_ID = env.FIREBASE_MESSAGING_SENDER_ID;
    FIREBASE_APP_ID = env.FIREBASE_APP_ID;
    FIREBASE_MEASUREMENT_ID = env.FIREBASE_MEASUREMENT_ID;
  }
} catch (error) {
  console.log('Using fallback Firebase configuration');
}

// Firebase configuration
const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;