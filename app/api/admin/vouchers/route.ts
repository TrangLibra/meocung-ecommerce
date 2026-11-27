import { NextResponse } from 'next/server';
import { createNeonVoucher, listNeonVouchers, type VoucherType } from '@/lib/neon-vouchers';

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
    const type = searchParams.get('type') || undefined;
    const vouchers = await listNeonVouchers({ q, type });
    return NextResponse.json(
      { vouchers, count: vouchers.length },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Không thể tải danh sách voucher từ Neon.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const type = (body.type === 'fixed' || body.type === 'freeship' ? body.type : 'percent') as VoucherType;

    if (!code || code.length < 3) {
      return NextResponse.json(
        { error: 'Mã voucher phải có ít nhất 3 ký tự.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const voucher = await createNeonVoucher({
      code,
      title,
      type,
      discount_value: body.discount_value,
      min_order: body.min_order,
      max_uses: body.max_uses,
      expires_at: body.expires_at,
      is_active: body.is_active !== false,
    });

    return NextResponse.json({ voucher }, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    if (err?.message === 'CODE_ALREADY_EXISTS') {
      return NextResponse.json(
        { error: 'Mã voucher này đã tồn tại trên Neon.' },
        { status: 409, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json(
      { error: 'Không thể tạo voucher mới.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
