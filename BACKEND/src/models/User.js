import { query } from '../db.js'

/**
 * Busca por usuario o email y verifica contraseña.
 * @param {string} login - Usuario o email
 * @param {string} plainPassword
 * @param {function(string, string): boolean} compareFn - (plain, hash) => boolean
 * @returns {Promise<{ id: number, usuario: string, email: string | null, nombre: string, role: string } | null>}
 */
export async function findByCredential(login, plainPassword, compareFn) {
  const [rows] = await query(
    `SELECT u.id, u.usuario, u.email, u.nombre, u.password, r.codigo AS role
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     WHERE (u.usuario = ? OR (u.email IS NOT NULL AND LOWER(u.email) = LOWER(?)))
       AND u.activo = 1
     LIMIT 1`,
    [login, login]
  )
  const u = rows[0]
  if (!u || !compareFn(plainPassword, u.password)) return null
  return { id: u.id, usuario: u.usuario, email: u.email, nombre: u.nombre, role: u.role }
}

/**
 * @param {number} id
 * @returns {Promise<{ id: number, usuario: string, email: string | null, nombre: string, role: string } | null>}
 */
export async function findById(id) {
  const [rows] = await query(
    `SELECT u.id, u.usuario, u.email, u.nombre, r.codigo AS role
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     WHERE u.id = ? AND u.activo = 1
     LIMIT 1`,
    [id]
  )
  return rows[0] || null
}

/**
 * Obtiene usuarios por rol.
 * @param {string} roleCodigo - Código del rol (ej: 'OPERARIO_MANTENIMIENTO')
 * @returns {Promise<Array<{ id: number, usuario: string, email: string | null, nombre: string, role: string }>>}
 */
export async function findByRole(roleCodigo) {
  const [rows] = await query(
    `SELECT u.id, u.usuario, u.email, u.nombre, r.codigo AS role
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     WHERE r.codigo = ? AND u.activo = 1
     ORDER BY u.nombre`,
    [roleCodigo]
  )
  return rows
}

/**
 * Crea un nuevo usuario.
 * @param {Object} data - { rolCodigo: string, usuario: string, email?: string, password: string, nombre: string }
 * @returns {Promise<{ id: number, usuario: string, email: string | null, nombre: string, role: string }>}
 */
export async function create(data) {
  const { rolCodigo, usuario, email, password, nombre } = data
  
  // Obtener el ID del rol
  const [roles] = await query('SELECT id FROM roles WHERE codigo = ?', [rolCodigo])
  if (roles.length === 0) {
    const e = new Error(`Rol ${rolCodigo} no encontrado`)
    e.status = 400
    throw e
  }
  const rolId = roles[0].id

  // Verificar si el usuario ya existe
  const [existing] = await query('SELECT id FROM usuarios WHERE usuario = ?', [usuario])
  if (existing.length > 0) {
    const e = new Error('El nombre de usuario ya existe')
    e.status = 409
    throw e
  }

  // Verificar si el email ya existe (si se proporciona)
  if (email) {
    const [existingEmail] = await query('SELECT id FROM usuarios WHERE email = ?', [email])
    if (existingEmail.length > 0) {
      const e = new Error('El email ya está registrado')
      e.status = 409
      throw e
    }
  }

  // Insertar el nuevo usuario
  const [result] = await query(
    `INSERT INTO usuarios (rol_id, usuario, email, password, nombre, activo)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [rolId, usuario, email || null, password, nombre]
  )

  // Retornar el usuario creado
  return findById(result.insertId)
}

/**
 * Lista todos los operarios de mantenimiento (activos e inactivos para gestión).
 * @returns {Promise<Array<{ id: number, usuario: string, email: string | null, nombre: string, role: string, activo: number }>>}
 */
export async function listOperarios() {
  const [rows] = await query(
    `SELECT u.id, u.usuario, u.email, u.nombre, r.codigo AS role, u.activo
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     WHERE r.codigo = 'OPERARIO_MANTENIMIENTO'
     ORDER BY u.nombre`
  )
  return rows
}
