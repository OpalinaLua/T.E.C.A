import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBBw04_jbA8PSZvnnUtV5kF_tmvBkOk6HA",
  authDomain: "teca-30ef5.firebaseapp.com",
  projectId: "teca-30ef5",
  storageBucket: "teca-30ef5.firebasestorage.app",
  messagingSenderId: "233265567374",
  appId: "1:233265567374:web:b46a19b11e63247e165bdf",
  measurementId: "G-4036QGWNBC"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      getAnalytics(app);
    }
  });
}

export { db };
