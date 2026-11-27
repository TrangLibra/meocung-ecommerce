'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CATEGORIES, Product } from '@/lib/products';
import FeaturedProductsSection from '@/components/FeaturedProductsSection';
import { Sparkles, ArrowRight, BookOpen, Calendar, ChevronRight } from 'lucide-react';

interface HomePageClientProps {
  initialHomeCfg: any;
  initialBanner: any;
  posts: any[];
  products: Product[];
  liveBanners: any[];
}

export default function HomePageClient({
  initialHomeCfg,
  initialBanner,
  posts,
  products,
  liveBanners,
}: HomePageClientProps) {
  const [homeCfg, setHomeCfg] = useState<any>(initialHomeCfg || {});
  const [hotline, setHotline] = useState<string>(initialBanner?.hotline || '0382 542 737');

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'MEOCUNG_LIVE_PREVIEW' && e.data.settings) {
        if (e.data.settings.pages_config?.home) {
          setHomeCfg(e.data.settings.pages_config.home);
        }
        if (e.data.settings.hotline) {
          setHotline(e.data.settings.hotline);
        }
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const activeBanner = {
    badge: homeCfg?.hero_badge || initialBanner.badge,
    title: homeCfg?.hero_title || initialBanner.title,
    subtitle: homeCfg?.hero_subtitle || initialBanner.subtitle,
    buttonText: homeCfg?.hero_btn_text || initialBanner.buttonText,
    buttonLink: homeCfg?.hero_btn_link || initialBanner.buttonLink,
    hotline,
  };

  const accent = homeCfg?.accent_color || '#ff7f5c';
  const heroBg = homeCfg?.hero_bg_color || accent;
  const pageStyle: React.CSSProperties = {
    backgroundColor: homeCfg?.bg_color && homeCfg.bg_color !== '#ffffff' ? homeCfg.bg_color : undefined,
    color: homeCfg?.text_color || undefined,
    fontFamily: homeCfg?.font_family && homeCfg.font_family !== 'inherit' ? homeCfg.font_family : undefined,
  };

  const defaultSections = [
    { id: 'hero', visible: true },
    { id: 'policies', visible: true },
    { id: 'banners', visible: true },
    { id: 'categories', visible: true },
    { id: 'products', visible: true },
    { id: 'blog', visible: true },
  ];
  const sections = Array.isArray(homeCfg?.sections) && homeCfg.sections.length > 0 ? homeCfg.sections : defaultSections;

  const policies = [
    { title: 'Sản phẩm an toàn', subtitle: '100% nguồn gốc rõ ràng', bgColor: '#FAF7CA', icon: '🛡️', href: '/chinh-sach#chinh-hang' },
    { title: 'Chất lượng chính hãng', subtitle: 'Hạt & pate dinh dưỡng cao', bgColor: '#E3FFD3', icon: '✨', href: '/chinh-sach#chinh-hang' },
    { title: 'Đổi trả 7 ngày', subtitle: 'Hoàn tiền nhanh nếu lỗi NSX', bgColor: '#FED5DC', icon: '🎖️', href: '/chinh-sach#doi-tra' },
    { title: 'Giao hàng hoả tốc', subtitle: 'Nhanh chóng trong 2h tại HCM', bgColor: '#E4E7FF', icon: '🚀', href: '/chinh-sach#giao-hang' },
  ];

  const renderSection = (sec: any, idx: number) => {
    if (sec.visible === false) return null;

    if (sec.id === 'hero') {
      return (
        <section
          key={`sec-hero-${idx}`}
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-white shadow-xl shadow-orange-100"
          style={{ background: `linear-gradient(135deg, ${heroBg}, ${heroBg}dd)` }}
        >
          <div className="max-w-2xl space-y-5 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white border border-white/20">
              <span>{activeBanner.badge}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight drop-shadow-sm">
              {activeBanner.title}
            </h1>

            <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-xl">
              {activeBanner.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={activeBanner.buttonLink === '/san-pham' ? '/products' : activeBanner.buttonLink || '/products'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white font-bold text-sm hover:bg-orange-50 transition shadow-md"
                style={{ color: accent }}
              >
                <span>{activeBanner.buttonText || 'Mua sắm ngay'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {activeBanner.hotline && (
                <a
                  href={`tel:${activeBanner.hotline.replace(/\s+/g, '')}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black/15 hover:bg-black/25 text-white font-semibold text-sm transition border border-white/20"
                >
                  <span>Hotline: {activeBanner.hotline}</span>
                </a>
              )}
            </div>
          </div>

          <div className="absolute right-4 bottom-0 text-[160px] sm:text-[220px] select-none opacity-25 pointer-events-none transform translate-y-8">
            🐱
          </div>
        </section>
      );
    }

    if (sec.id === 'policies') {
      return (
        <section key={`sec-policies-${idx}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {policies.map((policy, index) => (
              <Link
                key={index}
                href={policy.href}
                className="flex items-center gap-4 rounded-2xl border border-black/5 p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
                style={{ backgroundColor: policy.bgColor }}
              >
                <div className="w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center text-2xl shadow-sm shrink-0">
                  {policy.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">{policy.title}</h3>
                  <p className="text-xs text-gray-600 mt-0.5 truncate">{policy.subtitle}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    if (sec.id === 'banners') {
      if (liveBanners.length === 0) return null;
      return (
        <section key={`sec-banners-${idx}`} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveBanners.map((b: any) => (
              <Link
                key={b.id}
                href={b.link_url === '/san-pham' ? '/products' : b.link_url || '/products'}
                className="group relative h-48 sm:h-56 rounded-2xl overflow-hidden shadow-md border border-gray-100 block"
              >
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col justify-end p-5">
                  <span className="inline-block w-fit px-2.5 py-0.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ backgroundColor: accent }}>
                    Ưu đãi nổi bật
                  </span>
                  <h3 className="text-white font-black text-lg sm:text-xl leading-snug drop-shadow">{b.title}</h3>
                  <span className="text-orange-200 text-xs font-semibold mt-1 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Xem ngay <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    if (sec.id === 'categories') {
      return (
        <section key={`sec-categories-${idx}`} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                <span>{homeCfg?.categories_title || 'Danh Mục Nổi Bật'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 font-bold" style={{ color: accent }}>
                  Chọn lọc
                </span>
              </h2>
              <p className="text-xs sm:text-sm opacity-70 mt-0.5">Đầy đủ các dòng thức ăn hạt, pate thơm ngon và vật dụng thiết yếu</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/collections/${cat.slug}`}
                className="group p-4 rounded-2xl border border-gray-100 bg-white hover:shadow-lg transition-all duration-200 flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-2xl transition-colors duration-200 shadow-sm">
                  <span>{cat.icon}</span>
                </div>
                <h3 className="font-bold text-gray-800 text-sm sm:text-base mt-3 transition">{cat.name}</h3>
                <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    if (sec.id === 'products') {
      return (
        <section key={`sec-products-${idx}`} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sản phẩm bán chạy</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                {homeCfg?.featured_title || 'Thức Ăn & Phụ Kiện Yêu Thích Nhất'}
              </h2>
            </div>

            <Link href="/products" className="inline-flex items-center gap-1 text-sm font-bold transition group" style={{ color: accent }}>
              <span>Xem tất cả</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <FeaturedProductsSection initialProducts={products} />
        </section>
      );
    }

    if (sec.id === 'blog') {
      return (
        <section key={`sec-blog-${idx}`} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cẩm nang chăm sóc mèo</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black">
                {homeCfg?.blog_title || 'Kiến Thức & Kinh Nghiệm Nuôi Mèo'}
              </h2>
            </div>

            <Link href="/tin-tuc" className="inline-flex items-center gap-1 text-sm font-bold transition group" style={{ color: accent }}>
              <span>Xem thêm bài viết</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {posts.slice(0, 3).map((post) => (
              <article key={post.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col">
                <Link href={`/posts/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-gray-100">
                  <img src={post.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800'} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" loading="lazy" />
                  {post.category && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                      {post.category}
                    </span>
                  )}
                </Link>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 transition leading-snug">
                    <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                  </h3>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{post.date_created ? new Date(post.date_created).toLocaleDateString('vi-VN') : 'Mới cập nhật'}</span>
                    </span>
                    <Link href={`/posts/${post.slug}`} className="font-bold inline-flex items-center gap-0.5" style={{ color: accent }}>
                      <span>Đọc tiếp</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      );
    }

    return null;
  };

  return (
    <div className="space-y-12 rounded-3xl p-1" style={pageStyle}>
      {sections.map((sec: any, idx: number) => renderSection(sec, idx))}
    </div>
  );
}
