import { NextResponse } from 'next/server';
import { sendEmailWithSendGrid } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const to = typeof body.to === 'string' ? body.to.trim() : '';
    const subject =
      typeof body.subject === 'string' && body.subject.trim()
        ? body.subject.trim()
        : 'Test gửi Gmail từ Mèo Cưng qua SendGrid 🐱';
    const text =
      typeof body.text === 'string' && body.text.trim()
        ? body.text.trim()
        : 'Xin chào! Đây là email kiểm tra gửi từ ứng dụng Mèo Cưng thông qua SendGrid.';

    if (!to) {
      return NextResponse.json(
        { error: 'Vui lòng truyền địa chỉ email nhận (to).' },
        { status: 400 }
      );
    }

    const result = await sendEmailWithSendGrid({ to, subject, text });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, to });
  } catch {
    return NextResponse.json(
      { error: 'Không thể xử lý yêu cầu gửi email.' },
      { status: 500 }
    );
  }
}
