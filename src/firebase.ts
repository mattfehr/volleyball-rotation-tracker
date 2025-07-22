// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAV5L6TfCVAjRP-Ub0YggvhGWdPZHZXAz8",
  authDomain: "volleyball-rotations-f1f4d.firebaseapp.com",
  projectId: "volleyball-rotations-f1f4d",
  storageBucket: "volleyball-rotations-f1f4d.appspot.com", // original is "volleyball-rotations-f1f4d.firebasestorage.app"
  messagingSenderId: "93458857004",
  appId: "1:93458857004:web:0443774e071e1c652aa589"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app)