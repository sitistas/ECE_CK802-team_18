'use strict';

const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: true
    }
});

client.connect((err) => {
    if (err)
        throw err;
});

module.exports = client
