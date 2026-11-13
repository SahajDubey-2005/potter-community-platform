import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase Web configuration (public client configuration; NOT an Admin SDK key).
const firebaseConfig = {
  apiKey: "AIzaSyCOIvZFHamqoddo6apG505vVbejGVpQ3ak",
  authDomain: "potter-community-platform.firebaseapp.com",
  projectId: "potter-community-platform",
  storageBucket: "potter-community-platform.firebasestorage.app",
  messagingSenderId: "1003114000028",
  appId: "1:1003114000028:web:1418a2d2a8ccf3d3344759",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
