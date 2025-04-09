import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB-EkM0icRe_h9Lrocnu0-yIOZfgJ2L9_I",
  authDomain: "bolgs-f84ea.firebaseapp.com",
  projectId: "bolgs-f84ea",
  storageBucket: "bolgs-f84ea.firebasestorage.app",
  messagingSenderId: "1054736498245",
  appId: "1:1054736498245:web:31d3c0ea3f10242ecd6d2c",
  measurementId: "G-418CVL4S9X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };