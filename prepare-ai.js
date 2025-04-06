const fs = require('fs/promises');
const path = require('path');
const { OpenAI } = require('openai');
const config = require('./config');

const env = process.argv[2];
if (!env || !['dev', 'prod'].includes(env)) {
    console.error('❌ Please specify the environment: dev or prod');
    process.exit(1);
}

const dbName = config[env].database;
const openai = new OpenAI({ apiKey: config.openai.apiKey });

async function prepareVectorStore() {
    console.log(`🔍 Looking for vector store: ${dbName}`);

    const existing = await openai.vectorStores.list();
    const found = existing.data.find(store => store.name === dbName);

    let vectorStore;
    if (found) {
        console.log('✅ Vector store already exists.');
        vectorStore = found;
    } else {
        console.log('📦 Creating new vector store...');
        vectorStore = await openai.vectorStores.create({ name: dbName });
        console.log('✅ Vector store created.');
    }

    const folderPath = path.join(env, 'tables');
    const files = await fs.readdir(folderPath);
    const filesToUpload = [];
    for (const file of files) {
        if (!file.endsWith('.sql')) continue;
        const filePath = path.join(folderPath, file);
        const content = await fs.readFile(filePath, 'utf8');

        const readableName = `${env}/${file}`;

        const f = new File([content], readableName.replace('.sql', '.txt'), { type: 'text/plain' });
        filesToUpload.push(f);
    }
    console.log(`📤 Uploading ${filesToUpload.length} files...`);
    await openai.vectorStores.fileBatches.uploadAndPoll(vectorStore.id, {
        files: filesToUpload
    });

    console.log(`✅ Uploaded ${files.length} schema files to vector store.`);
}

prepareVectorStore().catch(err => {
    console.error('❌ Failed to prepare AI vector store:', err);
});
