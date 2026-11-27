import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { sendOrderConfirmationEmail, OrderEmailItem } from '@/lib/email';
import { createNeonOrder, listNeonOrdersByCustomer } from '@/lib/neon-orders';
import { saveNeonUserAddress } from '@/lib/neon-users';

export async function GET() {
  const sessionUser = getSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { error: 'Vui lòng đăng nhập để xem đơn hàng.' },
      { status: 401 }
    );
  }
  try {
    const orders = await listNeonOrdersByCustomer({
      id: sessionUser.id,
      email: sessionUser.email,
    });
    return NextResponse.json({ orders, count: orders.length });
  } catch {
    return NextResponse.json(
      { error: 'Không thể tải danh sách đơn hàng.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const sessionUser = getSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { error: 'Vui lòng đăng nhập để đặt hàng.' },
      { status: 401 }
    );
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

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email =
    (typeof body.email === 'string' ? body.email.trim().toLowerCase() : '') ||
    sessionUser.email;
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const note = typeof body.note === 'string' ? body.note.trim() : '';
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (!name || !phone || !address) {
    return NextResponse.json(
      { error: 'Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.' },
      { status: 400 }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Địa chỉ email không hợp lệ.' },
      { status: 400 }
    );
  }

  const items: OrderEmailItem[] = [];
  for (const item of rawItems) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const itemName = typeof rec.name === 'string' ? rec.name.trim() : '';
    const quantity = Number(rec.quantity);
    const price = Number(rec.price);
    if (
      !itemName ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        { error: 'Danh sách sản phẩm trong đơn hàng không hợp lệ.' },
        { status: 400 }
      );
    }
    items.push({ name: itemName, quantity, price });
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: 'Giỏ hàng đang trống.' },
      { status: 400 }
    );
  }

  // Recompute totals server-side
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = totalPrice >= 300000 ? 0 : 25000;
  const grandTotal = totalPrice + shippingFee;

  const orderCode = `MC${Date.now().toString().slice(-6)}`;

  // Lưu đơn hàng trực tiếp vào Neon PostgreSQL
  const savedOrder = await createNeonOrder({
    orderCode,
    userId: sessionUser.id,
    name,
    email,
    phone,
    address,
    note,
    items,
    subtotal: totalPrice,
    shippingFee,
    grandTotal,
  });

  // Lưu lại địa chỉ giao hàng vào tài khoản khách hàng trên Neon
  await saveNeonUserAddress({
    id: sessionUser.id,
    email,
    address,
    phone,
  }).catch(() => {});

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
      orderId: savedOrder.id,
      orderCode,
      email,
      emailSent,
    },
    { status: 201 }
  );
}
