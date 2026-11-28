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

async function ensureSeedCollections() {
  const countRes = await pool.query('SELECT COUNT(*)::int AS cnt FROM product_collection WHERE deleted_at IS NULL');
  if (countRes.rows[0]?.cnt === 0) {
    await pool.query(
      `INSERT INTO product_collection (id, title, handle, created_at, updated_at)
       VALUES
         ('pcol_bestseller01', 'Sản Phẩm Bán Chạy Nhất', 'ban-chay', NOW(), NOW()),
         ('pcol_combo02', 'Combo Tiết Kiệm Cho Mèo', 'combo-tiet-kiem', NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    await ensureSeedCollections();
    const res = await pool.query(
      `SELECT id, title, handle, created_at
       FROM product_collection
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );
    return NextResponse.json({ collections: res.rows }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ collections: [], error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ success: false, error: 'Thiếu tên bộ sưu tập' }, { status: 400, headers: corsHeaders });
    }
    const id = `pcol_${Date.now()}`;
    const handle =
      body.handle ||
      body.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const res = await pool.query(
      `INSERT INTO product_collection (id, title, handle, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, title, handle, created_at`,
      [id, body.title, handle]
    );
    return NextResponse.json({ success: true, collection: res.rows[0] }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID bộ sưu tập' }, { status: 400, headers: corsHeaders });
    }
    const res = await pool.query(
      `UPDATE product_collection
       SET title = COALESCE($2, title),
           handle = COALESCE($3, handle),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, handle, created_at`,
      [body.id, body.title, body.handle]
    );
    return NextResponse.json({ success: true, collection: res.rows[0] }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID bộ sưu tập' }, { status: 400, headers: corsHeaders });
    }
    await pool.query('DELETE FROM product_collection WHERE id = $1', [id]);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
