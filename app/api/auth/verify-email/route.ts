import { NextResponse } from 'next/server';
import {
  createUserFromPending,
  findUserByEmail,
  getPendingRegistration,
  setSessionCookie,
  toPublicUser,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!email || !code) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ email và mã xác thực.' },
        { status: 400 }
      );
    }

    if (findUserByEmail(email)) {
      return NextResponse.json(
        { error: 'Tài khoản này đã được xác thực. Vui lòng đăng nhập.' },
        { status: 409 }
      );
    }

    const pending = getPendingRegistration(email);
    if (!pending) {
      return NextResponse.json(
        { error: 'Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.' },
        { status: 404 }
      );
    }

    if (Date.now() > pending.expiresAt) {
      return NextResponse.json(
        { error: 'Mã xác thực đã hết hạn. Vui lòng bấm "Gửi lại mã".' },
        { status: 400 }
      );
    }

    if (pending.code !== code) {
      return NextResponse.json(
        { error: 'Mã xác thực không chính xác. Vui lòng kiểm tra lại Gmail.' },
        { status: 400 }
      );
    }

    const created = createUserFromPending(pending);
    const publicUser = toPublicUser(created);
    setSessionCookie(publicUser);

    return NextResponse.json({ user: publicUser }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Không thể xác thực tài khoản. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
