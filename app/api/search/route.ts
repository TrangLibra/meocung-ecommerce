import { NextResponse } from 'next/server';
import { searchProductsWithMeilisearch } from '@/lib/meilisearch';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const limit = Number(searchParams.get('limit')) || 6;

  try {
    const result = await searchProductsWithMeilisearch({
      query,
      category,
      limit,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: 'Không thể tìm kiếm sản phẩm lúc này.' },
      { status: 500 }
    );
  }
}
