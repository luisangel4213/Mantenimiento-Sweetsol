import * as OrdenMantenimiento from '../models/OrdenMantenimiento.js'

/**
 * Valida que la orden exista y permita subir evidencias (no cancelada)
 * antes de ejecutar multer. Evita guardar archivos en disco para órdenes inválidas.
 * Uso: router.post('/:id/evidencias', validarOrdenEvidencias, uploadEvidencias, ctrl.uploadEvidencias)
 */
export async function validarOrdenEvidencias(req, res, next) {
  const id = req.params?.id
  const num = Number(id)
  if (!id || !Number.isInteger(num) || num < 1) {
    const e = new Error('ID de orden inválido')
    e.status = 400
    return next(e)
  }
  try {
    const orden = await OrdenMantenimiento.findById(num, { includeEvidencias: false })
    if (!orden) {
      const e = new Error('Orden no encontrada')
      e.status = 404
      return next(e)
    }
    if (orden.estado === 'cancelada') {
      const e = new Error('No se pueden subir evidencias a una orden cancelada')
      e.status = 409
      return next(e)
    }
    next()
  } catch (err) {
    next(err)
  }
}
