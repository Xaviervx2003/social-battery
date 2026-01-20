// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBTe413MwOlYvh7KXlNyEyYm6lEpHw2_dE",
  authDomain: "bateria-app.firebaseapp.com",
  projectId: "bateria-app",
  storageBucket: "bateria-app.firebasestorage.app",
  messagingSenderId: "990994147026",
  appId: "1:990994147026:web:5b4dc4db5606c5237def0b",
  measurementId: "G-9V0G6FD5L6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
