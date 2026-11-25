import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { sendOrderConfirmationEmail, OrderEmailItem } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sessionUser = getSessionUser();

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email =
      (typeof body.email === 'string' ? body.email.trim().toLowerCase() : '') ||
      sessionUser?.email ||
      '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim() : '';
    const items: OrderEmailItem[] = Array.isArray(body.items) ? body.items : [];
    const totalPrice = Number(body.totalPrice) || 0;
    const shippingFee = Number(body.shippingFee) || 0;
    const grandTotal = Number(body.grandTotal) || totalPrice + shippingFee;

    if (!name || !phone || !address) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.' },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Giỏ hàng đang trống.' },
        { status: 400 }
      );
    }

    const orderCode = `MC${Date.now().toString().slice(-6)}`;

    let emailSent = false;
    if (email) {
      const emailResult = await sendOrderConfirmationEmail({
        orderCode,
        name,
        email,
        phone,
        address,
        note,
        items,
        totalPrice,
        shippingFee,
        grandTotal,
      });
      emailSent = emailResult.ok;
    }

    return NextResponse.json(
      {
        ok: true,
        orderCode,
        email,
        emailSent,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Không thể xử lý đơn hàng. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
