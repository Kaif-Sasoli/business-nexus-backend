// src/firebase.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDybJTZDaSPx_Zo5KCQT9vDW7tlDumTW18",
  authDomain: "businessnexus-cfa36.firebaseapp.com",
  projectId: "businessnexus-cfa36",
  storageBucket: "businessnexus-cfa36.firebasestorage.app",
  messagingSenderId: "390682900063",
  appId: "1:390682900063:web:edeff260a1955cc3ea4dea",
  measurementId: "G-KYCNRLX530"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
