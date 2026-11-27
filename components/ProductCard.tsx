'use client';

import React from 'react';
import Link from 'next/link';
import { Product } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Star } from 'lucide-react';
import { getProductDiscount, useActiveVouchers } from '@/lib/useActiveVouchers';

export default function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const vouchers = useActiveVouchers();
  const { finalPrice, originalPrice, discountPercent } = getProductDiscount(product, vouchers);

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-[#ff7f5c]/50 hover:shadow-xl transition-all duration-300">
      {/* Thumbnail */}
      <Link href={`/products/${product.id}`} className="relative aspect-square overflow-hidden bg-gray-50 block">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {discountPercent > 0 && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
            -{discountPercent}%
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span className="inline-flex items-center gap-1 font-medium text-slate-500">
              🏪 {product.vendorName || 'Mèo Cưng Mall'}
            </span>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-3 h-3 fill-amber-500" />
              <span>{product.rating}</span>
            </div>
          </div>

          <Link href={`/products/${product.id}`} className="block">
            <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#ff7f5c] transition line-clamp-2 leading-snug">
              {product.name || (product as any).title || 'Sản phẩm'}
            </h3>
          </Link>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-2 border-t border-gray-50 flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-black text-[#ff7f5c]">
              {finalPrice.toLocaleString('vi-VN')}₫
            </div>
            {originalPrice && (
              <div className="text-xs text-gray-400 line-through">
                {originalPrice.toLocaleString('vi-VN')}₫
              </div>
            )}
          </div>

          <button
            onClick={() => addToCart({ ...product, price: finalPrice }, 1)}
            className="w-9 h-9 rounded-xl bg-orange-50 hover:bg-[#ff7f5c] text-[#ff7f5c] hover:text-white flex items-center justify-center transition shadow-sm cursor-pointer"
            title="Thêm vào giỏ"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
