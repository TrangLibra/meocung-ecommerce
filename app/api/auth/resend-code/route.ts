import { NextResponse } from 'next/server';
import { refreshPendingCode } from '@/lib/auth';
import { sendVerificationCodeEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!email) {
      return NextResponse.json(
        { error: 'Thiếu địa chỉ email.' },
        { status: 400 }
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
        { error: emailResult.error || 'Không thể gửi lại mã xác thực.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Đã gửi lại mã xác thực mới tới Gmail của bạn.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Không thể gửi lại mã xác thực. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
