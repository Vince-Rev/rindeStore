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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '../lib/firebase'

export interface Product {
  id?: string
  name: string
  category: string
  subcategory: string
  originalPrice: number
  discountPrice: number
  costPerUse: number
  usageUnit: string
  usageAmount: string
  affiliateUrl: string
  imageUrl: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface ProductFormData {
  name: string
  category: string
  subcategory: string
  originalPrice: number
  discountPrice: number
  costPerUse: number
  usageUnit: string
  usageAmount: string
  affiliateUrl: string
  image: File | null
}

const PRODUCTS_COLLECTION = 'products'

/**
 * Sube una imagen a Firebase Storage y retorna la URL
 */
export async function uploadProductImage(file: File): Promise<string> {
  const timestamp = Date.now()
  const fileName = `products/${timestamp}_${file.name}`
  const storageRef = ref(storage, fileName)
  
  await uploadBytes(storageRef, file)
  const downloadUrl = await getDownloadURL(storageRef)
  
  return downloadUrl
}

/**
 * Elimina una imagen de Firebase Storage
 */
export async function deleteProductImage(imageUrl: string): Promise<void> {
  try {
    const storageRef = ref(storage, imageUrl)
    await deleteObject(storageRef)
  } catch (error) {
    console.error('Error eliminando imagen:', error)
  }
}

/**
 * Agrega un nuevo producto a Firestore
 */
export async function addProduct(formData: ProductFormData): Promise<string> {
  let imageUrl = ''
  
  // Subir imagen si existe
  if (formData.image) {
    imageUrl = await uploadProductImage(formData.image)
  }
  
  const productData: Omit<Product, 'id'> = {
    name: formData.name,
    category: formData.category,
    subcategory: formData.subcategory,
    originalPrice: formData.originalPrice,
    discountPrice: formData.discountPrice,
    costPerUse: formData.costPerUse,
    usageUnit: formData.usageUnit,
    usageAmount: formData.usageAmount,
    affiliateUrl: formData.affiliateUrl,
    imageUrl,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }
  
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), productData)
  return docRef.id
}

/**
 * Actualiza un producto existente
 */
export async function updateProduct(
  productId: string, 
  formData: ProductFormData,
  currentImageUrl?: string
): Promise<void> {
  let imageUrl = currentImageUrl || ''
  
  // Si hay nueva imagen, subirla y eliminar la anterior
  if (formData.image) {
    imageUrl = await uploadProductImage(formData.image)
    if (currentImageUrl) {
      await deleteProductImage(currentImageUrl)
    }
  }
  
  const productData = {
    name: formData.name,
    category: formData.category,
    subcategory: formData.subcategory,
    originalPrice: formData.originalPrice,
    discountPrice: formData.discountPrice,
    costPerUse: formData.costPerUse,
    usageUnit: formData.usageUnit,
    usageAmount: formData.usageAmount,
    affiliateUrl: formData.affiliateUrl,
    imageUrl,
    updatedAt: Timestamp.now()
  }
  
  const docRef = doc(db, PRODUCTS_COLLECTION, productId)
  await updateDoc(docRef, productData)
}

/**
 * Elimina un producto
 */
export async function deleteProduct(productId: string, imageUrl?: string): Promise<void> {
  // Eliminar imagen si existe
  if (imageUrl) {
    await deleteProductImage(imageUrl)
  }
  
  const docRef = doc(db, PRODUCTS_COLLECTION, productId)
  await deleteDoc(docRef)
}

/**
 * Obtiene todos los productos
 */
export async function getProducts(): Promise<Product[]> {
  const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Product[]
}
