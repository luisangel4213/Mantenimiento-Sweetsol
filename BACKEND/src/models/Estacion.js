import { query } from '../db.js'

/**
 * @returns {Promise<Array<{ id: number, nombre: string, codigo: string | null, descripcion: string | null }>>}
 */
export async function findAll() {
  const [rows] = await query(
    'SELECT id, nombre, codigo, descripcion FROM estaciones ORDER BY nombre'
  )
  return rows
}

/**
 * @param {number} id
 * @returns {Promise<{ id: number, nombre: string, codigo: string | null, descripcion: string | null } | null>}
 */
export async function findById(id) {
  const [rows] = await query(
    'SELECT id, nombre, codigo, descripcion FROM estaciones WHERE id = ? LIMIT 1',
    [id]
  )
  return rows[0] || null
}

/**
 * @param {string} nombre
 * @returns {Promise<{ id: number, nombre: string, codigo: string | null, descripcion: string | null } | null>}
 */
export async function findByNombre(nombre) {
  const [rows] = await query(
    'SELECT id, nombre, codigo, descripcion FROM estaciones WHERE nombre = ? LIMIT 1',
    [nombre]
  )
  return rows[0] || null
}
