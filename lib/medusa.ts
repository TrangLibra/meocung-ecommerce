import { Product, PRODUCTS } from './products';

export const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || 'https://quan-ly-khach-san-if4s.onrender.com';

export const MEDUSA_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || 'pk_test_meocung_shop_2026';

export interface MedusaProductVariant {
  id: string;
  title: string;
  prices: {
    amount: number;
    currency_code: string;
  }[];
}

export interface MedusaCartItem {
  id: string;
  title: string;
  thumbnail?: string;
  quantity: number;
  unit_price: number;
  variant: MedusaProductVariant;
}

export interface MedusaCart {
  id: string;
  items: MedusaCartItem[];
  subtotal: number;
  total: number;
  currency_code: string;
}

/**
 * Lấy danh sách sản phẩm từ Medusa Store API (có fallback về mock PRODUCTS hạt & pate)
 */
export async function getMedusaProducts(limit = 12): Promise<Product[]> {
  // 1. Ưu tiên lấy từ LocalStorage nếu đang chạy trên Client (Realtime live edits của Mentor)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('gh_admin_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
  }

  // 2. Gọi API Route nội bộ Medusa Engine trên Vercel
  try {
    const host = typeof window !== 'undefined' ? window.location.origin : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${host}/api/medusa/products`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.products) && data.products.length > 0) {
        return data.products;
      }
    }
  } catch (_) {}

  // 3. Fallback sang Medusa Backend độc lập hoặc Mock PRODUCTS
  return PRODUCTS;
}

/**
 * Lấy chi tiết sản phẩm theo Handle/Slug từ Medusa
 */
export async function getMedusaProductByHandle(handle: string): Promise<Product | null> {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/products?handle=${handle}`, {
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
        'Content-Type': 'application/json'
      },
      next: { revalidate: 60 }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        const p = data.products[0];
        return {
          id: p.id,
          name: p.title,
          slug: p.handle,
          categorySlug: (p.categories?.[0]?.handle as any) || 'thuc-an-hat',
          categoryName: p.categories?.[0]?.name || 'Thức ăn hạt',
          price: p.variants?.[0]?.prices?.[0]?.amount || 185000,
          originalPrice: (p.variants?.[0]?.prices?.[0]?.amount || 185000) * 1.15,
          image: p.thumbnail || p.images?.[0]?.url || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
          rating: 4.9,
          soldCount: 1200,
          weight: '2kg',
          inStock: true,
          description: p.description
        };
      }
    }
  } catch (err) {
    console.warn(`[MedusaJS] Fallback sản phẩm ${handle}:`, err);
  }

  const local = PRODUCTS.find(p => p.slug === handle || p.id === handle);
  return local || null;
}

/**
 * Tạo giỏ hàng mới trong Medusa Cart API
 */
export async function createMedusaCart(): Promise<MedusaCart> {
  try {
    const res = await fetch(`${MEDUSA_BACKEND_URL}/store/carts`, {
      method: 'POST',
      headers: {
        'x-publishable-api-key': MEDUSA_PUBLISHABLE_KEY,
        'Content-Type': 'application/json'
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.cart;
    }
  } catch (err) {
    console.warn('[MedusaJS] Tạo cart thất bại, dùng local cart fallback:', err);
  }

  return {
    id: `cart_${Date.now()}`,
    items: [],
    subtotal: 0,
    total: 0,
    currency_code: 'vnd'
  };
}
