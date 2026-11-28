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
    const res = await pool.query('SELECT * FROM reviews ORDER BY id DESC');
    return NextResponse.json({ reviews: res.rows }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ reviews: [], error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await pool.query(
      `INSERT INTO reviews (reviewer_name, rating, comment, is_approved, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())
       RETURNING *`,
      [
        body.reviewer_name || 'Khách hàng',
        Number(body.rating || 5),
        body.comment || '',
        body.is_approved !== false,
      ]
    );
    return NextResponse.json({ success: true, review: res.rows[0] }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID đánh giá' }, { status: 400, headers: corsHeaders });
    }
    const res = await pool.query(
      `UPDATE reviews
       SET reviewer_name = COALESCE($2, reviewer_name),
           rating = COALESCE($3, rating),
           comment = COALESCE($4, comment),
           is_approved = COALESCE($5, is_approved),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [body.id, body.reviewer_name, body.rating !== undefined ? Number(body.rating) : null, body.comment, body.is_approved]
    );
    return NextResponse.json({ success: true, review: res.rows[0] }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID đánh giá' }, { status: 400, headers: corsHeaders });
    }
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
