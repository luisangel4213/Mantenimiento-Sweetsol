import { query } from '../db.js'

/**
 * @param {string} codigo - Ej: JEFE_MANTENIMIENTO
 * @returns {Promise<{ id: number, codigo: string, nombre: string } | null>}
 */
export async function findByCodigo(codigo) {
  const [rows] = await query('SELECT id, codigo, nombre FROM roles WHERE codigo = ? LIMIT 1', [codigo])
  return rows[0] || null
}

/**
 * @returns {Promise<Array<{ id: number, codigo: string, nombre: string }>>}
 */
export async function findAll() {
  const [rows] = await query('SELECT id, codigo, nombre FROM roles ORDER BY id')
  return rows
}
