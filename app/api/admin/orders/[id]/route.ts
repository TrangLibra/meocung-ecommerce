import { NextResponse } from 'next/server';
import { deleteNeonOrder, updateNeonOrder, type OrderStatus } from '@/lib/neon-orders';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await updateNeonOrder(params.id, {
      status: body.status as OrderStatus | undefined,
      tracking_code: body.tracking_code,
    });
    if (!updated) {
      return NextResponse.json(
        { error: 'Không tìm thấy đơn hàng.' },
        { status: 404, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json({ order: updated }, { status: 200, headers: CORS_HEADERS });
  } catch {
    return NextResponse.json(
      { error: 'Không thể cập nhật đơn hàng.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteNeonOrder(params.id);
    return NextResponse.json(
      { id: params.id, deleted },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: 'Không thể xóa đơn hàng.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
