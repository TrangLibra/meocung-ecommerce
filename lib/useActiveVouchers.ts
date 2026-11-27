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

const MEDUSA_ID_ALIASES: Record<string, string[]> = {
  p1: ['prod_01ROYALCANINFIT32'],
  p2: ['prod_01REFLEXPLUS0002'],
  p3: ['prod_01CIAOCHURU0003'],
  p4: ['prod_01WHISKAS000004'],
  p5: ['prod_01CATURETOFU0005'],
  p6: ['prod_01SANICAT000006', 'prod_01BENTONITE00006'],
  p7: ['prod_01CANCAULONGVU07'],
  p8: ['prod_01BANCAOMONG008'],
};

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
  const prodNameNorm = (product.name || '').trim().toLowerCase();
  const aliases = MEDUSA_ID_ALIASES[product.id] || [];

  for (const v of vouchers) {
    const list = Array.isArray(v.applicable_products) ? v.applicable_products : [];
    const applies =
      list.length === 0 ||
      list.includes(product.id) ||
      list.includes(product.slug) ||
      aliases.some((a) => list.includes(a)) ||
      list.some((entry) => {
        const e = String(entry).trim().toLowerCase();
        return e && (e === prodNameNorm || prodNameNorm.includes(e) || e.includes(prodNameNorm));
      });

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
