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
 * Busca usuario por ID sin filtrar por activo (para admin).
 * @param {number} id
 * @returns {Promise<{ id: number, usuario: string, email: string | null, nombre: string, role: string, activo: number } | null>}
 */
export async function findByIdAny(id) {
  const [rows] = await query(
    `SELECT u.id, u.usuario, u.email, u.nombre, r.codigo AS role, u.activo
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     WHERE u.id = ?
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
 * Busca un usuario por nombre de usuario y rol.
 * @param {string} usuario - Nombre de usuario (ej: 'RPADILLA')
 * @param {string} roleCodigo - Código del rol (ej: 'OPERARIO_MANTENIMIENTO')
 * @returns {Promise<{ id: number, usuario: string, email: string | null, nombre: string, role: string } | null>}
 */
export async function findByUsuarioAndRole(usuario, roleCodigo) {
  if (!usuario || !roleCodigo) return null
  const [rows] = await query(
    `SELECT u.id, u.usuario, u.email, u.nombre, r.codigo AS role
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     WHERE u.usuario = ? AND r.codigo = ?
     LIMIT 1`,
    [String(usuario).trim(), roleCodigo]
  )
  return rows[0] || null
}

/**
 * Busca un usuario por nombre completo y rol (para asociar operario por nombre).
 * Comparación sin distinguir mayúsculas/minúsculas y sin espacios extra al inicio/final.
 * @param {string} nombre - Nombre completo (ej: 'Luis Ángel Serna')
 * @param {string} roleCodigo - Código del rol (ej: 'OPERARIO_MANTENIMIENTO')
 * @returns {Promise<{ id: number, usuario: string, email: string | null, nombre: string, role: string } | null>}
 */
export async function findByNombreAndRole(nombre, roleCodigo) {
  if (!nombre || !roleCodigo) return null
  const normalized = String(nombre).trim()
  if (!normalized) return null
  const [rows] = await query(
    `SELECT u.id, u.usuario, u.email, u.nombre, r.codigo AS role
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     WHERE r.codigo = ? AND u.activo = 1
       AND LOWER(TRIM(u.nombre)) = LOWER(?)
     LIMIT 1`,
    [roleCodigo, normalized]
  )
  return rows[0] || null
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

/**
 * Lista todos los usuarios (todos los roles). Para uso del super usuario.
 * @returns {Promise<Array<{ id: number, usuario: string, email: string | null, nombre: string, role: string, activo: number }>>}
 */
export async function listAll() {
  const [rows] = await query(
    `SELECT u.id, u.usuario, u.email, u.nombre, r.codigo AS role, u.activo
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.rol_id
     ORDER BY r.codigo, u.nombre`
  )
  return rows
}

/**
 * Actualiza nombre, usuario y/o contraseña de un usuario.
 * @param {number} id
 * @param {Object} data - { nombre?: string, usuario?: string, password?: string }
 */
export async function updateById(id, data) {
  const updates = []
  const params = []

  if (data.nombre != null) {
    updates.push('nombre = ?')
    params.push(data.nombre)
  }
  if (data.usuario != null) {
    updates.push('usuario = ?')
    params.push(data.usuario)
  }
  if (data.password != null) {
    updates.push('password = ?')
    params.push(data.password)
  }

  if (updates.length === 0) return

  params.push(id)
  await query(
    `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`,
    params
  )
}

/**
 * Desactiva un usuario (soft delete). No elimina para preservar integridad referencial.
 * @param {number} id
 */
export async function deactivateById(id) {
  await query('UPDATE usuarios SET activo = 0 WHERE id = ?', [id])
}
