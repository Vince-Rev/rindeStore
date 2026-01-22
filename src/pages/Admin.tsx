import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProductModal from '../components/ProductModal'
import CategorySettings from '../components/CategorySettings'
import { addProduct, updateProduct, getProducts, deleteProduct, type Product, type ProductFormData } from '../services/productService'
import { getCategories } from '../services/categoryService'
import { collection, getCountFromServer } from 'firebase/firestore'
import { db } from '../lib/firebase'
import './Admin.css'

// Tipo para las estadísticas
interface DashboardStats {
  totalProducts: number
  totalCategories: number
  totalSubcategories: number
  recentProducts: number
}

function Admin() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'settings'>('dashboard')
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalSubcategories: 0,
    recentProducts: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)

  // Cargar estadísticas del dashboard
  useEffect(() => {
    loadDashboardStats()
  }, [])

  // Cargar productos cuando se entra a la pestaña de productos o dashboard
  useEffect(() => {
    if (activeTab === 'products' || activeTab === 'dashboard') {
      loadProducts()
    }
  }, [activeTab])

  const loadDashboardStats = async () => {
    setLoadingStats(true)
    try {
      // Contar productos
      const productsSnapshot = await getCountFromServer(collection(db, 'products'))
      const totalProducts = productsSnapshot.data().count

      // Obtener categorías y contar subcategorías
      const categories = await getCategories()
      const totalCategories = categories.length
      const totalSubcategories = categories.reduce((acc, cat) => acc + cat.subcategories.length, 0)

      // Productos recientes (últimos 7 días)
      const allProducts = await getProducts()
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const recentProducts = allProducts.filter(p => 
        p.createdAt && p.createdAt.toDate() > oneWeekAgo
      ).length

      setStats({
        totalProducts,
        totalCategories,
        totalSubcategories,
        recentProducts
      })
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const loadProducts = async () => {
    setLoadingProducts(true)
    try {
      const data = await getProducts()
      setProducts(data)
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleAddProduct = async (data: ProductFormData) => {
    await addProduct(data)
    await loadProducts()
    await loadDashboardStats()
  }

  const handleEditProduct = async (data: ProductFormData) => {
    if (!editingProduct?.id) return
    await updateProduct(editingProduct.id, data, editingProduct.imageUrl)
    await loadProducts()
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setShowProductModal(true)
  }

  const openEditModal = (product: Product) => {
    setEditingProduct(product)
    setShowProductModal(true)
  }

  const closeModal = () => {
    setShowProductModal(false)
    setEditingProduct(null)
  }

  const handleDeleteProduct = async (product: Product) => {
    if (!product.id) return
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) return

    setDeletingId(product.id)
    try {
      await deleteProduct(product.id, product.imageUrl)
      await loadProducts()
      await loadDashboardStats()
    } catch (error) {
      console.error('Error eliminando producto:', error)
      alert('Error al eliminar el producto')
    } finally {
      setDeletingId(null)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(value)

  const calculateSavings = (original: number, discount: number) => {
    if (!original || original <= 0) return 0
    return Math.round(((original - discount) / original) * 100)
  }

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Link to="/">
            <span className="brand-drop">rinde</span>
            <span className="brand-name">Admin</span>
          </Link>
        </div>

        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            Dashboard
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            Productos
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Configuración
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user">
            <div className="admin-user-avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" />
              ) : (
                <span>{user?.displayName?.[0] || 'A'}</span>
              )}
            </div>
            <div className="admin-user-info">
              <strong>{user?.displayName || 'Admin'}</strong>
              <span>Administrador</span>
            </div>
          </div>
          <button className="admin-logout" onClick={logout}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'products' && 'Gestión de Productos'}
              {activeTab === 'settings' && 'Configuración'}
            </h1>
            <p>Panel de administración de RindeStore</p>
          </div>
          <Link to="/" className="admin-back-btn">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9,22 9,12 15,12 15,22" />
            </svg>
            Ir a la tienda
          </Link>
        </header>

        {activeTab === 'dashboard' && (
          <div className="admin-content">
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">📦 Productos activos</span>
                <strong className="stat-value">{loadingStats ? '...' : stats.totalProducts}</strong>
                <span className="stat-change">
                  {stats.recentProducts > 0 ? `+${stats.recentProducts} esta semana` : 'Sin nuevos esta semana'}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">🏷️ Categorías</span>
                <strong className="stat-value">{loadingStats ? '...' : stats.totalCategories}</strong>
                <span className="stat-change">Organizando productos</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">📂 Subcategorías</span>
                <strong className="stat-value">{loadingStats ? '...' : stats.totalSubcategories}</strong>
                <span className="stat-change">Para filtrado detallado</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">💰 Ahorro promedio</span>
                <strong className="stat-value">
                  {loadingStats ? '...' : products.length > 0 
                    ? `${Math.round(products.reduce((acc, p) => acc + calculateSavings(p.originalPrice, p.discountPrice), 0) / products.length)}%`
                    : '0%'
                  }
                </strong>
                <span className="stat-change">En todos los productos</span>
              </div>
            </div>

            <div className="admin-section">
              <div className="section-header">
                <h2>Productos recientes</h2>
                <button className="btn-primary" onClick={() => { setActiveTab('products'); openAddModal() }}>+ Agregar producto</button>
              </div>
              <div className="products-table">
                <div className="table-header">
                  <span>Producto</span>
                  <span>Precio</span>
                  <span>Ahorro</span>
                  <span>Acciones</span>
                </div>
                {products.slice(0, 4).map((product) => (
                  <div key={product.id} className="table-row">
                    <div className="product-cell">
                      {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="product-thumb" />}
                      <span>{product.name}</span>
                    </div>
                    <span>{formatCurrency(product.discountPrice)}</span>
                    <span className="savings-badge">{calculateSavings(product.originalPrice, product.discountPrice)}%</span>
                    <div className="row-actions">
                      <button className="action-btn" onClick={() => openEditModal(product)}>Editar</button>
                      <button 
                        className="action-btn action-btn--danger"
                        onClick={() => handleDeleteProduct(product)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="table-empty">
                    <p>No hay productos. ¡Agrega el primero!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="admin-content">
            <div className="section-header">
              <h2>Todos los productos ({products.length})</h2>
              <button className="btn-primary" onClick={openAddModal}>+ Agregar producto</button>
            </div>

            {loadingProducts ? (
              <div className="admin-loading">
                <div className="spinner" />
                <p>Cargando productos...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="admin-placeholder">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <h3>No hay productos aún</h3>
                <p>Agrega tu primer producto afiliado</p>
                <button className="btn-primary" onClick={openAddModal}>+ Agregar producto</button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-admin-card">
                    <div className="product-admin-image">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <div className="no-image">Sin imagen</div>
                      )}
                      <span className="savings-tag">-{calculateSavings(product.originalPrice, product.discountPrice)}%</span>
                    </div>
                    <div className="product-admin-info">
                      {product.category && (
                        <span className="product-category-tag">
                          <span className="cat-icon">{product.category.split(' ')[0]}</span>
                          {product.subcategory || product.category.split(' ').slice(1).join(' ')}
                        </span>
                      )}
                      <h4>{product.name}</h4>
                      <div className="price-row">
                        <span className="price-discount">{formatCurrency(product.discountPrice)}</span>
                        <span className="price-original">{formatCurrency(product.originalPrice)}</span>
                      </div>
                      {product.usageAmount && (
                        <p className="usage-info">
                          {formatCurrency(product.costPerUse)} / {product.usageAmount} {product.usageUnit}
                        </p>
                      )}
                      <div className="product-meta">
                        {product.usageUnit && (
                          <span className="product-meta-item">
                            <strong>Unidad:</strong> {product.usageUnit}
                          </span>
                        )}
                        {product.affiliateUrl && (
                          <span className="product-meta-item">
                            <strong>Link:</strong> ✓ Configurado
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="product-admin-actions">
                      <button className="action-btn" onClick={() => openEditModal(product)}>Editar</button>
                      <button 
                        className="action-btn action-btn--danger"
                        onClick={() => handleDeleteProduct(product)}
                        disabled={deletingId === product.id}
                      >
                        {deletingId === product.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="admin-content">
            <CategorySettings />
          </div>
        )}
      </main>

      <ProductModal
        isOpen={showProductModal}
        onClose={closeModal}
        onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
        product={editingProduct}
      />
    </div>
  )
}

export default Admin
