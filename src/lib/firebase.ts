import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyAf-Zz07bzDpO2ytinQgdyNMSnKuRVl0Dc",
  authDomain: "rindestore-edb18.firebaseapp.com",
  projectId: "rindestore-edb18",
  storageBucket: "rindestore-edb18.firebasestorage.app",
  messagingSenderId: "1093603652861",
  appId: "1:1093603652861:web:456e689a2fff1a7685ba94",
  measurementId: "G-48CTPG0FZV"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
export const googleProvider = new GoogleAuthProvider()

// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null

export default app
