const fs = require('fs');
require('dotenv').config();

module.exports = {
    dev: {
        host: process.env.DB_HOSTNAME_DEV,
        user: process.env.DB_USERNAME_DEV,
        password: process.env.DB_PASSWORD_DEV,
        database: process.env.DB_NAME_DEV,
        ssl: {
            ca: fs.readFileSync(__dirname + '/sslCert.pem')
          },
        multipleStatements: true,
        timezone: 'Z', // 'Z' means UTC
        connectionLimit: 10, // same as pool max
        waitForConnections: true,
        queueLimit: 0
    },
    prod: {
        host: process.env.DB_HOSTNAME_PROD,
        user: process.env.DB_USERNAME_PROD,
        password: process.env.DB_PASSWORD_PROD,
        database: process.env.DB_NAME_PROD,
        ssl: {
            ca: fs.readFileSync(__dirname + '/sslCert.pem')
          },
        multipleStatements: true,
        timezone: 'Z', // 'Z' means UTC
        connectionLimit: 10, // same as pool max
        waitForConnections: true,
        queueLimit: 0
    },
    ignore: {
        tables: ['logs', 'sessions'],
        procedures: ['test_proc'],
    },
};