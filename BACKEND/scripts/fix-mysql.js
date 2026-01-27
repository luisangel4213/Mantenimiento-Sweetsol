/**
 * Aplica database/fix-mysql-user.sql usando mysql2.
 * Conecta con DB_* de .env. Tras el fix use DB_PASSWORD= (vacío) en .env.
 */
import mysql from 'mysql2/promise'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const cfg = (h) => ({
  host: h,
  port: Number(process.env.DB_PORT) || 3306,
  user: ((process.env.DB_USER || 'root') + '').replace(/^\uFEFF/, '').trim(),
  password: ((process.env.DB_PASSWORD || '') + '').replace(/^\uFEFF/, '').trim(),
  multipleStatements: true,
})

const statements = [
  "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''",
  "CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY ''",
  "ALTER USER 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY ''",
  "GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION",
  'FLUSH PRIVILEGES',
  "CREATE DATABASE IF NOT EXISTS sweetsol_mantenimiento CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
]

let pluginWarning = false
async function run(conn, sql) {
  try {
    await conn.query(sql)
  } catch (e) {
    if (e.message?.includes("Plugin 'mysql_native_password' is not loaded")) {
      pluginWarning = true
    } else if (e.code !== 'ER_ACCESS_DENIED_ERROR') {
      console.warn('  aviso:', e.message)
    }
  }
}

async function tryHost(host) {
  const c = mysql.createConnection(cfg(host))
  try {
    const conn = await c
    for (const s of statements) await run(conn, s)
    await conn.end()
    return true
  } catch (e) {
    return false
  }
}

;(async () => {
  const h = (process.env.DB_HOST || 'localhost').replace(/^\uFEFF/, '').trim()
  let ok = await tryHost(h)
  if (!ok && (h === 'localhost' || h === '127.0.0.1')) ok = await tryHost(h === 'localhost' ? '127.0.0.1' : 'localhost')
  if (ok) {
    if (pluginWarning) {
      console.log('MySQL: conexión OK. El plugin mysql_native_password no está disponible.')
      console.log('  → Use en .env la contraseña actual de root: DB_PASSWORD=su_contraseña')
      console.log('  → Ejecute: npm run dev')
    } else {
      console.log('MySQL: fix aplicado. Ponga DB_PASSWORD= (vacío) en .env y ejecute: npm run dev')
    }
  } else {
    console.error('No se pudo conectar. Revise DB_USER y DB_PASSWORD en .env (contraseña actual de root).')
    console.error('O en MySQL Workbench abra database/fix-mysql-user.sql y ejecútelo.')
    process.exit(1)
  }
})()
