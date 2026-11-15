'use strict';

const mysql = require('mysql2/promise');
const { config } = require('./env');

const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4_unicode_ci',
  dateStrings: false,
});

/**
 * Ejecuta una consulta con prepared statement.
 * @param {string} sql
 * @param {Array<unknown>} [params]
 * @returns {Promise<any>}
 */
async function query(sql, params = []) {
  const safeParams = params.map((value) => (value === undefined ? null : value));
  const [rows] = await pool.execute(sql, safeParams);
  return rows;
}

/**
 * Devuelve la primera fila o null.
 */
async function one(sql, params = []) {
  const rows = await query(sql, params);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

/**
 * Ejecuta varias sentencias dentro de una transaccion.
 * Si el callback lanza, se hace rollback automatico.
 */
async function withTransaction(callback) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('[db] Error en rollback:', rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function healthCheck() {
  await pool.query('SELECT 1');
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, one, withTransaction, healthCheck, close };
