import { query } from '../src/db.js'
import { hashPassword } from '../src/services/authService.js'

/**
 * Inserta datos iniciales si las tablas están vacías.
 * Ejecutar tras aplicar schema.sql.
 */
export async function runSeeds() {
  // 1) Estación por defecto
  const [ec] = await query('SELECT COUNT(*) AS c FROM estaciones')
  if (Number(ec[0]?.c) === 0) {
    await query(
      "INSERT INTO estaciones (nombre, codigo, descripcion) VALUES ('Planta', 'PLANTA', 'Estación principal')"
    )
    console.log('[seeds] Estación "Planta" creada.')
  }

  // 2) Usuarios de prueba (contraseña: 123456)
  const [roles] = await query('SELECT id, codigo FROM roles')
  const byCodigo = Object.fromEntries(roles.map((r) => [r.codigo, r.id]))
  const pass = hashPassword('123456')
  
  const usuariosRequeridos = [
    { rolCodigo: 'JEFE_MANTENIMIENTO', usuario: 'jefe', email: 'jefe@sweetsol.com', nombre: 'Jefe Mantenimiento' },
    { rolCodigo: 'OPERARIO_MANTENIMIENTO', usuario: 'operario1', email: 'op1@sweetsol.com', nombre: 'Operario Mantenimiento' },
    { rolCodigo: 'OPERARIO_PRODUCCION', usuario: 'produccion', email: 'prod@sweetsol.com', nombre: 'Operario Producción' },
  ]

  for (const reqUser of usuariosRequeridos) {
    const rolId = byCodigo[reqUser.rolCodigo]
    if (!rolId) {
      console.warn(`[seeds] Advertencia: Rol ${reqUser.rolCodigo} no encontrado, omitiendo usuario ${reqUser.usuario}`)
      continue
    }

    // Verificar si el usuario ya existe
    const [existing] = await query('SELECT id, activo FROM usuarios WHERE usuario = ?', [reqUser.usuario])
    
    if (existing.length > 0) {
      // Actualizar usuario existente: activar y resetear contraseña
      await query(
        'UPDATE usuarios SET rol_id = ?, email = ?, password = ?, nombre = ?, activo = 1 WHERE usuario = ?',
        [rolId, reqUser.email, pass, reqUser.nombre, reqUser.usuario]
      )
      console.log(`[seeds] Usuario "${reqUser.usuario}" actualizado (activado y contraseña reseteada).`)
    } else {
      // Crear nuevo usuario
      await query(
        'INSERT INTO usuarios (rol_id, usuario, email, password, nombre, activo) VALUES (?, ?, ?, ?, ?, 1)',
        [rolId, reqUser.usuario, reqUser.email, pass, reqUser.nombre]
      )
      console.log(`[seeds] Usuario "${reqUser.usuario}" creado.`)
    }
  }
  
  console.log('[seeds] Usuarios de prueba listos (usuario: jefe|operario1|produccion, password: 123456).')

  // 3) Máquinas de ejemplo
  const [mc] = await query('SELECT COUNT(*) AS c FROM maquinas')
  if (Number(mc[0]?.c) === 0) {
    await query(
      `INSERT INTO maquinas (estacion_id, nombre, codigo, marca, modelo, criticidad) VALUES
       (1, 'Bomba centrífuga B-01', 'BOM-01', NULL, NULL, 'alta'),
       (1, 'Compresor C-01', 'COMP-01', NULL, NULL, 'media')`
    )
    console.log('[seeds] 2 máquinas de ejemplo creadas.')
  }
}
