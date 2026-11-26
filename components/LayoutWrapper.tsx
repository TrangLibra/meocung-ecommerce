'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import HeaderClient from '@/components/HeaderClient';
import ChatbotWidget from '@/components/ChatbotWidget';
import { Sparkles, MapPin, Phone, CheckCircle2 } from 'lucide-react';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscribed(true);
    setNewsletterEmail('');
  };

  if (isAdmin) {
    return <div className="fixed inset-0 z-50 bg-slate-50 overflow-hidden">{children}</div>;
  }

  return (
    <>
      {/* Top Notice */}
      <div className="bg-[#fff2ee] border-b border-[#ffd9ce] text-xs py-1.5 px-4 text-center text-[#ff6b42] font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Mèo Cưng - Hệ thống phân phối thức ăn & cẩm nang chăm sóc mèo hàng đầu TP.HCM • Giao hàng hỏa tốc 2H!</span>
      </div>

      {/* Header */}
      <HeaderClient />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 pt-12 pb-8 text-gray-600 text-sm">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#ff7f5c] text-white flex items-center justify-center text-xl font-bold">
                🐱
              </div>
              <span className="text-xl font-black text-[#ff7f5c]">Mèo Cưng</span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Mèo Cưng - Địa chỉ tin cậy chuyên cung cấp thức ăn hạt, pate dinh dưỡng, cát vệ sinh và cẩm nang nuôi dưỡng thú cưng hàng đầu tại TP. Hồ Chí Minh.
            </p>
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#ff7f5c] shrink-0" />
                <span>Quận 1, TP. Hồ Chí Minh, Việt Nam</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#ff7f5c] shrink-0" />
                <span className="font-bold text-gray-700">0382 542 737</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Danh Mục Nổi Bật</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/products?category=thuc-an-hat" className="hover:text-[#ff7f5c] transition-colors">Thức ăn hạt dinh dưỡng</a></li>
              <li><a href="/products?category=pate-cho-meo" className="hover:text-[#ff7f5c] transition-colors">Pate & Súp thưởng cho mèo</a></li>
              <li><a href="/products?category=cat-ve-sinh" className="hover:text-[#ff7f5c] transition-colors">Cát vệ sinh khử mùi</a></li>
              <li><a href="/tin-tuc" className="hover:text-[#ff7f5c] transition-colors">Cẩm nang chăm sóc mèo cưng</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Chính Sách & Hỗ Trợ</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/chinh-sach#giao-hang" className="hover:text-[#ff7f5c] transition-colors">Chính sách giao hàng 2H</Link></li>
              <li><Link href="/chinh-sach#doi-tra" className="hover:text-[#ff7f5c] transition-colors">Chính sách đổi trả trong 7 ngày</Link></li>
              <li><Link href="/chinh-sach#mua-hang" className="hover:text-[#ff7f5c] transition-colors">Hướng dẫn mua hàng & thanh toán</Link></li>
              <li><Link href="/chinh-sach#chinh-hang" className="hover:text-[#ff7f5c] transition-colors">Cam kết sản phẩm chính hãng</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Kết Nối Với Mèo Cưng</h4>
            <p className="text-xs text-gray-500 mb-3">
              Đăng ký nhận thông tin khuyến mãi và bí quyết chăm sóc hoàng thượng khỏe mạnh!
            </p>
            {subscribed ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Đã đăng ký nhận ưu đãi thành công!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-full focus:outline-none focus:border-[#ff7f5c]"
                />
                <button
                  type="submit"
                  className="bg-[#ff7f5c] hover:bg-[#e06b49] text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
                >
                  Gửi
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} Mèo Cưng. Bản quyền thuộc về Mèo Cưng Storefront.</p>
        </div>
      </footer>

      {/* AI Consultation Chatbot Widget */}
      <ChatbotWidget />
    </>
  );
}
