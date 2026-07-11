/**
 * AuthContext — gestión del estado de autenticación.
 *
 * Con la estrategia de httpOnly cookies:
 * - El frontend NO almacena tokens. El browser los maneja automáticamente.
 * - El estado de autenticación se determina consultando GET /auth/me al inicio.
 * - Login/Register/Logout solo setean el estado de React; las cookies las maneja el backend.
 * - "Recordarme" se pasa al backend, que decide el max_age de la cookie.
 */
import { createContext, useState, useContext, useEffect, useCallback } from 'react'
import apiClient from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(async () => {
    try {
      // Revocar refresh token en el backend y limpiar cookies
      await apiClient.post('/auth/logout')
    } catch {
      // Aunque falle el endpoint, limpiamos el estado local
    }
    setUser(null)
  }, [])

  const refetchUser = useCallback(async () => {
    try {
      const data = await apiClient.get('/auth/me')
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Al montar: verificar si hay una sesión activa (cookie httpOnly válida)
  useEffect(() => {
    refetchUser()
  }, [refetchUser])

  const login = async (email, password, rememberMe = true) => {
    // Backend espera OAuth2PasswordRequestForm (form-data, campo "username")
    // El parámetro rememberMe se pasa en el campo "scopes" del form para
    // que el backend configure el max_age de la cookie de refresh.
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    if (rememberMe) {
      formData.append('scope', 'remember_me')
    }

    // El backend responde con el user y setea las cookies httpOnly automáticamente
    const data = await apiClient.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    // Obtener user completo (con id) desde /me para tener todos los campos
    const me = await apiClient.get('/auth/me')
    setUser(me)
    return data
  }

  const register = async (email, password) => {
    // El backend crea el usuario, setea cookies, y devuelve el UserResponse
    await apiClient.post('/auth/register', { email, password })

    // Obtener user completo
    const me = await apiClient.get('/auth/me')
    setUser(me)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
