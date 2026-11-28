'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { PRODUCTS, type Product } from '@/lib/products';
import { useCart } from '@/context/CartContext';
import { getProductDiscount, useActiveVouchers } from '@/lib/useActiveVouchers';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import { ShoppingCart, Star, ShieldCheck, Truck, RotateCcw, Phone, Check, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

function getBaseProductName(name: string): string {
  return name
    .replace(/\s*\(\s*(?:Size\s+[A-Za-z0-9]+|\d+(?:\.\d+)?\s*(?:kg|g|l|ml)(?:\s*\([^)]+\))?|Lốc\s+\d+\s+gói|Thùng\s+\d+\s+lon)\s*\)\s*$/i, '')
    .trim()
    .toLowerCase();
}

function extractSizeLabel(name: string, weight?: string): string {
  const mSize = name.match(/\(\s*Size\s+([A-Za-z0-9]+)\s*\)/i);
  if (mSize) return `Size ${mSize[1].toUpperCase()}`;
  const mWeight = name.match(/\(\s*(\d+(?:\.\d+)?\s*(?:kg|g|l|ml)|Lốc\s+\d+\s+gói|Thùng\s+\d+\s+lon)\s*\)/i);
  if (mWeight) return mWeight[1];
  const w = (weight || '').trim();
  if (SIZE_ORDER.includes(w.toUpperCase())) return `Size ${w.toUpperCase()}`;
  return w || 'Tiêu chuẩn';
}

function mapNeonToProduct(found: any): Product {
  return {
    id: String(found.id),
    name: String(found.name || 'Sản phẩm Mèo Cưng'),
    categorySlug: String(found.category || 'thuc-an-hat'),
    categoryName: String(found.category_name || 'Sản phẩm Mèo Cưng'),
    price: Number(found.price) || 0,
    originalPrice: Number(found.price) || 0,
    weight: String(found.actual_weight || found.weight || '1kg'),
    image: String(found.image || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80'),
    description: String(found.description || ''),
    rating: 5,
    reviews: 12,
    sold: 25,
    inStock: (Number(found.inventory) || 0) > 0,
    tag: found.sku || undefined,
    specs: [
      `Mã SKU: ${found.sku || found.id}`,
      `Quy cách / Size: ${found.weight || 'Tiêu chuẩn'}`,
      `Tồn kho: ${found.inventory ?? 50} sản phẩm`,
    ],
  };
}

function extractWeightBadge(actualWeight?: string, weight?: string, description?: string): string {
  const aw = (actualWeight || '').trim();
  if (aw) return aw;
  const w = (weight || '').trim();
  if (w && !SIZE_ORDER.includes(w.toUpperCase()) && !/^size\s+/i.test(w)) {
    return w;
  }
  const desc = description || '';
  const m = desc.match(/(?:trên\s+\d+(?:\.\d+)?\s*(?:kg|g|l|ml)(?![a-zA-ZÀ-ỹ])|\d+(?:\.\d+)?\s*-\s*\d+(?:\.\d+)?\s*(?:kg|g|l|ml)(?![a-zA-ZÀ-ỹ])|\d+(?:\.\d+)?\s*(?:kg|g|l|ml)(?![a-zA-ZÀ-ỹ]))/i);
  return m ? m[0].trim() : '';
}

export default function ProductDetailPage() {
  const params = useParams();
  const idStr = String(params?.id || '');
  const staticProduct = PRODUCTS.find((p) => p.id === idStr) || null;
  const [product, setProduct] = useState<Product | null>(staticProduct);
  const [sizeVariants, setSizeVariants] = useState<{ size: string; product: Product }[]>([]);
  const [loading, setLoading] = useState(!staticProduct);
  const { addToCart } = useCart();
  const vouchers = useActiveVouchers();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const featuredScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (staticProduct) {
      setProduct(staticProduct);
      setSizeVariants([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    fetch('/api/admin/products')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data?.products) ? data.products : [];
        const found = list.find((p: any) => String(p.id) === idStr);
        if (found) {
          const mapped = mapNeonToProduct(found);
          setProduct(mapped);
          const baseName = getBaseProductName(mapped.name);
          const siblings = list
            .filter((item: any) => getBaseProductName(String(item.name || '')) === baseName)
            .map((item: any) => {
              const p = mapNeonToProduct(item);
              return { size: extractSizeLabel(p.name, p.weight), product: p };
            })
            .sort((a: { size: string }, b: { size: string }) => {
              const ia = SIZE_ORDER.indexOf(a.size);
              const ib = SIZE_ORDER.indexOf(b.size);
              return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
            });
          setSizeVariants(siblings.length > 1 ? siblings : []);
        } else {
          setProduct(null);
          setSizeVariants([]);
        }
      })
      .catch(() => {
        if (active) {
          setProduct(null);
          setSizeVariants([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [idStr, staticProduct]);

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-gray-500 font-medium">
        Đang tải thông tin sản phẩm...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4">
        <p className="text-lg font-bold text-gray-800">Không tìm thấy sản phẩm này</p>
        <Link href="/products" className="inline-block px-5 py-2.5 rounded-full bg-[#ff7f5c] text-white text-sm font-bold">
          Xem tất cả sản phẩm
        </Link>
      </div>
    );
  }

  const { finalPrice, originalPrice, discountPercent, voucherCode } = getProductDiscount(
    product,
    vouchers
  );

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const related = PRODUCTS.filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id).slice(0, 3);

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-[#ff7f5c]">Trang chủ</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[#ff7f5c]">Sản phẩm</Link>
        <span>/</span>
        <Link href={`/collections/${product.categorySlug}`} className="hover:text-[#ff7f5c]">{product.categoryName}</Link>
        <span>/</span>
        <span className="text-gray-900 font-bold truncate max-w-xs">{product.name}</span>
      </div>

      {/* Product Main Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white p-6 sm:p-10 rounded-3xl border border-gray-200">
        {/* Left: Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 relative">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Right: Info */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="px-3 py-1 rounded-full bg-orange-50 text-[#ff7f5c] text-xs font-bold border border-orange-200">
              {product.categoryName}
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-snug">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-4 h-4 fill-amber-500" />
                <span>{product.rating}</span>
              </div>
              <span>•</span>
              <span>Đã bán {product.soldCount} lượt</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">Còn hàng</span>
            </div>

            {/* Price */}
            <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-100 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-black text-[#ff7f5c]">
                {finalPrice.toLocaleString('vi-VN')}₫
              </span>
              {originalPrice && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    {originalPrice.toLocaleString('vi-VN')}₫
                  </span>
                  <span className="bg-red-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full">
                    -{discountPercent}%{voucherCode ? ` (${voucherCode})` : ''}
                  </span>
                </>
              )}
            </div>

            {sizeVariants.length > 1 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                  {['thuc-an-hat', 'pate-cho-meo', 'cat-ve-sinh'].includes(product.categorySlug)
                    ? 'Chọn khối lượng / quy cách:'
                    : 'Chọn phân loại / Size:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizeVariants.map((v) => {
                    const isSelected = v.product.id === product.id;
                    const weightBadge = extractWeightBadge((v.product as any).actual_weight, v.product.weight, v.product.description);
                    return (
                      <button
                        key={v.product.id}
                        type="button"
                        onClick={() => setProduct(v.product)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold border-2 transition-all ${
                          isSelected
                            ? 'bg-[#ff7f5c] text-white border-[#ff7f5c] shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#ff7f5c]'
                        }`}
                      >
                        {v.size}{weightBadge && weightBadge.toLowerCase() !== v.size.toLowerCase() ? ` • ${weightBadge}` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Khối lượng / Quy cách:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-4 py-2 rounded-xl text-xs font-extrabold bg-[#ff7f5c] text-white border-2 border-[#ff7f5c] shadow-sm inline-flex items-center gap-1.5">
                      <span>⚖️</span>
                      <span>{extractWeightBadge((product as any).actual_weight, product.weight, product.description) || product.weight || 'Tiêu chuẩn'}</span>
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block text-[11px]">Thương hiệu</span>
                    <span className="font-bold text-gray-800">Mèo Cưng Official</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-400 block text-[11px]">Tình trạng kho</span>
                    <span className="font-bold text-emerald-600">Sẵn hàng • Giao ngay</span>
                  </div>
                </div>
              </div>
            )}

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
                className="flex-1 py-3.5 px-6 rounded-full bg-[#ff7f5c] hover:bg-[#f0643d] text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-md shadow-orange-200 cursor-pointer"
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Đã thêm vào giỏ hàng!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Thêm vào giỏ hàng</span>
                  </>
                )}
              </button>

              <Link
                href="/cart"
                onClick={() => addToCart(product, quantity)}
                className="py-3.5 px-6 rounded-full bg-gray-900 hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <span>Mua ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Guarantee badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-gray-500 text-center">
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50">
                <Truck className="w-4 h-4 text-[#ff7f5c]" />
                <span>Giao 2H TP.HCM</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50">
                <ShieldCheck className="w-4 h-4 text-[#ff7f5c]" />
                <span>100% Chính hãng</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-2 rounded-xl bg-gray-50">
                <RotateCcw className="w-4 h-4 text-[#ff7f5c]" />
                <span>Đổi trả 7 ngày</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mô Tả Chi Tiết Sản Phẩm */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
          <span>📝</span>
          <span>Mô Tả Chi Tiết Sản Phẩm</span>
        </h2>
        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
          {product.description || `Sản phẩm ${product.name} chính hãng tại Mèo Cưng Pet Shop, đảm bảo chất lượng an toàn cho thú cưng của bạn.`}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="font-bold text-gray-800 block mb-0.5">Danh mục</span>
            {product.categoryName}
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="font-bold text-gray-800 block mb-0.5">Quy cách / Size</span>
            {product.weight || 'Tiêu chuẩn'}
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <span className="font-bold text-gray-800 block mb-0.5">Cam kết</span>
            100% Chính hãng • Đổi trả trong 7 ngày
          </div>
        </div>
      </section>

      {/* Các Sản Phẩm Nổi Bật (Carousel có nút < > bo tròn mũi tên cam) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
            <span>✨</span>
            <span>Các Sản Phẩm Nổi Bật</span>
          </h2>
          <Link href="/products" className="text-xs font-bold text-[#ff7f5c] hover:underline">
            Xem tất cả →
          </Link>
        </div>
        <div className="relative group">
          <button
            type="button"
            aria-label="Sản phẩm trước"
            onClick={() => featuredScrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
            className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border-2 border-[#ff7f5c] text-[#ff7f5c] hover:bg-orange-50 shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div
            ref={featuredScrollRef}
            className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth pb-2 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {PRODUCTS.filter((p) => p.id !== product.id).map((item) => (
              <div key={item.id} className="w-[220px] sm:w-[250px] shrink-0">
                <ProductCard product={item} />
              </div>
            ))}
          </div>

          <button
            type="button"
            aria-label="Sản phẩm tiếp theo"
            onClick={() => featuredScrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
            className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white border-2 border-[#ff7f5c] text-[#ff7f5c] hover:bg-orange-50 shadow-lg flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </section>
    </div>
  );
}
