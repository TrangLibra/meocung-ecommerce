import { Pool } from 'pg';

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

export interface NeonOrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface NeonOrder {
  id: string;
  order_code: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  note: string | null;
  items: NeonOrderItem[];
  subtotal: number;
  shipping_fee: number;
  grand_total: number;
  status: OrderStatus;
  tracking_code: string | null;
  created_at: string;
  updated_at: string;
}

const globalForOrderPg = globalThis as unknown as {
  __meocungNeonPool?: Pool;
  __meocungOrdersTableReady?: boolean;
};

function getPool(): Pool {
  if (!globalForOrderPg.__meocungNeonPool) {
    globalForOrderPg.__meocungNeonPool = new Pool({
      connectionString: process.env.DATABASE_URL || DEFAULT_NEON_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForOrderPg.__meocungNeonPool;
}

async function ensureOrderTable(): Promise<void> {
  if (globalForOrderPg.__meocungOrdersTableReady) return;
  const pool = getPool();
  await pool.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "order_code" text NULL;`);
  await pool.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "user_id" text NULL;`);
  await pool.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_email" text NULL;`);
  await pool.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "items" jsonb NOT NULL DEFAULT '[]'::jsonb;`);
  await pool.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "subtotal" integer NOT NULL DEFAULT 0;`);
  await pool.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_fee" integer NOT NULL DEFAULT 0;`);
  await pool.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_code" text NULL;`);
  globalForOrderPg.__meocungOrdersTableReady = true;
}

function mapRowToOrder(row: any): NeonOrder {
  const rawStatus = String(row.order_status || 'pending');
  const status: OrderStatus = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(rawStatus)
    ? (rawStatus as OrderStatus)
    : 'pending';
  return {
    id: String(row.id),
    order_code: row.order_code ? String(row.order_code) : `ORD-${row.id}`,
    user_id: row.user_id ? String(row.user_id) : null,
    customer_name: String(row.customer_name || ''),
    customer_email: row.customer_email ? String(row.customer_email) : '',
    customer_phone: String(row.customer_phone || ''),
    shipping_address: String(row.shipping_address || ''),
    note: row.notes ? String(row.notes) : null,
    items: Array.isArray(row.items) ? row.items : [],
    subtotal: Number(row.subtotal) || Number(row.total_amount) || 0,
    shipping_fee: Number(row.shipping_fee) || 0,
    grand_total: Number(row.total_amount) || 0,
    status,
    tracking_code: row.tracking_code ? String(row.tracking_code) : null,
    created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function createNeonOrder(input: {
  orderCode: string;
  userId?: string | null;
  name: string;
  email: string;
  phone: string;
  address: string;
  note?: string;
  items: NeonOrderItem[];
  subtotal: number;
  shippingFee: number;
  grandTotal: number;
}): Promise<NeonOrder> {
  await ensureOrderTable();
  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO "orders" (
      "order_code", "user_id", "customer_name", "customer_email",
      "customer_phone", "shipping_address", "notes", "items",
      "subtotal", "shipping_fee", "total_amount", "order_status", "created_at", "updated_at"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, 'pending', now(), now())
    RETURNING *`,
    [
      input.orderCode,
      input.userId || null,
      input.name,
      input.email,
      input.phone,
      input.address,
      input.note || null,
      JSON.stringify(input.items),
      Math.round(input.subtotal),
      Math.round(input.shippingFee),
      Math.round(input.grandTotal),
    ]
  );
  return mapRowToOrder(rows[0]);
}

export async function listNeonOrders(options?: {
  q?: string;
  status?: string;
}): Promise<NeonOrder[]> {
  await ensureOrderTable();
  const pool = getPool();
  const params: unknown[] = [];
  const where: string[] = ['1=1'];

  if (
    options?.status &&
    ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(options.status)
  ) {
    params.push(options.status);
    where.push(`"order_status" = $${params.length}`);
  }

  if (options?.q && options.q.trim()) {
    params.push(`%${options.q.trim().toLowerCase()}%`);
    const idx = params.length;
    where.push(
      `(LOWER(COALESCE("order_code", '')) LIKE $${idx} OR LOWER("customer_name") LIKE $${idx} OR LOWER(COALESCE("customer_email", '')) LIKE $${idx} OR LOWER("customer_phone") LIKE $${idx})`
    );
  }

  const { rows } = await pool.query(
    `SELECT * FROM "orders" WHERE ${where.join(' AND ')} ORDER BY "created_at" DESC LIMIT 200`,
    params
  );
  return rows.map(mapRowToOrder);
}

export async function updateNeonOrder(
  id: string,
  input: { status?: OrderStatus; tracking_code?: string | null }
): Promise<NeonOrder | null> {
  await ensureOrderTable();
  const pool = getPool();
  const sets: string[] = ['"updated_at" = now()'];
  const params: unknown[] = [];

  if (
    input.status &&
    ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(input.status)
  ) {
    params.push(input.status);
    sets.push(`"order_status" = $${params.length}`);
  }

  if (input.tracking_code !== undefined) {
    params.push(
      typeof input.tracking_code === 'string' && input.tracking_code.trim()
        ? input.tracking_code.trim()
        : null
    );
    sets.push(`"tracking_code" = $${params.length}`);
  }

  params.push(Number(id));
  const { rows } = await pool.query(
    `UPDATE "orders" SET ${sets.join(', ')} WHERE "id" = $${params.length} RETURNING *`,
    params
  );
  return rows[0] ? mapRowToOrder(rows[0]) : null;
}

export async function deleteNeonOrder(id: string): Promise<boolean> {
  await ensureOrderTable();
  const pool = getPool();
  const { rowCount } = await pool.query(
    `DELETE FROM "orders" WHERE "id" = $1`,
    [Number(id)]
  );
  return (rowCount || 0) > 0;
}

export async function listNeonOrdersByCustomer(user: {
  id?: string;
  email?: string;
}): Promise<NeonOrder[]> {
  await ensureOrderTable();
  const pool = getPool();
  const email = (user.email || '').trim().toLowerCase();
  const userId = user.id ? String(user.id) : '';
  if (!email && !userId) return [];

  const { rows } = await pool.query(
    `SELECT * FROM "orders"
     WHERE ($1 <> '' AND "user_id" = $1)
        OR ($2 <> '' AND LOWER(COALESCE("customer_email", '')) = $2)
     ORDER BY "created_at" DESC
     LIMIT 100`,
    [userId, email]
  );
  return rows.map(mapRowToOrder);
}
