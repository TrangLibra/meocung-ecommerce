import { NextResponse } from 'next/server';
import {
  clearPendingCookie,
  deletePendingRegistration,
  getPendingFromCookie,
  getPendingRegistration,
  incrementPendingAttempts,
  setPendingCookie,
  setSessionCookie,
  verifyPendingCode,
} from '@/lib/auth';
import {
  createNeonUser,
  findNeonUserByEmail,
  neonCustomerToPublicUser,
} from '@/lib/neon-users';

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

  const existing = await findNeonUserByEmail(email);
  if (existing) {
    return NextResponse.json(
      { error: 'Tài khoản này đã được xác thực. Vui lòng đăng nhập.' },
      { status: 409 }
    );
  }

  const pending = getPendingFromCookie(email) || getPendingRegistration(email);
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
    const attempts = (pending.attempts || 0) + 1;
    incrementPendingAttempts(email);
    if (attempts >= MAX_OTP_ATTEMPTS) {
      deletePendingRegistration(email);
      clearPendingCookie();
      return NextResponse.json(
        { error: 'Bạn đã nhập sai mã quá 5 lần. Vui lòng đăng ký lại để nhận mã mới.' },
        { status: 429 }
      );
    }
    setPendingCookie({ ...pending, attempts });
    return NextResponse.json(
      { error: `Mã xác thực không chính xác (còn ${MAX_OTP_ATTEMPTS - attempts} lần thử).` },
      { status: 400 }
    );
  }

  // Lưu tài khoản & mật khẩu (đã hash scrypt) trực tiếp vào bảng public.users trên Neon PostgreSQL
  const created = await createNeonUser({
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    passwordHash: pending.passwordHash,
    source: 'customer',
  });

  deletePendingRegistration(pending.email);
  clearPendingCookie();
  const publicUser = neonCustomerToPublicUser(created);
  setSessionCookie(publicUser);

  return NextResponse.json({ user: publicUser }, { status: 201 });
}
