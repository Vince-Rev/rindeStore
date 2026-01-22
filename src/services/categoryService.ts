import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../lib/firebase'

export interface Category {
  id?: string
  name: string
  icon: string
  subcategories: string[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

const CATEGORIES_COLLECTION = 'categories'

/**
 * Obtiene todas las categorías
 */
export async function getCategories(): Promise<Category[]> {
  const q = query(collection(db, CATEGORIES_COLLECTION), orderBy('name', 'asc'))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Category[]
}

/**
 * Agrega una nueva categoría
 */
export async function addCategory(name: string, icon: string): Promise<string> {
  const categoryData: Omit<Category, 'id'> = {
    name,
    icon,
    subcategories: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
  
  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), categoryData)
  return docRef.id
}

/**
 * Actualiza una categoría existente
 */
export async function updateCategory(
  categoryId: string, 
  data: Partial<Pick<Category, 'name' | 'icon' | 'subcategories'>>
): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, categoryId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now()
  })
}

/**
 * Agrega una subcategoría a una categoría
 */
export async function addSubcategory(categoryId: string, subcategoryName: string): Promise<void> {
  const categories = await getCategories()
  const category = categories.find(c => c.id === categoryId)
  
  if (!category) throw new Error('Categoría no encontrada')
  
  const updatedSubcategories = [...category.subcategories, subcategoryName]
  await updateCategory(categoryId, { subcategories: updatedSubcategories })
}

/**
 * Elimina una subcategoría de una categoría
 */
export async function removeSubcategory(categoryId: string, subcategoryName: string): Promise<void> {
  const categories = await getCategories()
  const category = categories.find(c => c.id === categoryId)
  
  if (!category) throw new Error('Categoría no encontrada')
  
  const updatedSubcategories = category.subcategories.filter(s => s !== subcategoryName)
  await updateCategory(categoryId, { subcategories: updatedSubcategories })
}

/**
 * Elimina una categoría
 */
export async function deleteCategory(categoryId: string): Promise<void> {
  const docRef = doc(db, CATEGORIES_COLLECTION, categoryId)
  await deleteDoc(docRef)
}
