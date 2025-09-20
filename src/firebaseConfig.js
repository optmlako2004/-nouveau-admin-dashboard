// src/firebaseConfig.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";

// IMPORTANT : Remplacez cet objet par la configuration de VOTRE projet Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDFv8TiTtebwOvfqYxal8pENVSfQpRl18I",
  authDomain: "ftvdriver-app.firebaseapp.com",
  projectId: "ftvdriver-app",
  storageBucket: "ftvdriver-app.firebasestorage.app",
  messagingSenderId: "893704715152",
  appId: "1:893704715152:web:4fbdb8f6762f04d3f31115",
  measurementId: "G-R556JZKVXX",
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);

// Exporte les services Firebase pour les utiliser dans d'autres fichiers
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);
