import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, increment, setDoc, getDoc, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDTZCLHebfjWTkjFN_0JdPHGdOWp5ar-qk",
  authDomain: "le-franais-avec-aya-wael.firebaseapp.com",
  projectId: "le-franais-avec-aya-wael",
  storageBucket: "le-franais-avec-aya-wael.firebasestorage.app",
  messagingSenderId: "1048153650527",
  appId: "1:1048153650527:web:fc1156d307281f3925b2ea",
  measurementId: "G-FKTH22Y6W4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider, signInWithPopup, onAuthStateChanged, signOut, collection, addDoc, getDocs, query, where, doc, deleteDoc, updateDoc, increment, setDoc, getDoc, orderBy };
