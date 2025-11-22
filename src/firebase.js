import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDcpdPA6LA3jFt4cPAe-idewxR-Eij77ZY",
    authDomain: "flash-speaking.firebaseapp.com",
    projectId: "flash-speaking",
    storageBucket: "flash-speaking.firebasestorage.app",
    messagingSenderId: "280904626874",
    appId: "1:280904626874:web:0d495d2fbf1dca0a46c883",
    measurementId: "G-4F1ENVYCGR"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'flash-speaking';
