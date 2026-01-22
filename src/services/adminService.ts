import { doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

/**
 * Verifica si un usuario es administrador consultando Firestore
 * La colección 'admins' contiene documentos donde el ID es el UID del usuario
 */
export async function checkIsAdmin(uid: string): Promise<boolean> {
  try {
    const adminDoc = await getDoc(doc(db, 'admins', uid))
    return adminDoc.exists()
  } catch (error) {
    console.error('Error verificando admin:', error)
    return false
  }
}
