import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'

interface AdminRouteProps {
  children: ReactNode
}

function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>Verificando permisos...</p>
      </div>
    )
  }

  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Si el usuario no es admin, redirigir al inicio
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default AdminRoute
