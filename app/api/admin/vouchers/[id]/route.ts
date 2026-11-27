import { NextResponse } from 'next/server';
import { deleteNeonVoucher, updateNeonVoucher, type VoucherType } from '@/lib/neon-vouchers';

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
    const updated = await updateNeonVoucher(params.id, {
      code: typeof body.code === 'string' ? body.code : undefined,
      title: typeof body.title === 'string' ? body.title : undefined,
      type:
        body.type === 'percent' || body.type === 'fixed' || body.type === 'freeship'
          ? (body.type as VoucherType)
          : undefined,
      discount_value: body.discount_value,
      min_order: body.min_order,
      max_uses: body.max_uses,
      expires_at: body.expires_at,
      is_active: typeof body.is_active === 'boolean' ? body.is_active : undefined,
      applicable_products: Array.isArray(body.applicable_products)
        ? body.applicable_products
        : undefined,
    });
    if (!updated) {
      return NextResponse.json(
        { error: 'Không tìm thấy voucher.' },
        { status: 404, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json({ voucher: updated }, { status: 200, headers: CORS_HEADERS });
  } catch (err: any) {
    if (err?.message === 'CODE_ALREADY_EXISTS') {
      return NextResponse.json(
        { error: 'Mã voucher này đã tồn tại.' },
        { status: 409, headers: CORS_HEADERS }
      );
    }
    return NextResponse.json(
      { error: 'Không thể cập nhật voucher.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deleteNeonVoucher(params.id);
    return NextResponse.json(
      { id: params.id, deleted },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: 'Không thể xóa voucher.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
