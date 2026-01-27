import axios from 'axios'
import { TOKEN_KEY, USER_KEY } from '../constants'
import { normalizeApiError } from './apiErrorHandler'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/** @type {((norm: { message: string, status: number, isNetwork: boolean }) => void) | null} */
let globalErrorHandler = null

/**
 * Registra un manejador global para errores de API (p. ej. 5xx, red).
 * Se invoca desde el interceptor de respuesta antes de rechazar la promesa.
 * @param {((norm: { message: string, status: number, isNetwork: boolean }) => void) | null} fn
 */
export function setGlobalErrorHandler(fn) {
  globalErrorHandler = fn
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Interceptor de request: envío de token JWT ─────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Interceptor de response: manejo centralizado de errores ─────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const norm = normalizeApiError(error)
    Object.assign(error, {
      apiMessage: norm.message,
      status: norm.status,
      isNetwork: norm.isNetwork,
    })

    // 401 (excepto en login): limpiar sesión y redirigir
    if (norm.status === 401) {
      const isLogin = /\/auth\/login$/i.test(error.config?.url ?? '')
      if (!isLogin) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        window.location.href = '/login'
      }
    }

    // Invocar manejador global (p. ej. para 5xx o errores de red)
    if (typeof globalErrorHandler === 'function') {
      globalErrorHandler(norm)
    }

    return Promise.reject(error)
  }
)

export default api
export { getApiErrorMessage } from './apiErrorHandler'