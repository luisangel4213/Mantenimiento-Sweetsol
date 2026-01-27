import * as authService from '../services/authService.js'
import * as User from '../models/User.js'
import { ROLES } from '../constants/roles.js'

/**
 * POST /auth/login
 * Body: { usuario, password }
 * Res: { token, user }
 */
export async function login(req, res, next) {
  try {
    const { token, user } = await authService.login(req.body)
    res.json({ token, user })
  } catch (e) {
    next(e)
  }
}

/**
 * GET /auth/me — Devuelve el usuario del token. Requiere auth.
 */
export function me(req, res, next) {
  try {
    res.json(req.user)
  } catch (e) {
    next(e)
  }
}

/**
 * GET /auth/operarios — Obtiene lista de operarios de mantenimiento. Requiere auth.
 */
export async function getOperarios(req, res, next) {
  try {
    const operarios = await User.findByRole(ROLES.OPERARIO_MANTENIMIENTO)
    res.json(operarios)
  } catch (e) {
    next(e)
  }
}
