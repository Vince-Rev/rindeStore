import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getUserPurchases, removePurchase, getSavingsStats, type Purchase } from '../services/purchaseService'
import './Historial.css'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)

function Historial() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPurchases = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      try {
        const userPurchases = await getUserPurchases(user.uid)
        setPurchases(userPurchases)
      } catch (error) {
        console.error('Error cargando historial:', error)
      } finally {
        setLoading(false)
      }
    }
    loadPurchases()
  }, [user])

  const handleRemovePurchase = async (purchaseId: string) => {
    try {
      await removePurchase(purchaseId)
      setPurchases(prev => prev.filter(p => p.id !== purchaseId))
    } catch (error) {
      console.error('Error eliminando compra:', error)
    }
  }

  const stats = getSavingsStats(purchases)

  // Si no está logueado
  if (!user) {
    return (
      <div className="historial-page">
        <div className="historial-auth-required">
          <div className="auth-required-icon">
            <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1>Tu historial de ahorro</h1>
          <p>
            Inicia sesión para ver cuánto has ahorrado con RindeStore y llevar un registro de tus compras inteligentes.
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

  return (
    <div className="historial-page">
      <header className="historial-header">
        <Link to="/" className="back-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>
        <h1>Mi historial de ahorro</h1>
      </header>

      {loading ? (
        <div className="historial-loading">
          <div className="spinner" />
          <p>Cargando historial...</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="historial-content">
          <div className="historial-empty">
            <div className="empty-icon">💰</div>
            <h2>Aún no tienes compras registradas</h2>
            <p>Cuando compres un producto, haz clic en "Ya lo compré" para registrarlo aquí y ver cuánto ahorras.</p>
            <Link to="/" className="btn-primary">Explorar productos</Link>
          </div>
        </div>
      ) : (
        <div className="historial-content">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-card--primary">
              <div className="stat-card__icon">💰</div>
              <div className="stat-card__content">
                <span className="stat-label">Total ahorrado</span>
                <strong className="stat-value stat-value--large">{formatCurrency(stats.totalSavings)}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card__icon">🛒</div>
              <div className="stat-card__content">
                <span className="stat-label">Compras</span>
                <strong className="stat-value">{stats.totalPurchases}</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card__icon">📊</div>
              <div className="stat-card__content">
                <span className="stat-label">Ahorro promedio</span>
                <strong className="stat-value">{stats.avgSavingsPercent}%</strong>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card__icon">💳</div>
              <div className="stat-card__content">
                <span className="stat-label">Total gastado</span>
                <strong className="stat-value">{formatCurrency(stats.totalSpent)}</strong>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            {/* Savings by Category */}
            <div className="chart-card">
              <h3>Ahorro por categoría</h3>
              <div className="category-bars">
                {Object.entries(stats.byCategory).map(([category, data]) => {
                  const maxSavings = Math.max(...Object.values(stats.byCategory).map(d => d.savings))
                  const percentage = maxSavings > 0 ? (data.savings / maxSavings) * 100 : 0
                  return (
                    <div key={category} className="category-bar">
                      <div className="category-bar__label">
                        <span>{category}</span>
                        <strong>{formatCurrency(data.savings)}</strong>
                      </div>
                      <div className="category-bar__track">
                        <div 
                          className="category-bar__fill" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="category-bar__count">{data.count} compras</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Monthly Savings */}
            <div className="chart-card">
              <h3>Ahorro mensual</h3>
              <div className="monthly-chart">
                {Object.entries(stats.byMonth)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .slice(-6)
                  .map(([month, data]) => {
                    const maxSavings = Math.max(...Object.values(stats.byMonth).map(d => d.savings))
                    const height = maxSavings > 0 ? (data.savings / maxSavings) * 100 : 0
                    const [year, monthNum] = month.split('-')
                    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('es-MX', { month: 'short' })
                    return (
                      <div key={month} className="month-bar">
                        <div className="month-bar__container">
                          <div 
                            className="month-bar__fill" 
                            style={{ height: `${height}%` }}
                          >
                            <span className="month-bar__value">{formatCurrency(data.savings)}</span>
                          </div>
                        </div>
                        <span className="month-bar__label">{monthName}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          {/* Comparison Card */}
          <div className="comparison-card">
            <div className="comparison-card__icon">🎉</div>
            <div className="comparison-card__content">
              <h3>¡Felicidades!</h3>
              <p>
                Sin RindeStore habrías pagado <strong>{formatCurrency(stats.totalOriginal)}</strong>, 
                pero gracias a tus compras inteligentes solo pagaste <strong>{formatCurrency(stats.totalSpent)}</strong>.
              </p>
            </div>
          </div>

          {/* Purchases List */}
          <div className="purchases-section">
            <h3>Historial de compras</h3>
            <div className="purchases-list">
              {purchases.map((purchase) => (
                <div key={purchase.id} className="purchase-item">
                  <div className="purchase-item__media">
                    {purchase.productImage ? (
                      <img src={purchase.productImage} alt={purchase.productName} />
                    ) : (
                      <div className="no-image">📦</div>
                    )}
                  </div>
                  <div className="purchase-item__content">
                    <h4>{purchase.productName}</h4>
                    <span className="purchase-category">{purchase.category}</span>
                    <div className="purchase-prices">
                      <span className="price-original">{formatCurrency(purchase.originalPrice)}</span>
                      <strong className="price-paid">{formatCurrency(purchase.discountPrice)}</strong>
                    </div>
                  </div>
                  <div className="purchase-item__savings">
                    <span className="savings-badge">-{formatCurrency(purchase.savings)}</span>
                    <span className="purchase-date">
                      {formatDate(purchase.purchasedAt instanceof Date ? purchase.purchasedAt : new Date())}
                    </span>
                  </div>
                  <button 
                    className="remove-purchase-btn"
                    onClick={() => purchase.id && handleRemovePurchase(purchase.id)}
                    aria-label="Eliminar del historial"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Historial
