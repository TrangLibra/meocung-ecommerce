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

const SEED_PRODUCTS = [
  {
    id: 'prod_01ROYALCANINFIT32',
    sku: 'RC-FIT32-2KG',
    name: 'Thức Ăn Hạt Royal Canin Cho Mèo Trưởng Thành (Fit 32)',
    name_en: 'Royal Canin Fit 32 Adult Cat Dry Food (2kg)',
    category: 'thuc-an-hat',
    category_name: 'Thức ăn hạt dinh dưỡng',
    price: 185000,
    cost_price: 142000,
    weight: '2kg',
    inventory: 140,
    vendor: 'Royal Canin Việt Nam',
    status: 'published',
    expiry_date: '2027-06-15',
    channels: ['Web Storefront', 'Mobile App', 'Zalo OA / Hotline', 'Chi nhánh Q.1'],
    attributes: { age: 'Trưởng thành', flavor: 'Gà & Ngũ cốc', benefit: 'Tiêu búi lông' },
    public_meta: { origin: 'Pháp' },
    private_meta: { supplierCode: 'NCC-RC01', warehouseBin: 'A1-02' },
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80',
    description: 'Cung cấp đầy đủ 52 dưỡng chất thiết yếu duy trì thể trạng mèo trưởng thành.',
  },
  {
    id: 'prod_01REFLEXPLUS0002',
    sku: 'RF-SAL-15KG',
    name: 'Hạt Cho Mèo Reflex Plus Vị Cá Hồi & Gạo (Salmon Adult)',
    name_en: 'Reflex Plus Salmon & Rice Adult Cat Food (1.5kg)',
    category: 'thuc-an-hat',
    category_name: 'Thức ăn hạt dinh dưỡng',
    price: 155000,
    cost_price: 118000,
    weight: '1.5kg',
    inventory: 18,
    vendor: 'Reflex Pet Food',
    status: 'published',
    expiry_date: '2026-12-15',
    channels: ['Web Storefront', 'Zalo OA / Hotline'],
    attributes: { age: 'Trưởng thành', flavor: 'Cá hồi', benefit: 'Dưỡng lông mượt' },
    public_meta: { origin: 'Thổ Nhĩ Kỳ' },
    private_meta: { supplierCode: 'NCC-RF02', warehouseBin: 'A1-05' },
    image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&auto=format&fit=crop&q=80',
    description: 'Omega 3 & 6 từ cá hồi Na Uy giúp dưỡng lông bóng mượt.',
  },
  {
    id: 'prod_01CIAOCHURU0003',
    sku: 'CC-TUNA-56G',
    name: 'Pate Mèo Ciao Churu Dạng Tuýp Súp Thưởng (Gói 4 thanh)',
    name_en: 'Ciao Churu Lickable Cat Treats (4 Tubes)',
    category: 'pate-cho-meo',
    category_name: 'Pate & Súp thưởng',
    price: 45000,
    cost_price: 31000,
    weight: '56g',
    inventory: 310,
    vendor: 'Ciao Churu Mall',
    status: 'published',
    expiry_date: '2027-08-20',
    channels: ['Web Storefront', 'Mobile App', 'Chi nhánh Q.1'],
    attributes: { age: 'Mọi lứa tuổi', flavor: 'Cá ngừ', benefit: 'Cấp nước & Khử mùi' },
    public_meta: { origin: 'Nhật Bản' },
    private_meta: { supplierCode: 'NCC-CC03', warehouseBin: 'B2-01' },
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&auto=format&fit=crop&q=80',
    description: 'Bổ sung tinh chất trà xanh khử mùi hôi miệng và cấp nước cho mèo.',
  },
  {
    id: 'prod_01WHISKAS000004',
    sku: 'WK-KIT-85G',
    name: 'Pate Cho Mèo Con Whiskas Vị Cá Thu & Cá Hồi',
    name_en: 'Whiskas Junior Mackerel & Salmon Wet Food (85g)',
    category: 'pate-cho-meo',
    category_name: 'Pate & Súp thưởng',
    price: 22000,
    cost_price: 15000,
    weight: '85g',
    inventory: 12,
    vendor: 'Whiskas Việt Nam',
    status: 'published',
    expiry_date: '2026-12-10',
    channels: ['Web Storefront', 'Chi nhánh Q.1'],
    attributes: { age: 'Mèo con', flavor: 'Cá hồi', benefit: 'Phát triển xương' },
    public_meta: { origin: 'Thái Lan' },
    private_meta: { supplierCode: 'NCC-WK04', warehouseBin: 'B2-04' },
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
    description: 'Bổ sung Canxi và Phốt pho phát triển khung xương cho mèo con dưới 1 năm.',
  },
  {
    id: 'prod_01CATURETOFU0005',
    sku: 'CT-TOFU-6L',
    name: 'Cát Đậu Nành Tự Nhiên Cature Tofu Khử Mùi & Vón Cục Tốt',
    name_en: 'Cature Natural Tofu Clumping Cat Litter (6L)',
    category: 'cat-ve-sinh',
    category_name: 'Cát vệ sinh & Khử mùi',
    price: 135000,
    cost_price: 95000,
    weight: '6L (2.4kg)',
    inventory: 95,
    vendor: 'Cature Official',
    status: 'published',
    expiry_date: '2028-01-01',
    channels: ['Web Storefront', 'Mobile App', 'Zalo OA / Hotline'],
    attributes: { age: 'Mọi lứa tuổi', flavor: 'Đậu nành', benefit: 'Xả bồn cầu' },
    public_meta: { origin: 'Trung Quốc' },
    private_meta: { supplierCode: 'NCC-CT05', warehouseBin: 'C1-01' },
    image: 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=800&auto=format&fit=crop&q=80',
    description: 'Cát đậu nành hữu cơ thân thiện môi trường, xả trực tiếp bồn cầu.',
  },
];

const globalForProdPg = globalThis as unknown as {
  __meocungNeonPool?: Pool;
  __meocungProductTableReady?: boolean;
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

async function ensureProductTable(): Promise<void> {
  if (globalForProdPg.__meocungProductTableReady) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "storefront_product" (
      "id" text PRIMARY KEY,
      "sku" text NOT NULL DEFAULT '',
      "name" text NOT NULL,
      "name_en" text NOT NULL DEFAULT '',
      "category" text NOT NULL DEFAULT 'thuc-an-hat',
      "category_name" text NOT NULL DEFAULT 'Thức ăn hạt dinh dưỡng',
      "price" integer NOT NULL DEFAULT 0,
      "cost_price" integer NOT NULL DEFAULT 0,
      "weight" text NOT NULL DEFAULT '',
      "inventory" integer NOT NULL DEFAULT 0,
      "vendor" text NOT NULL DEFAULT 'Mèo Cưng Official',
      "status" text NOT NULL DEFAULT 'published',
      "publish_date" text NULL,
      "expiry_date" text NULL,
      "channels" jsonb NOT NULL DEFAULT '["Web Storefront"]'::jsonb,
      "attributes" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "public_meta" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "private_meta" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "image" text NOT NULL DEFAULT '',
      "description" text NOT NULL DEFAULT '',
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now()
    );
  `);

  const countRes = await pool.query(`SELECT COUNT(*)::int AS cnt FROM "storefront_product"`);
  if ((countRes.rows[0]?.cnt || 0) === 0) {
    for (const p of SEED_PRODUCTS) {
      await pool.query(
        `INSERT INTO "storefront_product" (
          "id","sku","name","name_en","category","category_name","price","cost_price","weight","inventory",
          "vendor","status","expiry_date","channels","attributes","public_meta","private_meta","image","description"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb,$16::jsonb,$17::jsonb,$18,$19)
        ON CONFLICT ("id") DO NOTHING`,
        [
          p.id, p.sku, p.name, p.name_en, p.category, p.category_name, p.price, p.cost_price,
          p.weight, p.inventory, p.vendor, p.status, p.expiry_date,
          JSON.stringify(p.channels), JSON.stringify(p.attributes),
          JSON.stringify(p.public_meta), JSON.stringify(p.private_meta),
          p.image, p.description,
        ]
      );
    }
  }
  globalForProdPg.__meocungProductTableReady = true;
}

function mapRow(r: any): NeonProduct {
  return {
    id: String(r.id),
    sku: String(r.sku || ''),
    name: String(r.name || ''),
    name_en: String(r.name_en || ''),
    category: String(r.category || 'thuc-an-hat'),
    category_name: String(r.category_name || ''),
    price: Number(r.price) || 0,
    cost_price: Number(r.cost_price) || 0,
    weight: String(r.weight || ''),
    inventory: Number(r.inventory) || 0,
    vendor: String(r.vendor || ''),
    status: String(r.status || 'published'),
    publish_date: r.publish_date ? String(r.publish_date) : null,
    expiry_date: r.expiry_date ? String(r.expiry_date) : null,
    channels: Array.isArray(r.channels) ? r.channels : ['Web Storefront'],
    attributes: r.attributes && typeof r.attributes === 'object' ? r.attributes : {},
    public_meta: r.public_meta && typeof r.public_meta === 'object' ? r.public_meta : {},
    private_meta: r.private_meta && typeof r.private_meta === 'object' ? r.private_meta : {},
    image: String(r.image || ''),
    description: String(r.description || ''),
    created_at: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
    updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
  };
}

export async function listNeonProducts(): Promise<NeonProduct[]> {
  await ensureProductTable();
  const pool = getPool();
  const { rows } = await pool.query(`SELECT * FROM "storefront_product" ORDER BY "created_at" DESC`);
  return rows.map(mapRow);
}

export async function upsertNeonProduct(input: Partial<NeonProduct> & { name: string }): Promise<NeonProduct> {
  await ensureProductTable();
  const pool = getPool();
  const id = input.id || `prod_${Date.now()}`;
  const { rows } = await pool.query(
    `INSERT INTO "storefront_product" (
      "id","sku","name","name_en","category","category_name","price","cost_price","weight","inventory",
      "vendor","status","publish_date","expiry_date","channels","attributes","public_meta","private_meta","image","description","updated_at"
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16::jsonb,$17::jsonb,$18::jsonb,$19,$20,now())
    ON CONFLICT ("id") DO UPDATE SET
      "sku"=EXCLUDED."sku", "name"=EXCLUDED."name", "name_en"=EXCLUDED."name_en",
      "category"=EXCLUDED."category", "category_name"=EXCLUDED."category_name",
      "price"=EXCLUDED."price", "cost_price"=EXCLUDED."cost_price",
      "weight"=EXCLUDED."weight", "inventory"=EXCLUDED."inventory",
      "vendor"=EXCLUDED."vendor", "status"=EXCLUDED."status",
      "publish_date"=EXCLUDED."publish_date", "expiry_date"=EXCLUDED."expiry_date",
      "channels"=EXCLUDED."channels", "attributes"=EXCLUDED."attributes",
      "public_meta"=EXCLUDED."public_meta", "private_meta"=EXCLUDED."private_meta",
      "image"=EXCLUDED."image", "description"=EXCLUDED."description",
      "updated_at"=now()
    RETURNING *`,
    [
      id,
      input.sku || '',
      input.name,
      input.name_en || input.name,
      input.category || 'thuc-an-hat',
      input.category_name || 'Thức ăn hạt dinh dưỡng',
      Math.max(0, Math.round(Number(input.price) || 0)),
      Math.max(0, Math.round(Number(input.cost_price) || 0)),
      input.weight || '',
      Math.max(0, Math.round(Number(input.inventory) || 0)),
      input.vendor || 'Mèo Cưng Official',
      input.status || 'published',
      input.publish_date || null,
      input.expiry_date || null,
      JSON.stringify(Array.isArray(input.channels) ? input.channels : ['Web Storefront']),
      JSON.stringify(input.attributes || {}),
      JSON.stringify(input.public_meta || {}),
      JSON.stringify(input.private_meta || {}),
      input.image || '',
      input.description || '',
    ]
  );
  return mapRow(rows[0]);
}

export async function deleteNeonProduct(id: string): Promise<boolean> {
  await ensureProductTable();
  const pool = getPool();
  const { rowCount } = await pool.query(`DELETE FROM "storefront_product" WHERE "id" = $1`, [id]);
  return (rowCount || 0) > 0;
}

export async function adjustNeonProductStock(
  items: { name: string; quantity: number }[],
  direction: 'deduct' | 'restore'
): Promise<void> {
  await ensureProductTable();
  const pool = getPool();
  for (const item of items) {
    const qty = Math.max(0, Math.round(Number(item.quantity) || 0));
    if (!qty || !item.name) continue;
    if (direction === 'deduct') {
      await pool.query(
        `UPDATE "storefront_product"
         SET "inventory" = GREATEST(0, "inventory" - $1), "updated_at" = now()
         WHERE LOWER("name") = LOWER($2)`,
        [qty, item.name.trim()]
      );
    } else {
      await pool.query(
        `UPDATE "storefront_product"
         SET "inventory" = "inventory" + $1, "updated_at" = now()
         WHERE LOWER("name") = LOWER($2)`,
        [qty, item.name.trim()]
      );
    }
  }
}
