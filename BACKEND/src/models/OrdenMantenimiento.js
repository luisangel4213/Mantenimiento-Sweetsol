import { query } from '../db.js'
import * as Evidencia from './Evidencia.js'

const ESTADOS = ['pendiente', 'en_progreso', 'completada', 'cancelada']
const PRIORIDADES = ['alta', 'media', 'baja']

// Cache para verificar si la columna datos_reporte existe
let hasDatosReporteColumnCache = null

async function checkDatosReporteColumn() {
  if (hasDatosReporteColumnCache !== null) {
    return hasDatosReporteColumnCache
  }
  try {
    const [cols] = await query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'ordenes_mantenimiento' 
        AND COLUMN_NAME = 'datos_reporte'
    `)
    hasDatosReporteColumnCache = cols && cols.length > 0
  } catch {
    hasDatosReporteColumnCache = false
  }
  return hasDatosReporteColumnCache
}

function toCamel(o) {
  if (!o) return null
  // Parsear datos_reporte si es string JSON
  let datosReporte = null
  if (o.datos_reporte) {
    try {
      datosReporte = typeof o.datos_reporte === 'string' ? JSON.parse(o.datos_reporte) : o.datos_reporte
    } catch {
      datosReporte = null
    }
  }
  return {
    id: o.id,
    titulo: o.titulo ?? null,
    descripcion: o.descripcion ?? null,
    estado: ESTADOS.includes(o.estado) ? o.estado : 'pendiente',
    trabajoRealizado: o.trabajo_realizado ?? null,
    datosReporte,
    equipoId: o.maquina_id ?? null,
    asignadoA: o.asignado_a ?? null,
    creadoPor: o.creado_por ?? null,
    prioridad: o.prioridad && PRIORIDADES.includes(o.prioridad) ? o.prioridad : 'media',
    fechaInicio: o.fecha_inicio ?? null,
    fechaCierre: o.fecha_cierre ?? null,
    createdAt: o.created_at ?? null,
    updatedAt: o.updated_at ?? null,
  }
}

/**
 * @param {object} [filtros] - { estado, equipoId, asignadoA, creadoPor, desde, hasta }
 * @param {{ includeEvidencias?: boolean }} [opts]
 * @returns {Promise<Array<object>>}
 */
export async function findAll(filtros = {}, opts = {}) {
  // Verificar si la columna datos_reporte existe
  const hasColumn = await checkDatosReporteColumn()
  const datosReporteColumn = hasColumn ? ', datos_reporte' : ''
  
  let sql = `
    SELECT id, maquina_id, asignado_a, creado_por, titulo, descripcion, estado, trabajo_realizado${datosReporteColumn},
           prioridad, fecha_inicio, fecha_cierre, created_at, updated_at
    FROM ordenes_mantenimiento
    WHERE 1=1
  `
  const params = []
  if (filtros.estado != null && filtros.estado !== '' && ESTADOS.includes(filtros.estado)) {
    sql += ' AND estado = ?'
    params.push(filtros.estado)
  }
  if (filtros.equipoId != null) {
    sql += ' AND maquina_id = ?'
    params.push(filtros.equipoId)
  }
  if (filtros.asignadoA !== undefined) {
    if (filtros.asignadoA === null || filtros.asignadoA === '') {
      sql += ' AND asignado_a IS NULL'
    } else {
      sql += ' AND asignado_a = ?'
      params.push(filtros.asignadoA)
    }
  }
  if (filtros.creadoPor != null && filtros.creadoPor !== '') {
    sql += ' AND creado_por = ?'
    params.push(filtros.creadoPor)
  }
  if (filtros.desde) {
    sql += ' AND created_at >= ?'
    params.push(filtros.desde)
  }
  if (filtros.hasta) {
    sql += ' AND created_at <= ?'
    params.push(filtros.hasta)
  }
  sql += ' ORDER BY created_at DESC'
  const [rows] = await query(sql, params)
  const list = rows.map((r) => toCamel(r))
  if (opts.includeEvidencias) {
    for (const o of list) {
      const evs = await Evidencia.findByOrdenId(o.id)
      o.evidencias = evs.map((e) => ({ archivo_ruta: e.archivo_ruta, nombre_original: e.nombre_original }))
    }
  } else {
    list.forEach((o) => { o.evidencias = [] })
  }
  return list
}

/**
 * @param {number} id
 * @param {{ includeEvidencias?: boolean }} [opts]
 * @returns {Promise<object | null>}
 */
export async function findById(id, opts = {}) {
  // Verificar si la columna datos_reporte existe
  const hasColumn = await checkDatosReporteColumn()
  const datosReporteColumn = hasColumn ? ', datos_reporte' : ''
  
  const [rows] = await query(
    `SELECT id, maquina_id, asignado_a, creado_por, titulo, descripcion, estado, trabajo_realizado${datosReporteColumn},
            prioridad, fecha_inicio, fecha_cierre, created_at, updated_at
     FROM ordenes_mantenimiento WHERE id = ? LIMIT 1`,
    [id]
  )
  const o = toCamel(rows[0])
  if (!o) return null
  if (opts.includeEvidencias !== false) {
    const evs = await Evidencia.findByOrdenId(id)
    o.evidencias = evs.map((e) => ({ archivo_ruta: e.archivo_ruta, nombre_original: e.nombre_original }))
  } else {
    o.evidencias = []
  }
  return o
}

/**
 * @param {object} data - { titulo, descripcion?, estado?, equipoId?, prioridad?, creadoPor?, fechaInicio?, fechaCierre? }
 * @param {number} [creadoPor] - Usuario que crea (req.user.id)
 * @returns {Promise<object>}
 */
export async function create(data, creadoPor = null) {
  const estado = data.estado && ESTADOS.includes(data.estado) ? data.estado : 'pendiente'
  const prioridad = data.prioridad && PRIORIDADES.includes(data.prioridad) ? data.prioridad : 'media'
  
  // Normalizar fecha_inicio: acepta ISO string o formato MySQL (YYYY-MM-DD HH:MM:SS)
  let fecha_inicio = null
  if (data.fechaInicio) {
    if (typeof data.fechaInicio === 'string') {
      // Si es formato MySQL (YYYY-MM-DD HH:MM:SS), usar directamente
      if (data.fechaInicio.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        fecha_inicio = data.fechaInicio
      } else {
        // Si es ISO string, convertir a formato MySQL
        try {
          const date = new Date(data.fechaInicio)
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const hours = String(date.getHours()).padStart(2, '0')
            const minutes = String(date.getMinutes()).padStart(2, '0')
            const seconds = String(date.getSeconds()).padStart(2, '0')
            fecha_inicio = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
          }
        } catch (e) {
          console.warn('[OrdenMantenimiento.create] Error al parsear fechaInicio:', e.message)
          fecha_inicio = null
        }
      }
    }
  }
  
  const fecha_cierre = data.fechaCierre || null
  
  const [res] = await query(
    `INSERT INTO ordenes_mantenimiento (maquina_id, asignado_a, creado_por, titulo, descripcion, estado, trabajo_realizado, prioridad, fecha_inicio, fecha_cierre)
     VALUES (?, NULL, ?, ?, ?, ?, NULL, ?, ?, ?)`,
    [
      data.equipoId ?? null,
      creadoPor ?? data.creadoPor ?? null,
      data.titulo ?? '',
      data.descripcion ?? null,
      estado,
      prioridad,
      fecha_inicio,
      fecha_cierre,
    ]
  )
  return findById(res.insertId)
}

/**
 * @param {number} id
 * @param {object} data - Campos a actualizar (estado, trabajoRealizado, datosReporte, equipoId, titulo, descripcion, prioridad, asignadoA, fechaInicio, fechaCierre)
 * @returns {Promise<object | null>}
 */
export async function update(id, data) {
  const curr = await findById(id, { includeEvidencias: false })
  if (!curr) return null

  // Verificar si la columna datos_reporte existe
  const hasColumn = await checkDatosReporteColumn()

  // Función auxiliar para normalizar fecha a formato MySQL
  const normalizarFecha = (fechaValue) => {
    if (!fechaValue) return null
    if (typeof fechaValue === 'string') {
      // Si es formato MySQL (YYYY-MM-DD HH:MM:SS), usar directamente
      if (fechaValue.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        return fechaValue
      }
      // Si es formato MySQL solo fecha (YYYY-MM-DD), agregar hora
      if (fechaValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return `${fechaValue} 00:00:00`
      }
      // Si es ISO string, convertir a formato MySQL
      try {
        const date = new Date(fechaValue)
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          const seconds = String(date.getSeconds()).padStart(2, '0')
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
        }
      } catch (e) {
        console.warn('[OrdenMantenimiento.update] Error al parsear fecha:', e.message)
        return null
      }
    }
    return null
  }

  const maquina_id = data.equipoId !== undefined ? data.equipoId : (curr.equipoId ?? null)
  const asignado_a = data.asignadoA !== undefined ? data.asignadoA : curr.asignadoA
  const titulo = data.titulo !== undefined ? data.titulo : curr.titulo
  const descripcion = data.descripcion !== undefined ? data.descripcion : curr.descripcion
  const estado = data.estado !== undefined && ESTADOS.includes(data.estado) ? data.estado : curr.estado
  const trabajo_realizado = data.trabajoRealizado !== undefined ? data.trabajoRealizado : curr.trabajoRealizado
  const datos_reporte = data.datosReporte !== undefined ? (data.datosReporte ? JSON.stringify(data.datosReporte) : null) : null
  const prioridad = data.prioridad !== undefined && PRIORIDADES.includes(data.prioridad) ? data.prioridad : curr.prioridad
  
  // Normalizar fechas: si se proporciona nueva fecha, normalizarla; si no, mantener la actual normalizada
  let fecha_inicio = null
  if (data.fechaInicio !== undefined) {
    fecha_inicio = normalizarFecha(data.fechaInicio)
  } else if (curr.fechaInicio) {
    // Si no se actualiza pero existe, mantenerla (ya debería estar en formato correcto de la BD)
    fecha_inicio = curr.fechaInicio
  }
  
  let fecha_cierre = null
  if (data.fechaCierre !== undefined) {
    fecha_cierre = normalizarFecha(data.fechaCierre)
  } else if (curr.fechaCierre) {
    fecha_cierre = curr.fechaCierre
  }

  if (hasColumn) {
    await query(
      `UPDATE ordenes_mantenimiento
       SET maquina_id=?, asignado_a=?, titulo=?, descripcion=?, estado=?, trabajo_realizado=?, datos_reporte=?, prioridad=?, fecha_inicio=?, fecha_cierre=?
       WHERE id = ?`,
      [maquina_id, asignado_a, titulo, descripcion, estado, trabajo_realizado, datos_reporte, prioridad, fecha_inicio, fecha_cierre, id]
    )
  } else {
    await query(
      `UPDATE ordenes_mantenimiento
       SET maquina_id=?, asignado_a=?, titulo=?, descripcion=?, estado=?, trabajo_realizado=?, prioridad=?, fecha_inicio=?, fecha_cierre=?
       WHERE id = ?`,
      [maquina_id, asignado_a, titulo, descripcion, estado, trabajo_realizado, prioridad, fecha_inicio, fecha_cierre, id]
    )
  }
  return findById(id)
}

/**
 * Asigna una orden a un usuario.
 * @param {number} id
 * @param {number | null} asignadoA - ID de usuario; null para desasignar
 * @returns {Promise<object | null>}
 */
export async function asignar(id, asignadoA) {
  const curr = await findById(id, { includeEvidencias: false })
  if (!curr) return null
  if (curr.estado === 'completada' || curr.estado === 'cancelada') return null
  await query('UPDATE ordenes_mantenimiento SET asignado_a = ? WHERE id = ?', [asignadoA, id])
  return findById(id)
}

/**
 * Inicia una orden: estado en_progreso, fecha_inicio=NOW(). Si no tiene asignado, asigna a userId.
 * @param {number} id
 * @param {number} [userId] - Para auto-asignar si asignado_a es null
 * @returns {Promise<object | null>}
 */
export async function iniciar(id, userId = null) {
  const curr = await findById(id, { includeEvidencias: false })
  if (!curr) return null
  if (curr.estado !== 'pendiente') return null
  const asignado = curr.asignadoA ?? userId
  await query(
    'UPDATE ordenes_mantenimiento SET estado = ?, fecha_inicio = NOW(), asignado_a = COALESCE(asignado_a, ?) WHERE id = ?',
    ['en_progreso', asignado, id]
  )
  return findById(id)
}

/**
 * Finaliza una orden: estado completada, fecha_cierre=NOW(), trabajo_realizado, datos_reporte.
 * @param {number} id
 * @param {string} [trabajoRealizado]
 * @param {object} [datosReporte] - Objeto JSON con todos los datos del reporte completo
 * @returns {Promise<object | null>}
 */
export async function finalizar(id, trabajoRealizado = null, datosReporte = null) {
  const curr = await findById(id, { includeEvidencias: false })
  if (!curr) return null
  if (curr.estado !== 'en_progreso') return null
  
  // Verificar si la columna datos_reporte existe
  const hasColumn = await checkDatosReporteColumn()
  const datos_reporte_json = datosReporte ? JSON.stringify(datosReporte) : null
  
  if (hasColumn) {
    await query(
      'UPDATE ordenes_mantenimiento SET estado = ?, fecha_cierre = NOW(), trabajo_realizado = ?, datos_reporte = ? WHERE id = ?',
      ['completada', trabajoRealizado ?? null, datos_reporte_json, id]
    )
  } else {
    await query(
      'UPDATE ordenes_mantenimiento SET estado = ?, fecha_cierre = NOW(), trabajo_realizado = ? WHERE id = ?',
      ['completada', trabajoRealizado ?? null, id]
    )
  }
  return findById(id)
}

/**
 * @param {number} id
 * @returns {Promise<boolean>}
 */
export async function remove(id) {
  const [res] = await query('DELETE FROM ordenes_mantenimiento WHERE id = ?', [id])
  return (res.affectedRows ?? 0) > 0
}
