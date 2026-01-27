import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { findByCredential, findById } from '../models/User.js'
import { env } from '../config/index.js'

const SALT_ROUNDS = 10

/** Hash de contraseña con bcrypt. Usar al crear/actualizar usuarios o seeds. */
export function hashPassword(plain) {
  return bcrypt.hashSync(plain, SALT_ROUNDS)
}

function compare(plain, hashed) {
  return bcrypt.compareSync(plain, hashed)
}

/**
 * @param {{ usuario: string, password: string }} credentials
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function login(credentials) {
  const { usuario, password } = credentials || {}
  if (!usuario || !password) {
    const e = new Error('Usuario y contraseña son obligatorios')
    e.status = 400
    throw e
  }
  const user = await findByCredential(usuario, password, compare)
  if (!user) {
    const e = new Error('Credenciales inválidas')
    e.status = 401
    throw e
  }
  const token = jwt.sign(
    { sub: user.id, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn || '7d' }
  )
  return { token, user }
}

/**
 * @param {string} [bearer] - Header Authorization: Bearer <token>
 * @returns {Promise<{ id, usuario, email, nombre, role } | null>}
 */
export async function verifyToken(bearer) {
  if (!bearer || !bearer.startsWith('Bearer ')) return null
  const token = bearer.slice(7)
  try {
    const { sub } = jwt.verify(token, env.jwtSecret)
    return await findById(sub)
  } catch {
    return null
  }
}
