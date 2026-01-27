import './loadEnv.js'
import path from 'path'
import fs from 'fs'
import app from './app.js'
import { env } from './config/index.js'
import { testConnection, resetPool } from './db.js'
import { runSeeds } from '../database/runSeeds.js'

const uploadDir = path.resolve(env.uploadDir || './uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

;(async () => {
  let ok = false
  try {
    await testConnection()
    await runSeeds()
    ok = true
  } catch (e) {
    if (e.code === 'ER_ACCESS_DENIED_ERROR' && env.db.host === 'localhost') {
      console.error('Reintentando con DB_HOST=127.0.0.1...')
      env.db.host = '127.0.0.1'
      await resetPool()
      try {
        await testConnection()
        await runSeeds()
        ok = true
      } catch (e2) {
        console.error('Error al conectar con MySQL o ejecutar seeds:', e2.message)
        console.error('  → Ejecute: npm run fix:mysql   (o en MySQL Workbench: database/fix-mysql-user.sql)')
        console.error('  → En .env: DB_USER=root y DB_PASSWORD= (vacío)')
        process.exit(1)
      }
    } else {
      console.error('Error al conectar con MySQL o ejecutar seeds:', e.message)
      if (e.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('  → Ejecute: npm run fix:mysql   (o en MySQL Workbench: database/fix-mysql-user.sql)')
        console.error('  → En .env: DB_USER=root y DB_PASSWORD= (vacío). Pruebe DB_HOST=127.0.0.1')
      }
      process.exit(1)
    }
  }
  if (ok) {
    app.listen(env.port, () => {
      console.log(`Servidor en http://localhost:${env.port}`)
      console.log(`API: http://localhost:${env.port}/api`)
    })
  }
})()
