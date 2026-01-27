import * as userService from '../services/userService.js'

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

