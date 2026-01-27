import * as mantenimientoService from '../services/mantenimientoService.js'

export async function getOrdenes(req, res, next) {
  try {
    const { estado, equipoId, asignadoA, creadoPor, desde, hasta } = req.query
    const filtros = {
      estado: estado || undefined,
      equipoId: equipoId || undefined,
      creadoPor: creadoPor || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
    }
    
    // Manejar asignadoA: puede ser un ID, 'null' (string), o undefined
    if (asignadoA !== undefined && asignadoA !== null && asignadoA !== '') {
      if (asignadoA === 'null' || asignadoA === 'NULL') {
        filtros.asignadoA = null
      } else {
        const id = Number(asignadoA)
        if (!isNaN(id)) {
          filtros.asignadoA = id
        }
      }
    }
    
    const data = await mantenimientoService.getOrdenes(filtros)
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function getOrdenById(req, res, next) {
  try {
    const data = await mantenimientoService.getOrdenById(req.params.id)
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function createOrden(req, res, next) {
  try {
    const creadoPor = req.user?.id ?? null
    const data = await mantenimientoService.createOrden(req.body, creadoPor)
    res.status(201).json(data)
  } catch (e) {
    next(e)
  }
}

export async function updateOrden(req, res, next) {
  try {
    const data = await mantenimientoService.updateOrden(req.params.id, req.body)
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function deleteOrden(req, res, next) {
  try {
    await mantenimientoService.deleteOrden(req.params.id)
    res.status(204).send()
  } catch (e) {
    next(e)
  }
}

export async function uploadEvidencias(req, res, next) {
  try {
    const files = req.files || []
    const data = await mantenimientoService.addEvidencias(req.params.id, files)
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function getDatosInforme(req, res, next) {
  try {
    const data = await mantenimientoService.getDatosParaInforme(req.params.id)
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function getInforme(req, res, next) {
  try {
    const data = await mantenimientoService.getInforme(req.params.id)
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function createInforme(req, res, next) {
  try {
    const generadoPor = req.user?.id
    if (!generadoPor) {
      const err = new Error('Usuario no autenticado')
      err.status = 401
      throw err
    }
    const data = await mantenimientoService.createInforme(req.params.id, req.body, generadoPor)
    res.status(201).json(data)
  } catch (e) {
    next(e)
  }
}

export async function asignarOrden(req, res, next) {
  try {
    const asignadoA = req.body.asignadoA != null ? Number(req.body.asignadoA) : null
    const data = await mantenimientoService.asignarOrden(req.params.id, asignadoA)
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function iniciarOrden(req, res, next) {
  try {
    const userId = req.user?.id ?? null
    const data = await mantenimientoService.iniciarOrden(req.params.id, userId)
    res.json(data)
  } catch (e) {
    next(e)
  }
}

export async function finalizarOrden(req, res, next) {
  try {
    const trabajoRealizado = req.body?.trabajoRealizado ?? null
    const datosReporte = req.body?.datosReporte ?? null
    const data = await mantenimientoService.finalizarOrden(req.params.id, trabajoRealizado, datosReporte)
    res.json(data)
  } catch (e) {
    next(e)
  }
}
