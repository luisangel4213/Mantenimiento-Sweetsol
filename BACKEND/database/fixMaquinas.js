import '../src/loadEnv.js'
import { query } from '../src/db.js'

/**
 * Script para crear/actualizar el catálogo de máquinas (Equipos de Trabajo)
 * según la lista proporcionada por producción.
 *
 * Ejecutar con:
 *   npm run fix:maquinas
 */
async function fixMaquinas() {
  try {
    console.log('🔧 Sincronizando catálogo de máquinas...\n')

    // 1. Asegurar estación "Planta"
    const [estRows] = await query(
      "SELECT id FROM estaciones WHERE nombre = 'Planta' LIMIT 1"
    )
    let plantaId
    if (estRows.length === 0) {
      const [res] = await query(
        "INSERT INTO estaciones (nombre, codigo, descripcion) VALUES ('Planta', 'PLANTA', 'Estación principal')"
      )
      plantaId = res.insertId
      console.log(`✓ Estación "Planta" creada (ID: ${plantaId})`)
    } else {
      plantaId = estRows[0].id
      console.log(`✓ Estación "Planta" encontrada (ID: ${plantaId})`)
    }

    // 2. Lista oficial de nombres de máquinas (exactamente como los necesitas ver en Equipos)
    const nombres = [
      'LINEA MEZCLA CANDY 1',
      'LINEA MEZCLA CANDY 2',
      'LINEA CANDY 1',
      'LINEA CANDY 2',
      'LINEA CANDY 1A',
      'LINEA CANDY 2A',
      'LINEA CANDY 3A',
      'LINEA CANDY 4A',
      'LINEA CANDY 5A',
      'LINEA CANDY 6',
      'LINEA CANDY 7',
      'LINEA CANDY 11',
      'LINEA CANDY 12',
      'LINEA MINI PACK 1',
      'LINEA MINI PACK 2',
      'LINEA MINI PACK 3',
      'PRE-MEZCLA',
      'MOLIENDA',
      'PULVERIZADO',
      'MEZCLADOR',
      'LINEA TABLETEADO 1',
      'LINEA TABLETEADO 2',
      'LINEA TABLETEADO 3',
      'LINEA TABLETEADO TVD-23',
      'LINEA FLOW PACK 1',
      'LINEA FLOW PACK 2',
      'LINEA FLOW PACK 3',
      'LINEA DIPS 1',
      'LINEA DIPS 2',
      'LINEA MEZCLA PITILLO 1',
      'LINEA MEZCLA PITILLO 2',
      'LINEA PITILLOS TOYAMA 1',
      'LINEA PITILLOS TOYAMA 2',
      'MAXIPACK',
      'KENWY',
    ]

    // 80% alta, 20% media
    const total = nombres.length
    const altasHasta = Math.round(total * 0.8) // primeras ≈80% alta

    // 3. Obtener existentes
    const [existentesRows] = await query(
      'SELECT id, nombre, criticidad FROM maquinas'
    )
    const existentes = new Map(
      existentesRows.map((m) => [m.nombre.trim().toUpperCase(), m])
    )

    // 4. Crear / actualizar
    for (let i = 0; i < nombres.length; i++) {
      const nombre = nombres[i]
      const clave = nombre.trim().toUpperCase()
      const criticidad = i < altasHasta ? 'alta' : 'media'

      const existente = existentes.get(clave)
      if (existente) {
        // Actualizar estación y criticidad si hace falta
        await query(
          'UPDATE maquinas SET estacion_id = ?, criticidad = ? WHERE id = ?',
          [plantaId, criticidad, existente.id]
        )
        console.log(
          `✓ Actualizada máquina existente: ${nombre} (criticidad: ${criticidad})`
        )
      } else {
        // Crear nueva máquina
        const [res] = await query(
          'INSERT INTO maquinas (estacion_id, nombre, codigo, marca, modelo, criticidad) VALUES (?, ?, NULL, NULL, NULL, ?)',
          [plantaId, nombre, criticidad]
        )
        console.log(
          `✓ Creada máquina: ${nombre} (ID: ${res.insertId}, criticidad: ${criticidad})`
        )
      }
    }

    console.log('\n✅ Catálogo de máquinas sincronizado correctamente.')
  } catch (err) {
    console.error('\n❌ Error al sincronizar máquinas:', err.message)
    if (err.original) {
      console.error('Detalle:', err.original.message)
    }
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (process.argv[1] && process.argv[1].endsWith('fixMaquinas.js')) {
  fixMaquinas()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { fixMaquinas }

