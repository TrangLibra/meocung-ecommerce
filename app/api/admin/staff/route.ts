import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import crypto from 'crypto';

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
    const res = await pool.query(
      `SELECT id, email, role, login_attempts, lock_until, created_at, updated_at
       FROM users
       ORDER BY id ASC`
    );
    return NextResponse.json({ staff: res.rows }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ staff: [], error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Thiếu email nhân viên' }, { status: 400, headers: corsHeaders });
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(body.password || 'Admin@123', salt, 25000, 512, 'sha256').toString('hex');

    const res = await pool.query(
      `INSERT INTO users (email, role, salt, hash, login_attempts, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 0, NOW(), NOW())
       RETURNING id, email, role, login_attempts, lock_until, created_at`,
      [email, body.role || 'editor', salt, hash]
    );
    return NextResponse.json({ success: true, staff: res.rows[0] }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID nhân viên' }, { status: 400, headers: corsHeaders });
    }
    const res = await pool.query(
      `UPDATE users
       SET role = COALESCE($2, role),
           login_attempts = CASE WHEN $3::boolean = true THEN 0 ELSE login_attempts END,
           lock_until = CASE WHEN $3::boolean = true THEN NULL ELSE lock_until END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, role, login_attempts, lock_until, created_at`,
      [body.id, body.role || null, body.unlock === true]
    );
    return NextResponse.json({ success: true, staff: res.rows[0] }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID nhân viên' }, { status: 400, headers: corsHeaders });
    }
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
