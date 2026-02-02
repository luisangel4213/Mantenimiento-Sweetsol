import * as mantenimientoService from '../services/mantenimientoService.js'

/**
 * GET /api/maquinas/:id/historial
 * Query opcional: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 *
 * Devuelve el historial de mantenimiento de una máquina específica.
 */
export async function getHistorial(req, res, next) {
  try {
    const { desde, hasta } = req.query
    const maquinaId = Number(req.params.id)

    const data = await mantenimientoService.getHistorialPorMaquina(maquinaId, {
      desde: desde || undefined,
      hasta: hasta || undefined,
    })

    res.json(data)
  } catch (e) {
    next(e)
  }
}

