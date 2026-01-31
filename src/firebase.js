import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBTe413MwOlYvh7KXlNyEyYm6lEpHw2_dE",
  authDomain: "bateria-app.firebaseapp.com",
  projectId: "bateria-app",
  storageBucket: "bateria-app.firebasestorage.app",
  messagingSenderId: "990994147026",
  appId: "1:990994147026:web:5b4dc4db5606c5237def0b",
  measurementId: "G-9V0G6FD5L6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export { auth, googleProvider, githubProvider };
export default app;
