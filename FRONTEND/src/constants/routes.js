import { ROLES } from './roles'

/**
 * Ruta por defecto tras login o cuando se deniega acceso, según el rol.
 */
export const ROLE_DEFAULT_PATHS = {
  [ROLES.JEFE_MANTENIMIENTO]: '/reportes',
  [ROLES.OPERARIO_MANTENIMIENTO]: '/ordenes',
  [ROLES.OPERARIO_PRODUCCION]: '/dashboard',
}

export const getDefaultPathForRole = (role) =>
  (role && ROLE_DEFAULT_PATHS[role]) || '/dashboard'

/**
 * Roles requeridos por ruta. Clave = pathname.
 * Array vacío = cualquier rol autenticado.
 */
export const ROUTE_ROLES = {
  '/': [],
  '/ordenes': [],
  '/produccion': [ROLES.OPERARIO_PRODUCCION],
  '/equipos': [ROLES.JEFE_MANTENIMIENTO, ROLES.OPERARIO_MANTENIMIENTO],
  '/reportes': [ROLES.JEFE_MANTENIMIENTO],
  '/operarios': [ROLES.JEFE_MANTENIMIENTO],
}

/** Roles que pueden generar el informe técnico (desde orden completada). */
export const INFORME_TECNICO_ROLES = [
  ROLES.JEFE_MANTENIMIENTO,
  ROLES.OPERARIO_MANTENIMIENTO,
]

/**
 * Items del menú lateral con roles que pueden ver cada uno.
 * roles = [] → visible para todos los autenticados.
 * icon: clave para el icono (dashboard, ordenes, equipos, reportes).
 */
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: [] },
  { to: '/ordenes', label: 'Órdenes de Trabajo', icon: 'ordenes', roles: [] },
  { to: '/produccion', label: 'Solicitud de Mantenimiento', icon: 'ordenes', roles: [ROLES.OPERARIO_PRODUCCION] },
  { to: '/equipos', label: 'Equipos', icon: 'equipos', roles: [ROLES.JEFE_MANTENIMIENTO, ROLES.OPERARIO_MANTENIMIENTO] },
  { to: '/operarios', label: 'Operarios', icon: 'equipos', roles: [ROLES.JEFE_MANTENIMIENTO] },
  { to: '/reportes', label: 'Reportes', icon: 'reportes', roles: [ROLES.JEFE_MANTENIMIENTO] },
]
