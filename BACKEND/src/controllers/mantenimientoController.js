import * as mantenimientoService from '../services/mantenimientoService.js'
import * as User from '../models/User.js'
import { ROLES } from '../constants/roles.js'

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
    let asignadoA = null
    const asignadoUsuario = req.body.asignadoUsuario != null && String(req.body.asignadoUsuario).trim() !== ''
      ? String(req.body.asignadoUsuario).trim()
      : null
    const asignadoNombre = req.body.asignadoNombre != null && String(req.body.asignadoNombre).trim() !== ''
      ? String(req.body.asignadoNombre).trim()
      : null

    // Resolver operario: primero por usuario de login, luego por nombre completo
    if (asignadoUsuario) {
      const u = await User.findByUsuarioAndRole(asignadoUsuario, ROLES.OPERARIO_MANTENIMIENTO)
      if (u) asignadoA = u.id
    }
    if (asignadoA == null && asignadoNombre) {
      const u = await User.findByNombreAndRole(asignadoNombre, ROLES.OPERARIO_MANTENIMIENTO)
      if (u) asignadoA = u.id
    }
    if (asignadoA == null && req.body.asignadoA != null) {
      asignadoA = Number(req.body.asignadoA)
    }

    if (asignadoA == null && (asignadoUsuario || asignadoNombre)) {
      return res.status(400).json({
        message: 'No se encontró un usuario de mantenimiento asociado a este operario. Verifique que el operario tenga un usuario creado en el sistema con rol de Operario de Mantenimiento.',
      })
    }

    let data = await mantenimientoService.asignarOrden(req.params.id, asignadoA)
    // Guardar descripción adicional si se envió (al asignar, el Jefe suele ingresarla aquí)
    if (req.body.descripcionAdicional !== undefined && req.body.descripcionAdicional !== null) {
      const datosReporte = { ...(data.datosReporte || {}), descripcionAdicional: String(req.body.descripcionAdicional).trim() }
      await mantenimientoService.updateOrden(req.params.id, { datosReporte })
      data = await mantenimientoService.getOrdenById(req.params.id)
    }
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
