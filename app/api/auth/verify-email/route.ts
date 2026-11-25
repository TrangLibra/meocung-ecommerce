import { NextResponse } from 'next/server';
import {
  createUserFromPending,
  deletePendingRegistration,
  findUserByEmail,
  getPendingRegistration,
  incrementPendingAttempts,
  setSessionCookie,
  toPublicUser,
  verifyPendingCode,
} from '@/lib/auth';

const MAX_OTP_ATTEMPTS = 5;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    }
    body = parsed;
  } catch {
    return NextResponse.json({ error: 'JSON không hợp lệ.' }, { status: 400 });
  }

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

  if (!verifyPendingCode(pending.code, code)) {
    const attempts = incrementPendingAttempts(email);
    if (attempts >= MAX_OTP_ATTEMPTS) {
      deletePendingRegistration(email);
      return NextResponse.json(
        { error: 'Bạn đã nhập sai mã quá 5 lần. Vui lòng đăng ký lại để nhận mã mới.' },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: `Mã xác thực không chính xác (còn ${MAX_OTP_ATTEMPTS - attempts} lần thử).` },
      { status: 400 }
    );
  }

  const created = createUserFromPending(pending);
  const publicUser = toPublicUser(created);
  setSessionCookie(publicUser);

  return NextResponse.json({ user: publicUser }, { status: 201 });
}
