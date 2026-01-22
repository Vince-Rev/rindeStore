import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './ProfileSidebar.css'

interface ProfileSidebarProps {
  isOpen: boolean
  onClose: () => void
}

function ProfileSidebar({ isOpen, onClose }: ProfileSidebarProps) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    onClose()
  }

  const handleAdminPanel = () => {
    onClose()
    navigate('/admin')
  }

  const handleFavorites = () => {
    onClose()
    navigate('/favoritos')
  }

  const handleHistorial = () => {
    onClose()
    navigate('/historial')
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`} 
        onClick={onClose}
      />
      <aside className={`profile-sidebar ${isOpen ? 'profile-sidebar--open' : ''}`}>
        <header className="sidebar-header">
          <h2>Mi cuenta</h2>
          <button className="sidebar-close" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="sidebar-profile">
          <div className="profile-avatar">
            <span>{getInitials(user?.displayName ?? null)}</span>
          </div>
          <div className="profile-info">
            <strong>{user?.displayName || 'Usuario'}</strong>
            <span>{user?.email}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {isAdmin && (
            <button onClick={handleAdminPanel} className="sidebar-link sidebar-link--admin">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Panel de control
            </button>
          )}
          <button onClick={handleHistorial} className="sidebar-link">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            Mi historial de ahorro
          </button>
          <button onClick={handleFavorites} className="sidebar-link">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            Mis favoritos
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

export default ProfileSidebar
