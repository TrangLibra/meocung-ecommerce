'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Trash2, ArrowRight, CheckCircle2, ShoppingBag, Mail, Lock, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import CatDialog from '@/components/CatDialog';
import { getProductDiscount, useActiveVouchers } from '@/lib/useActiveVouchers';
import { PRODUCTS } from '@/lib/products';

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems } = useCart();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ordered, setOrdered] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    if (user) {
      setName((prev) => prev || user.name || '');
      setEmail((prev) => prev || user.email || '');
      setPhone((prev) => prev || user.phone || '');
    }
  }, [user]);

  const vouchers = useActiveVouchers();

  // Tính giá gốc sản phẩm và số tiền giảm từ voucher đang bật
  const cartBreakdown = cart.map((item) => {
    const catalogProd = PRODUCTS.find((p) => p.id === item.product.id);
    const baseProduct = catalogProd ? { ...item.product, price: catalogProd.price } : item.product;
    const disc = getProductDiscount(baseProduct, vouchers);
    return {
      item,
      unitOriginal: baseProduct.price,
      unitFinal: disc.finalPrice,
      lineOriginal: baseProduct.price * item.quantity,
      lineDiscount: (baseProduct.price - disc.finalPrice) * item.quantity,
      voucherCode: disc.voucherCode,
    };
  });

  const originalSubtotal = cartBreakdown.reduce((sum, x) => sum + x.lineOriginal, 0);
  const voucherDiscount = cartBreakdown.reduce((sum, x) => sum + x.lineDiscount, 0);
  const appliedCodes = Array.from(
    new Set(cartBreakdown.map((x) => x.voucherCode).filter(Boolean))
  ) as string[];
  const afterDiscount = Math.max(0, originalSubtotal - voucherDiscount);
  const shippingFee = afterDiscount >= 300000 || afterDiscount === 0 ? 0 : 25000;
  const grandTotal = afterDiscount + shippingFee;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login?redirect=/cart');
      return;
    }
    if (!name.trim() || !phone.trim() || !address.trim() || !email.trim()) {
      setAlertMessage('Vui lòng điền đầy đủ họ tên, Gmail, số điện thoại và địa chỉ nhận hàng!');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          note,
          items: cartBreakdown.map((x) => ({
            name: x.item.product.name,
            quantity: x.item.quantity,
            price: x.unitFinal,
          })),
          totalPrice: afterDiscount,
          shippingFee,
          grandTotal,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAlertMessage(data.error || 'Không thể đặt hàng. Vui lòng thử lại.');
        return;
      }
      setOrderCode(data.orderCode || '');
      setEmailSent(Boolean(data.emailSent));
      setOrdered(true);
      clearCart();
    } catch {
      setAlertMessage('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (ordered) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-3xl border border-gray-200 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">Đặt Hàng Thành Công!</h2>
        {orderCode && (
          <p className="text-xs font-bold text-[#ff7f5c] bg-orange-50 inline-block px-4 py-1.5 rounded-full">
            Mã đơn hàng: #{orderCode}
          </p>
        )}
        <p className="text-sm text-gray-600 leading-relaxed">
          Cảm ơn <strong>{name}</strong>! Đơn hàng của bạn đã được ghi nhận vào hệ thống Mèo Cưng. Nhân viên sẽ liên hệ số điện thoại <strong>{phone}</strong> để xác nhận và giao hàng hỏa tốc trong 2H!
        </p>
        {emailSent && (
          <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
            <Mail className="w-4 h-4 shrink-0" />
            <span>
              Đã gửi Gmail xác nhận đơn hàng đến <strong>{email}</strong>
            </span>
          </div>
        )}
        <div className="pt-4 flex justify-center gap-3">
          <Link
            href="/orders"
            className="px-6 py-3 rounded-full bg-[#ff7f5c] text-white font-bold text-xs hover:bg-[#f0643d] transition"
          >
            Xem trạng thái đơn hàng
          </Link>
          <Link
            href="/products"
            className="px-6 py-3 rounded-full bg-orange-50 text-[#ff7f5c] border border-orange-200 font-bold text-xs hover:bg-orange-100 transition"
          >
            Tiếp tục mua sắm
          </Link>
          <a
            href="tel:0382542737"
            className="px-6 py-3 rounded-full bg-gray-100 text-gray-800 font-bold text-xs hover:bg-gray-200 transition"
          >
            Hotline: 0382 542 737
          </a>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-dashed border-gray-300 text-center space-y-4">
        <div className="text-5xl">🛒</div>
        <h2 className="text-xl font-bold text-gray-900">Giỏ Hàng Đang Trống</h2>
        <p className="text-xs text-gray-500">Chưa có sản phẩm nào trong giỏ của bạn. Hãy chọn món đồ yêu thích cho boss mèo nhé!</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#ff7f5c] text-white font-bold text-xs hover:bg-[#f0643d] transition"
        >
          <span>Khám phá sản phẩm</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
        Giỏ Hàng Của Bạn ({totalItems} món)
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Items list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {cart.map((item) => (
              <div key={item.product.id} className="p-4 sm:p-5 flex items-center gap-4">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-20 h-20 rounded-2xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[10px] font-bold text-[#ff7f5c] uppercase">
                    {item.product.categoryName}
                  </span>
                  <Link href={`/products/${item.product.id}`} className="block">
                    <h3 className="font-bold text-sm text-gray-900 hover:text-[#ff7f5c] truncate">
                      {item.product.name}
                    </h3>
                  </Link>
                  <div className="text-xs font-bold text-[#ff7f5c]">
                    {item.product.price.toLocaleString('vi-VN')}₫
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold bg-white">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="px-2.5 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-gray-400 hover:text-red-500 p-2 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs text-gray-500 px-2">
            <Link href="/products" className="hover:text-[#ff7f5c] font-semibold">
              ← Tiếp tục chọn thêm sản phẩm
            </Link>
            <button onClick={clearCart} className="hover:text-red-500">
              Xóa toàn bộ giỏ hàng
            </button>
          </div>
        </div>

        {/* Right: Checkout form */}
        <div className="space-y-6">
          <form onSubmit={handleCheckout} className="bg-white p-6 rounded-3xl border border-gray-200 space-y-4">
            <h3 className="font-black text-gray-900 text-base border-b border-gray-100 pb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#ff7f5c]" />
              <span>Thông Tin Giao Hàng Hỏa Tốc</span>
            </h3>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Họ và tên *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#ff7f5c]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Gmail nhận xác nhận đơn hàng *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ban@gmail.com"
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#ff7f5c]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Số điện thoại nhận hàng *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0902 xxx xxx"
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#ff7f5c]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Địa chỉ nhận hàng tại TP.HCM *</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, tên đường, Phường/Quận..."
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#ff7f5c]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Ghi chú giao hàng</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Giao giờ hành chính, gọi trước khi đến..."
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#ff7f5c]"
              />
            </div>

            {/* Price Breakdown */}
            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span>{originalSubtotal.toLocaleString('vi-VN')}₫</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>
                    Giảm giá voucher{appliedCodes.length > 0 ? ` (${appliedCodes.join(', ')})` : ''}:
                  </span>
                  <span>-{voucherDiscount.toLocaleString('vi-VN')}₫</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Phí giao hàng (TP.HCM):</span>
                <span>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}₫`}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
                <span>Tổng thanh toán:</span>
                <span className="text-lg text-[#ff7f5c]">{grandTotal.toLocaleString('vi-VN')}₫</span>
              </div>
            </div>

            {!authLoading && !user ? (
              <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 space-y-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#ff7f5c]">
                  <Lock className="w-4 h-4" />
                  <span>Vui lòng đăng nhập để đặt hàng</span>
                </div>
                <p className="text-[11px] text-gray-600">
                  Bạn cần có tài khoản Mèo Cưng để xác nhận đơn hàng và nhận Gmail thông báo.
                </p>
                <div className="flex gap-2">
                  <Link
                    href="/login?redirect=/cart"
                    className="flex-1 py-2.5 px-3 rounded-full bg-[#ff7f5c] hover:bg-[#f0643d] text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Đăng nhập</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 py-2.5 px-3 rounded-full bg-white border border-orange-200 hover:border-[#ff7f5c] text-[#ff7f5c] font-bold text-xs transition flex items-center justify-center"
                  >
                    Đăng ký
                  </Link>
                </div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={submitting || authLoading}
                className="w-full py-3.5 rounded-full bg-[#ff7f5c] hover:bg-[#f0643d] disabled:opacity-60 text-white font-bold text-xs transition shadow-md shadow-orange-200 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{submitting ? 'Đang gửi đơn hàng...' : 'Xác Nhận Đặt Hàng Hỏa Tốc (COD)'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </div>

      <CatDialog
        open={Boolean(alertMessage)}
        title="Thông báo đặt hàng"
        message={alertMessage}
        mode="alert"
        onConfirm={() => setAlertMessage('')}
        onClose={() => setAlertMessage('')}
      />
    </div>
  );
}
