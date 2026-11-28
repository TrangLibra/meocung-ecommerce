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
  'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const FULL_PERMISSIONS = {
  products: { view: true, create: true, edit: true, delete: true },
  inventory: { view: true, create: true, edit: true, delete: true },
  orders: { view: true, create: true, edit: true, delete: true },
  customers: { view: true, create: true, edit: true, delete: true },
  posts: { view: true, create: true, edit: true, delete: true },
  theme: { view: true, create: true, edit: true, delete: true },
  staff: { view: true, create: true, edit: true, delete: true },
  settings: { view: true, create: true, edit: true, delete: true },
};

function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  if (!salt || !expectedHash) return false;
  const derived = crypto.pbkdf2Sync(password, salt, 25000, 512, 'sha256').toString('hex');
  return derived === expectedHash;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập Email và Mật khẩu' }, { status: 400, headers: corsHeaders });
    }

    const res = await pool.query(
      `SELECT id, email, role, hash, salt, lock_until FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [email]
    );

    const user = res.rows[0];
    if (!user) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401, headers: corsHeaders });
    }

    if (user.role === 'customer') {
      return NextResponse.json({ error: 'Tài khoản khách hàng không có quyền truy cập trang Quản trị' }, { status: 403, headers: corsHeaders });
    }

    if (user.lock_until && new Date(user.lock_until).getTime() > Date.now()) {
      return NextResponse.json({ error: 'Tài khoản đang bị tạm khóa' }, { status: 403, headers: corsHeaders });
    }

    if (!verifyPassword(password, user.salt, user.hash)) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng' }, { status: 401, headers: corsHeaders });
    }

    let roleName = user.role === 'admin' ? 'Quản trị viên (Super Admin)' : user.role;
    let permissions = user.role === 'admin' ? FULL_PERMISSIONS : null;

    try {
      const roleRes = await pool.query(
        `SELECT name, permissions FROM admin_roles WHERE code = $1 LIMIT 1`,
        [user.role]
      );
      if (roleRes.rows[0]) {
        roleName = roleRes.rows[0].name;
        permissions = roleRes.rows[0].permissions;
      }
    } catch (_) {}

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          role_name: roleName,
          permissions: permissions || FULL_PERMISSIONS,
        },
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xác thực' }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const currentPassword = String(body.current_password || '');
    const newPassword = String(body.new_password || '');

    if (!email || !currentPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đúng mật khẩu hiện tại và mật khẩu mới tối thiểu 6 ký tự' },
        { status: 400, headers: corsHeaders }
      );
    }

    const res = await pool.query(
      `SELECT id, hash, salt FROM users WHERE LOWER(email) = $1 LIMIT 1`,
      [email]
    );
    const user = res.rows[0];
    if (!user || !verifyPassword(currentPassword, user.salt, user.hash)) {
      return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 401, headers: corsHeaders });
    }

    const nextSalt = crypto.randomBytes(32).toString('hex');
    const nextHash = crypto.pbkdf2Sync(newPassword, nextSalt, 25000, 512, 'sha256').toString('hex');
    await pool.query(`UPDATE users SET salt = $2, hash = $3, updated_at = NOW() WHERE id = $1`, [
      user.id,
      nextSalt,
      nextHash,
    ]);

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công' }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
