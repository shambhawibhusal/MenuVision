import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyDRDg8Yy03lP9YI7eey9F-3-H49kiEjLTs",
    authDomain: "menuvision-9acfc.firebaseapp.com",
    projectId: "menuvision-9acfc",
    storageBucket: "menuvision-9acfc.appspot.com", // fixed here
    messagingSenderId: "299254178564",
    appId: "1:299254178564:web:06cd6e7e38a1c99b856651",
    measurementId: "G-TDBVV2DFVY"
};

const app = initializeApp(firebaseConfig);

let analytics;
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}

export const storage = getStorage(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
