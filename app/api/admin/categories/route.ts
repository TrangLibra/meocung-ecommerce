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

const DEFAULT_CATEGORIES = [
  { id: 'pcat_thucanhat01', name: 'Thức ăn hạt', handle: 'thuc-an-hat', description: 'Hạt dinh dưỡng cao cấp cho mèo mọi lứa tuổi', rank: 0 },
  { id: 'pcat_patechomeo02', name: 'Pate cho mèo', handle: 'pate-cho-meo', description: 'Pate thơm ngon bổ sung nước và dưỡng chất', rank: 1 },
  { id: 'pcat_catvesinh03', name: 'Cát vệ sinh', handle: 'cat-ve-sinh', description: 'Cát đậu nành & bentonite vón cục khử mùi', rank: 2 },
  { id: 'pcat_phukien04', name: 'Phụ kiện & Đồ chơi', handle: 'phu-kien', description: 'Đồ chơi tương tác, bàn cào móng và phụ kiện', rank: 3 },
];

async function ensureSeedCategories() {
  const countRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM product_category WHERE deleted_at IS NULL');
  if (countRes.rows[0]?.cnt === 0) {
    for (const c of DEFAULT_CATEGORIES) {
      await pool.query(
        `INSERT INTO product_category (id, name, description, handle, mpath, is_active, is_internal, rank, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, true, false, $6, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING`,
        [c.id, c.name, c.description, c.handle, `${c.id}.`, c.rank]
      );
    }
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    await ensureSeedCategories();
    const res = await pool.query(
      `SELECT id, name, description, handle, is_active, rank, created_at
       FROM product_category
       WHERE deleted_at IS NULL
       ORDER BY rank ASC, created_at DESC`
    );
    return NextResponse.json({ categories: res.rows }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ categories: [], error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ success: false, error: 'Thiếu tên danh mục' }, { status: 400, headers: corsHeaders });
    }
    const id = `pcat_${Date.now()}`;
    const handle =
      body.handle ||
      body.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const res = await pool.query(
      `INSERT INTO product_category (id, name, description, handle, mpath, is_active, is_internal, rank, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, $7, NOW(), NOW())
       RETURNING id, name, description, handle, is_active, rank, created_at`,
      [id, body.name, body.description || '', handle, `${id}.`, body.is_active !== false, Number(body.rank || 0)]
    );
    return NextResponse.json({ success: true, category: res.rows[0] }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID danh mục' }, { status: 400, headers: corsHeaders });
    }
    const res = await pool.query(
      `UPDATE product_category
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           handle = COALESCE($4, handle),
           is_active = COALESCE($5, is_active),
           rank = COALESCE($6, rank),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, description, handle, is_active, rank, created_at`,
      [body.id, body.name, body.description, body.handle, body.is_active, body.rank !== undefined ? Number(body.rank) : null]
    );
    return NextResponse.json({ success: true, category: res.rows[0] }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID danh mục' }, { status: 400, headers: corsHeaders });
    }
    await pool.query('DELETE FROM product_category WHERE id = $1', [id]);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
