import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { Analytics, getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyAO8weBesmOc9jd-e47LNxW9EZI3gLV9l8",
    authDomain: "project-mpxuqomb.firebaseapp.com",
    projectId: "project-mpxuqomb",
    storageBucket: "project-mpxuqomb.firebasestorage.app",
    messagingSenderId: "105533544715",
    appId: "1:105533544715:web:beba33cfd3d69e38be2a0e",
    measurementId: ""
};

const app = initializeApp(firebaseConfig);

export let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export const storage = getStorage(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
