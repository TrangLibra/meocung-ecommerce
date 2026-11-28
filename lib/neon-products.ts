import { Pool } from 'pg';

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

export interface NeonProduct {
  id: string;
  sku: string;
  name: string;
  name_en: string;
  category: string;
  category_name: string;
  price: number;
  cost_price: number;
  weight: string;
  actual_weight?: string;
  inventory: number;
  vendor: string;
  status: string;
  publish_date: string | null;
  expiry_date: string | null;
  channels: string[];
  attributes: Record<string, string>;
  public_meta: Record<string, string>;
  private_meta: Record<string, string>;
  image: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const globalForProdPg = globalThis as unknown as {
  __meocungNeonPool?: Pool;
};

function getPool(): Pool {
  if (!globalForProdPg.__meocungNeonPool) {
    globalForProdPg.__meocungNeonPool = new Pool({
      connectionString: process.env.DATABASE_URL || DEFAULT_NEON_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForProdPg.__meocungNeonPool;
}

function toSlugHandle(name: string, id: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = id.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toLowerCase();
  return `${base || 'san-pham'}-${suffix}`;
}

function mapProductRow(r: any): NeonProduct {
  const meta = r.metadata && typeof r.metadata === 'object' ? r.metadata : {};
  const cat = String(meta.category || 'thuc-an-hat');
  const catName = String(
    r.subtitle ||
      meta.category_name ||
      (cat === 'pate-cho-meo'
        ? 'Pate & Súp thưởng'
        : cat === 'cat-ve-sinh'
        ? 'Cát vệ sinh & Khử mùi'
        : cat === 'phu-kien'
        ? 'Phụ kiện & Đồ chơi'
        : 'Thức ăn hạt dinh dưỡng')
  );
  return {
    id: String(r.id),
    sku: String(meta.sku || ''),
    name: String(r.title || ''),
    name_en: String(meta.name_en || r.title || ''),
    category: cat,
    category_name: catName,
    price: Number(meta.price) || 0,
    cost_price: Number(meta.cost_price) || 0,
    weight: String(meta.weight || (r.weight ? `${r.weight}` : '')),
    actual_weight: String(meta.actual_weight || ''),
    inventory: Number(meta.inventory ?? 50),
    vendor: String(meta.vendor || 'Mèo Cưng Official'),
    status: String(r.status || 'published'),
    publish_date: meta.publish_date ? String(meta.publish_date) : null,
    expiry_date: meta.expiry_date ? String(meta.expiry_date) : null,
    channels: Array.isArray(meta.channels) ? meta.channels : ['Web Storefront'],
    attributes: meta.attributes && typeof meta.attributes === 'object' ? meta.attributes : {},
    public_meta: meta.public_meta && typeof meta.public_meta === 'object' ? meta.public_meta : {},
    private_meta: meta.private_meta && typeof meta.private_meta === 'object' ? meta.private_meta : {},
    image: String(r.thumbnail || ''),
    description: String(r.description || ''),
    created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function listNeonProducts(): Promise<NeonProduct[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM "product" WHERE "deleted_at" IS NULL ORDER BY "created_at" DESC`
  );
  return rows.map(mapProductRow);
}

export async function upsertNeonProduct(input: Partial<NeonProduct> & { name: string }): Promise<NeonProduct> {
  const pool = getPool();
  const id = input.id || `prod_${Date.now()}`;
  const price = Math.max(0, Math.round(Number(input.price) || 0));
  const costPrice = Math.max(0, Math.round(Number(input.cost_price) || 0));
  const inventory = Math.max(0, Math.round(Number(input.inventory) || 0));
  const status = input.status || 'published';
  const category = input.category || 'thuc-an-hat';
  const categoryName =
    input.category_name ||
    (category === 'pate-cho-meo'
      ? 'Pate & Súp thưởng'
      : category === 'cat-ve-sinh'
      ? 'Cát vệ sinh & Khử mùi'
      : category === 'phu-kien'
      ? 'Phụ kiện & Đồ chơi'
      : 'Thức ăn hạt dinh dưỡng');
  const vendor = input.vendor || 'Mèo Cưng Official';
  const image = input.image || '';
  const description = input.description || '';
  const handle = toSlugHandle(input.name, id);

  const meta = {
    sku: input.sku || '',
    name_en: input.name_en || input.name,
    price,
    cost_price: costPrice,
    inventory,
    weight: input.weight || '',
    actual_weight: input.actual_weight || '',
    category,
    category_name: categoryName,
    vendor,
    publish_date: input.publish_date || null,
    expiry_date: input.expiry_date || null,
    channels: Array.isArray(input.channels) ? input.channels : ['Web Storefront'],
    attributes: input.attributes || {},
    public_meta: input.public_meta || {},
    private_meta: input.private_meta || {},
  };

  const { rows } = await pool.query(
    `INSERT INTO "product" ("id", "title", "handle", "subtitle", "description", "status", "thumbnail", "metadata", "created_at", "updated_at")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, now(), now())
     ON CONFLICT ("id") DO UPDATE SET
       "title" = EXCLUDED."title",
       "subtitle" = EXCLUDED."subtitle",
       "description" = EXCLUDED."description",
       "status" = EXCLUDED."status",
       "thumbnail" = EXCLUDED."thumbnail",
       "metadata" = COALESCE("product"."metadata", '{}'::jsonb) || EXCLUDED."metadata",
       "updated_at" = now()
     RETURNING *`,
    [id, input.name, handle, categoryName, description, status, image || null, JSON.stringify(meta)]
  );
  return mapProductRow(rows[0]);
}

export async function deleteNeonProduct(id: string): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(`DELETE FROM "product" WHERE "id" = $1`, [id]);
  return (rowCount || 0) > 0;
}

export async function adjustNeonProductStock(
  items: { name: string; quantity: number }[],
  direction: 'deduct' | 'restore'
): Promise<void> {
  const pool = getPool();
  for (const item of items) {
    const qty = Math.max(0, Math.round(Number(item.quantity) || 0));
    if (!qty || !item.name) continue;
    const { rows } = await pool.query(
      `SELECT "id", "metadata" FROM "product" WHERE LOWER("title") = LOWER($1) LIMIT 1`,
      [item.name.trim()]
    );
    if (!rows.length) continue;
    const meta = rows[0].metadata && typeof rows[0].metadata === 'object' ? rows[0].metadata : {};
    const curInv = Number(meta.inventory ?? 50);
    const nextInv = direction === 'deduct' ? Math.max(0, curInv - qty) : curInv + qty;
    await pool.query(
      `UPDATE "product" SET "metadata" = COALESCE("metadata", '{}'::jsonb) || $1::jsonb, "updated_at" = now() WHERE "id" = $2`,
      [JSON.stringify({ inventory: nextInv }), rows[0].id]
    );
  }
}

export interface NeonCategory {
  id: string;
  name: string;
  handle: string;
  description: string;
  is_active: boolean;
}

export async function listNeonCategories(): Promise<NeonCategory[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT "id", "name", "handle", "description", "is_active" FROM "product_category" WHERE "deleted_at" IS NULL ORDER BY "rank" ASC, "created_at" ASC`
  );
  return rows.map((r: any) => ({
    id: String(r.id),
    name: String(r.name),
    handle: String(r.handle),
    description: String(r.description || ''),
    is_active: Boolean(r.is_active),
  }));
}

export async function createNeonCategory(input: { name: string; description?: string }): Promise<NeonCategory> {
  const pool = getPool();
  const handle =
    input.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `danh-muc-${Date.now()}`;
  const cleanSlug = handle.replace(/-/g, '').slice(0, 14);
  const id = `pcat_${cleanSlug}${Date.now().toString().slice(-4)}`;
  const mpath = `${id}.`;
  const { rows } = await pool.query(
    `INSERT INTO "product_category" ("id", "name", "description", "handle", "mpath", "is_active", "is_internal", "rank", "created_at", "updated_at")
     VALUES ($1, $2, $3, $4, $5, true, false, 0, now(), now())
     ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description", "updated_at" = now()
     RETURNING "id", "name", "handle", "description", "is_active"`,
    [id, input.name.trim(), input.description || '', handle, mpath]
  );
  const r = rows[0];
  return {
    id: String(r.id),
    name: String(r.name),
    handle: String(r.handle),
    description: String(r.description || ''),
    is_active: Boolean(r.is_active),
  };
}

export async function deleteNeonCategory(id: string): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(`DELETE FROM "product_category" WHERE "id" = $1`, [id]);
  return (rowCount || 0) > 0;
}
