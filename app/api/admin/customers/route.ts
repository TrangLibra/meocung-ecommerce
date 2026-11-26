import { NextResponse } from 'next/server';
import { createNeonUser, listNeonUsers } from '@/lib/neon-users';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const statusParam = searchParams.get('status');
    const status =
      statusParam === 'active' || statusParam === 'blocked' ? statusParam : undefined;

    const users = await listNeonUsers({ q, status });
    return NextResponse.json(
      { users, count: users.length },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Không thể tải danh sách khách hàng từ Neon.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;
    const password = typeof body.password === 'string' ? body.password : '';
    const status = body.status === 'blocked' ? 'blocked' : 'active';

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự).' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const user = await createNeonUser({
      name,
      email,
      phone,
      password,
      status,
      source: 'admin',
    });

    return NextResponse.json({ user }, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    if (err?.message === 'EMAIL_ALREADY_EXISTS') {
      return NextResponse.json(
        { error: 'Email này đã tồn tại trên Neon.' },
        { status: 409, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json(
      { error: 'Không thể tạo tài khoản khách hàng.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
