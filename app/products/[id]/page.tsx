'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { PRODUCTS } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, Phone, Check, ArrowRight } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const product = PRODUCTS.find((p) => p.id === params.id);
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [pageCfg, setPageCfg] = useState<any>({
    in_stock_text: 'Còn hàng',
    add_cart_text: 'Thêm vào giỏ hàng',
    buy_now_text: 'Mua ngay',
    badge_shipping: 'Giao 2H TP.HCM',
    badge_authentic: '100% Chính hãng',
    badge_return: 'Đổi trả 7 ngày',
    custom_note: '',
    show_breadcrumb: true,
    show_rating: true,
    show_guarantees: true,
    bg_color: '#ffffff',
    text_color: '#111827',
    accent_color: '#ff7f5c',
    font_family: 'inherit',
  });

  useEffect(() => {
    fetch('/api/admin/site-settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.settings?.pages_config?.product_detail) {
          setPageCfg((prev: any) => ({ ...prev, ...d.settings.pages_config.product_detail }));
        }
      })
      .catch(() => {});

    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'MEOCUNG_LIVE_PREVIEW' && e.data.settings?.pages_config?.product_detail) {
        setPageCfg((prev: any) => ({ ...prev, ...e.data.settings.pages_config.product_detail }));
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!product) {
    notFound();
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const related = PRODUCTS.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, 3);

  const accent = pageCfg.accent_color || '#ff7f5c';

  return (
    <div
      className="space-y-10"
      style={{
        fontFamily: pageCfg.font_family && pageCfg.font_family !== 'inherit' ? pageCfg.font_family : undefined,
        color: pageCfg.text_color || undefined,
      }}
    >
      {/* Breadcrumb */}
      {pageCfg.show_breadcrumb !== false && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#ff7f5c]">Trang chủ</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#ff7f5c]">Sản phẩm</Link>
          <span>/</span>
          <Link href={`/collections/${product.categorySlug}`} className="hover:text-[#ff7f5c]">{product.categoryName}</Link>
          <span>/</span>
          <span className="font-bold truncate max-w-xs">{product.name}</span>
        </div>
      )}

      {/* Product Main Section */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-10 rounded-3xl border border-gray-200"
        style={{ backgroundColor: pageCfg.bg_color || '#ffffff' }}
      >
        {/* Left: Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Right: Info */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full bg-orange-50 text-xs font-bold border border-orange-200" style={{ color: accent }}>
              {product.categoryName}
            </span>

            <h1 className="text-2xl sm:text-3xl font-black leading-snug">
              {product.name}
            </h1>

            {/* Rating */}
            {pageCfg.show_rating !== false && (
              <div className="flex items-center gap-4 text-xs opacity-75">
                <div className="flex items-center gap-1 text-amber-500 font-bold">
                  <Star className="w-4 h-4 fill-amber-500" />
                  <span>{product.rating}</span>
                </div>
                <span>•</span>
                <span>Đã bán {product.soldCount} lượt</span>
                <span>•</span>
                <span className="text-emerald-600 font-semibold">{pageCfg.in_stock_text}</span>
              </div>
            )}

            {/* Price */}
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-baseline gap-3">
              <span className="text-3xl font-black" style={{ color: accent }}>
                {product.price.toLocaleString('vi-VN')}₫
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {product.originalPrice.toLocaleString('vi-VN')}₫
                </span>
              )}
            </div>

            {pageCfg.custom_note && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-semibold">
                {pageCfg.custom_note}
              </div>
            )}

            <p className="text-sm text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {product.weight && (
              <div className="text-xs text-gray-500">
                <strong>Quy cách đóng gói:</strong> {product.weight}
              </div>
            )}
          </div>

          {/* Quantity & Buy Buttons */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-700">Số lượng:</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 hover:bg-gray-200 font-bold text-gray-600"
                >
                  -
                </button>
                <span className="px-4 py-1.5 font-bold text-sm bg-white">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3 py-1.5 hover:bg-gray-200 font-bold text-gray-600"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-6 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-md shadow-orange-200 cursor-pointer"
                style={{ backgroundColor: accent }}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã thêm vào giỏ hàng!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>{pageCfg.add_cart_text}</span>
                  </>
                )}
              </button>

              <Link
                href="/cart"
                onClick={() => addToCart(product, quantity)}
                className="py-3.5 px-6 rounded-full bg-gray-900 hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <span>{pageCfg.buy_now_text}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Guarantee badges */}
            {pageCfg.show_guarantees !== false && (
              <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-gray-500 text-center">
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50">
                  <Truck className="w-4 h-4" style={{ color: accent }} />
                  <span>{pageCfg.badge_shipping}</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50">
                  <ShieldCheck className="w-4 h-4" style={{ color: accent }} />
                  <span>{pageCfg.badge_authentic}</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50">
                  <RotateCcw className="w-4 h-4" style={{ color: accent }} />
                  <span>{pageCfg.badge_return}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
