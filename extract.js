const mysql = require('mysql2/promise');
const fs = require('fs/promises');
const path = require('path');
const config = require('./config');

async function extractDDL(env) {
  const connection = await mysql.createConnection(config[env]);
  const [tables] = await connection.query('SHOW TABLES');
  const [procedures] = await connection.query(
    `SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'`,
    [config[env].database]
  );

  await fs.mkdir(`${env}/tables`, { recursive: true });
  await fs.mkdir(`${env}/procedures`, { recursive: true });

  for (const row of tables) {
    const tableName = Object.values(row)[0];
    if (config.ignore.tables.includes(tableName)) continue;
    const [[tableDDL]] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    await fs.writeFile(
      path.join(`${env}/tables`, `${tableName}.sql`),
      tableDDL['Create Table']
    );
  }

  for (const proc of procedures) {
    const procName = proc.ROUTINE_NAME;
    if (config.ignore.procedures.includes(procName)) continue;
    const [[procDDL]] = await connection.query(`SHOW CREATE PROCEDURE \`${procName}\``);
    const content = `DROP PROCEDURE IF EXISTS \`${procName}\`;\n${procDDL['Create Procedure']}`;
    await fs.writeFile(
      path.join(`${env}/procedures`, `${procName}.sql`),
      content
    );
  }

  await connection.end();
}

if (require.main === module) {
  const env = process.argv[2];
  if (!env || !['dev', 'prod'].includes(env)) {
    console.error('Please provide "dev" or "prod" as argument');
    process.exit(1);
  }
  extractDDL(env);
}