import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProfileSidebar from './components/ProfileSidebar'
import CompareModal from './components/CompareModal'
import { getCategories, type Category } from './services/categoryService'
import { getProducts, type Product } from './services/productService'
import { getUserFavorites, toggleFavorite } from './services/favoritesService'
import { addPurchase } from './services/purchaseService'
import './App.css'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)

const trustBadges = [
  { title: '100% Confiable', detail: 'Precios auditados cada 6 h' },
  { title: 'Links verificados', detail: 'Redirigimos directo a tienda' },
  { title: 'Comparación real', detail: 'Incluimos costo por unidad' },
  { title: 'Gratis siempre', detail: 'Sin costos ocultos' },
]

const savingsChips = [
  { id: 'all', label: 'Todo Rinde' },
  { id: '25', label: 'Ahorro 25%+' },
  { id: '15', label: 'Ahorro 15%+' },
]

const heroStats = [
  { title: '+10,800', detail: 'productos auditados' },
  { title: '32%', detail: 'ahorro promedio' },
  { title: '4.8/5', detail: 'familias felices' },
]

function App() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [savingsFilter, setSavingsFilter] = useState<'all' | '25' | '15'>('all')
  const [navRaised, setNavRaised] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [subcategoryDropdownOpen, setSubcategoryDropdownOpen] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [compareModalOpen, setCompareModalOpen] = useState(false)
  const [selectedProductForCompare, setSelectedProductForCompare] = useState<Product | null>(null)
  const [compareProduct, setCompareProduct] = useState<Product | null>(null)

  // Cargar categorías y productos desde Firestore
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts()
        ])
        setCategories(cats)
        setProducts(prods)
      } catch (error) {
        console.error('Error cargando datos:', error)
      } finally {
        setLoadingProducts(false)
      }
    }
    loadData()
  }, [])

  // Cargar favoritos del usuario
  useEffect(() => {
    const loadFavorites = async () => {
      if (user) {
        try {
          console.log('Cargando favoritos para usuario:', user.uid)
          const userFavorites = await getUserFavorites(user.uid)
          console.log('Favoritos cargados:', userFavorites)
          setFavorites(userFavorites)
        } catch (error) {
          console.error('Error cargando favoritos:', error)
        }
      } else {
        setFavorites([])
      }
    }
    loadFavorites()
  }, [user])

  const handleToggleFavorite = async (productId: string) => {
    if (!user) {
      navigate('/auth')
      return
    }
    try {
      console.log('Toggle favorito:', productId, 'Usuario:', user.uid)
      const isFavorite = favorites.includes(productId)
      console.log('Es favorito actualmente:', isFavorite)
      const newState = await toggleFavorite(user.uid, productId, isFavorite)
      console.log('Nuevo estado:', newState)
      setFavorites(prev =>
        newState
          ? [...prev, productId]
          : prev.filter(id => id !== productId)
      )
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleFavoritesClick = () => {
    navigate('/favoritos')
  }

  const handleCompareClick = (product: Product) => {
    // Buscar productos de la misma categoría y subcategoría
    const sameCategory = products.filter(p => 
      p.id !== product.id &&
      p.category === product.category &&
      (!product.subcategory || p.subcategory === product.subcategory)
    )

    // Ordenar por precio de descuento (menor a mayor)
    const sortedByPrice = sameCategory.sort((a, b) => a.discountPrice - b.discountPrice)

    // Determinar qué producto mostrar para comparar
    let productToCompare: Product | null = null

    if (sortedByPrice.length > 0) {
      // Si el producto seleccionado es el más barato, mostrar el segundo más barato
      if (product.discountPrice <= sortedByPrice[0].discountPrice) {
        productToCompare = sortedByPrice[0]
      } else {
        // Si no es el más barato, mostrar el más barato
        productToCompare = sortedByPrice[0]
      }
    }

    setSelectedProductForCompare(product)
    setCompareProduct(productToCompare)
    setCompareModalOpen(true)
  }

  const handlePurchaseClick = async (product: Product) => {
    if (!user) {
      navigate('/auth')
      return
    }
    try {
      const savings = product.originalPrice - product.discountPrice
      await addPurchase({
        userId: user.uid,
        productId: product.id || '',
        productName: product.name,
        productImage: product.imageUrl,
        category: product.category,
        subcategory: product.subcategory,
        originalPrice: product.originalPrice,
        discountPrice: product.discountPrice,
        savings,
        costPerUse: product.costPerUse,
        usageUnit: product.usageUnit,
      })
      // Mostrar feedback visual
      alert('¡Compra registrada! Revisa tu historial de ahorro.')
    } catch (error) {
      console.error('Error registrando compra:', error)
      alert('Error al registrar la compra. Intenta de nuevo.')
    }
  }

  const handleExploreClick = () => {
    const dealSection = document.querySelector('.deal-section')
    if (dealSection) {
      dealSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handlePanelClick = () => {
    if (user) {
      setSidebarOpen(true)
    } else {
      navigate('/auth')
    }
  }

  const selectedCategoryData = categories.find(c => c.name === selectedCategory)
  const availableSubcategories = selectedCategoryData?.subcategories || []

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    setSelectedSubcategory('all')
    setCategoryDropdownOpen(false)
  }

  const handleSubcategoryChange = (subcategory: string) => {
    setSelectedSubcategory(subcategory)
    setSubcategoryDropdownOpen(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      setNavRaised(window.scrollY > 24)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.custom-dropdown')) {
        setCategoryDropdownOpen(false)
        setSubcategoryDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const getSavingsRatio = (product: Product) => {
    if (!product.originalPrice) return 0
    return Math.max(0, 1 - product.discountPrice / product.originalPrice)
  }

  const filteredProducts = products.filter((product) => {
    const needle = searchTerm.toLowerCase()
    return (
      product.name.toLowerCase().includes(needle) ||
      product.category.toLowerCase().includes(needle) ||
      (product.subcategory && product.subcategory.toLowerCase().includes(needle))
    )
  }).filter((product) => selectedCategory === 'all' || product.category === selectedCategory)
    .filter((product) => selectedSubcategory === 'all' || product.subcategory === selectedSubcategory)
    .filter((product) => {
      const ratio = getSavingsRatio(product)
      if (savingsFilter === '25') return ratio >= 0.25
      if (savingsFilter === '15') return ratio >= 0.15
      return true
    })

  return (
    <div className="page-shell">
      <nav className={`nav ${navRaised ? 'nav--scrolled' : ''}`}>
        <div className="brand-mark">
          <span className="brand-drop">rinde</span>
          <div className="brand-copy">
            <span>rindeStore</span>
          </div>
        </div>
        <div className="search-box">
          <input
            type="search"
            placeholder="¿Qué producto buscas? (Detergente, pañales, café...)"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <button>Buscar</button>
        </div>
        <div className="nav-actions">
          <button 
            className={`icon-btn ${favorites.length > 0 ? 'icon-btn--has-favorites' : ''}`} 
            type="button" 
            aria-label="Favoritos" 
            onClick={handleFavoritesClick}
          >
            {favorites.length > 0 ? '♥' : '♡'}
            {favorites.length > 0 && <span className="favorites-badge">{favorites.length}</span>}
          </button>
          {user ? (
            <button className="profile-btn" type="button" onClick={() => setSidebarOpen(true)}>
              Cuenta
            </button>
          ) : (
            <Link to="/auth" className="profile-btn">
              Login
            </Link>
          )}
        </div>
      </nav>
      
      <ProfileSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="nav-offset nav-offset--compact" aria-hidden="true" />
      <header className="hero hero--compact">
        <div className="hero-body">
          <div className="hero-content">
            <h1>
              Encuentra las <span>mejores diferencias</span> de precio y compra con inteligencia verde.
            </h1>
            <p>
              RindeStore compara miles de productos del súper, normalizando el costo por uso para que ahorres sin sacrificar calidad.
            </p>
            <div className="cta-row">
              <button className="primary" onClick={handleExploreClick}>Explorar comparador</button>
              <button className="secondary" onClick={handlePanelClick}>Ver panel personal</button>
            </div>
          </div>
          <div className="hero-stats-panel">
            {heroStats.map((stat) => (
              <div key={stat.title} className="stat-item">
                <strong>{stat.title}</strong>
                <span>{stat.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <section className="trust-grid">
        {trustBadges.map((badge) => (
          <article key={badge.title}>
            <h4>{badge.title}</h4>
            <p>{badge.detail}</p>
          </article>
        ))}
      </section>

      <section className="deal-section">
        <div className="filter-bar">
          <div className="filter-bar__left">
            <h2>Productos con mejor rendimiento</h2>
            <span className="filter-bar__count">{filteredProducts.length} resultados</span>
          </div>
          <div className="filter-bar__right">
            {/* Dropdown Categorías */}
            <div className="custom-dropdown">
              <button 
                className="dropdown-trigger"
                onClick={() => {
                  setCategoryDropdownOpen(!categoryDropdownOpen)
                  setSubcategoryDropdownOpen(false)
                }}
              >
                <span className="dropdown-icon">{selectedCategoryData?.icon || '📦'}</span>
                <span className="dropdown-label">
                  {selectedCategory === 'all' ? 'Categoría' : selectedCategory}
                </span>
                <svg className={`dropdown-arrow ${categoryDropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              {categoryDropdownOpen && (
                <div className="dropdown-menu">
                  <button 
                    className={`dropdown-item ${selectedCategory === 'all' ? 'active' : ''}`}
                    onClick={() => handleCategoryChange('all')}
                  >
                    <span className="dropdown-item-icon">📦</span>
                    <span>Todas las categorías</span>
                  </button>
                  {categories.map((cat) => (
                    <button 
                      key={cat.id}
                      className={`dropdown-item ${selectedCategory === cat.name ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(cat.name)}
                    >
                      <span className="dropdown-item-icon">{cat.icon}</span>
                      <span>{cat.name}</span>
                      {cat.subcategories.length > 0 && (
                        <span className="dropdown-item-count">{cat.subcategories.length}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown Subcategorías */}
            <div className="custom-dropdown">
              <button 
                className={`dropdown-trigger ${selectedCategory === 'all' ? 'disabled' : ''}`}
                onClick={() => {
                  if (selectedCategory !== 'all') {
                    setSubcategoryDropdownOpen(!subcategoryDropdownOpen)
                    setCategoryDropdownOpen(false)
                  }
                }}
                disabled={selectedCategory === 'all'}
              >
                <span className="dropdown-label">
                  {selectedSubcategory === 'all' ? 'Subcategoría' : selectedSubcategory}
                </span>
                <svg className={`dropdown-arrow ${subcategoryDropdownOpen ? 'open' : ''}`} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              {subcategoryDropdownOpen && availableSubcategories.length > 0 && (
                <div className="dropdown-menu">
                  <button 
                    className={`dropdown-item ${selectedSubcategory === 'all' ? 'active' : ''}`}
                    onClick={() => handleSubcategoryChange('all')}
                  >
                    <span>Todas las subcategorías</span>
                  </button>
                  {availableSubcategories.map((sub) => (
                    <button 
                      key={sub}
                      className={`dropdown-item ${selectedSubcategory === sub ? 'active' : ''}`}
                      onClick={() => handleSubcategoryChange(sub)}
                    >
                      <span>{sub}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="filter-bar__chips">
              {savingsChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={`chip-compact ${savingsFilter === chip.id ? 'chip-compact--active' : ''}`}
                  onClick={() => setSavingsFilter(chip.id as 'all' | '25' | '15')}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="deal-grid">
          {loadingProducts ? (
            <div className="loading-products">
              <div className="spinner" />
              <p>Cargando productos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products">
              <p>No se encontraron productos</p>
              <span>Intenta con otros filtros o busca algo diferente</span>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const savingsRatio = getSavingsRatio(product)
              const savings = Math.round(savingsRatio * 100)
              const productId = product.id || ''
              const isFavorite = favorites.includes(productId)
              return (
                <article key={product.id} className="product-card">
                  <div className="product-card__media">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} loading="lazy" />
                    ) : (
                      <div className="no-image-placeholder">Sin imagen</div>
                    )}
                    <button 
                      type="button" 
                      className={`favorite-btn ${isFavorite ? 'favorite-btn--active' : ''}`}
                      aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                      onClick={() => handleToggleFavorite(productId)}
                    >
                      {isFavorite ? '♥' : '♡'}
                    </button>
                  </div>
                  <div className="product-card__body">
                    <div className="product-pill">Ahorra {savings}%</div>
                    <h3>{product.name}</h3>
                    <div className="price-compare" aria-label="Comparación de precios">
                      <span className="price-compare__regular">{formatCurrency(product.originalPrice)}</span>
                      <strong className="price-compare__best">{formatCurrency(product.discountPrice)}</strong>
                    </div>
                    <div className="unit-price">
                      <span>Costo por unidad</span>
                      <strong>{product.costPerUse ? `${product.costPerUse.toFixed(2)} MXN` : '-'}</strong>
                    </div>
                    <div className="card-actions">
                      <button 
                        type="button" 
                        className="card-btn card-btn--ghost"
                        onClick={() => handleCompareClick(product)}
                      >
                        Comparar
                      </button>
                      <a href={product.affiliateUrl} className="card-btn card-btn--solid" target="_blank" rel="noreferrer">
                        Comprar
                      </a>
                    </div>
                    <button 
                      type="button" 
                      className="card-btn card-btn--outline"
                      onClick={() => handlePurchaseClick(product)}
                    >
                      Ya lo compré
                    </button>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </section>

      <section className="comparison-section">
        <header>
          <div>
            <p className="pill pill-outline">Tabla comparativa</p>
            <h2>Precio por uso para decisiones rápidas</h2>
          </div>
          <span className="caption">Incluye costo equivalente por carga/unidad</span>
        </header>
        <div className="table">
          <div className="table-head">
            <span>Producto</span>
            <span>Precio oferta</span>
            <span>Precio original</span>
            <span>Costo por uso</span>
            <span>Ahorro</span>
          </div>
          {filteredProducts.slice(0, 10).map((product) => {
            const savings = Math.round((1 - product.discountPrice / product.originalPrice) * 100)
            return (
              <div key={`row-${product.id}`} className="table-row">
                <span>
                  <strong>{product.name}</strong>
                  <small>{product.category}</small>
                </span>
                <span>{formatCurrency(product.discountPrice)}</span>
                <span>{formatCurrency(product.originalPrice)}</span>
                <span>{product.costPerUse ? `${product.costPerUse.toFixed(2)} MXN/${product.usageUnit}` : '-'}</span>
                <span className="positive">-{savings}%</span>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="footer">
        <div>
          <h3>rindeStore</h3>
          <p>Comparador gratuito con precios verificados y enlaces afiliados responsables.</p>
        </div>
        <div className="footer-links">
          <span>Contacto</span>
          <span>Prensa</span>
          <span>Afíliate</span>
        </div>
        <small>© {new Date().getFullYear()} RindeStore · Datos actualizados diariamente.</small>
      </footer>

      <CompareModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        selectedProduct={selectedProductForCompare}
        compareProduct={compareProduct}
      />
    </div>
  )
}

export default App
