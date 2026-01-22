import { useState, useRef, useEffect } from 'react'
import type { Product, ProductFormData } from '../services/productService'
import { getCategories, type Category } from '../services/categoryService'
import './AddProductModal.css'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ProductFormData) => Promise<void>
  product?: Product | null  // Si se pasa, es modo edición
}

const emptyFormData: ProductFormData = {
  name: '',
  category: '',
  subcategory: '',
  originalPrice: 0,
  discountPrice: 0,
  costPerUse: 0,
  usageUnit: 'ml',
  usageAmount: '',
  affiliateUrl: '',
  image: null
}

function ProductModal({ isOpen, onClose, onSubmit, product }: ProductModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>([])
  const [formData, setFormData] = useState<ProductFormData>(emptyFormData)

  const isEditMode = !!product

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      loadCategories()
      
      if (product) {
        // Modo edición: cargar datos del producto
        setFormData({
          name: product.name,
          category: product.category || '',
          subcategory: product.subcategory || '',
          originalPrice: product.originalPrice,
          discountPrice: product.discountPrice,
          costPerUse: product.costPerUse,
          usageUnit: product.usageUnit,
          usageAmount: product.usageAmount,
          affiliateUrl: product.affiliateUrl,
          image: null // La imagen se mantiene a menos que se cambie
        })
        setImagePreview(product.imageUrl || null)
      } else {
        // Modo agregar: limpiar formulario
        setFormData(emptyFormData)
        setImagePreview(null)
      }
    }
  }, [isOpen, product])

  // Actualizar subcategorías cuando cambia la categoría
  useEffect(() => {
    const category = categories.find(c => c.name === formData.category)
    setAvailableSubcategories(category?.subcategories || [])
  }, [formData.category, categories])

  const loadCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error cargando categorías:', error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validaciones
      if (!formData.name.trim()) {
        throw new Error('El nombre del producto es requerido')
      }
      // En modo agregar, la imagen es requerida. En edición es opcional
      if (!isEditMode && !formData.image) {
        throw new Error('La imagen del producto es requerida')
      }
      if (!formData.category) {
        throw new Error('La categoría es requerida')
      }
      if (formData.originalPrice <= 0) {
        throw new Error('El precio original debe ser mayor a 0')
      }
      if (formData.discountPrice <= 0) {
        throw new Error('El precio con descuento debe ser mayor a 0')
      }
      if (!formData.affiliateUrl.trim()) {
        throw new Error('La URL del afiliado es requerida')
      }

      await onSubmit(formData)
      
      // Limpiar formulario
      setFormData(emptyFormData)
      setImagePreview(null)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setError(null)
      setFormData(emptyFormData)
      setImagePreview(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{isEditMode ? 'Editar Producto' : 'Agregar Producto'}</h2>
          <button className="modal-close" onClick={handleClose} disabled={loading}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="form-error">{error}</div>}

          {/* Sección: Imagen */}
          <div className="form-section">
            <div className="form-section-title">Imagen del producto</div>
            <div className="form-group">
              <div 
                className="image-upload" 
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="image-placeholder">
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                    <span>Clic para subir imagen</span>
                    <small>JPG, PNG hasta 5MB</small>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </div>
              {isEditMode && !formData.image && (
                <p className="form-hint">Deja sin cambiar para mantener la imagen actual</p>
              )}
            </div>
          </div>

          {/* Sección: Información básica */}
          <div className="form-section">
            <div className="form-section-title">Información básica</div>
            
            <div className="form-group">
              <label htmlFor="name">Nombre del producto *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Detergente concentrado 3L"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Categoría *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecciona categoría</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="subcategory">Subcategoría</label>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  disabled={!formData.category || availableSubcategories.length === 0}
                >
                  <option value="">Selecciona subcategoría</option>
                  {availableSubcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Precios */}
          <div className="form-section">
            <div className="form-section-title">Precios</div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="originalPrice">Precio original (MXN) *</label>
                <input
                  type="number"
                  id="originalPrice"
                  name="originalPrice"
                  value={formData.originalPrice || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="discountPrice">Precio con descuento *</label>
                <input
                  type="number"
                  id="discountPrice"
                  name="discountPrice"
                  value={formData.discountPrice || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sección: Rendimiento */}
          <div className="form-section">
            <div className="form-section-title">Rendimiento (opcional)</div>
            
            <div className="form-row-3">
              <div className="form-group">
                <label htmlFor="costPerUse">Costo por uso</label>
                <input
                  type="number"
                  id="costPerUse"
                  name="costPerUse"
                  value={formData.costPerUse || ''}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label htmlFor="usageAmount">Cantidad</label>
                <input
                  type="text"
                  id="usageAmount"
                  name="usageAmount"
                  value={formData.usageAmount}
                  onChange={handleChange}
                  placeholder="Ej: 100"
                />
              </div>
              <div className="form-group">
                <label htmlFor="usageUnit">Unidad</label>
                <select
                  id="usageUnit"
                  name="usageUnit"
                  value={formData.usageUnit}
                  onChange={handleChange}
                >
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="pzas">pzas</option>
                  <option value="usos">usos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Link afiliado */}
          <div className="form-section">
            <div className="form-section-title">Enlace de afiliado</div>
            
            <div className="form-group">
              <label htmlFor="affiliateUrl">URL del producto *</label>
              <input
                type="url"
                id="affiliateUrl"
                name="affiliateUrl"
                value={formData.affiliateUrl}
                onChange={handleChange}
                placeholder="https://ejemplo.com/producto?ref=rinde"
                required
              />
            </div>
          </div>

          <footer className="modal-footer">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : (isEditMode ? 'Guardar cambios' : 'Agregar Producto')}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}

export default ProductModal
