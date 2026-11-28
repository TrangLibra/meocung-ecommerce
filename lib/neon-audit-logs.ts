import { Pool } from 'pg';

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
  items: any[];
  created_at: string;
}

const globalForAuditPg = globalThis as unknown as {
  __meocungNeonPool?: Pool;
  __meocungAuditTableReady?: boolean;
};

function getPool(): Pool {
  if (!globalForAuditPg.__meocungNeonPool) {
    globalForAuditPg.__meocungNeonPool = new Pool({
      connectionString: process.env.DATABASE_URL || DEFAULT_NEON_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForAuditPg.__meocungNeonPool;
}

async function ensureAuditTable(): Promise<void> {
  if (globalForAuditPg.__meocungAuditTableReady) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "admin_audit_log" (
      "id" text PRIMARY KEY,
      "actor" text NOT NULL DEFAULT 'Admin',
      "action" text NOT NULL,
      "target" text NOT NULL DEFAULT '',
      "detail" text NOT NULL DEFAULT '',
      "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "created_at" timestamptz NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`ALTER TABLE "admin_audit_log" ADD COLUMN IF NOT EXISTS "items" jsonb NOT NULL DEFAULT '[]'::jsonb;`);
  globalForAuditPg.__meocungAuditTableReady = true;
}

export async function recordAdminAuditLog(input: {
  actor?: string;
  action: string;
  target?: string;
  detail?: string;
  items?: any[];
}): Promise<AuditLogEntry> {
  await ensureAuditTable();
  const pool = getPool();
  const id = `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const itemsArr = Array.isArray(input.items) ? input.items : [];
  const { rows } = await pool.query(
    `INSERT INTO "admin_audit_log" ("id", "actor", "action", "target", "detail", "items")
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING *`,
    [id, input.actor || 'Admin', input.action, input.target || '', input.detail || '', JSON.stringify(itemsArr)]
  );
  const r = rows[0];
  return {
    id: String(r.id),
    actor: String(r.actor),
    action: String(r.action),
    target: String(r.target || ''),
    detail: String(r.detail || ''),
    items: Array.isArray(r.items) ? r.items : [],
    created_at: new Date(r.created_at).toISOString(),
  };
}

export async function listAdminAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  await ensureAuditTable();
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM "admin_audit_log" ORDER BY "created_at" DESC LIMIT $1`,
    [Math.min(200, Math.max(1, limit))]
  );
  return rows.map((r: any) => ({
    id: String(r.id),
    actor: String(r.actor || 'Admin'),
    action: String(r.action || ''),
    target: String(r.target || ''),
    detail: String(r.detail || ''),
    items: Array.isArray(r.items) ? r.items : [],
    created_at: new Date(r.created_at).toISOString(),
  }));
}
