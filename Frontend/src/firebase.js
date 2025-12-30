// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Import the functions you need from the SDKs you need

import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDRDg8Yy03lP9YI7eey9F-3-H49kiEjLTs",
    authDomain: "menuvision-9acfc.firebaseapp.com",
    projectId: "menuvision-9acfc",
    storageBucket: "menuvision-9acfc.firebasestorage.app",
    messagingSenderId: "299254178564",
    appId: "1:299254178564:web:06cd6e7e38a1c99b856651",
    measurementId: "G-TDBVV2DFVY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


// Export Auth and Database services so App.js can use them
export const auth = getAuth(app);
export const db = getFirestore(app);