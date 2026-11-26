import { NextResponse } from 'next/server';
import {
  findUserByEmailAsync,
  setSessionCookie,
  toPublicUser,
  verifyPassword,
} from '@/lib/auth';

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

    const user = await findUserByEmailAsync(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    const publicUser = toPublicUser(user);
    setSessionCookie(publicUser);

    return NextResponse.json({ user: publicUser });
  } catch {
    return NextResponse.json(
      { error: 'Không thể xử lý yêu cầu đăng nhập. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
