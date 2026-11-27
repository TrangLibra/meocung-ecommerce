import { NextResponse } from 'next/server';
import { deleteNeonProduct, upsertNeonProduct } from '@/lib/neon-products';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
    const product = await upsertNeonProduct({ ...body, id: params.id });
    return NextResponse.json({ product }, { status: 200, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Không thể cập nhật sản phẩm.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteNeonProduct(params.id);
    return NextResponse.json(
      { id: params.id, deleted },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: 'Không thể xóa sản phẩm.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
