import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS, Product } from '@/lib/products';

export const dynamic = 'force-dynamic';

// Bộ nhớ in-memory fallback trên serverless instance
let serverProducts: Product[] = [...PRODUCTS];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get('handle') || searchParams.get('slug');

  if (handle) {
    const product = serverProducts.find(p => p.slug === handle || p.id === handle);
    return NextResponse.json({
      product: product || null,
      products: product ? [product] : []
    });
  }

  return NextResponse.json({
    products: serverProducts,
    count: serverProducts.length,
    offset: 0,
    limit: serverProducts.length
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.name) {
      return NextResponse.json({ success: false, message: 'Thiếu tên sản phẩm' }, { status: 400 });
    }

    const newProduct: Product = {
      id: body.id || `p_${Date.now()}`,
      name: body.name,
      slug: body.slug || `san-pham-${Date.now()}`,
      categorySlug: body.categorySlug || 'thuc-an-hat',
      categoryName: body.categoryName || 'Thức ăn hạt',
      price: Number(body.price) || 100000,
      originalPrice: body.originalPrice ? Number(body.originalPrice) : undefined,
      image: body.image || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
      rating: 5.0,
      soldCount: Number(body.soldCount) || 0,
      weight: body.weight || '1kg',
      inStock: body.inStock !== false,
      description: body.description || ''
    };

    serverProducts = [newProduct, ...serverProducts];
    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.id) {
      return NextResponse.json({ success: false, message: 'Thiếu ID sản phẩm' }, { status: 400 });
    }

    serverProducts = serverProducts.map(p => p.id === body.id ? { ...p, ...body } : p);
    return NextResponse.json({ success: true, message: 'Đã cập nhật sản phẩm' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, message: 'Thiếu ID cần xóa' }, { status: 400 });
  }

  serverProducts = serverProducts.filter(p => p.id !== id);
  return NextResponse.json({ success: true, message: 'Đã xóa sản phẩm' });
}
