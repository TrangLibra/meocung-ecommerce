import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';
import {
  authenticateNeonUser,
  neonCustomerToPublicUser,
} from '@/lib/neon-users';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ email và mật khẩu.' },
        { status: 400 }
      );
    }

    const result = await authenticateNeonUser(email, password);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    const publicUser = neonCustomerToPublicUser(result.user);
    setSessionCookie(publicUser);

    return NextResponse.json({ user: publicUser });
  } catch {
    return NextResponse.json(
      { error: 'Không thể xử lý yêu cầu đăng nhập. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
