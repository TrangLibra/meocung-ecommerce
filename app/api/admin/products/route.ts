import { NextResponse } from 'next/server';
import { listNeonProducts, upsertNeonProduct } from '@/lib/neon-products';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const products = await listNeonProducts();
    return NextResponse.json(
      { products, count: products.length },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Không thể tải danh sách sản phẩm từ Neon.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Vui lòng nhập tên sản phẩm.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    const product = await upsertNeonProduct(body);
    return NextResponse.json({ product }, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Không thể lưu sản phẩm lên Neon.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
