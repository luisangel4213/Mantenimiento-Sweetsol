import { ROLES } from './roles'

/**
 * Ruta por defecto tras login o cuando se deniega acceso, según el rol.
 */
export const ROLE_DEFAULT_PATHS = {
  [ROLES.JEFE_MANTENIMIENTO]: '/dashboard',
  [ROLES.OPERARIO_MANTENIMIENTO]: '/dashboard',
  [ROLES.OPERARIO_PRODUCCION]: '/dashboard',
  [ROLES.SUPER_USUARIO]: '/dashboard',
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
  '/produccion': [ROLES.OPERARIO_PRODUCCION, ROLES.OPERARIO_MANTENIMIENTO, ROLES.JEFE_MANTENIMIENTO, ROLES.SUPER_USUARIO],
  '/reportes': [ROLES.JEFE_MANTENIMIENTO, ROLES.SUPER_USUARIO],
  '/reportes/historial-maquina': [ROLES.JEFE_MANTENIMIENTO, ROLES.SUPER_USUARIO],
  '/operarios': [ROLES.JEFE_MANTENIMIENTO, ROLES.SUPER_USUARIO],
  '/usuarios': [ROLES.JEFE_MANTENIMIENTO, ROLES.SUPER_USUARIO],
}

/** Roles que pueden generar el informe técnico (solo órdenes en estado Proceso cerrado). */
export const INFORME_TECNICO_ROLES = [
  ROLES.JEFE_MANTENIMIENTO,
  ROLES.SUPER_USUARIO,
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
  { to: '/produccion', label: 'Solicitud de Mantenimiento', icon: 'ordenes', roles: [ROLES.OPERARIO_PRODUCCION, ROLES.OPERARIO_MANTENIMIENTO, ROLES.JEFE_MANTENIMIENTO, ROLES.SUPER_USUARIO] },
  { to: '/operarios', label: 'Operarios', icon: 'equipos', roles: [ROLES.JEFE_MANTENIMIENTO, ROLES.SUPER_USUARIO] },
  { to: '/usuarios', label: 'Administración de usuarios', icon: 'equipos', roles: [ROLES.JEFE_MANTENIMIENTO, ROLES.SUPER_USUARIO] },
  { to: '/reportes', label: 'Reportes', icon: 'reportes', roles: [ROLES.JEFE_MANTENIMIENTO, ROLES.SUPER_USUARIO] },
  { to: '/reportes/historial-maquina', label: 'Historial por Máquina', icon: 'reportes', roles: [ROLES.JEFE_MANTENIMIENTO, ROLES.SUPER_USUARIO] },
]
