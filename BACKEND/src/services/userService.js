import { create, listOperarios } from '../models/User.js'
import { hashPassword } from './authService.js'

/**
 * Crea un nuevo operario de mantenimiento.
 * @param {Object} data - { usuario: string, email?: string, password: string, nombre: string }
 * @returns {Promise<object>}
 */
export async function crearOperario(data) {
  const { usuario, email, password, nombre } = data

  if (!usuario || !password || !nombre) {
    const e = new Error('Usuario, contraseña y nombre son obligatorios')
    e.status = 400
    throw e
  }

  if (password.length < 6) {
    const e = new Error('La contraseña debe tener al menos 6 caracteres')
    e.status = 400
    throw e
  }

  const hashedPassword = hashPassword(password)

  const user = await create({
    rolCodigo: 'OPERARIO_MANTENIMIENTO',
    usuario,
    email: email || null,
    password: hashedPassword,
    nombre,
  })

  // No retornar la contraseña
  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * Lista todos los operarios de mantenimiento.
 * @returns {Promise<Array>}
 */
export async function listarOperarios() {
  return listOperarios()
}

