import { query } from '../db.js'
import * as Estacion from './Estacion.js'

const CRITICIDAD_VALUES = ['alta', 'media', 'baja']

/**
 * @param {object} [filtros] - { area, criticidad }
 * @returns {Promise<Array<{ id, nombre, codigo, area, criticidad, marca, modelo, estacionId }>>}
 */
export async function findAll(filtros = {}) {
  let sql = `
    SELECT m.id, m.nombre, m.codigo, m.marca, m.modelo, m.criticidad, m.estacion_id AS estacionId,
           e.nombre AS area
    FROM maquinas m
    INNER JOIN estaciones e ON e.id = m.estacion_id
    WHERE 1=1
  `
  const params = []
  if (filtros.area != null && filtros.area !== '') {
    sql += ' AND e.nombre = ?'
    params.push(filtros.area)
  }
  if (filtros.criticidad != null && CRITICIDAD_VALUES.includes(filtros.criticidad)) {
    sql += ' AND m.criticidad = ?'
    params.push(filtros.criticidad)
  }
  sql += ' ORDER BY m.nombre'
  const [rows] = await query(sql, params)
  return rows.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    codigo: r.codigo,
    area: r.area,
    criticidad: r.criticidad,
    marca: r.marca,
    modelo: r.modelo,
    estacionId: r.estacionId,
  }))
}

/**
 * @param {number} id
 * @returns {Promise<object | null>}
 */
export async function findById(id) {
  const [rows] = await query(
    `SELECT m.id, m.nombre, m.codigo, m.marca, m.modelo, m.criticidad, m.estacion_id AS estacionId,
            e.nombre AS area
     FROM maquinas m
     INNER JOIN estaciones e ON e.id = m.estacion_id
     WHERE m.id = ? LIMIT 1`,
    [id]
  )
  const r = rows[0]
  if (!r) return null
  return {
    id: r.id,
    nombre: r.nombre,
    codigo: r.codigo,
    area: r.area,
    criticidad: r.criticidad,
    marca: r.marca,
    modelo: r.modelo,
    estacionId: r.estacionId,
  }
}

/**
 * @param {object} data - { nombre, codigo?, marca?, modelo?, criticidad?, estacionId }
 * @returns {Promise<object>}
 */
export async function create(data) {
  let estacionId = data.estacionId
  if (estacionId == null && data.area) {
    const e = await Estacion.findByNombre(data.area)
    if (e) estacionId = e.id
  }
  if (estacionId == null) estacionId = 1
  const criticidad = data.criticidad && CRITICIDAD_VALUES.includes(data.criticidad) ? data.criticidad : 'media'
  const [res] = await query(
    `INSERT INTO maquinas (estacion_id, nombre, codigo, marca, modelo, criticidad)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      estacionId,
      data.nombre ?? '',
      data.codigo ?? null,
      data.marca ?? null,
      data.modelo ?? null,
      criticidad,
    ]
  )
  return findById(res.insertId)
}

/**
 * @param {number} id
 * @param {object} data - { nombre?, codigo?, marca?, modelo?, criticidad?, estacionId? }
 * @returns {Promise<object | null>}
 */
export async function update(id, data) {
  const curr = await findById(id)
  if (!curr) return null
  
  let estacionId = data.estacionId
  if (estacionId == null && data.area) {
    const e = await Estacion.findByNombre(data.area)
    if (e) estacionId = e.id
  }
  if (estacionId == null) estacionId = curr.estacionId
  
  const criticidad =
    data.criticidad !== undefined && CRITICIDAD_VALUES.includes(data.criticidad)
      ? data.criticidad
      : curr.criticidad
  await query(
    `UPDATE maquinas SET estacion_id=?, nombre=?, codigo=?, marca=?, modelo=?, criticidad=?
     WHERE id = ?`,
    [
      estacionId,
      data.nombre !== undefined ? data.nombre : curr.nombre,
      data.codigo !== undefined ? data.codigo : curr.codigo,
      data.marca !== undefined ? data.marca : curr.marca,
      data.modelo !== undefined ? data.modelo : curr.modelo,
      criticidad,
      id,
    ]
  )
  return findById(id)
}

/**
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function remove(id) {
  const [res] = await query('DELETE FROM maquinas WHERE id = ?', [id])
  return (res.affectedRows ?? 0) > 0
}
