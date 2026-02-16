const fs = require('fs');
const path = require('path');
const pool = require('../db/pool');

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function run() {
  await ensureMigrationsTable();

  const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const filename of files) {
    const alreadyApplied = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [filename]
    );

    if (alreadyApplied.rowCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`Skipping ${filename} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf8');
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await pool.query('COMMIT');
      // eslint-disable-next-line no-console
      console.log(`Applied ${filename}`);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  }
}

run()
  .then(() => pool.end())
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await pool.end();
    process.exit(1);
  });
