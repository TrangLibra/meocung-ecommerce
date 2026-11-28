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

export async function GET() {
  try {
    const res = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
    return NextResponse.json({ coupons: res.rows }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ coupons: [], error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await pool.query(
      `INSERT INTO coupons (code, discount_percent, min_order_value, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [
        String(body.code || 'MEOCUNG').toUpperCase().trim(),
        Number(body.discount_percent || 10),
        Number(body.min_order_value || 0),
        body.is_active !== false,
      ]
    );
    return NextResponse.json({ success: true, coupon: res.rows[0] }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID coupon' }, { status: 400, headers: corsHeaders });
    }
    const res = await pool.query(
      `UPDATE coupons
       SET code = COALESCE($2, code),
           discount_percent = COALESCE($3, discount_percent),
           min_order_value = COALESCE($4, min_order_value),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        body.id,
        body.code ? String(body.code).toUpperCase().trim() : null,
        body.discount_percent !== undefined ? Number(body.discount_percent) : null,
        body.min_order_value !== undefined ? Number(body.min_order_value) : null,
        body.is_active,
      ]
    );
    return NextResponse.json({ success: true, coupon: res.rows[0] }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID coupon' }, { status: 400, headers: corsHeaders });
    }
    await pool.query('DELETE FROM coupons WHERE id = $1', [id]);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
