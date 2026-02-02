import { create, listOperarios, listAll, updateById, deactivateById, findByUsuarioAndRole } from '../models/User.js'
import { hashPassword } from './authService.js'

/** Operarios de mantenimiento por defecto (misma lista que fixOperarios). Se crean si faltan al listar usuarios. */
const OPERARIOS_DEFAULT = [
  { nombre: 'RAFAEL PADILLA', usuario: 'RPADILLA' },
  { nombre: 'SERGIO VILLAFAÑE', usuario: 'SVILLAFAÑE' },
  { nombre: 'JEAN PIERRE', usuario: 'JPIERRE' },
  { nombre: 'JOLMAN VALLEJO', usuario: 'JVALLEJO' },
  { nombre: 'JORGE MADROÑERO', usuario: 'JMADROÑERO' },
  { nombre: 'JHON RENGIFO', usuario: 'JRENGIFO' },
  { nombre: 'SANTIAGO SILVA', usuario: 'SSILVA' },
  { nombre: 'ANDRÉS MERCHÁN', usuario: 'AMERCHAN' },
  { nombre: 'LUIS ÁNGEL SERNA', usuario: 'LSERNA' },
  { nombre: 'ESTEBAN QUINTERO', usuario: 'EQUINTERO' },
]

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

  const { password: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * Crea un usuario con cualquier rol (Super Usuario / Jefe).
 * @param {Object} data - { rolCodigo: string, usuario: string, nombre: string, email?: string, password: string }
 * @returns {Promise<object>}
 */
export async function crearUsuario(data) {
  const { rolCodigo, usuario, nombre, email, password } = data

  if (!rolCodigo || !usuario || !nombre || !password) {
    const e = new Error('Rol, usuario, nombre y contraseña son obligatorios')
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
    rolCodigo,
    usuario,
    email: email || null,
    password: hashedPassword,
    nombre,
  })

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

/**
 * Crea en BD los operarios de mantenimiento por defecto que aún no existan,
 * para que aparezcan en el listado de Administración de usuarios.
 */
export async function ensureOperarios() {
  for (const o of OPERARIOS_DEFAULT) {
    const existing = await findByUsuarioAndRole(o.usuario, 'OPERARIO_MANTENIMIENTO')
    if (existing) continue
    try {
      await crearOperario({
        usuario: o.usuario,
        nombre: o.nombre,
        password: '123456',
      })
    } catch (err) {
      if (err.status !== 409) throw err
      // Usuario ya existe con otro rol: ignorar
    }
  }
}/**
 * Lista todos los usuarios (todos los roles). Antes asegura que existan los operarios de mantenimiento por defecto.
 * @returns {Promise<Array>}
 */
export async function listarUsuarios() {
  await ensureOperarios()
  return listAll()
}

/**
 * Actualiza nombre, usuario y/o contraseña de un usuario.
 * @param {number} id
 * @param {Object} data - { nombre?: string, usuario?: string, password?: string }
 */
export async function actualizarUsuario(id, data) {
  const payload = {}
  if (data.nombre != null) payload.nombre = data.nombre
  if (data.usuario != null) payload.usuario = data.usuario
  if (data.password != null && data.password.length >= 6) {
    payload.password = hashPassword(data.password)
  }
  if (Object.keys(payload).length === 0) return
  await updateById(id, payload)
}

/**
 * Desactiva un usuario (soft delete).
 * @param {number} id
 */
export async function eliminarUsuario(id) {
  await deactivateById(id)
}
