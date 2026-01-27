import { query } from '../db.js'

/**
 * @param {number} ordenId
 * @returns {Promise<Array<{ id: number, archivo_ruta: string, nombre_original: string, mime_type: string | null }>>}
 */
export async function findByOrdenId(ordenId) {
  const [rows] = await query(
    'SELECT id, archivo_ruta, nombre_original, mime_type FROM evidencias WHERE orden_id = ? ORDER BY created_at',
    [ordenId]
  )
  return rows
}

/**
 * @param {number} ordenId
 * @param {string} archivoRuta - Ej: nombre del fichero en uploads
 * @param {string} nombreOriginal
 * @param {string} [mimeType]
 * @returns {Promise<{ id: number, archivo_ruta: string, nombre_original: string }>}
 */
export async function create(ordenId, archivoRuta, nombreOriginal, mimeType = null) {
  const [res] = await query(
    'INSERT INTO evidencias (orden_id, archivo_ruta, nombre_original, mime_type) VALUES (?, ?, ?, ?)',
    [ordenId, archivoRuta, nombreOriginal, mimeType]
  )
  return { id: res.insertId, archivo_ruta: archivoRuta, nombre_original: nombreOriginal }
}
