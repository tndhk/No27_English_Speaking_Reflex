import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDcpdPA6LA3jFt4cPAe-idewxR-Eij77ZY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "flash-speaking.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "flash-speaking",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "flash-speaking.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "280904626874",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:280904626874:web:0d495d2fbf1dca0a46c883",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-4F1ENVYCGR"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'flash-speaking';
