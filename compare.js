const fs = require('fs/promises');
const path = require('path');
const diff = require('diff');
const chalk = require('chalk');
const config = require('./config');

function cleanTableDDL(content) {
  return content.replace(/\) ENGINE=InnoDB AUTO_INCREMENT=\d+ DEFAULT CHARSET=\w+/g, '');
}

function cleanProcedureDDL(content) {
  return content
    .replace(/--.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function resetAutoIncrement(ddl) {
  return ddl.replace(/AUTO_INCREMENT=\d+/g, 'AUTO_INCREMENT=1');
}

function formatProcedureDDL(procName, ddl, env) {
  const dbName = config[env].database;
  const delimiter = 'DELIMITER $$';
  const endDelimiter = 'DELIMITER ;';
  const useDb = `USE \`${dbName}\`;`;

  const formatted = [
    useDb,
    delimiter,
    `DROP PROCEDURE IF EXISTS \`${procName}\`$$`,
    ddl.replace(/;$/, '') + '$$',
    endDelimiter,
    ''
  ].join('\n');

  return formatted;
}

async function compareFiles(file1, file2, type) {
  let [content1, content2] = await Promise.all([
    fs.readFile(file1, 'utf8'),
    fs.readFile(file2, 'utf8'),
  ]);

  if (type === 'table') {
    content1 = cleanTableDDL(content1);
    content2 = cleanTableDDL(content2);
    return diff.createTwoFilesPatch(file1, file2, content1, content2);
  } else if (type === 'procedure') {
    content1 = cleanProcedureDDL(content1);
    content2 = cleanProcedureDDL(content2);
    return diff.diffWords(content1, content2);
  }

  return [];
}

async function compare() {
  await fs.mkdir('changes/procedures', { recursive: true });
  await fs.mkdir('changes/tables', { recursive: true });

  const devTables = (await fs.readdir('dev/tables')).filter(
    (f) => !config.ignore.tables.includes(f.replace('.sql', ''))
  );
  const prodTables = await fs.readdir('prod/tables');

  for (const table of devTables) {
    if (!prodTables.includes(table)) {
      let ddl = await fs.readFile(`dev/tables/${table}`, 'utf8');
      ddl = resetAutoIncrement(ddl);
      await fs.writeFile(`changes/tables/${table}`, ddl);
      console.log(chalk.green(`New table detected: ${table}`));
    } else {
      const diffResult = await compareFiles(
        `prod/tables/${table}`,
        `dev/tables/${table}`,
        'table'
      );

      if (diffResult && diffResult.includes('@@')) {
        await fs.writeFile(`changes/tables/${table}.diff`, diffResult);
        console.log(chalk.yellow(`Changes detected in table: ${table}`));
      }
    }
  }

  const devProcs = (await fs.readdir('dev/procedures')).filter(
    (f) => !config.ignore.procedures.includes(f.replace('.sql', ''))
  );
  const prodProcs = await fs.readdir('prod/procedures');

  for (const proc of devProcs) {
    const devProcPath = `dev/procedures/${proc}`;
    const prodProcPath = `prod/procedures/${proc}`;
    const procName = proc.replace('.sql', '');

    if (!prodProcs.includes(proc)) {
      let ddl = (await fs.readFile(devProcPath, 'utf8'))
        .replace(/^DROP PROCEDURE.*?;$/gm, '') // Remove DROP PROCEDURE lines
        .replace(/^USE .*?;$/gm, '')           // Remove USE db lines
        .replace(/^DELIMITER .*?$/gm, '')      // Remove any existing delimiters
        .trim();
      const formatted = formatProcedureDDL(procName, ddl, 'prod');
      await fs.writeFile(`changes/procedures/${proc}`, formatted);
      console.log(chalk.green(`New procedure detected: ${proc}`));
    } else {
      const differences = await compareFiles(devProcPath, prodProcPath, 'procedure');
      const changed = differences.some((d) => d.added || d.removed);

      if (changed) {
        let ddl = (await fs.readFile(devProcPath, 'utf8'))
          .replace(/^DROP PROCEDURE.*?;$/gm, '') // Remove DROP PROCEDURE lines
          .replace(/^USE .*?;$/gm, '')           // Remove USE db lines
          .replace(/^DELIMITER .*?$/gm, '')      // Remove any existing delimiters
          .trim();
        ddl = ddl.replace(new RegExp(config.dev.database, 'g'), config.prod.database);
        const formatted = formatProcedureDDL(procName, ddl, 'prod');
        await fs.writeFile(`changes/procedures/${proc}`, formatted);
        console.log(chalk.yellow(`Changes detected in procedure: ${proc}`));
      }
    }
  }

  console.log(chalk.blue('Comparison completed. Check changes folder.'));
}

if (require.main === module) {
  compare();
}
