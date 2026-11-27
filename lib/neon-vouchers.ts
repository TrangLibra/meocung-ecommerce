import { Pool } from 'pg';

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

export type VoucherType = 'percent' | 'fixed' | 'freeship';

export interface NeonVoucher {
  id: string;
  code: string;
  title: string;
  type: VoucherType;
  discount_value: number;
  min_order: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  applicable_products: string[];
  created_at: string;
  updated_at: string;
}

const globalForVoucherPg = globalThis as unknown as {
  __meocungNeonPool?: Pool;
  __meocungVoucherTableReady?: boolean;
};

function getPool(): Pool {
  if (!globalForVoucherPg.__meocungNeonPool) {
    globalForVoucherPg.__meocungNeonPool = new Pool({
      connectionString: process.env.DATABASE_URL || DEFAULT_NEON_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForVoucherPg.__meocungNeonPool;
}

async function ensureVoucherTable(): Promise<void> {
  if (globalForVoucherPg.__meocungVoucherTableReady) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "voucher" (
      "id" serial PRIMARY KEY,
      "code" text NOT NULL UNIQUE,
      "title" text NOT NULL,
      "type" text NOT NULL DEFAULT 'percent' CHECK ("type" IN ('percent', 'fixed', 'freeship')),
      "discount_value" integer NOT NULL DEFAULT 0,
      "min_order" integer NOT NULL DEFAULT 0,
      "max_uses" integer NULL,
      "used_count" integer NOT NULL DEFAULT 0,
      "expires_at" timestamptz NULL,
      "is_active" boolean NOT NULL DEFAULT true,
      "applicable_products" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
  `);
  await pool.query(
    `ALTER TABLE "voucher" ADD COLUMN IF NOT EXISTS "applicable_products" jsonb NOT NULL DEFAULT '[]'::jsonb;`
  );
  globalForVoucherPg.__meocungVoucherTableReady = true;
}

function mapRow(row: any): NeonVoucher {
  const rawType = String(row.type || 'percent');
  const type: VoucherType =
    rawType === 'fixed' || rawType === 'freeship' ? rawType : 'percent';
  return {
    id: String(row.id),
    code: String(row.code),
    title: String(row.title),
    type,
    discount_value: Number(row.discount_value) || 0,
    min_order: Number(row.min_order) || 0,
    max_uses: row.max_uses != null ? Number(row.max_uses) : null,
    used_count: Number(row.used_count) || 0,
    expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    is_active: row.is_active !== false,
    applicable_products: Array.isArray(row.applicable_products)
      ? row.applicable_products.map(String)
      : [],
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function listNeonVouchers(options?: {
  q?: string;
  type?: string;
}): Promise<NeonVoucher[]> {
  await ensureVoucherTable();
  const pool = getPool();
  const params: unknown[] = [];
  const where: string[] = ['1=1'];

  if (options?.type && ['percent', 'fixed', 'freeship'].includes(options.type)) {
    params.push(options.type);
    where.push(`"type" = $${params.length}`);
  } else if (options?.type === 'promo') {
    where.push(`"type" IN ('percent', 'fixed')`);
  }

  if (options?.q && options.q.trim()) {
    params.push(`%${options.q.trim().toLowerCase()}%`);
    const idx = params.length;
    where.push(`(LOWER("code") LIKE $${idx} OR LOWER("title") LIKE $${idx})`);
  }

  const { rows } = await pool.query(
    `SELECT * FROM "voucher" WHERE ${where.join(' AND ')} ORDER BY "created_at" DESC LIMIT 200`,
    params
  );
  return rows.map(mapRow);
}

export async function createNeonVoucher(input: {
  code: string;
  title: string;
  type: VoucherType;
  discount_value?: number;
  min_order?: number;
  max_uses?: number | null;
  expires_at?: string | null;
  is_active?: boolean;
  applicable_products?: string[];
}): Promise<NeonVoucher> {
  await ensureVoucherTable();
  const pool = getPool();
  const code = input.code.trim().toUpperCase().replace(/\s+/g, '');
  if (!code) throw new Error('CODE_REQUIRED');

  const existing = await pool.query(
    `SELECT id FROM "voucher" WHERE UPPER("code") = $1 LIMIT 1`,
    [code]
  );
  if (existing.rows[0]) {
    throw new Error('CODE_ALREADY_EXISTS');
  }

  const type: VoucherType =
    input.type === 'fixed' || input.type === 'freeship' ? input.type : 'percent';
  const discountValue =
    type === 'freeship' ? 0 : Math.max(0, Math.round(Number(input.discount_value) || 0));
  const minOrder = Math.max(0, Math.round(Number(input.min_order) || 0));
  const maxUses =
    input.max_uses != null && Number(input.max_uses) > 0
      ? Math.round(Number(input.max_uses))
      : null;
  const expiresAt =
    input.expires_at && String(input.expires_at).trim()
      ? new Date(String(input.expires_at)).toISOString()
      : null;

  const applicableProducts = Array.isArray(input.applicable_products)
    ? input.applicable_products.map(String).filter(Boolean)
    : [];

  const { rows } = await pool.query(
    `INSERT INTO "voucher" (
      "code", "title", "type", "discount_value", "min_order", "max_uses", "expires_at", "is_active", "applicable_products", "created_at", "updated_at"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, now(), now())
    RETURNING *`,
    [
      code,
      input.title.trim() || (type === 'freeship' ? 'Miễn phí vận chuyển' : `Khuyến mãi ${code}`),
      type,
      discountValue,
      minOrder,
      maxUses,
      expiresAt,
      input.is_active !== false,
      JSON.stringify(applicableProducts),
    ]
  );
  return mapRow(rows[0]);
}

export async function updateNeonVoucher(
  id: string,
  input: {
    code?: string;
    title?: string;
    type?: VoucherType;
    discount_value?: number;
    min_order?: number;
    max_uses?: number | null;
    expires_at?: string | null;
    is_active?: boolean;
    applicable_products?: string[];
  }
): Promise<NeonVoucher | null> {
  await ensureVoucherTable();
  const pool = getPool();
  const sets: string[] = ['"updated_at" = now()'];
  const params: unknown[] = [];

  if (typeof input.code === 'string' && input.code.trim()) {
    const code = input.code.trim().toUpperCase().replace(/\s+/g, '');
    const dup = await pool.query(
      `SELECT id FROM "voucher" WHERE UPPER("code") = $1 AND "id" <> $2 LIMIT 1`,
      [code, Number(id)]
    );
    if (dup.rows[0]) throw new Error('CODE_ALREADY_EXISTS');
    params.push(code);
    sets.push(`"code" = $${params.length}`);
  }

  if (typeof input.title === 'string' && input.title.trim()) {
    params.push(input.title.trim());
    sets.push(`"title" = $${params.length}`);
  }

  if (input.type && ['percent', 'fixed', 'freeship'].includes(input.type)) {
    params.push(input.type);
    sets.push(`"type" = $${params.length}`);
  }

  if (input.discount_value !== undefined) {
    params.push(Math.max(0, Math.round(Number(input.discount_value) || 0)));
    sets.push(`"discount_value" = $${params.length}`);
  }

  if (input.min_order !== undefined) {
    params.push(Math.max(0, Math.round(Number(input.min_order) || 0)));
    sets.push(`"min_order" = $${params.length}`);
  }

  if (input.max_uses !== undefined) {
    params.push(
      input.max_uses != null && Number(input.max_uses) > 0
        ? Math.round(Number(input.max_uses))
        : null
    );
    sets.push(`"max_uses" = $${params.length}`);
  }

  if (input.expires_at !== undefined) {
    params.push(
      input.expires_at && String(input.expires_at).trim()
        ? new Date(String(input.expires_at)).toISOString()
        : null
    );
    sets.push(`"expires_at" = $${params.length}`);
  }

  if (typeof input.is_active === 'boolean') {
    params.push(input.is_active);
    sets.push(`"is_active" = $${params.length}`);
  }

  if (Array.isArray(input.applicable_products)) {
    params.push(JSON.stringify(input.applicable_products.map(String).filter(Boolean)));
    sets.push(`"applicable_products" = $${params.length}::jsonb`);
  }

  params.push(Number(id));
  const { rows } = await pool.query(
    `UPDATE "voucher" SET ${sets.join(', ')} WHERE "id" = $${params.length} RETURNING *`,
    params
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function deleteNeonVoucher(id: string): Promise<boolean> {
  await ensureVoucherTable();
  const pool = getPool();
  const { rowCount } = await pool.query(`DELETE FROM "voucher" WHERE "id" = $1`, [
    Number(id),
  ]);
  return (rowCount || 0) > 0;
}
