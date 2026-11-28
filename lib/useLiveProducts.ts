'use client';

import { useEffect, useState } from 'react';
import { PRODUCTS, type Product } from '@/lib/products';

function stripSizeSuffix(name: string): string {
  return name.replace(/\s*\(\s*Size\s+[A-Za-z0-9]+\s*\)\s*$/i, '').trim();
}

function normalizeKey(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export function useLiveProducts(): Product[] {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);

  useEffect(() => {
    let active = true;

    const fetchLive = async () => {
      try {
        const res = await fetch('/api/admin/products', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const rows = Array.isArray(data?.products) ? data.products : [];
        if (!active || rows.length === 0) return;

        // Sort ascending by price so grouped sizes display the starting price
        const sorted = [...rows].sort((a: any, b: any) => (Number(a.price) || 0) - (Number(b.price) || 0));
        const seen = new Set<string>();
        const merged: Product[] = [];

        for (const r of sorted) {
          const cleanName = stripSizeSuffix(String(r.name || ''));
          const key = normalizeKey(cleanName || String(r.id || ''));
          if (!key || seen.has(key)) continue;
          seen.add(key);
          merged.push({
            id: String(r.id),
            name: cleanName || String(r.name || ''),
            categorySlug: String(r.category || 'thuc-an-hat'),
            categoryName: String(r.category_name || 'Sản phẩm Mèo Cưng'),
            price: Number(r.price) || 0,
            originalPrice: Number(r.price) || 0,
            weight: String(r.weight || '1kg'),
            image: String(r.image || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80'),
            description: String(r.description || ''),
            rating: 5,
            reviews: 12,
            sold: 25,
            soldCount: 25,
            inStock: (Number(r.inventory) || 0) > 0,
            tag: r.sku || undefined,
          } as Product);
        }

        // Keep static products that aren't already in Neon
        for (const sp of PRODUCTS) {
          const key = normalizeKey(stripSizeSuffix(sp.name));
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(sp);
          }
        }

        if (active) setProducts(merged);
      } catch {
        // fallback to existing state
      }
    };

    fetchLive();
    const timer = setInterval(fetchLive, 15000);
    const onFocus = () => fetchLive();
    window.addEventListener('focus', onFocus);

    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return products;
}
