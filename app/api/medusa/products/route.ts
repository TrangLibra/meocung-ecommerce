import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

function formatProductRow(p: any, idx = 0) {
  const meta = p.metadata || {};
  const defaultPrice = 150000 + (idx % 4) * 35000;
  const price = Number(meta.price ?? defaultPrice);
  const originalPrice = Number(meta.originalPrice ?? Math.round(price * 1.15));
  const titleLower = String(p.name || p.title || '').toLowerCase();
  const catSlug =
    meta.category ||
    (titleLower.includes('pate') ? 'pate-cho-meo' : titleLower.includes('cat') || titleLower.includes('cát') ? 'cat-ve-sinh' : 'thuc-an-hat');
  const catNames: Record<string, string> = {
    'thuc-an-hat': 'Thức ăn hạt',
    'pate-cho-meo': 'Pate cho mèo',
    'cat-ve-sinh': 'Cát vệ sinh',
    'phu-kien': 'Phụ kiện & Đồ chơi',
  };

  return {
    id: p.id,
    name: p.name || p.title,
    slug: p.slug || p.handle || `san-pham-${p.id}`,
    price,
    originalPrice,
    inventory: Number(meta.inventory ?? 100),
    weight: meta.weight || '1kg',
    vendor: meta.vendor || 'Mèo Cưng Official',
    collection_id: meta.collection_id || '',
    image: p.image || p.thumbnail || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
    categorySlug: catSlug,
    categoryName: meta.categoryName || catNames[catSlug] || 'Thức ăn hạt',
    rating: 5.0,
    soldCount: 50 + idx * 10,
    inStock: Number(meta.inventory ?? 100) > 0,
    description: p.description || '',
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const handle = searchParams.get('handle') || searchParams.get('slug');

    if (handle) {
      const res = await pool.query(
        `SELECT id, title as name, handle as slug, thumbnail as image, description, metadata, created_at
         FROM product
         WHERE (handle = $1 OR id = $1) AND deleted_at IS NULL
         LIMIT 1`,
        [handle]
      );
      if (res.rows.length > 0) {
        const formatted = formatProductRow(res.rows[0], 0);
        return NextResponse.json({ product: formatted, products: [formatted] }, { headers: corsHeaders });
      }
      return NextResponse.json({ product: null, products: [] }, { headers: corsHeaders });
    }

    const res = await pool.query(
      `SELECT id, title as name, handle as slug, thumbnail as image, description, metadata, created_at
       FROM product
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );

    const formattedProducts = res.rows.map((p, idx) => formatProductRow(p, idx));
    return NextResponse.json({ products: formattedProducts, count: formattedProducts.length }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Error querying products from PostgreSQL:', err);
    return NextResponse.json({ error: err.message, products: [] }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body.name || body.title;
    if (!name) {
      return NextResponse.json({ success: false, message: 'Thiếu tên sản phẩm' }, { status: 400, headers: corsHeaders });
    }

    const id = body.id || `prod_${Date.now()}`;
    const baseSlug =
      name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || 'san-pham';
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    const image = body.image || body.thumbnail || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800';
    const description = body.description || '';
    const metadata = {
      price: Number(body.price ?? 150000),
      originalPrice: Number(body.originalPrice ?? Math.round(Number(body.price ?? 150000) * 1.15)),
      inventory: Number(body.inventory ?? 100),
      weight: body.weight || '1kg',
      vendor: body.vendor || 'Mèo Cưng Official',
      category: body.category || 'thuc-an-hat',
      categoryName: body.categoryName || 'Thức ăn hạt',
      collection_id: body.collection_id || '',
    };

    await pool.query(
      `INSERT INTO product (id, title, handle, thumbnail, description, metadata, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'published', NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         handle = EXCLUDED.handle,
         thumbnail = EXCLUDED.thumbnail,
         description = EXCLUDED.description,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()`,
      [id, name, slug, image, description, JSON.stringify(metadata)]
    );

    return NextResponse.json(
      { success: true, product: { id, name, slug, image, description, ...metadata } },
      { status: 201, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Error inserting product to PostgreSQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, message: 'Thiếu ID sản phẩm' }, { status: 400, headers: corsHeaders });
    }

    const existing = await pool.query('SELECT metadata FROM product WHERE id = $1', [body.id]);
    const oldMeta = existing.rows[0]?.metadata || {};
    const newMeta = {
      ...oldMeta,
      ...(body.price !== undefined ? { price: Number(body.price) } : {}),
      ...(body.originalPrice !== undefined ? { originalPrice: Number(body.originalPrice) } : {}),
      ...(body.inventory !== undefined ? { inventory: Number(body.inventory) } : {}),
      ...(body.weight !== undefined ? { weight: body.weight } : {}),
      ...(body.vendor !== undefined ? { vendor: body.vendor } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.categoryName !== undefined ? { categoryName: body.categoryName } : {}),
      ...(body.collection_id !== undefined ? { collection_id: body.collection_id } : {}),
    };

    const name = body.name || body.title || null;
    const image = body.image || body.thumbnail || null;
    const description = body.description !== undefined ? body.description : null;

    await pool.query(
      `UPDATE product
       SET title = COALESCE($2, title),
           thumbnail = COALESCE($3, thumbnail),
           description = COALESCE($4, description),
           metadata = $5::jsonb,
           updated_at = NOW()
       WHERE id = $1`,
      [body.id, name, image, description, JSON.stringify(newMeta)]
    );

    return NextResponse.json({ success: true, message: 'Đã cập nhật sản phẩm trong Database', metadata: newMeta }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Error updating product in PostgreSQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Thiếu ID cần xóa' }, { status: 400, headers: corsHeaders });
    }

    await pool.query('DELETE FROM product WHERE id = $1', [id]);
    return NextResponse.json({ success: true, message: 'Đã xóa sản phẩm khỏi Database' }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Error deleting product from PostgreSQL:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500, headers: corsHeaders });
  }
}
