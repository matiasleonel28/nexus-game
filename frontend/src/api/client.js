/**
 * Cliente Axios centralizado para Nexus.
 *
 * Estrategia de autenticación (httpOnly cookies):
 * - Los tokens JWT van en cookies httpOnly que el browser maneja automáticamente.
 * - El frontend NO almacena tokens en localStorage ni sessionStorage.
 * - `withCredentials: true` le dice a axios que envíe las cookies en cada request.
 * - El interceptor de 401 intenta un refresh silencioso llamando a /auth/refresh.
 *   Si el refresh también falla, redirige a /login.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,   // envía las cookies httpOnly en cada request
})

// Interceptor de request: no hay nada que inyectar manualmente,
// el browser envía las cookies automáticamente.
// (El interceptor se mantiene por si necesitamos agregar headers en el futuro)
apiClient.interceptors.request.use((config) => config)

// Interceptor de response: refresh automático en 401 + unwrap .data + mensajes humanos
let _isRefreshing = false
let _refreshQueue = []

apiClient.interceptors.response.use(
  res => res.data,
  async (err) => {
    const originalRequest = err.config

    // Intento de refresh si es 401, no es retry, y no es el propio /auth/refresh ni /auth/login
    const isAuthEndpoint = originalRequest.url?.includes('/auth/refresh') ||
                           originalRequest.url?.includes('/auth/login')

    if (err.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      if (_isRefreshing) {
        // Si ya hay un refresh en curso, encolar y esperar
        return new Promise((resolve) => {
          _refreshQueue.push(() => resolve(apiClient(originalRequest)))
        })
      }

      _isRefreshing = true
      try {
        // El refresh token está en cookie httpOnly; el backend lo lee automáticamente
        await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })

        // Liberar la cola de requests que esperaban
        _refreshQueue.forEach(cb => cb())
        _refreshQueue = []

        return apiClient(originalRequest)
      } catch {
        // Refresh falló → sesión expirada, redirigir a login
        _refreshQueue = []
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        _isRefreshing = false
      }
    }

    // Mensajes de error amigables en español
    let friendlyMessage = 'Ocurrió un problema temporal. Por favor, intenta de nuevo en unos instantes.'
    if (err.message === 'Network Error' || err.code === 'ECONNABORTED') {
      friendlyMessage = 'No logramos conectar con el servidor. Verifica tu conexión a internet o reintenta más tarde.'
    } else if (err.response) {
      if (err.response.status === 404) friendlyMessage = 'No encontramos el juego o la lista que buscabas.'
      if (err.response.status === 500) friendlyMessage = 'Tenemos un problema técnico en nuestro sistema. Ya lo estamos revisando.'
    }

    console.error('API error:', err.response?.data || err.message)
    return Promise.reject({ message: friendlyMessage, status: err.response?.status, detail: err.response?.data?.detail })
  }
)

export default apiClient
