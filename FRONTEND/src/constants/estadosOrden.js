export const ESTADOS_ORDEN = {
  PENDIENTE: 'pendiente',
  EN_PROGRESO: 'en_progreso',
  COMPLETADA: 'completada',
  PROCESO_CERRADO: 'proceso_cerrado',
  CANCELADA: 'cancelada',
}

export const ESTADOS_ORDEN_LABEL = {
  [ESTADOS_ORDEN.PENDIENTE]: 'Pendientes',
  [ESTADOS_ORDEN.EN_PROGRESO]: 'En progreso',
  [ESTADOS_ORDEN.COMPLETADA]: 'Completadas',
  [ESTADOS_ORDEN.PROCESO_CERRADO]: 'Proceso Cerrado',
  [ESTADOS_ORDEN.CANCELADA]: 'Canceladas',
}

/** Orden de los estados para mostrar en el dashboard */
export const ESTADOS_ORDEN_VISIBLE = [
  ESTADOS_ORDEN.PENDIENTE,
  ESTADOS_ORDEN.EN_PROGRESO,
  ESTADOS_ORDEN.COMPLETADA,
  ESTADOS_ORDEN.PROCESO_CERRADO,
  ESTADOS_ORDEN.CANCELADA,
]
