import { NextResponse } from 'next/server';
import { deleteNeonUser, updateNeonUser } from '@/lib/neon-users';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    if (typeof body.password === 'string' && body.password.length > 0 && body.password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const updated = await updateNeonUser(params.id, {
      name: typeof body.name === 'string' ? body.name : undefined,
      email: typeof body.email === 'string' ? body.email : undefined,
      phone: body.phone !== undefined ? body.phone : undefined,
      status:
        body.status === 'active' || body.status === 'blocked' ? body.status : undefined,
      password: typeof body.password === 'string' && body.password ? body.password : undefined,
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản.' },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json({ user: updated }, { status: 200, headers: CORS_HEADERS });
  } catch (err: any) {
    if (err?.message === 'EMAIL_ALREADY_EXISTS') {
      return NextResponse.json(
        { error: 'Email này đã được sử dụng bởi tài khoản khác.' },
        { status: 409, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json(
      { error: 'Không thể cập nhật tài khoản.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteNeonUser(params.id);
    return NextResponse.json(
      { id: params.id, deleted },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: 'Không thể xóa tài khoản.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
