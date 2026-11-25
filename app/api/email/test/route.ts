import { NextResponse } from 'next/server';
import { sendEmailWithSendGrid } from '@/lib/email';

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

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

  const to = typeof body.to === 'string' ? body.to.trim() : '';
  const subject =
    typeof body.subject === 'string' && body.subject.trim()
      ? body.subject.trim()
      : 'Test gửi Gmail từ Mèo Cưng qua SendGrid 🐱';
  const text =
    typeof body.text === 'string' && body.text.trim()
      ? body.text.trim()
      : 'Xin chào! Đây là email kiểm tra gửi từ ứng dụng Mèo Cưng thông qua SendGrid.';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!to || !emailRegex.test(to)) {
    return NextResponse.json(
      { error: 'Vui lòng truyền địa chỉ email nhận hợp lệ (to).' },
      { status: 400 }
    );
  }

  const result = await sendEmailWithSendGrid({ to, subject, text });
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Không thể gửi email kiểm tra. Vui lòng kiểm tra cấu hình SendGrid.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, to });
}
