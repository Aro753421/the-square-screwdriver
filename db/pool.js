const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/screwdriver';

const pool = new Pool({ connectionString });

module.exports = pool;
