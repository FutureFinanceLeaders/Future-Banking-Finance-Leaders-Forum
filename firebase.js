import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { 
  getDatabase,
  ref,
  set,
  push 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-CihaWuOxgcGc02lY3jDdD8K-F6Fux2k",
  authDomain: "future-finance-leaders.firebaseapp.com",
  databaseURL: "https://future-finance-leaders-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "future-finance-leaders",
  storageBucket: "future-finance-leaders.firebasestorage.app",
  messagingSenderId: "388995690205",
  appId: "1:388995690205:web:296474a99df73907c77534"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

export { 
  auth, 
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
};