import crypto from 'crypto';
import { Pool } from 'pg';
import { hashPassword, verifyPassword, type PublicUser } from './auth';

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

export interface NeonCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: 'active' | 'blocked';
  source: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

const globalForPg = globalThis as unknown as {
  __meocungNeonPool?: Pool;
  __meocungUserTableReady?: boolean;
};

function getPool(): Pool {
  if (!globalForPg.__meocungNeonPool) {
    globalForPg.__meocungNeonPool = new Pool({
      connectionString: process.env.DATABASE_URL || DEFAULT_NEON_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForPg.__meocungNeonPool;
}

async function ensureTable(): Promise<void> {
  if (globalForPg.__meocungUserTableReady) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "storefront_user" (
      "id" text NOT NULL,
      "name" text NOT NULL,
      "email" text NOT NULL,
      "phone" text NULL,
      "password_hash" text NOT NULL,
      "status" text CHECK ("status" IN ('active', 'blocked')) NOT NULL DEFAULT 'active',
      "source" text NOT NULL DEFAULT 'meocung-ecommerce',
      "last_login_at" timestamptz NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "storefront_user_pkey" PRIMARY KEY ("id")
    );
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_user_email_unique"
    ON "storefront_user" ("email") WHERE "deleted_at" IS NULL;
  `);
  globalForPg.__meocungUserTableReady = true;
}

function mapRowToCustomer(row: any): NeonCustomer {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : null,
    status: row.status === 'blocked' ? 'blocked' : 'active',
    source: row.source ? String(row.source) : 'meocung-ecommerce',
    last_login_at: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export function neonCustomerToPublicUser(c: NeonCustomer): PublicUser {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone || undefined,
    createdAt: c.created_at,
  };
}

export async function findNeonUserByEmail(email: string): Promise<(NeonCustomer & { password_hash: string }) | null> {
  await ensureTable();
  const pool = getPool();
  const normalized = email.trim().toLowerCase();
  const { rows } = await pool.query(
    `SELECT * FROM "storefront_user" WHERE LOWER("email") = $1 AND "deleted_at" IS NULL LIMIT 1`,
    [normalized]
  );
  if (!rows[0]) return null;
  return {
    ...mapRowToCustomer(rows[0]),
    password_hash: String(rows[0].password_hash),
  };
}

export async function createNeonUser(input: {
  name: string;
  email: string;
  phone?: string | null;
  password?: string;
  passwordHash?: string;
  status?: 'active' | 'blocked';
  source?: string;
}): Promise<NeonCustomer> {
  await ensureTable();
  const pool = getPool();
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await findNeonUserByEmail(normalizedEmail);
  if (existing) {
    throw new Error('EMAIL_ALREADY_EXISTS');
  }

  const passwordHash =
    input.passwordHash || (input.password ? hashPassword(input.password) : '');
  if (!passwordHash) {
    throw new Error('PASSWORD_REQUIRED');
  }

  const id = `sfu_${crypto.randomUUID().replace(/-/g, '')}`;
  const { rows } = await pool.query(
    `INSERT INTO "storefront_user" ("id", "name", "email", "phone", "password_hash", "status", "source", "created_at", "updated_at")
     VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())
     RETURNING *`,
    [
      id,
      input.name.trim(),
      normalizedEmail,
      input.phone?.trim() || null,
      passwordHash,
      input.status === 'blocked' ? 'blocked' : 'active',
      input.source || 'meocung-ecommerce',
    ]
  );
  return mapRowToCustomer(rows[0]);
}

export async function authenticateNeonUser(
  email: string,
  password: string
): Promise<
  | { ok: true; user: NeonCustomer }
  | { ok: false; status: number; error: string }
> {
  const user = await findNeonUserByEmail(email);
  if (!user) {
    return { ok: false, status: 401, error: 'Email hoặc mật khẩu không chính xác.' };
  }
  if (user.status === 'blocked') {
    return {
      ok: false,
      status: 403,
      error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
    };
  }
  if (!verifyPassword(password, user.password_hash)) {
    return { ok: false, status: 401, error: 'Email hoặc mật khẩu không chính xác.' };
  }

  const pool = getPool();
  const { rows } = await pool.query(
    `UPDATE "storefront_user" SET "last_login_at" = now(), "updated_at" = now() WHERE "id" = $1 RETURNING *`,
    [user.id]
  );
  return { ok: true, user: mapRowToCustomer(rows[0] || user) };
}

export async function listNeonUsers(options?: {
  q?: string;
  status?: 'active' | 'blocked';
}): Promise<NeonCustomer[]> {
  await ensureTable();
  const pool = getPool();
  const params: unknown[] = [];
  const where: string[] = ['"deleted_at" IS NULL'];

  if (options?.status === 'active' || options?.status === 'blocked') {
    params.push(options.status);
    where.push(`"status" = $${params.length}`);
  }

  if (options?.q && options.q.trim()) {
    params.push(`%${options.q.trim().toLowerCase()}%`);
    const idx = params.length;
    where.push(
      `(LOWER("name") LIKE $${idx} OR LOWER("email") LIKE $${idx} OR LOWER(COALESCE("phone", '')) LIKE $${idx})`
    );
  }

  const { rows } = await pool.query(
    `SELECT * FROM "storefront_user" WHERE ${where.join(' AND ')} ORDER BY "created_at" DESC LIMIT 200`,
    params
  );
  return rows.map(mapRowToCustomer);
}

export async function updateNeonUser(
  id: string,
  input: {
    name?: string;
    email?: string;
    phone?: string | null;
    status?: 'active' | 'blocked';
    password?: string;
  }
): Promise<NeonCustomer | null> {
  await ensureTable();
  const pool = getPool();

  const sets: string[] = ['"updated_at" = now()'];
  const params: unknown[] = [];

  if (typeof input.name === 'string' && input.name.trim().length >= 2) {
    params.push(input.name.trim());
    sets.push(`"name" = $${params.length}`);
  }

  if (typeof input.email === 'string' && input.email.trim()) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await findNeonUserByEmail(normalizedEmail);
    if (existing && existing.id !== id) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }
    params.push(normalizedEmail);
    sets.push(`"email" = $${params.length}`);
  }

  if (input.phone !== undefined) {
    params.push(typeof input.phone === 'string' && input.phone.trim() ? input.phone.trim() : null);
    sets.push(`"phone" = $${params.length}`);
  }

  if (input.status === 'active' || input.status === 'blocked') {
    params.push(input.status);
    sets.push(`"status" = $${params.length}`);
  }

  if (typeof input.password === 'string' && input.password.length >= 6) {
    params.push(hashPassword(input.password));
    sets.push(`"password_hash" = $${params.length}`);
  }

  params.push(id);
  const { rows } = await pool.query(
    `UPDATE "storefront_user" SET ${sets.join(', ')} WHERE "id" = $${params.length} AND "deleted_at" IS NULL RETURNING *`,
    params
  );
  return rows[0] ? mapRowToCustomer(rows[0]) : null;
}

export async function deleteNeonUser(id: string): Promise<boolean> {
  await ensureTable();
  const pool = getPool();
  const { rowCount } = await pool.query(
    `DELETE FROM "storefront_user" WHERE "id" = $1`,
    [id]
  );
  return (rowCount || 0) > 0;
}
