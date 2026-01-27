import api from './api'

const ENDPOINT = '/auth'

/**
 * Servicio de autenticación. Preparado para backend Node.js (Express, etc.).
 *
 * POST /auth/login
 * Body: { usuario: string, password: string }
 * - usuario: puede ser email o nombre de usuario; el backend valida.
 * - Si tu API usa "email", en Login llama: login({ email: usuario.trim(), password })
 *
 * Respuesta esperada 200:
 * { token: string, user: { id, email?, nombre?, role } }
 * - role: JEFE_MANTENIMIENTO | OPERARIO_MANTENIMIENTO | OPERARIO_PRODUCCION
 *
 * Errores típicos:
 * - 401: credenciales inválidas
 * - 400: validación (message, error, msg o errors[])
 * - 500: error del servidor
 */
export const authService = {
  login: (credentials) => api.post(`${ENDPOINT}/login`, credentials),
  getOperarios: () => api.get(`${ENDPOINT}/operarios`),
}
