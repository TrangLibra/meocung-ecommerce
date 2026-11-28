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

const DEFAULT_ROLES = [
  {
    code: 'admin',
    name: 'Super Admin (Toàn quyền)',
    description: 'Toàn quyền quản trị hệ thống, sản phẩm, đơn hàng, nhân sự & giao diện web',
    permissions: {
      products: { view: true, create: true, edit: true, delete: true },
      inventory: { view: true, create: true, edit: true, delete: true },
      orders: { view: true, create: true, edit: true, delete: true },
      customers: { view: true, create: true, edit: true, delete: true },
      posts: { view: true, create: true, edit: true, delete: true },
      theme: { view: true, create: true, edit: true, delete: true },
      staff: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: true, edit: true, delete: true },
    },
  },
  {
    code: 'warehouse_manager',
    name: 'Quản Lý Kho & Sản Phẩm',
    description: 'Quản lý danh mục, sản phẩm, nhập xuất tồn kho và bảng giá',
    permissions: {
      products: { view: true, create: true, edit: true, delete: false },
      inventory: { view: true, create: true, edit: true, delete: false },
      orders: { view: true, create: false, edit: true, delete: false },
      customers: { view: false, create: false, edit: false, delete: false },
      posts: { view: false, create: false, edit: false, delete: false },
      theme: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    code: 'editor',
    name: 'Biên Tập Viên (PayloadCMS)',
    description: 'Viết bài cẩm nang, đăng banner quảng cáo, tạo voucher & chỉnh nội dung web',
    permissions: {
      products: { view: true, create: false, edit: false, delete: false },
      inventory: { view: false, create: false, edit: false, delete: false },
      orders: { view: false, create: false, edit: false, delete: false },
      customers: { view: false, create: false, edit: false, delete: false },
      posts: { view: true, create: true, edit: true, delete: true },
      theme: { view: true, create: true, edit: true, delete: false },
    },
  },
  {
    code: 'order_staff',
    name: 'Nhân Viên Xử Lý Đơn',
    description: 'Xem & xác nhận đơn hàng, cập nhật mã vận đơn và chăm sóc khách hàng',
    permissions: {
      products: { view: true, create: false, edit: false, delete: false },
      inventory: { view: true, create: false, edit: false, delete: false },
      orders: { view: true, create: true, edit: true, delete: false },
      customers: { view: true, create: false, edit: true, delete: false },
      posts: { view: false, create: false, edit: false, delete: false },
      theme: { view: false, create: false, edit: false, delete: false },
    },
  },
];

let rolesReady = false;
async function ensureRolesTable() {
  if (rolesReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_roles (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  const cnt = await pool.query('SELECT COUNT(*)::int AS cnt FROM admin_roles');
  if (cnt.rows[0]?.cnt === 0) {
    for (const r of DEFAULT_ROLES) {
      await pool.query(
        `INSERT INTO admin_roles (code, name, description, permissions) VALUES ($1, $2, $3, $4::jsonb) ON CONFLICT (code) DO NOTHING`,
        [r.code, r.name, r.description, JSON.stringify(r.permissions)]
      );
    }
  }
  rolesReady = true;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    await ensureRolesTable();
    const res = await pool.query('SELECT * FROM admin_roles ORDER BY id ASC');
    return NextResponse.json({ roles: res.rows }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ roles: [], error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureRolesTable();
    const body = await request.json();
    const code = String(body.code || `role_${Date.now()}`).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const res = await pool.query(
      `INSERT INTO admin_roles (code, name, description, permissions, created_at, updated_at)
       VALUES ($1, $2, $3, $4::jsonb, NOW(), NOW())
       RETURNING *`,
      [code, body.name || 'Vai trò mới', body.description || '', JSON.stringify(body.permissions || DEFAULT_ROLES[3].permissions)]
    );
    return NextResponse.json({ success: true, role: res.rows[0] }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureRolesTable();
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID vai trò' }, { status: 400, headers: corsHeaders });
    }
    const res = await pool.query(
      `UPDATE admin_roles
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           permissions = COALESCE($4::jsonb, permissions),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [body.id, body.name || null, body.description !== undefined ? body.description : null, body.permissions ? JSON.stringify(body.permissions) : null]
    );
    return NextResponse.json({ success: true, role: res.rows[0] }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureRolesTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Thiếu ID vai trò' }, { status: 400, headers: corsHeaders });
    }
    await pool.query('DELETE FROM admin_roles WHERE id = $1', [id]);
    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
