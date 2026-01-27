import { verifyToken } from '../services/authService.js'

/**
 * Middleware de autenticación: verifica JWT en Authorization: Bearer <token>
 * y asigna req.user. Responde 401 si el token falta, es inválido o el usuario no existe.
 */
export async function auth(req, res, next) {
  const user = await verifyToken(req.headers.authorization)
  if (!user) {
    const e = new Error('No autorizado')
    e.status = 401
    return next(e)
  }
  req.user = user
  next()
}
