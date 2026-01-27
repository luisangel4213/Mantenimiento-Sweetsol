import { query } from '../db.js'

/**
 * @param {number} ordenId
 * @returns {Promise<{ id: number, orden_id: number, generado_por: number, firma_ruta: string | null, observaciones: string | null, created_at: Date } | null>}
 */
export async function findByOrdenId(ordenId) {
  const [rows] = await query(
    'SELECT id, orden_id, generado_por, firma_ruta, observaciones, created_at FROM informes WHERE orden_id = ? LIMIT 1',
    [ordenId]
  )
  return rows[0] || null
}

/**
 * @param {object} data - { orden_id, generado_por, firma_ruta?, observaciones? }
 * @returns {Promise<object>}
 */
export async function create(data) {
  const [res] = await query(
    'INSERT INTO informes (orden_id, generado_por, firma_ruta, observaciones) VALUES (?, ?, ?, ?)',
    [
      data.orden_id,
      data.generado_por,
      data.firma_ruta ?? null,
      data.observaciones ?? null,
    ]
  )
  const [rows] = await query('SELECT id, orden_id, generado_por, firma_ruta, observaciones, created_at FROM informes WHERE id = ?', [res.insertId])
  return rows[0]
}
