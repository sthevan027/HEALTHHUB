import { readFileSync } from 'fs';
import { join } from 'path';
import pool from './db';

async function migrate() {
  const client = await pool.connect();
  try {
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    await client.query(schema);
    console.log('[migrate] Schema applied successfully');
  } catch (err) {
    console.error('[migrate] Error applying schema:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
