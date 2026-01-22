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
  Timestamp,
} from 'firebase/firestore'

export interface Purchase {
  id?: string
  userId: string
  productId: string
  productName: string
  productImage?: string
  category: string
  subcategory?: string
  originalPrice: number
  discountPrice: number
  savings: number
  costPerUse?: number
  usageUnit?: string
  purchasedAt: Date | Timestamp
}

const COLLECTION_NAME = 'purchases'

// Obtener todas las compras de un usuario
export const getUserPurchases = async (userId: string): Promise<Purchase[]> => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  )
  const snapshot = await getDocs(q)
  const purchases = snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      id: doc.id,
      ...data,
      purchasedAt: data.purchasedAt?.toDate() || new Date(),
    } as Purchase
  })
  // Ordenar por fecha en el cliente (más reciente primero)
  return purchases.sort((a, b) => {
    const dateA = a.purchasedAt instanceof Date ? a.purchasedAt.getTime() : 0
    const dateB = b.purchasedAt instanceof Date ? b.purchasedAt.getTime() : 0
    return dateB - dateA
  })
}

// Agregar una compra
export const addPurchase = async (purchase: Omit<Purchase, 'id' | 'purchasedAt'>): Promise<string> => {
  const docId = `${purchase.userId}_${purchase.productId}_${Date.now()}`
  await setDoc(doc(db, COLLECTION_NAME, docId), {
    ...purchase,
    purchasedAt: serverTimestamp(),
  })
  return docId
}

// Eliminar una compra
export const removePurchase = async (purchaseId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION_NAME, purchaseId))
}

// Obtener estadísticas de ahorro
export const getSavingsStats = (purchases: Purchase[]) => {
  const totalSavings = purchases.reduce((acc, p) => acc + p.savings, 0)
  const totalSpent = purchases.reduce((acc, p) => acc + p.discountPrice, 0)
  const totalOriginal = purchases.reduce((acc, p) => acc + p.originalPrice, 0)
  const avgSavingsPercent = totalOriginal > 0 
    ? Math.round((totalSavings / totalOriginal) * 100) 
    : 0

  // Agrupar por categoría
  const byCategory = purchases.reduce((acc, p) => {
    if (!acc[p.category]) {
      acc[p.category] = { count: 0, savings: 0, spent: 0 }
    }
    acc[p.category].count++
    acc[p.category].savings += p.savings
    acc[p.category].spent += p.discountPrice
    return acc
  }, {} as Record<string, { count: number; savings: number; spent: number }>)

  // Agrupar por mes
  const byMonth = purchases.reduce((acc, p) => {
    const date = p.purchasedAt instanceof Date ? p.purchasedAt : new Date()
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[monthKey]) {
      acc[monthKey] = { count: 0, savings: 0, spent: 0 }
    }
    acc[monthKey].count++
    acc[monthKey].savings += p.savings
    acc[monthKey].spent += p.discountPrice
    return acc
  }, {} as Record<string, { count: number; savings: number; spent: number }>)

  return {
    totalSavings,
    totalSpent,
    totalOriginal,
    avgSavingsPercent,
    totalPurchases: purchases.length,
    byCategory,
    byMonth,
  }
}
