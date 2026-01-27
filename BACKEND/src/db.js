import mysql from 'mysql2/promise'
import { env } from './config/index.js'

let pool = mysql.createPool(env.db)
pool.on('error', (err) => {
  console.error('[MySQL] Error en el pool:', err.message)
})

/** Cierra el pool y crea uno nuevo con la config actual de env.db. Útil al cambiar host/user/pass. */
export async function resetPool() {
  await pool.end().catch(() => {})
  pool = mysql.createPool(env.db)
  pool.on('error', (err) => console.error('[MySQL] Error en el pool:', err.message))
}

/**
 * Ejecuta una consulta con el pool. Promesas.
 * @param {string} sql - Consulta SQL (placeholders ?)
 * @param {Array} [params] - Parámetros
 * @returns {Promise<[rows, fields]>} - Resultado de execute
 * @throws {Error} Con mensaje claro si falla la conexión o la consulta
 */
export async function query(sql, params = []) {
  try {
    return await pool.execute(sql, params)
  } catch (err) {
    const msg = err.code === 'ECONNREFUSED'
      ? `MySQL: no se pudo conectar a ${env.db.host}:${env.db.port}. Compruebe que el servidor esté en marcha y .env (DB_*).`
      : err.code === 'ER_ACCESS_DENIED_ERROR'
        ? `MySQL: usuario o contraseña incorrectos. Conectando a host=${env.db.host}, user=${env.db.user}, database=${env.db.database}. Revise .env (DB_USER, DB_PASSWORD). Pruebe DB_HOST=127.0.0.1 si usa localhost. En MySQL Workbench ejecute: ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY ''; ALTER USER 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY ''; FLUSH PRIVILEGES;`
        : err.code === 'ER_BAD_DB_ERROR'
          ? `MySQL: la base de datos "${env.db.database}" no existe. Créela antes de arrancar.`
          : `MySQL: ${err.message}`
    const e = new Error(msg)
    e.original = err
    e.code = err.code
    throw e
  }
}

/**
 * Obtiene una conexión del pool para transacciones o varias consultas.
 * Debe liberarse con conexion.release().
 * @returns {Promise<import('mysql2/promise').PoolConnection>}
 */
export async function getConnection() {
  try {
    return await pool.getConnection()
  } catch (err) {
    const msg = err.code === 'ECONNREFUSED'
      ? `MySQL: no se pudo conectar a ${env.db.host}:${env.db.port}.`
      : `MySQL: ${err.message}`
    const e = new Error(msg)
    e.original = err
    e.code = err.code
    throw e
  }
}

/**
 * Comprueba que el pool pueda conectar. Útil al arrancar la app.
 * @throws {Error} Si la conexión falla
 */
export async function testConnection() {
  const [rows] = await query('SELECT 1 AS ok')
  if (!rows?.[0]?.ok) throw new Error('MySQL: la consulta de prueba no devolvió resultado.')
  return true
}

export { pool }
