import { NextResponse } from 'next/server';
import { createNeonOrder, listNeonOrders, type OrderStatus } from '@/lib/neon-orders';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const status = searchParams.get('status') || undefined;
    const orders = await listNeonOrders({ q, status });
    return NextResponse.json(
      { orders, count: orders.length },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Không thể tải danh sách đơn hàng từ Neon.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const subtotal = items.reduce(
      (sum: number, it: any) => sum + Number(it.price || 0) * Number(it.quantity || 1),
      0
    );
    const shippingFee = Number(body.shipping_fee || 0);
    const discountAmount = Number(body.discount_amount || 0);
    const grandTotal = Math.max(0, subtotal + shippingFee - discountAmount);
    const orderCode =
      body.order_code ||
      `DRF-${Date.now().toString().slice(-6)}`;

    const order = await createNeonOrder({
      orderCode,
      name: String(body.customer_name || 'Khách tại quầy'),
      email: String(body.customer_email || ''),
      phone: String(body.customer_phone || '0000000000'),
      address: String(body.shipping_address || 'Nhận tại cửa hàng'),
      note: body.note ? String(body.note) : undefined,
      internalNote: body.internal_note ? String(body.internal_note) : undefined,
      status: (body.status as OrderStatus) || 'draft',
      items,
      subtotal,
      shippingFee,
      grandTotal,
    });
    return NextResponse.json({ order }, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Không thể tạo đơn nháp.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
