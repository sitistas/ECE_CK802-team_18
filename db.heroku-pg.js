'use strict';

const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgres://lghdvjgzpzukla:d92b59d81b2d067c8b427caaebd5236cae1c14cf8848dccac6ade17294a7ef93@ec2-52-18-116-67.eu-west-1.compute.amazonaws.com:5432/d18j9v5aqokkub',
    ssl: {
        rejectUnauthorized: false
    }
});

client.connect((err) => {
    if (err)
        throw err;
});

module.exports = client
