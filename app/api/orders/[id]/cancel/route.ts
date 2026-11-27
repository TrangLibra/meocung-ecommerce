import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { cancelNeonOrderByCustomer } from '@/lib/neon-orders';
import { adjustNeonProductStock } from '@/lib/neon-products';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const sessionUser = getSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { error: 'Vui lòng đăng nhập để hủy đơn hàng.' },
      { status: 401 }
    );
  }

  try {
    const result = await cancelNeonOrderByCustomer(params.id, {
      id: sessionUser.id,
      email: sessionUser.email,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    // Tự động hoàn lại tồn kho khi khách hủy đơn
    await adjustNeonProductStock(result.order.items || [], 'restore').catch(() => {});
    return NextResponse.json({ ok: true, order: result.order }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: 'Không thể hủy đơn hàng. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
