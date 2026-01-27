import { ROLES_LIST } from '../constants/index.js'

/**
 * Middleware de autorización por roles. Debe ir después de auth.
 * @param {...string} allowedRoles - Roles permitidos (ej: ROLES.JEFE_MANTENIMIENTO)
 * @example
 *   router.get('/admin', auth, authorize(ROLES.JEFE_MANTENIMIENTO), ctrl.admin)
 *   router.get('/equipos', auth, authorize(ROLES.JEFE_MANTENIMIENTO, ROLES.OPERARIO_MANTENIMIENTO), ctrl.list)
 */
export function authorize(...allowedRoles) {
  const set = new Set(allowedRoles.filter((r) => ROLES_LIST.includes(r)))

  return (req, res, next) => {
    if (!req.user) {
      const e = new Error('No autorizado')
      e.status = 401
      return next(e)
    }
    if (set.size > 0 && !set.has(req.user.role)) {
      const e = new Error('No tiene permiso para esta acción')
      e.status = 403
      return next(e)
    }
    next()
  }
}
