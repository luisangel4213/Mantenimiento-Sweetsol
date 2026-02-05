import * as userService from '../services/userService.js'
import * as User from '../models/User.js'
import { ROLES } from '../constants/roles.js'

/**
 * Crea un nuevo operario de mantenimiento.
 * POST /api/usuarios/operarios
 * Body: { usuario: string, email?: string, password: string, nombre: string }
 */
export async function crearOperario(req, res, next) {
  try {
    const data = await userService.crearOperario(req.body)
    res.status(201).json(data)
  } catch (e) {
    next(e)
  }
}

/**
 * Lista todos los operarios de mantenimiento.
 * GET /api/usuarios/operarios
 */
export async function listarOperarios(req, res, next) {
  try {
    const data = await userService.listarOperarios()
    res.json(data)
  } catch (e) {
    next(e)
  }
}

/**
 * Lista todos los usuarios (todos los roles). Jefe de Mantenimiento y Super Usuario.
 * GET /api/usuarios/todos
 */
export async function listarUsuarios(req, res, next) {
  try {
    const role = req.user?.role
    if (role !== ROLES.SUPER_USUARIO && role !== ROLES.JEFE_MANTENIMIENTO) {
      const e = new Error('No tiene permiso para esta acción')
      e.status = 403
      throw e
    }
    const data = await userService.listarUsuarios()
    res.json(data)
  } catch (e) {
    next(e)
  }
}/**
 * Crea un usuario. Jefe de Mantenimiento (Calidad, Producción, Mantenimiento, Coordinador) o Super Usuario (cualquier rol).
 * POST /api/usuarios
 * Body: { rolCodigo: string, usuario: string, nombre: string, email?: string, password: string }
 */
export async function crearUsuario(req, res, next) {
  try {
    const role = req.user?.role
    if (role !== ROLES.SUPER_USUARIO && role !== ROLES.JEFE_MANTENIMIENTO) {
      const e = new Error('No tiene permiso para esta acción')
      e.status = 403
      throw e
    }
    const rolCodigo = req.body?.rolCodigo
    if (role === ROLES.JEFE_MANTENIMIENTO && rolCodigo === ROLES.SUPER_USUARIO) {
      const e = new Error('Solo el Super Usuario puede crear usuarios con rol Super Usuario')
      e.status = 403
      throw e
    }
    const data = await userService.crearUsuario(req.body)
    res.status(201).json(data)
  } catch (e) {
    next(e)
  }
}/**
 * Actualiza nombre, usuario y/o contraseña de un usuario. Jefe de Mantenimiento y Super Usuario.
 * El Jefe no puede actualizar al Super Usuario.
 * PUT /api/usuarios/:id
 * Body: { nombre?: string, usuario?: string, password?: string }
 */
export async function actualizarUsuario(req, res, next) {
  try {
    const role = req.user?.role
    if (role !== ROLES.SUPER_USUARIO && role !== ROLES.JEFE_MANTENIMIENTO) {
      const e = new Error('No tiene permiso para esta acción')
      e.status = 403
      throw e
    }
    const { id } = req.params
    const idNum = Number(id)
    if (!idNum) {
      const e = new Error('ID de usuario inválido')
      e.status = 400
      throw e
    }
    const target = await User.findByIdAny(idNum)
    if (!target) {
      const e = new Error('Usuario no encontrado')
      e.status = 404
      throw e
    }
    if (role === ROLES.JEFE_MANTENIMIENTO && target.role === ROLES.SUPER_USUARIO) {
      const e = new Error('No puede modificar al Super Usuario')
      e.status = 403
      throw e
    }
    await userService.actualizarUsuario(idNum, req.body)
    const updated = await User.findById(idNum)
    res.json(updated || { id: idNum })
  } catch (e) {
    next(e)
  }
}/**
 * Desactiva un usuario (soft delete). Jefe de Mantenimiento y Super Usuario. No se puede desactivar al Super Usuario ni a sí mismo.
 * DELETE /api/usuarios/:id
 */
export async function eliminarUsuario(req, res, next) {
  try {
    const role = req.user?.role
    if (role !== ROLES.SUPER_USUARIO && role !== ROLES.JEFE_MANTENIMIENTO) {
      const e = new Error('No tiene permiso para esta acción')
      e.status = 403
      throw e
    }
    const { id } = req.params
    const idNum = Number(id)
    if (!idNum) {
      const e = new Error('ID de usuario inválido')
      e.status = 400
      throw e
    }
    if (idNum === req.user?.id) {
      const e = new Error('No puede desactivar su propio usuario')
      e.status = 400
      throw e
    }
    const target = await User.findByIdAny(idNum)
    if (!target) {
      const e = new Error('Usuario no encontrado')
      e.status = 404
      throw e
    }
    if (target.role === ROLES.SUPER_USUARIO) {
      const e = new Error('No se puede desactivar al Super Usuario')
      e.status = 403
      throw e
    }
    await userService.eliminarUsuario(idNum)
    res.status(204).send()
  } catch (e) {
    next(e)
  }
}
