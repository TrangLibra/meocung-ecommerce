'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/products';
import ProductCard from '@/components/ProductCard';

interface Props {
  initialProducts: Product[];
}

export default function FeaturedProductsSection({ initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    // 1. Kiểm tra cache localStorage đã đồng bộ từ Admin chưa
    const syncFromLocal = () => {
      const saved = localStorage.getItem('mc_admin_products') || localStorage.getItem('gh_admin_products');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
          }
        } catch (_) {}
      }
    };

    syncFromLocal();

    // 2. Lắng nghe sự kiện cập nhật từ Admin cùng browser
    window.addEventListener('storage', syncFromLocal);
    return () => window.removeEventListener('storage', syncFromLocal);
  }, []);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
