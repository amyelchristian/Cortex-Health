import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCR9mHW6AZQN0VFNbvDUZh9EKFFZ_m66SE",
    authDomain: "cortex-12feb.firebaseapp.com",
    projectId: "cortex-12feb",
    storageBucket: "cortex-12feb.firebasestorage.app",
    messagingSenderId: "472595500035",
    appId: "1:472595500035:web:cd98e4a6c1684058ff9236",
    measurementId: "G-577REEPG9B"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
