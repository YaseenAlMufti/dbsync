const fs = require('fs/promises');
const moment = require('moment');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');
const chalk = require('chalk');
const config = require('./config');
const { splitStatements } = require('./split-sql');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function formatResultMessage(sql, result) {
  const firstLine = sql.trim().split(/\n|;/)[0];
  const action = firstLine.split(/\s+/)[0].toUpperCase();
  const type = firstLine.split(/\s+/)[1]?.toUpperCase() || '';

  const summary = [];

  if (['CREATE', 'DROP', 'ALTER'].includes(action)) {
    summary.push(`${action} ${type} OK`);
  }

  if (result.affectedRows !== undefined) {
    summary.push(`${result.affectedRows} row(s) affected`);
  }
  if (result.insertId) {
    summary.push(`Insert ID: ${result.insertId}`);
  }
  if (result.warningStatus) {
    summary.push(`Warnings: ${result.warningStatus}`);
  }

  return summary.join(', ');
}

async function deploy() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry');

  const deploymentEnv = config.deployment.env;
  const dbConfig = config[deploymentEnv];
  const dbName = dbConfig.database;

  const deployDir = path.join(process.cwd(), 'deployments');
  const deployedDir = path.join(process.cwd(), 'deployed');
  await fs.mkdir(deployedDir, { recursive: true });

  const files = (await fs.readdir(deployDir)).filter(f => f.endsWith('.sql'));

  if (files.length === 0) {
    console.log(chalk.yellow('⚠️  No .sql files found in deployments folder.'));
    process.exit(0);
  }

  console.log(chalk.blue('📦 Files to be deployed:'));
  files.forEach(f => console.log('  -', f));
  console.log();

  const confirmation = await askQuestion(`Type "${deploymentEnv}/${dbName}" to confirm deployment: `);
  if (confirmation.trim() !== `${deploymentEnv}/${dbName}`) {
    console.log(chalk.red('❌ Deployment cancelled.'));
    rl.close();
    return;
  }
  rl.close();

  const results = [];
  let connection;

  if (!isDryRun) {
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true,
    });
  }

  for (const file of files) {
    const filePath = path.join(deployDir, file);
    const sql = await fs.readFile(filePath, 'utf8');

    let log = '';
    let status = '✅';

    try {
      if (!isDryRun) {
        const [result] = await connection.query(sql);
        const statements = splitStatements(sql);
        if (Array.isArray(result)) {
            if (statements.length === result.length) {
                log = result.map((r, i) => `Statement ${i + 1}: ${formatResultMessage(statements[i], r)}`).join('\n');
            } else {
                log = result.map((r, i) => `Statement ${i + 1}: ${formatResultMessage(sql, r)}`).join('\n');
            }
        } else {
          log = formatResultMessage(sql, result);
        }
      } else {
        log = 'DRY RUN - not executed.';
      }
      console.log(chalk.green(`✔️  ${file}`));
    } catch (err) {
      log = err.message;
      status = '❌';
      console.log(chalk.red(`✖️  ${file}`));
    }

    const timestamp = moment().format('MMDDYYYY-HHmmss');
    const logPath = path.join(deployedDir, `${file.replace('.sql', '')}_${timestamp}.log`);
    await fs.writeFile(logPath, log);

    results.push({ file, status });

    if (status === '✅' && !isDryRun) {
      const targetPath = path.join(deployedDir, file);
      await fs.rename(filePath, targetPath);
    }
  }

  if (!isDryRun && connection) await connection.end();

  console.log('\n📄 Deployment Summary:');
  console.table(results);
}

if (require.main === module) {
  deploy();
}
