import dotenv from 'dotenv';
import pg from 'pg';
import { readFileSync } from 'node:fs';

dotenv.config({ path: '.env.local', override: true });
dotenv.config();

const { Pool } = pg;
const supabaseCa = readFileSync(new URL('../../database/prod-ca-2021.crt', import.meta.url), 'utf8');
let pool;

export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('Falta configurar DATABASE_URL.');
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'false' ? false : {
        ca: supabaseCa,
        rejectUnauthorized: true
      },
      max: Number(process.env.DB_POOL_MAX || 3),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: true
    });
    pool.on('error', error => console.error('Error inesperado en PostgreSQL:', error));
  }
  return pool;
}

export async function query(text, values = []) {
  return getPool().query(text, values);
}

export async function withTransaction(work) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
