import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AdminRoute from './components/AdminRoute'
import './index.css'
import App from './App.tsx'
import Auth from './pages/Auth.tsx'
import Admin from './pages/Admin.tsx'
import Favoritos from './pages/Favoritos.tsx'
import Historial from './pages/Historial.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/favoritos" element={<Favoritos />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
