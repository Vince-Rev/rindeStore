import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  updateProfile
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { checkIsAdmin } from '../services/adminService'
import './Auth.css'

type AuthMode = 'login' | 'register'

function Auth() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<AuthMode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const redirectAfterLogin = async (uid: string) => {
    const isAdminUser = await checkIsAdmin(uid)
    if (isAdminUser) {
      navigate('/admin')
    } else {
      navigate('/')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      let userUid: string
      
      if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Las contraseñas no coinciden')
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          formData.email, 
          formData.password
        )
        // Actualizar el nombre del usuario
        if (formData.name) {
          await updateProfile(userCredential.user, { displayName: formData.name })
        }
        userUid = userCredential.user.uid
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password)
        userUid = userCredential.user.uid
      }
      await redirectAfterLogin(userUid)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error de autenticación'
      setError(translateFirebaseError(errorMessage))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await redirectAfterLogin(result.user.uid)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar con Google'
      setError(translateFirebaseError(errorMessage))
    } finally {
      setLoading(false)
    }
  }

  const translateFirebaseError = (message: string): string => {
    if (message.includes('email-already-in-use')) return 'Este correo ya está registrado'
    if (message.includes('invalid-email')) return 'El correo no es válido'
    if (message.includes('weak-password')) return 'La contraseña debe tener al menos 6 caracteres'
    if (message.includes('user-not-found')) return 'No existe una cuenta con este correo'
    if (message.includes('wrong-password')) return 'Contraseña incorrecta'
    if (message.includes('invalid-credential')) return 'Credenciales inválidas'
    if (message.includes('too-many-requests')) return 'Demasiados intentos. Intenta más tarde'
    return message
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'))
    setFormData({ name: '', email: '', password: '', confirmPassword: '' })
    setError(null)
  }

  return (
    <div className="auth-page">
      <nav className="auth-nav">
        <a href="/" className="auth-brand">
          <span className="brand-drop">rinde</span>
          <span className="brand-name">rindeStore</span>
        </a>
      </nav>

      <div className="auth-container">
        <div className="auth-card">
          <header className="auth-header">
            <h1>{mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h1>
            <p>
              {mode === 'login'
                ? 'Ingresa para sincronizar tus compras y ver tu ahorro'
                : 'Únete a miles de familias que ahorran inteligentemente'}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="name">Nombre completo</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Tu nombre"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tu@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>
            )}

            {mode === 'login' && (
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>Recordarme</span>
                </label>
                <a href="#" className="forgot-link">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'Cargando...' : (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta')}
            </button>
          </form>

          <div className="auth-divider">
            <span>o continúa con</span>
          </div>

          <div className="social-buttons">
            <button 
              type="button" 
              className="social-btn social-btn--google"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </button>
          </div>

          <footer className="auth-footer">
            <p>
              {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
              <button type="button" onClick={toggleMode} className="toggle-mode">
                {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión'}
              </button>
            </p>
          </footer>
        </div>

        <div className="auth-benefits">
          <h2>Beneficios de tu cuenta</h2>
          <ul>
            <li>
              <span className="benefit-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              </span>
              <div>
                <strong>Historial de ahorro</strong>
                <p>Visualiza cuánto has ahorrado mes a mes</p>
              </div>
            </li>
            <li>
              <span className="benefit-icon">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </span>
              <div>
                <strong>Lista de favoritos</strong>
                <p>Guarda productos para comprar después</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <footer className="auth-page-footer">
        <p>© {new Date().getFullYear()} RindeStore · Ahorra inteligentemente</p>
      </footer>
    </div>
  )
}

export default Auth
