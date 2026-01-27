import { ESTADOS_ORDEN, ESTADOS_ORDEN_VISIBLE } from '../constants'

/**
 * Agrupa órdenes por estado. Normaliza estado desconocido a 'pendiente'.
 * @param {Array} ordenes
 * @returns {{ [estado]: number }}
 */
export function contarOrdenesPorEstado(ordenes) {
  const counts = ESTADOS_ORDEN_VISIBLE.reduce((acc, e) => {
    acc[e] = 0
    return acc
  }, {})

  for (const o of ordenes || []) {
    const e = o.estado && counts.hasOwnProperty(o.estado) ? o.estado : ESTADOS_ORDEN.PENDIENTE
    counts[e] = (counts[e] || 0) + 1
  }

  return counts
}

/**
 * Órdenes completadas hoy. Busca fechaCierre, completedAt o updatedAt.
 * @param {Array} ordenes
 * @returns {number}
 */
export function completadasHoy(ordenes) {
  const hoy = new Date().toDateString()
  return (ordenes || []).filter((o) => {
    if (o.estado !== ESTADOS_ORDEN.COMPLETADA) return false
    const d = o.fechaCierre || o.completedAt || o.updatedAt
    if (!d) return false
    const dt = typeof d === 'string' ? new Date(d) : d
    return dt.toDateString() === hoy
  }).length
}
