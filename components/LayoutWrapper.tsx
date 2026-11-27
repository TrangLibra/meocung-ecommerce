'use client';

import React, { useState, useEffect } from 'react';
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

  const [siteCfg, setSiteCfg] = useState<any>({
    site_name: 'Mèo Cưng',
    logo_url: '',
    logo_emoji: '🐱',
    top_notice: 'Mèo Cưng - Hệ thống phân phối thức ăn & cẩm nang chăm sóc mèo hàng đầu TP.HCM • Giao hàng hỏa tốc 2H!',
    footer_about: 'Mèo Cưng - Địa chỉ tin cậy chuyên cung cấp thức ăn hạt, pate dinh dưỡng, cát vệ sinh và cẩm nang nuôi dưỡng thú cưng hàng đầu tại TP. Hồ Chí Minh.',
    address: 'Quận 1, TP. Hồ Chí Minh, Việt Nam',
    hotline: '0382 542 737',
    footer_copyright: 'Bản quyền thuộc về Mèo Cưng Storefront.',
    primary_color: '#ff7f5c',
  });

  useEffect(() => {
    fetch('/api/admin/site-settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings) setSiteCfg(data.settings);
      })
      .catch(() => {});
  }, []);

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
      <div className="bg-[#fff2ee] border-b border-[#ffd9ce] text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2" style={{ color: siteCfg.primary_color || '#ff6b42' }}>
        <Sparkles className="w-3.5 h-3.5" />
        <span>{siteCfg.top_notice}</span>
      </div>

      {/* Header */}
      <HeaderClient />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16 pt-12 pb-8 text-gray-600 text-sm">
        {(() => {
          const defaultCols = [
            { id: 'col-brand', type: 'brand', title: 'Thông Tin Shop' },
            {
              id: 'col-cat',
              type: 'links',
              title: siteCfg.pages_config?.footer?.col2_title || 'Danh Mục Nổi Bật',
              links: siteCfg.pages_config?.footer?.col2_links || [
                { label: 'Thức ăn hạt dinh dưỡng', href: '/products?category=thuc-an-hat' },
                { label: 'Pate & Súp thưởng cho mèo', href: '/products?category=pate-cho-meo' },
                { label: 'Cát vệ sinh khử mùi', href: '/products?category=cat-ve-sinh' },
                { label: 'Cẩm nang chăm sóc mèo cưng', href: '/tin-tuc' },
              ],
            },
            {
              id: 'col-policy',
              type: 'links',
              title: siteCfg.pages_config?.footer?.col3_title || 'Chính Sách & Hỗ Trợ',
              links: siteCfg.pages_config?.footer?.col3_links || [
                { label: 'Chính sách giao hàng 2H', href: '/chinh-sach#giao-hang' },
                { label: 'Chính sách đổi trả trong 7 ngày', href: '/chinh-sach#doi-tra' },
                { label: 'Hướng dẫn mua hàng & thanh toán', href: '/chinh-sach#mua-hang' },
                { label: 'Cam kết sản phẩm chính hãng', href: '/chinh-sach#chinh-hang' },
              ],
            },
            {
              id: 'col-news',
              type: 'newsletter',
              title: siteCfg.pages_config?.footer?.col4_title || 'Kết Nối Với Mèo Cưng',
              desc: siteCfg.pages_config?.footer?.col4_desc || 'Đăng ký nhận thông tin khuyến mãi và bí quyết chăm sóc hoàng thượng khỏe mạnh!',
              btn_text: siteCfg.pages_config?.footer?.col4_btn || 'Gửi',
            },
          ];
          const cols =
            Array.isArray(siteCfg.pages_config?.footer?.columns) && siteCfg.pages_config.footer.columns.length > 0
              ? siteCfg.pages_config.footer.columns
              : defaultCols;

          return (
            <div
              className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 mb-10"
              style={{ gridTemplateColumns: cols.length > 0 ? `repeat(${Math.min(cols.length, 5)}, minmax(0, 1fr))` : undefined }}
            >
              {cols.map((col: any, cIdx: number) => {
                if (col.type === 'brand') {
                  return (
                    <div key={col.id || cIdx} className="space-y-4">
                      <div className="flex items-center gap-2">
                        {siteCfg.logo_url ? (
                          <img src={siteCfg.logo_url} alt={siteCfg.site_name} className="w-9 h-9 rounded-xl object-cover border border-orange-100" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center text-xl font-bold" style={{ backgroundColor: siteCfg.primary_color || '#ff7f5c' }}>
                            {siteCfg.logo_emoji || '🐱'}
                          </div>
                        )}
                        <span className="text-xl font-black" style={{ color: siteCfg.primary_color || '#ff7f5c' }}>{siteCfg.site_name || 'Mèo Cưng'}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{siteCfg.footer_about}</p>
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 shrink-0" style={{ color: siteCfg.primary_color || '#ff7f5c' }} />
                          <span>{siteCfg.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 shrink-0" style={{ color: siteCfg.primary_color || '#ff7f5c' }} />
                          <span className="font-bold text-gray-700">{siteCfg.hotline}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                if (col.type === 'newsletter') {
                  return (
                    <div key={col.id || cIdx}>
                      <h4 className="font-bold text-gray-900 mb-3 text-sm">{col.title || 'Kết Nối Với Mèo Cưng'}</h4>
                      <p className="text-xs text-gray-500 mb-3">{col.desc}</p>
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
                            className="text-white px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
                            style={{ backgroundColor: siteCfg.primary_color || '#ff7f5c' }}
                          >
                            {col.btn_text || 'Gửi'}
                          </button>
                        </form>
                      )}
                    </div>
                  );
                }
                return (
                  <div key={col.id || cIdx}>
                    <h4 className="font-bold text-gray-900 mb-3 text-sm">{col.title}</h4>
                    <ul className="space-y-2 text-xs">
                      {(col.links || []).map((lnk: any, lIdx: number) => (
                        <li key={lIdx}>
                          <Link href={lnk.href || '/'} className="hover:text-[#ff7f5c] transition-colors">
                            {lnk.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          );
        })()}

        <div className="border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} {siteCfg.site_name || 'Mèo Cưng'}. {siteCfg.footer_copyright}</p>
        </div>
      </footer>

      {/* AI Consultation Chatbot Widget */}
      <ChatbotWidget />
    </>
  );
}
