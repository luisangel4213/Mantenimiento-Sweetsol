import '../src/loadEnv.js'
import { query } from '../src/db.js'
import { hashPassword } from '../src/services/authService.js'

/**
 * Script para crear/actualizar perfiles de operarios de mantenimiento
 * con usuario y contraseña predeterminados.
 *
 * Ejecutar con:
 *   npm run fix:operarios
 */
async function fixOperarios() {
  try {
    console.log('🔧 Sincronizando operarios de mantenimiento...\n')

    // 1. Obtener roles
    const [roles] = await query('SELECT id, codigo FROM roles')
    const byCodigo = Object.fromEntries(roles.map((r) => [r.codigo, r.id]))

    const rolOperario = byCodigo['OPERARIO_MANTENIMIENTO']
    if (!rolOperario) {
      throw new Error('No se encontró el rol OPERARIO_MANTENIMIENTO en la tabla roles')
    }

    // 2. Definir usuarios a sincronizar
    const passHash = hashPassword('123456')

    /** Todos se crean como OPERARIO_MANTENIMIENTO */
    const usuariosRequeridos = [
      {
        nombre: 'RAFAEL PADILLA',
        usuario: 'RPADILLA',
        email: null,
        password: passHash,
        rolId: rolOperario,
      },
      {
        nombre: 'SERGIO VILLAFAÑE',
        usuario: 'SVILLAFAÑE',
        email: null,
        password: passHash,
        rolId: rolOperario,
      },
      {
        nombre: 'JEAN PIERRE',
        usuario: 'JPIERRE',
        email: null,
        password: passHash,
        rolId: rolOperario,
      },
      {
        nombre: 'JOLMAN VALLEJO',
        usuario: 'JVALLEJO',
        email: null,
        password: passHash,
        rolId: rolOperario,
      },
      {
        nombre: 'JORGE MADROÑERO',
        usuario: 'JMADROÑERO',
        email: null,
        password: passHash,
        rolId: rolOperario,
      },
      {
        nombre: 'JHON RENGIFO',
        usuario: 'JRENGIFO',
        email: null,
        password: passHash,
        rolId: rolOperario,
      },
      {
        nombre: 'SANTIAGO SILVA',
        usuario: 'SSILVA',
        email: null,
        password: passHash,
        rolId: rolOperario,
      },
      {
        nombre: 'ANDRÉS MERCHÁN',
        usuario: 'AMERCHAN',
        email: null,
        password: passHash,
        rolId: rolOperario,
      },
      {
        nombre: 'LUIS ÁNGEL SERNA',
        usuario: 'LSERNA',
        email: null,
        password: passHash,
        rolId: rolOperario,
      },
      {
        nombre: 'ESTEBAN QUINTERO',
        usuario: 'EQUINTERO',
        email: null,
        password: passHash,
        rolId: rolOperario,
      },
    ]

    // 3. Crear / actualizar usuarios
    for (const u of usuariosRequeridos) {
      const [existing] = await query(
        'SELECT id, activo FROM usuarios WHERE usuario = ? LIMIT 1',
        [u.usuario]
      )

      if (existing.length > 0) {
        const curr = existing[0]
        await query(
          'UPDATE usuarios SET rol_id = ?, password = ?, nombre = ?, activo = 1 WHERE id = ?',
          [u.rolId, u.password, u.nombre, curr.id]
        )
        console.log(`✓ Actualizado usuario existente: ${u.usuario} (${u.nombre})`)
      } else {
        await query(
          'INSERT INTO usuarios (rol_id, usuario, email, password, nombre, activo) VALUES (?, ?, ?, ?, ?, 1)',
          [u.rolId, u.usuario, u.email, u.password, u.nombre]
        )
        console.log(`✓ Creado usuario: ${u.usuario} (${u.nombre})`)
      }
    }

    console.log('\n✅ Operarios sincronizados correctamente.')
    console.log('\n📝 Credenciales predeterminadas:')
    usuariosRequeridos.forEach((u) => {
      console.log(`   Usuario: ${u.usuario} | Contraseña: 123456`)
    })
  } catch (err) {
    console.error('\n❌ Error en fixOperarios:', err.message)
    if (err.original) {
      console.error('Detalle:', err.original.message)
    }
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('fixOperarios.js')) {
  fixOperarios()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { fixOperarios }

