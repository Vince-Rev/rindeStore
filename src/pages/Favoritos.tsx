import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserFavorites, removeFromFavorites } from '../services/favoritesService'
import { getProducts, type Product } from '../services/productService'
import './Favoritos.css'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)

function Favoritos() {
  const { user } = useAuth()
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const [favoriteIds, allProducts] = await Promise.all([
          getUserFavorites(user.uid),
          getProducts()
        ])
        const favProducts = allProducts.filter(p => p.id && favoriteIds.includes(p.id))
        setFavoriteProducts(favProducts)
      } catch (error) {
        console.error('Error cargando favoritos:', error)
      } finally {
        setLoading(false)
      }
    }
    loadFavorites()
  }, [user])

  const handleRemoveFavorite = async (productId: string) => {
    if (!user) return
    try {
      await removeFromFavorites(user.uid, productId)
      setFavoriteProducts(prev => prev.filter(p => p.id !== productId))
    } catch (error) {
      console.error('Error eliminando favorito:', error)
    }
  }

  const getSavingsPercent = (product: Product) => {
    if (!product.originalPrice) return 0
    return Math.round((1 - product.discountPrice / product.originalPrice) * 100)
  }

  // Si no está logueado, mostrar mensaje
  if (!user) {
    return (
      <div className="favoritos-page">
        <div className="favoritos-auth-required">
          <div className="auth-required-icon">
            <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
          </div>
          <h1>Tus favoritos te esperan</h1>
          <p>
            Inicia sesión o regístrate para guardar tus productos favoritos y recibir alertas cuando bajen de precio.
          </p>
          <div className="auth-required-actions">
            <Link to="/auth" className="btn-primary">Iniciar sesión</Link>
            <Link to="/auth" className="btn-secondary">Crear cuenta</Link>
          </div>
          <Link to="/" className="back-link">← Volver a la tienda</Link>
        </div>
      </div>
    )
  }

  // Usuario logueado: mostrar página de favoritos
  return (
    <div className="favoritos-page">
      <header className="favoritos-header">
        <Link to="/" className="back-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>
        <h1>Mis favoritos</h1>
        <span className="favoritos-count">{favoriteProducts.length} productos</span>
      </header>

      <div className="favoritos-content">
        {loading ? (
          <div className="favoritos-loading">
            <div className="spinner" />
            <p>Cargando favoritos...</p>
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="favoritos-empty">
            <div className="empty-icon">
              <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            <h2>Aún no tienes favoritos</h2>
            <p>Explora productos y presiona el corazón para agregarlos aquí.</p>
            <Link to="/" className="btn-primary">Explorar productos</Link>
          </div>
        ) : (
          <div className="favoritos-grid">
            {favoriteProducts.map((product) => (
              <article key={product.id} className="favorito-card">
                <div className="favorito-card__media">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} loading="lazy" />
                  ) : (
                    <div className="no-image-placeholder">Sin imagen</div>
                  )}
                  <button
                    type="button"
                    className="remove-favorite-btn"
                    onClick={() => product.id && handleRemoveFavorite(product.id)}
                    aria-label="Quitar de favoritos"
                  >
                    ✕
                  </button>
                </div>
                <div className="favorito-card__body">
                  <span className="favorito-savings">Ahorra {getSavingsPercent(product)}%</span>
                  <h3>{product.name}</h3>
                  <div className="favorito-prices">
                    <span className="price-original">{formatCurrency(product.originalPrice)}</span>
                    <strong className="price-discount">{formatCurrency(product.discountPrice)}</strong>
                  </div>
                  {product.costPerUse && (
                    <span className="favorito-unit-price">
                      ${product.costPerUse.toFixed(2)} / {product.usageUnit || 'unidad'}
                    </span>
                  )}
                  <a 
                    href={product.affiliateUrl} 
                    className="favorito-buy-btn"
                    target="_blank" 
                    rel="noreferrer"
                  >
                    Comprar ahora
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Favoritos
