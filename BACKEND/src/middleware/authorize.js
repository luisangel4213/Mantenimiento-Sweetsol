import { ROLES_LIST, ROLES } from '../constants/index.js'

/**
 * Middleware de autorización por roles. Debe ir después de auth.
 * El rol SUPER_USUARIO tiene acceso a todo.
 * @param {...string} allowedRoles - Roles permitidos (ej: ROLES.JEFE_MANTENIMIENTO)
 */
export function authorize(...allowedRoles) {
  const set = new Set(allowedRoles.filter((r) => ROLES_LIST.includes(r)))

  return (req, res, next) => {
    if (!req.user) {
      const e = new Error('No autorizado')
      e.status = 401
      return next(e)
    }
    if (req.user.role === ROLES.SUPER_USUARIO) return next()
    if (set.size > 0 && !set.has(req.user.role)) {
      const e = new Error('No tiene permiso para esta acción')
      e.status = 403
      return next(e)
    }
    next()
  }
}
