import { Pool } from 'pg';

const globalForDb = globalThis as unknown as {
  __meocungPgPool?: Pool;
};

function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.replace(/[\uFEFF\r\n]/g, '').trim() || undefined;
}

export function getPool(): Pool | null {
  const connectionString = getDatabaseUrl();
  if (!connectionString) return null;

  if (!globalForDb.__meocungPgPool) {
    globalForDb.__meocungPgPool = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForDb.__meocungPgPool;
}

export async function ensureStoreTables(): Promise<Pool | null> {
  return getPool();
}
