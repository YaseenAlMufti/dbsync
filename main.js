const { spawn } = require('child_process');

async function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });

    child.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`${command} exited with code ${code}`));
      }
      resolve();
    });
  });
}

async function main() {
  try {
    console.log('Extracting DEV DDL...');
    await runCommand('node', ['extract.js', 'dev']);

    console.log('Extracting PROD DDL...');
    await runCommand('node', ['extract.js', 'prod']);

    console.log('Comparing DDL...');
    await runCommand('node', ['compare.js']);

    console.log('✅ DDL Sync Completed');
  } catch (err) {
    console.error('❌ DDL Sync Failed', err);
  }
}

if (require.main === module) {
  main();
}