const { pool, tables } = require('../db');
const logger = require('../logger');

async function validateDatabaseConnection() {
  try {
    await pool.execute('SELECT 1');
    logger.info('Conexion a base de datos verificada');
  } catch (error) {
    logger.error('No se pudo conectar a la base de datos al iniciar', { message: error.message });
    throw error;
  }
}

async function validateRequiredTables() {
  const required = [tables.acuse, tables.detalle, tables.repartidor];
  const errors = [];

  for (const tableRef of required) {
    try {
      await pool.execute(`SELECT 1 FROM ${tableRef} LIMIT 1`);
    } catch (error) {
      errors.push({ table: tableRef, message: error.message });
    }
  }

  if (errors.length) {
    errors.forEach((e) => logger.error('Tabla requerida no accesible', e));
    logger.warn('Algunas tablas requeridas no estan disponibles. El servidor iniciara pero algunas funciones pueden fallar.');
  }
}

async function ensureAuditTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ${tables.log} (
      ID INT NOT NULL AUTO_INCREMENT,
      ID_Acuse INT NOT NULL,
      Accion VARCHAR(60) NOT NULL,
      FechaHora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      Usuario VARCHAR(120) NULL,
      Observacion VARCHAR(255) NULL,
      PRIMARY KEY (ID),
      INDEX idx_acuse_log_acuse (ID_Acuse),
      INDEX idx_acuse_log_fecha (FechaHora)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.execute(`
    CREATE TABLE IF NOT EXISTS ${tables.historial} (
      ID INT NOT NULL AUTO_INCREMENT,
      ID_Acuse INT NOT NULL,
      Estado VARCHAR(100) NOT NULL,
      Fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      Usuario VARCHAR(120) NULL,
      Observacion VARCHAR(255) NULL,
      PRIMARY KEY (ID),
      INDEX idx_acuse_historial_acuse (ID_Acuse),
      INDEX idx_acuse_historial_fecha (Fecha)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

module.exports = { ensureAuditTables, validateDatabaseConnection, validateRequiredTables };
