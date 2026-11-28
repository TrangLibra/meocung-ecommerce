'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, BookOpen, Search, Clock, TrendingUp, ArrowRight, Flame } from 'lucide-react';

export default function NewsPageClient({ posts, initialNewsCfg }: { posts: any[]; initialNewsCfg: any }) {
  const [newsCfg, setNewsCfg] = useState<any>(initialNewsCfg || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === 'MEOCUNG_LIVE_PREVIEW' && e.data.settings?.pages_config?.news_page) {
        setNewsCfg(e.data.settings.pages_config.news_page);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const accent = newsCfg.accent_color || '#ff7f5c';

  const categories = useMemo(() => {
    const set = new Set<string>();
    (posts || []).forEach((p: any) => {
      if (p.category) set.add(String(p.category));
    });
    return ['all', ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (posts || []).filter((p: any) => {
      const matchCat = activeCategory === 'all' || String(p.category || '') === activeCategory;
      const matchQ =
        !q ||
        String(p.title || '').toLowerCase().includes(q) ||
        String(p.summary || '').toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [posts, activeCategory, searchTerm]);

  const isDefaultView = activeCategory === 'all' && !searchTerm.trim();
  const leadPost = isDefaultView && filteredPosts.length > 0 ? filteredPosts[0] : null;
  const topRightPosts = isDefaultView && filteredPosts.length > 1 ? filteredPosts.slice(1, 5) : [];
  const mainListPosts = isDefaultView && filteredPosts.length > 5 ? filteredPosts.slice(5) : filteredPosts;
  const trendingPosts = useMemo(() => (posts || []).slice(0, 5), [posts]);

  const getImg = (p: any) =>
    p.coverImage ||
    p.image ||
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80';

  const getDate = (p: any) => {
    const raw = p.publishedAt || p.date_created;
    return raw ? new Date(raw).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Mới cập nhật';
  };

  const getExcerpt = (p: any) =>
    p.summary || p.seo?.meta_description || 'Cẩm nang chia sẻ kiến thức và kinh nghiệm chăm sóc mèo cưng khỏe mạnh chuẩn khoa học...';

  return (
    <div
      className="max-w-7xl mx-auto space-y-8 pb-12"
      style={{
        backgroundColor: newsCfg.bg_color && newsCfg.bg_color !== '#ffffff' ? newsCfg.bg_color : undefined,
        color: newsCfg.text_color || undefined,
        fontFamily: newsCfg.font_family && newsCfg.font_family !== 'inherit' ? newsCfg.font_family : undefined,
      }}
    >
      {/* 1. MASTHEAD BÁO ĐIỆN TỬ & THANH CHUYÊN MỤC */}
      {newsCfg.show_banner !== false && (
        <header className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
          <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-gray-100 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
                <BookOpen className="w-3.5 h-3.5" />
                <span>{newsCfg.badge_text || 'Tạp Chí Mèo Cưng'}</span>
                <span className="text-gray-300">•</span>
                <span className="text-gray-500 font-semibold normal-case tracking-normal">
                  {posts.length} bài viết chuyên sâu
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
                {newsCfg.title || 'Cẩm Nang Chăm Sóc Mèo & Tin Tức'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 max-w-2xl">
                {newsCfg.subtitle}
              </p>
            </div>

            <div className="relative w-full md:w-72 shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(10); }}
                placeholder="Tìm kiếm bài viết, bệnh lý, dinh dưỡng..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-full bg-gray-50 border border-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 text-gray-800"
              />
            </div>
          </div>

          <div className="px-6 sm:px-8 py-3 bg-gray-50/70 flex items-center gap-2 overflow-x-auto">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setActiveCategory(cat); setVisibleCount(10); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:text-gray-900'
                  }`}
                  style={isActive ? { backgroundColor: accent } : undefined}
                >
                  {cat === 'all' ? 'Tất cả chuyên mục' : cat}
                </button>
              );
            })}
          </div>
        </header>
      )}

      {/* 2. KHU VỰC TIN TIÊU ĐIỂM (NEWSPAPER HERO: 1 BÀI LỚN + 4 TIN MỚI BÊN PHẢI) */}
      {leadPost && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-sm">
          {/* Cột trái: Tin tiêu điểm số 1 */}
          <Link href={`/posts/${leadPost.slug}`} className="lg:col-span-7 group block space-y-4">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={getImg(leadPost)}
                alt={leadPost.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span
                className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase text-white shadow"
                style={{ backgroundColor: accent }}
              >
                Tin tiêu điểm
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="font-bold uppercase" style={{ color: accent }}>{leadPost.category || 'Cẩm nang'}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {getDate(leadPost)}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 3 phút đọc</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-gray-900 leading-tight group-hover:opacity-80 transition">
                {leadPost.title}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                {getExcerpt(leadPost)}
              </p>
            </div>
          </Link>

          {/* Cột phải: 4 tin mới nhất xếp dọc kiểu báo chí */}
          <div className="lg:col-span-5 flex flex-col justify-between divide-y divide-gray-100 lg:border-l lg:border-gray-100 lg:pl-6">
            <div className="pb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-800">
              <Flame className="w-4 h-4" style={{ color: accent }} />
              <span>Tin Mới Cập Nhật</span>
            </div>
            {topRightPosts.map((post: any) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="group py-3.5 flex gap-3.5 items-start first:pt-2 last:pb-0"
              >
                <div className="w-24 sm:w-28 aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <img
                    src={getImg(post)}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase" style={{ color: accent }}>
                    <span>{post.category || 'Cẩm nang'}</span>
                    <span className="text-gray-400 font-normal">• {getDate(post)}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:underline">
                    {post.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 line-clamp-1">
                    {getExcerpt(post)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. DANH SÁCH BÀI BÁO NẰM NGANG (8 CỘT) + SIDEBAR ĐỌC NHIỀU (4 CỘT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột trái: Danh sách bài viết dạng Editorial Horizontal */}
        <div className="lg:col-span-8 space-y-5">
          <div className="flex items-center justify-between border-b-2 pb-2.5" style={{ borderColor: accent }}>
            <h2 className="text-lg sm:text-xl font-black text-gray-900">
              {activeCategory === 'all' ? 'Bài Viết Mới Nhất' : `Chuyên mục: ${activeCategory}`}
            </h2>
            <span className="text-xs font-semibold text-gray-500">{mainListPosts.length} bài viết</span>
          </div>

          {mainListPosts.length === 0 ? (
            <div className="py-14 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-sm text-gray-500">
              Không tìm thấy bài viết nào phù hợp.
            </div>
          ) : (
            <div className="divide-y divide-gray-200/80 bg-white rounded-3xl border border-gray-200/80 px-5 sm:px-6 shadow-sm">
              {mainListPosts.slice(0, visibleCount).map((post: any) => (
                <article key={post.id} className="py-5 flex flex-col sm:flex-row gap-5 group">
                  <Link
                    href={`/posts/${post.slug}`}
                    className="sm:w-60 md:w-64 aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100 shrink-0 block"
                  >
                    <img
                      src={getImg(post)}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between space-y-2.5 min-w-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 text-[11px]">
                        <span
                          className="px-2.5 py-0.5 rounded-full font-bold uppercase"
                          style={{ backgroundColor: `${accent}18`, color: accent }}
                        >
                          {post.category || 'Cẩm nang'}
                        </span>
                        <span className="text-gray-400 inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {getDate(post)}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-gray-900 leading-snug line-clamp-2 group-hover:opacity-75 transition">
                        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                      </h3>

                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {getExcerpt(post)}
                      </p>
                    </div>

                    <div>
                      <Link
                        href={`/posts/${post.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold group-hover:translate-x-1 transition-transform"
                        style={{ color: accent }}
                      >
                        <span>{newsCfg.read_more_text || 'Đọc bài viết'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {visibleCount < mainListPosts.length && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-sm hover:opacity-90 transition"
                style={{ backgroundColor: accent }}
              >
                Xem thêm bài viết ({mainListPosts.length - visibleCount} bài còn lại)
              </button>
            </div>
          )}
        </div>

        {/* Cột phải: Sidebar Đọc Nhiều Nhất & Chuyên Mục */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
              <TrendingUp className="w-4 h-4" style={{ color: accent }} />
              <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">Đọc Nhiều Nhất</h3>
            </div>

            <div className="divide-y divide-gray-100">
              {trendingPosts.map((tp: any, idx: number) => (
                <Link key={tp.id} href={`/posts/${tp.slug}`} className="py-3 flex items-start gap-3 group first:pt-1 last:pb-0">
                  <span
                    className="text-2xl font-black leading-none select-none w-7 shrink-0 opacity-40 group-hover:opacity-100 transition"
                    style={{ color: accent }}
                  >
                    0{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-800 line-clamp-2 leading-snug group-hover:underline">
                      {tp.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 mt-1 block">{getDate(tp)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-sm space-y-3">
            <h3 className="font-black text-sm uppercase tracking-wider text-gray-900">Chuyên Mục Cẩm Nang</h3>
            <div className="flex flex-wrap gap-2">
              {categories.filter((c) => c !== 'all').map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setActiveCategory(cat); setVisibleCount(10); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-orange-50 border border-gray-200 text-xs font-semibold text-gray-700 transition"
                >
                  #{cat}
                </button>
              ))}
            </div>
          </div>

          <div
            className="rounded-3xl p-6 text-white space-y-3 shadow-md"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
          >
            <div className="text-xs font-bold uppercase tracking-wider opacity-90">🐾 Mèo Cưng Store</div>
            <h3 className="text-lg font-black leading-snug">Tìm thức ăn hạt & pate chuẩn khoa học cho boss?</h3>
            <p className="text-xs opacity-90">Giao nhanh 2H nội thành, cam kết 100% chính hãng.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-xs font-bold shadow-sm hover:opacity-95 transition"
              style={{ color: accent }}
            >
              <span>Ghé cửa hàng ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
