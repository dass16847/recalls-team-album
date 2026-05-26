import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVf1RnTKexvS5YGDQEvn-CT2i11cawPLw",
  authDomain: "recalls-album.firebaseapp.com",
  projectId: "recalls-album",
  storageBucket: "recalls-album.firebasestorage.app",
  messagingSenderId: "669977552565",
  appId: "1:669977552565:web:f42312b91083f6585580fc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;