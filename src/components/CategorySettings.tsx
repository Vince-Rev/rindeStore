import { useState, useEffect } from 'react'
import { 
  getCategories, 
  addCategory, 
  deleteCategory, 
  addSubcategory, 
  removeSubcategory,
  type Category 
} from '../services/categoryService'
import './CategorySettings.css'

// Emojis disponibles para categorías
const availableIcons = ['🧺', '🧻', '🥑', '🍼', '🐾', '☕', '🧴', '🍞', '🧹', '💊', '🏠', '🎮']

function CategorySettings() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('🧺')
  const [addingCategory, setAddingCategory] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [newSubcategory, setNewSubcategory] = useState('')
  const [addingSubcategory, setAddingSubcategory] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error cargando categorías:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return

    setAddingCategory(true)
    try {
      await addCategory(newCategoryName.trim(), selectedIcon)
      setNewCategoryName('')
      setSelectedIcon('🧺')
      setShowAddCategory(false)
      await loadCategories()
    } catch (error) {
      console.error('Error agregando categoría:', error)
      alert('Error al agregar la categoría')
    } finally {
      setAddingCategory(false)
    }
  }

  const handleDeleteCategory = async (category: Category) => {
    if (!category.id) return
    if (!confirm(`¿Eliminar la categoría "${category.name}" y todas sus subcategorías?`)) return

    try {
      await deleteCategory(category.id)
      await loadCategories()
    } catch (error) {
      console.error('Error eliminando categoría:', error)
      alert('Error al eliminar la categoría')
    }
  }

  const handleAddSubcategory = async (categoryId: string) => {
    if (!newSubcategory.trim()) return

    setAddingSubcategory(true)
    try {
      await addSubcategory(categoryId, newSubcategory.trim())
      setNewSubcategory('')
      await loadCategories()
    } catch (error) {
      console.error('Error agregando subcategoría:', error)
      alert('Error al agregar la subcategoría')
    } finally {
      setAddingSubcategory(false)
    }
  }

  const handleRemoveSubcategory = async (categoryId: string, subcategoryName: string) => {
    if (!confirm(`¿Eliminar la subcategoría "${subcategoryName}"?`)) return

    try {
      await removeSubcategory(categoryId, subcategoryName)
      await loadCategories()
    } catch (error) {
      console.error('Error eliminando subcategoría:', error)
      alert('Error al eliminar la subcategoría')
    }
  }

  if (loading) {
    return (
      <div className="category-settings-loading">
        <div className="spinner" />
        <p>Cargando categorías...</p>
      </div>
    )
  }

  return (
    <div className="category-settings">
      <div className="settings-header">
        <div>
          <h3>Categorías y Subcategorías</h3>
          <p>Administra las categorías disponibles para los productos</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowAddCategory(true)}
        >
          + Nueva categoría
        </button>
      </div>

      {/* Formulario para nueva categoría */}
      {showAddCategory && (
        <form className="add-category-form" onSubmit={handleAddCategory}>
          <div className="form-row">
            <div className="icon-selector">
              <label>Icono</label>
              <div className="icon-grid">
                {availableIcons.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    className={`icon-btn ${selectedIcon === icon ? 'selected' : ''}`}
                    onClick={() => setSelectedIcon(icon)}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="name-input">
              <label htmlFor="categoryName">Nombre de la categoría</label>
              <input
                id="categoryName"
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej: Lavandería pro"
                autoFocus
              />
            </div>
          </div>
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => setShowAddCategory(false)}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={addingCategory || !newCategoryName.trim()}
            >
              {addingCategory ? 'Guardando...' : 'Guardar categoría'}
            </button>
          </div>
        </form>
      )}

      {/* Lista de categorías */}
      <div className="categories-list">
        {categories.length === 0 ? (
          <div className="empty-state">
            <p>No hay categorías creadas aún</p>
          </div>
        ) : (
          categories.map(category => (
            <div key={category.id} className="category-item">
              <div 
                className="category-header"
                onClick={() => setExpandedCategory(
                  expandedCategory === category.id ? null : category.id!
                )}
              >
                <div className="category-info">
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                  <span className="subcategory-count">
                    {category.subcategories.length} subcategorías
                  </span>
                </div>
                <div className="category-actions">
                  <button 
                    className="action-btn action-btn--danger"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteCategory(category)
                    }}
                  >
                    Eliminar
                  </button>
                  <span className={`expand-icon ${expandedCategory === category.id ? 'expanded' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Subcategorías */}
              {expandedCategory === category.id && (
                <div className="subcategories-section">
                  <div className="subcategories-list">
                    {category.subcategories.length === 0 ? (
                      <p className="no-subcategories">Sin subcategorías</p>
                    ) : (
                      category.subcategories.map(sub => (
                        <div key={sub} className="subcategory-item">
                          <span>{sub}</span>
                          <button
                            className="remove-btn"
                            onClick={() => handleRemoveSubcategory(category.id!, sub)}
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="add-subcategory">
                    <input
                      type="text"
                      placeholder="Nueva subcategoría..."
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSubcategory(category.id!)
                        }
                      }}
                    />
                    <button
                      className="btn-add"
                      onClick={() => handleAddSubcategory(category.id!)}
                      disabled={addingSubcategory || !newSubcategory.trim()}
                    >
                      {addingSubcategory ? '...' : '+'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CategorySettings
