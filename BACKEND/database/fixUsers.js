import '../src/loadEnv.js'
import { query } from '../src/db.js'
import { hashPassword } from '../src/services/authService.js'

/**
 * Script para diagnosticar y reparar usuarios en la base de datos.
 * Ejecutar con: node database/fixUsers.js
 */
async function diagnosticarYReparar() {
  try {
    console.log('🔍 Diagnosticando usuarios en la base de datos...\n')

    // 1. Verificar roles
    console.log('1. Verificando roles...')
    const [roles] = await query('SELECT id, codigo, nombre FROM roles')
    console.log(`   ✓ Encontrados ${roles.length} roles:`)
    roles.forEach(r => console.log(`     - ${r.codigo} (ID: ${r.id})`))
    
    if (roles.length === 0) {
      console.log('   ❌ ERROR: No hay roles en la base de datos. Ejecute schema.sql primero.')
      process.exit(1)
    }

    const byCodigo = Object.fromEntries(roles.map((r) => [r.codigo, r.id]))
    
    // Verificar que existan los roles necesarios
    const rolesNecesarios = ['JEFE_MANTENIMIENTO', 'OPERARIO_MANTENIMIENTO', 'OPERARIO_PRODUCCION']
    for (const codigo of rolesNecesarios) {
      if (!byCodigo[codigo]) {
        console.log(`   ❌ ERROR: Falta el rol ${codigo}`)
        process.exit(1)
      }
    }

    console.log('')

    // 2. Verificar usuarios existentes
    console.log('2. Verificando usuarios existentes...')
    const [usuarios] = await query(`
      SELECT u.id, u.usuario, u.email, u.nombre, u.activo, r.codigo AS role
      FROM usuarios u
      LEFT JOIN roles r ON r.id = u.rol_id
      ORDER BY u.usuario
    `)
    
    console.log(`   ✓ Encontrados ${usuarios.length} usuarios:`)
    usuarios.forEach(u => {
      const estado = u.activo ? '✓ Activo' : '✗ Inactivo'
      const rol = u.role || 'Sin rol'
      console.log(`     - ${u.usuario} (${u.nombre}) - ${estado} - Rol: ${rol}`)
    })
    console.log('')

    // 3. Definir usuarios que deben existir
    const usuariosRequeridos = [
      {
        usuario: 'jefe',
        email: 'jefe@sweetsol.com',
        nombre: 'Jefe Mantenimiento',
        rolCodigo: 'JEFE_MANTENIMIENTO',
        password: '123456'
      },
      {
        usuario: 'operario1',
        email: 'op1@sweetsol.com',
        nombre: 'Operario Mantenimiento',
        rolCodigo: 'OPERARIO_MANTENIMIENTO',
        password: '123456'
      },
      {
        usuario: 'produccion',
        email: 'prod@sweetsol.com',
        nombre: 'Operario Producción',
        rolCodigo: 'OPERARIO_PRODUCCION',
        password: '123456'
      }
    ]

    // 4. Crear o actualizar usuarios
    console.log('3. Creando/actualizando usuarios...')
    const passHash = hashPassword('123456')
    
    for (const reqUser of usuariosRequeridos) {
      const rolId = byCodigo[reqUser.rolCodigo]
      const usuarioExistente = usuarios.find(u => u.usuario === reqUser.usuario)
      
      if (usuarioExistente) {
        // Actualizar usuario existente
        if (!usuarioExistente.activo || usuarioExistente.role !== reqUser.rolCodigo) {
          await query(
            'UPDATE usuarios SET rol_id = ?, activo = 1, password = ? WHERE id = ?',
            [rolId, passHash, usuarioExistente.id]
          )
          console.log(`   ✓ Actualizado: ${reqUser.usuario} (activado y contraseña reseteada)`)
        } else {
          // Solo actualizar contraseña si es necesario
          await query(
            'UPDATE usuarios SET password = ? WHERE id = ?',
            [passHash, usuarioExistente.id]
          )
          console.log(`   ✓ Contraseña actualizada: ${reqUser.usuario}`)
        }
      } else {
        // Crear nuevo usuario
        await query(
          'INSERT INTO usuarios (rol_id, usuario, email, password, nombre, activo) VALUES (?, ?, ?, ?, ?, 1)',
          [rolId, reqUser.usuario, reqUser.email, passHash, reqUser.nombre]
        )
        console.log(`   ✓ Creado: ${reqUser.usuario}`)
      }
    }

    console.log('')

    // 5. Verificar resultado final
    console.log('4. Verificación final...')
    const [usuariosFinal] = await query(`
      SELECT u.id, u.usuario, u.email, u.nombre, u.activo, r.codigo AS role
      FROM usuarios u
      INNER JOIN roles r ON r.id = u.rol_id
      WHERE u.activo = 1
      ORDER BY u.usuario
    `)
    
    console.log(`   ✓ Usuarios activos: ${usuariosFinal.length}`)
    usuariosFinal.forEach(u => {
      console.log(`     - ${u.usuario} (${u.nombre}) - Rol: ${u.role}`)
    })

    console.log('\n✅ Proceso completado exitosamente!')
    console.log('\n📝 Credenciales para login:')
    console.log('   Usuario: jefe | Contraseña: 123456')
    console.log('   Usuario: operario1 | Contraseña: 123456')
    console.log('   Usuario: produccion | Contraseña: 123456')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.original) {
      console.error('   Detalle:', error.original.message)
    }
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Verificar si se ejecuta directamente
if (process.argv[1] && process.argv[1].endsWith('fixUsers.js')) {
  diagnosticarYReparar()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

export { diagnosticarYReparar }

