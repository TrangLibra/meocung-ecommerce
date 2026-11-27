'use client';

import { useEffect, useState } from 'react';
import type { Product } from './products';

export interface ActiveVoucher {
  id: string;
  code: string;
  title: string;
  type: 'percent' | 'fixed' | 'freeship';
  discount_value: number;
  min_order: number;
  expires_at: string | null;
  is_active: boolean;
  applicable_products: string[];
}

let cachedVouchers: ActiveVoucher[] | null = null;
let inflightPromise: Promise<ActiveVoucher[]> | null = null;

async function fetchActiveVouchersOnce(): Promise<ActiveVoucher[]> {
  if (cachedVouchers) return cachedVouchers;
  if (!inflightPromise) {
    inflightPromise = fetch('/api/admin/vouchers', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { vouchers: [] }))
      .then((data) => {
        const now = Date.now();
        const list: ActiveVoucher[] = (Array.isArray(data?.vouchers) ? data.vouchers : []).filter(
          (v: ActiveVoucher) =>
            v.is_active !== false &&
            v.type !== 'freeship' &&
            (!v.expires_at || new Date(v.expires_at).getTime() > now)
        );
        cachedVouchers = list;
        return list;
      })
      .catch(() => []);
  }
  return inflightPromise;
}

export function useActiveVouchers(): ActiveVoucher[] {
  const [vouchers, setVouchers] = useState<ActiveVoucher[]>(cachedVouchers || []);

  useEffect(() => {
    let mounted = true;
    fetchActiveVouchersOnce().then((list) => {
      if (mounted) setVouchers(list);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return vouchers;
}

export function getProductDiscount(
  product: Product,
  vouchers: ActiveVoucher[]
): {
  finalPrice: number;
  originalPrice: number | null;
  discountPercent: number;
  voucherCode: string | null;
} {
  let bestDiscountAmount = 0;
  let bestCode: string | null = null;

  for (const v of vouchers) {
    const applies =
      !Array.isArray(v.applicable_products) ||
      v.applicable_products.length === 0 ||
      v.applicable_products.includes(product.id) ||
      v.applicable_products.includes(product.slug);

    if (!applies) continue;

    const amount =
      v.type === 'percent'
        ? Math.round((product.price * v.discount_value) / 100)
        : Math.min(product.price, v.discount_value);

    if (amount > bestDiscountAmount) {
      bestDiscountAmount = amount;
      bestCode = v.code;
    }
  }

  if (bestDiscountAmount <= 0) {
    return {
      finalPrice: product.price,
      originalPrice: null,
      discountPercent: 0,
      voucherCode: null,
    };
  }

  const finalPrice = Math.max(0, product.price - bestDiscountAmount);
  const discountPercent = Math.round((bestDiscountAmount / product.price) * 100);

  return {
    finalPrice,
    originalPrice: product.price,
    discountPercent,
    voucherCode: bestCode,
  };
}
