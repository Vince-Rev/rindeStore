import { db } from '../lib/firebase'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'

export interface Favorite {
  id: string
  userId: string
  productId: string
  createdAt: Date
}

const COLLECTION_NAME = 'favorites'

// Obtener todos los favoritos de un usuario
export const getUserFavorites = async (userId: string): Promise<string[]> => {
  const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data().productId)
}

// Agregar un producto a favoritos
export const addToFavorites = async (userId: string, productId: string): Promise<void> => {
  const docId = `${userId}_${productId}`
  await setDoc(doc(db, COLLECTION_NAME, docId), {
    userId,
    productId,
    createdAt: serverTimestamp(),
  })
}

// Eliminar un producto de favoritos
export const removeFromFavorites = async (userId: string, productId: string): Promise<void> => {
  const docId = `${userId}_${productId}`
  await deleteDoc(doc(db, COLLECTION_NAME, docId))
}

// Toggle favorito (agregar o eliminar)
export const toggleFavorite = async (
  userId: string,
  productId: string,
  isFavorite: boolean
): Promise<boolean> => {
  if (isFavorite) {
    await removeFromFavorites(userId, productId)
    return false
  } else {
    await addToFavorites(userId, productId)
    return true
  }
}
