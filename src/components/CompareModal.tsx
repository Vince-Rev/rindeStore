import { type Product } from '../services/productService'
import './CompareModal.css'

interface CompareModalProps {
  isOpen: boolean
  onClose: () => void
  selectedProduct: Product | null
  compareProduct: Product | null
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value)

function CompareModal({ isOpen, onClose, selectedProduct, compareProduct }: CompareModalProps) {
  if (!isOpen || !selectedProduct) return null

  const getSavingsPercent = (product: Product) => {
    if (!product.originalPrice) return 0
    return Math.round((1 - product.discountPrice / product.originalPrice) * 100)
  }

  const getWinner = () => {
    if (!compareProduct) return null
    if (selectedProduct.discountPrice <= compareProduct.discountPrice) {
      return 'selected'
    }
    return 'compare'
  }

  const winner = getWinner()
  const priceDiff = compareProduct 
    ? Math.abs(selectedProduct.discountPrice - compareProduct.discountPrice)
    : 0

  return (
    <div className="compare-modal-overlay" onClick={onClose}>
      <div className="compare-modal" onClick={(e) => e.stopPropagation()}>
        <button className="compare-modal__close" onClick={onClose}>
          ✕
        </button>
        
        <h2 className="compare-modal__title">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5M9 12h6M12 9v6"/>
          </svg>
          Comparar productos
        </h2>

        {!compareProduct ? (
          <div className="compare-no-products">
            <div className="compare-no-products__icon">🔍</div>
            <p>No hay otros productos en esta categoría para comparar</p>
            <span>{selectedProduct.category} {selectedProduct.subcategory ? `> ${selectedProduct.subcategory}` : ''}</span>
          </div>
        ) : (
          <>
            <div className="compare-grid">
              {/* Producto seleccionado */}
              <div className={`compare-card ${winner === 'selected' ? 'compare-card--winner' : ''}`}>
                {winner === 'selected' && <div className="winner-badge">🏆 Mejor precio</div>}
                <div className="compare-card__media">
                  {selectedProduct.imageUrl ? (
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
                  ) : (
                    <div className="no-image">Sin imagen</div>
                  )}
                </div>
                <div className="compare-card__body">
                  <span className="compare-savings">Ahorra {getSavingsPercent(selectedProduct)}%</span>
                  <h3>{selectedProduct.name}</h3>
                  <div className="compare-prices">
                    <span className="price-original">{formatCurrency(selectedProduct.originalPrice)}</span>
                    <strong className="price-discount">{formatCurrency(selectedProduct.discountPrice)}</strong>
                  </div>
                  {selectedProduct.costPerUse && (
                    <span className="compare-unit">
                      ${selectedProduct.costPerUse.toFixed(2)} / {selectedProduct.usageUnit || 'unidad'}
                    </span>
                  )}
                  <a 
                    href={selectedProduct.affiliateUrl} 
                    className="compare-buy-btn"
                    target="_blank" 
                    rel="noreferrer"
                  >
                    Comprar
                  </a>
                </div>
              </div>

              {/* VS Divider */}
              <div className="compare-vs">
                <span>VS</span>
              </div>

              {/* Producto a comparar */}
              <div className={`compare-card ${winner === 'compare' ? 'compare-card--winner' : ''}`}>
                {winner === 'compare' && <div className="winner-badge">🏆 Mejor precio</div>}
                <div className="compare-card__media">
                  {compareProduct.imageUrl ? (
                    <img src={compareProduct.imageUrl} alt={compareProduct.name} />
                  ) : (
                    <div className="no-image">Sin imagen</div>
                  )}
                </div>
                <div className="compare-card__body">
                  <span className="compare-savings">Ahorra {getSavingsPercent(compareProduct)}%</span>
                  <h3>{compareProduct.name}</h3>
                  <div className="compare-prices">
                    <span className="price-original">{formatCurrency(compareProduct.originalPrice)}</span>
                    <strong className="price-discount">{formatCurrency(compareProduct.discountPrice)}</strong>
                  </div>
                  {compareProduct.costPerUse && (
                    <span className="compare-unit">
                      ${compareProduct.costPerUse.toFixed(2)} / {compareProduct.usageUnit || 'unidad'}
                    </span>
                  )}
                  <a 
                    href={compareProduct.affiliateUrl} 
                    className="compare-buy-btn"
                    target="_blank" 
                    rel="noreferrer"
                  >
                    Comprar
                  </a>
                </div>
              </div>
            </div>

            {/* Resumen */}
            <div className="compare-summary">
              <div className="compare-summary__icon">💰</div>
              <p>
                {winner === 'selected' ? (
                  <>
                    <strong>{selectedProduct.name}</strong> es más barato por <strong>{formatCurrency(priceDiff)}</strong>
                  </>
                ) : (
                  <>
                    <strong>{compareProduct.name}</strong> es más barato por <strong>{formatCurrency(priceDiff)}</strong>
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CompareModal
