import { NextResponse } from 'next/server';
import { getPendingRegistration, refreshPendingCode } from '@/lib/auth';
import { sendVerificationCodeEmail } from '@/lib/email';

const RESEND_COOLDOWN_MS = 60 * 1000;

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

  if (!email) {
    return NextResponse.json(
      { error: 'Thiếu địa chỉ email.' },
      { status: 400 }
    );
  }

  const existing = getPendingRegistration(email);
  if (!existing) {
    return NextResponse.json(
      { error: 'Không tìm thấy phiên đăng ký cho email này. Vui lòng đăng ký lại.' },
      { status: 404 }
    );
  }

  if (existing.lastSentAt && Date.now() - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt)) / 1000);
    return NextResponse.json(
      { error: `Vui lòng đợi ${waitSec} giây trước khi gửi lại mã.` },
      { status: 429 }
    );
  }

  const updated = refreshPendingCode(email);
  if (!updated) {
    return NextResponse.json(
      { error: 'Không tìm thấy phiên đăng ký cho email này. Vui lòng đăng ký lại.' },
      { status: 404 }
    );
  }

  const emailResult = await sendVerificationCodeEmail({
    name: updated.name,
    email: updated.email,
    code: updated.code,
  });

  if (!emailResult.ok) {
    return NextResponse.json(
      { error: 'Không thể gửi lại mã xác thực lúc này. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Đã gửi lại mã xác thực mới tới Gmail của bạn.',
  });
}
