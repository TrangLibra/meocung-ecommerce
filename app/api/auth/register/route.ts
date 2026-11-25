import { NextResponse } from 'next/server';
import {
  findUserByEmail,
  savePendingRegistration,
  setPendingCookie,
} from '@/lib/auth';
import { sendVerificationCodeEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: 'Vui lòng nhập họ và tên (tối thiểu 2 ký tự).' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email không hợp lệ.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự.' },
        { status: 400 }
      );
    }

    if (findUserByEmail(email)) {
      return NextResponse.json(
        { error: 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác.' },
        { status: 409 }
      );
    }

    const pending = savePendingRegistration({ name, email, phone, password });
    setPendingCookie(pending);
    const emailResult = await sendVerificationCodeEmail({
      name: pending.name,
      email: pending.email,
      code: pending.code,
    });

    if (!emailResult.ok) {
      return NextResponse.json(
        {
          error: emailResult.skipped
            ? 'Hệ thống chưa cấu hình SendGrid (SENDGRID_API_KEY / SENDGRID_FROM_EMAIL) trong .env.local.'
            : `Không thể gửi mã xác thực tới Gmail: ${emailResult.error}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        requiresVerification: true,
        email: pending.email,
        message: 'Mã xác thực 6 chữ số đã được gửi tới Gmail của bạn.',
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Không thể xử lý yêu cầu đăng ký. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
