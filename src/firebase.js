// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4Sj42birLWButSS58t9kFc-2QgzPJckk",
  authDomain: "edoxia-f1a23.firebaseapp.com",
  projectId: "edoxia-f1a23",
  storageBucket: "edoxia-f1a23.firebasestorage.app",
  messagingSenderId: "997218201204",
  appId: "1:997218201204:web:c2244e8fb317b17cb7eb21",
  measurementId: "G-XTL9SMZ1Q3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);