// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAAkJ9Cb_QI8slHTyWRJP7HD7pEH_i05Os",
  authDomain: "action-plan-34b70.firebaseapp.com",
  projectId: "action-plan-34b70",
  storageBucket: "action-plan-34b70.firebasestorage.app",
  messagingSenderId: "956350139842",
  appId: "1:956350139842:web:1d4f63a051c20e3d695a5b",
  measurementId: "G-7KYPF1HYN4"
};

// Initialize Firebase (רק אם עוד לא initialized)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firestore
const db = getFirestore(app);

// Analytics (רק בצד הלקוח - client-side)
let analytics = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { db, analytics };