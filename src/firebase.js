// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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