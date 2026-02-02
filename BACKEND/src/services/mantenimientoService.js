import path from 'path'
import fs from 'fs'
import * as OrdenMantenimiento from '../models/OrdenMantenimiento.js'
import * as Evidencia from '../models/Evidencia.js'
import * as Informe from '../models/Informe.js'
import * as Maquina from '../models/Maquina.js'
import * as User from '../models/User.js'
import { env } from '../config/index.js'

const base = () => (env.apiBaseUrl || '').replace(/\/$/, '')

function mapEvidencias(evs) {
  const b = base()
  return (evs || []).map((e) => ({
    url: `${b}/uploads/${e.archivo_ruta}`,
    nombre: e.nombre_original,
  }))
}

function mapOrder(o) {
  if (!o) return o
  o.evidencias = mapEvidencias(o.evidencias)
  return o
}

export async function getOrdenes(filtros = {}) {
  const list = await OrdenMantenimiento.findAll(filtros, { includeEvidencias: false })
  return list
}

export async function asignarOrden(id, asignadoA) {
  const curr = await OrdenMantenimiento.findById(id, { includeEvidencias: false })
  if (!curr) {
    const e = new Error('Orden no encontrada')
    e.status = 404
    throw e
  }
  if (curr.estado === 'completada' || curr.estado === 'cancelada') {
    const e = new Error('No se puede asignar una orden completada o cancelada')
    e.status = 409
    throw e
  }
  const o = await OrdenMantenimiento.asignar(id, asignadoA)
  
  // Enriquecer con nombre del asignado
  let asignadoANombre = null
  if (o.asignadoA) {
    const u = await User.findById(o.asignadoA)
    if (u) asignadoANombre = u.nombre
  }
  
  return {
    ...mapOrder(o),
    asignadoANombre,
  }
}

export async function iniciarOrden(id, userId) {
  const curr = await OrdenMantenimiento.findById(id, { includeEvidencias: false })
  if (!curr) {
    const e = new Error('Orden no encontrada')
    e.status = 404
    throw e
  }
  if (curr.estado !== 'pendiente') {
    const e = new Error('Solo se puede iniciar una orden en estado pendiente')
    e.status = 409
    throw e
  }
  const o = await OrdenMantenimiento.iniciar(id, userId)
  return mapOrder(o)
}

export async function finalizarOrden(id, trabajoRealizado, datosReporte = null) {
  const curr = await OrdenMantenimiento.findById(id, { includeEvidencias: false })
  if (!curr) {
    const e = new Error('Orden no encontrada')
    e.status = 404
    throw e
  }
  if (curr.estado !== 'en_progreso') {
    const e = new Error('Solo se puede finalizar una orden en estado en progreso')
    e.status = 409
    throw e
  }
  // Validar estructura de datosReporte si se proporciona
  if (datosReporte && typeof datosReporte !== 'object') {
    const e = new Error('datosReporte debe ser un objeto válido')
    e.status = 400
    throw e
  }
  const o = await OrdenMantenimiento.finalizar(id, trabajoRealizado, datosReporte)
  return mapOrder(o)
}

export async function getOrdenById(id) {
  const o = await OrdenMantenimiento.findById(id)
  if (!o) {
    const e = new Error('Orden no encontrada')
    e.status = 404
    throw e
  }
  
  // Enriquecer con nombres y usuario del asignado (para preselección en dropdown)
  let asignadoANombre = null
  let asignadoAUsuario = null
  if (o.asignadoA) {
    const u = await User.findById(o.asignadoA)
    if (u) {
      asignadoANombre = u.nombre
      asignadoAUsuario = u.usuario
    }
  }
  
  let creadoPorNombre = null
  if (o.creadoPor) {
    const u = await User.findById(o.creadoPor)
    if (u) creadoPorNombre = u.nombre
  }
  
  const ordenEnriquecida = {
    ...mapOrder(o),
    asignadoANombre,
    asignadoAUsuario,
    creadoPorNombre,
  }
  // Asegurar que datosReporte sea siempre un objeto (para descripcionAdicional, etc.)
  if (ordenEnriquecida.datosReporte == null || typeof ordenEnriquecida.datosReporte !== 'object') {
    ordenEnriquecida.datosReporte = {}
  }
  return ordenEnriquecida
}

export async function createOrden(data, creadoPor) {
  const o = await OrdenMantenimiento.create(data, creadoPor)
  return mapOrder(o)
}

export async function updateOrden(id, data) {
  const o = await OrdenMantenimiento.update(id, data)
  if (!o) {
    const e = new Error('Orden no encontrada')
    e.status = 404
    throw e
  }
  const result = mapOrder(o)
  if (result.datosReporte == null || typeof result.datosReporte !== 'object') {
    result.datosReporte = {}
  }
  return result
}

export async function deleteOrden(id) {
  const ok = await OrdenMantenimiento.remove(id)
  if (!ok) {
    const e = new Error('Orden no encontrada')
    e.status = 404
    throw e
  }
  // Eliminar carpeta de evidencias de la orden (guardado seguro: ordenes/{id})
  const baseDir = path.resolve(env.uploadDir)
  const dir = path.join(baseDir, 'ordenes', String(id))
  if (fs.existsSync(dir)) {
    try {
      fs.rmSync(dir, { recursive: true })
    } catch {
      // Ignorar si falla (permisos, etc.)
    }
  }
}

/**
 * Añade evidencias a la orden. files = resultado de multer.
 * Inserta en tabla evidencias y devuelve la orden actualizada.
 */
export async function addEvidencias(id, files) {
  const ord = await OrdenMantenimiento.findById(id, { includeEvidencias: false })
  if (!ord) {
    const e = new Error('Orden no encontrada')
    e.status = 404
    throw e
  }
  const baseDir = path.resolve(env.uploadDir)
  for (const f of files || []) {
    const ruta = path.relative(baseDir, f.path).replace(/\\/g, '/')
    await Evidencia.create(id, ruta, f.originalname || f.filename || 'Evidencia', f.mimetype)
  }
  const o = await OrdenMantenimiento.findById(id)
  return mapOrder(o)
}

export async function getInforme(ordenId) {
  const ord = await OrdenMantenimiento.findById(ordenId, { includeEvidencias: false })
  if (!ord) {
    const e = new Error('Orden no encontrada')
    e.status = 404
    throw e
  }
  assertOrdenProcesoCerrado(ord, 'consultar el informe técnico')
  const inf = await Informe.findByOrdenId(ordenId)
  if (!inf) {
    const e = new Error('Informe no encontrado')
    e.status = 404
    throw e
  }
  return inf
}

/**
 * Genera los datos estructurados para informes (PDF/Excel).
 * Responde con orden enriquecida, informe (si existe) y vistas paraPDF/paraExcel.
 * @param {number} ordenId
 * @returns {Promise<object>} { orden, informe, paraPDF, paraExcel }
 */
const ESTADO_PROCESO_CERRADO = 'proceso_cerrado'

function assertOrdenProcesoCerrado(orden, accion = 'acceder al informe técnico') {
  if (orden.estado !== ESTADO_PROCESO_CERRADO) {
    const e = new Error(`Solo las órdenes en estado "Proceso cerrado" pueden ${accion}. La orden está en estado "${orden.estado || 'desconocido'}".`)
    e.status = 400
    throw e
  }
}

export async function getDatosParaInforme(ordenId) {
  const o = await OrdenMantenimiento.findById(ordenId)
  if (!o) {
    const e = new Error('Orden no encontrada')
    e.status = 404
    throw e
  }
  assertOrdenProcesoCerrado(o, 'consultar o generar el informe técnico')

  const b = base()
  const evidencias = mapEvidencias(o.evidencias || [])

  let equipoNombre = null
  let estacionNombre = null
  if (o.equipoId) {
    const maq = await Maquina.findById(o.equipoId)
    if (maq) {
      equipoNombre = maq.nombre
      estacionNombre = maq.area ?? null
    }
  }

  let creadoPorNombre = null
  if (o.creadoPor) {
    const u = await User.findById(o.creadoPor)
    if (u) creadoPorNombre = u.nombre
  }

  let asignadoANombre = null
  if (o.asignadoA) {
    const u = await User.findById(o.asignadoA)
    if (u) asignadoANombre = u.nombre
  }

  const orden = {
    id: o.id,
    titulo: o.titulo,
    descripcion: o.descripcion,
    trabajoRealizado: o.trabajoRealizado,
    estado: o.estado,
    prioridad: o.prioridad,
    fechaInicio: o.fechaInicio,
    fechaCierre: o.fechaCierre,
    equipoId: o.equipoId,
    equipoNombre,
    estacionNombre,
    creadoPor: o.creadoPor,
    creadoPorNombre,
    asignadoA: o.asignadoA,
    asignadoANombre,
    evidencias,
  }

  let informe = null
  let firmaUrl = null
  let generadoPor = null
  let fechaGeneracion = null
  let observaciones = null

  const inf = await Informe.findByOrdenId(ordenId)
  if (inf) {
    firmaUrl = inf.firma_ruta ? `${b}/uploads/${inf.firma_ruta}` : null
    const u = await User.findById(inf.generado_por)
    generadoPor = u?.nombre ?? null
    fechaGeneracion = inf.created_at
    observaciones = inf.observaciones ?? null
    informe = {
      observaciones,
      firmaUrl,
      generadoPor,
      fechaGeneracion,
    }
  }

  // Vistas listas para PDF y Excel (compatibles con exportarInformePDF/exportarInformeExcel del front)
  const ordenBase = {
    id: orden.id,
    titulo: orden.titulo,
    descripcion: orden.descripcion,
    trabajoRealizado: orden.trabajoRealizado,
    evidencias: orden.evidencias,
  }

  const paraPDF = {
    orden: ordenBase,
    firmaUrl,
    generadoPor: generadoPor ?? '',
  }

  const paraExcel = {
    orden: ordenBase,
    firmaUrl,
    generadoPor: generadoPor ?? '',
    observaciones: observaciones ?? '',
  }

  return {
    orden,
    informe,
    paraPDF,
    paraExcel,
  }
}

export async function createInforme(ordenId, data, generadoPor) {
  const ord = await OrdenMantenimiento.findById(ordenId, { includeEvidencias: false })
  if (!ord) {
    const e = new Error('Orden no encontrada')
    e.status = 404
    throw e
  }
  assertOrdenProcesoCerrado(ord, 'crear el informe técnico')
  try {
    return await Informe.create({
      orden_id: ordenId,
      generado_por: generadoPor,
      firma_ruta: data.firma_ruta ?? null,
      observaciones: data.observaciones ?? null,
    })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.original?.code === 'ER_DUP_ENTRY') {
      const e = new Error('Ya existe un informe para esta orden')
      e.status = 409
      throw e
    }
    throw err
  }
}

/**
 * Obtiene el historial de mantenimiento de una máquina específica.
 * Incluye datos agregados para análisis.
 *
 * @param {number} maquinaId
 * @param {{ desde?: string, hasta?: string }} filtros
 * @returns {Promise<{
 *   maquina: { id: number, nombre: string, codigo: string | null, area: string | null },
 *   historial: Array<{
 *     ordenId: number,
 *     fechaInicio: string | null,
     fechaCierre: string | null,
 *     estado: string,
 *     duracionMinutos: number | null,
 *     tipoMantenimiento: string | null,
 *     operarioId: number | null,
 *     operarioNombre: string | null,
 *     informeId: number | null
 *   }>
 * }>}
 */
export async function getHistorialPorMaquina(maquinaId, filtros = {}) {
  const id = Number(maquinaId)
  if (!id || Number.isNaN(id)) {
    const e = new Error('ID de máquina inválido')
    e.status = 400
    throw e
  }

  const maq = await Maquina.findById(id)
  if (!maq) {
    const e = new Error('Máquina no encontrada')
    e.status = 404
    throw e
  }

  const historial = await OrdenMantenimiento.findHistorialByMaquina(id, {
    ...filtros,
    maquinaNombre: maq.nombre,
  })

  return {
    maquina: {
      id: maq.id,
      nombre: maq.nombre,
      codigo: maq.codigo ?? null,
      area: maq.area ?? null,
    },
    historial,
  }
}
