// 'use strict';

const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.JDBC_DATABASE_URL,
    // ssl: {
    //     rejectUnauthorized: false
    // }
});

client.connect((err) => {
    if (err)
        throw err;
});

module.exports = client
