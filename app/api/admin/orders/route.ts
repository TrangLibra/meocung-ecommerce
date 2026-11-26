import { NextResponse } from 'next/server';
import { listNeonOrders } from '@/lib/neon-orders';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
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
