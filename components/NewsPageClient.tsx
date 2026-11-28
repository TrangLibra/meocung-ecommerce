'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, BookOpen, Search, Sparkles, ArrowRight } from 'lucide-react';

export default function NewsPageClient({ posts, initialNewsCfg }: { posts: any[]; initialNewsCfg: any }) {
  const [newsCfg, setNewsCfg] = useState<any>(initialNewsCfg || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

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
  const colClass =
    Number(newsCfg.columns_count) === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : Number(newsCfg.columns_count) === 3
      ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

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

  const showSpotlight = activeCategory === 'all' && !searchTerm.trim() && filteredPosts.length >= 3;
  const featuredMain = showSpotlight ? filteredPosts[0] : null;
  const featuredSide = showSpotlight ? filteredPosts.slice(1, 3) : [];
  const gridPosts = showSpotlight ? filteredPosts.slice(3) : filteredPosts;

  const getImg = (p: any) =>
    p.coverImage ||
    p.image ||
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80';

  const getDate = (p: any) => {
    const raw = p.publishedAt || p.date_created;
    return raw ? new Date(raw).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
  };

  return (
    <div
      className="space-y-8 rounded-3xl p-2 sm:p-4"
      style={{
        backgroundColor: newsCfg.bg_color && newsCfg.bg_color !== '#ffffff' ? newsCfg.bg_color : undefined,
        color: newsCfg.text_color || undefined,
        fontFamily: newsCfg.font_family && newsCfg.font_family !== 'inherit' ? newsCfg.font_family : undefined,
      }}
    >
      {/* Editorial Hero Banner */}
      {newsCfg.show_banner !== false && (
        <div
          className="relative overflow-hidden p-6 sm:p-10 rounded-3xl border border-black/5 shadow-sm space-y-5"
          style={{ background: `linear-gradient(135deg, ${accent}14, #ffffff 65%, ${accent}0d)` }}
        >
          <div className="max-w-3xl space-y-2.5">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white shadow-sm border border-black/5"
              style={{ color: accent }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {newsCfg.badge_text}
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-gray-900 leading-tight">
              {newsCfg.title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              {newsCfg.subtitle}
            </p>
          </div>

          {/* Search & Category Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      isActive
                        ? 'text-white shadow-sm border-transparent'
                        : 'bg-white/90 text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                    style={isActive ? { backgroundColor: accent } : undefined}
                  >
                    {cat === 'all' ? `Tất cả (${posts.length})` : cat}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm bài viết cẩm nang..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-full bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-200 text-gray-800"
              />
            </div>
          </div>
        </div>
      )}

      {/* Spotlight Magazine Section (1 Hero Article + 2 Side Articles) */}
      {showSpotlight && featuredMain && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Link
            href={`/posts/${featuredMain.slug}`}
            className="lg:col-span-7 group relative rounded-3xl overflow-hidden border border-gray-200 bg-gray-900 min-h-[320px] sm:min-h-[380px] flex flex-col justify-end shadow-md"
          >
            <img
              src={getImg(featuredMain)}
              alt={featuredMain.title}
              className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            <div className="relative z-10 p-6 sm:p-8 space-y-2.5 text-white">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase text-white"
                  style={{ backgroundColor: accent }}
                >
                  <Sparkles className="w-3 h-3" /> Bài viết nổi bật
                </span>
                {featuredMain.category && (
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase">
                    {featuredMain.category}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black leading-snug line-clamp-2">
                {featuredMain.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/80 line-clamp-2">
                {featuredMain.summary || 'Khám phá kiến thức chăm sóc mèo cưng chuẩn khoa học...'}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold pt-1 text-orange-200 group-hover:translate-x-1 transition-transform">
                {newsCfg.read_more_text || 'Đọc tiếp'} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>

          <div className="lg:col-span-5 flex flex-col gap-4">
            {featuredSide.map((post: any) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="group flex-1 flex gap-4 bg-white rounded-2xl border border-gray-200 p-3.5 hover:shadow-lg transition-all"
              >
                <div className="w-32 sm:w-36 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={getImg(post)}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex flex-col justify-between py-0.5 min-w-0">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase" style={{ color: accent }}>
                      <span>{post.category || 'Cẩm nang'}</span>
                      {getDate(post) && <span className="text-gray-400 font-normal">• {getDate(post)}</span>}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {post.summary || 'Xem hướng dẫn chi tiết...'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold pt-1" style={{ color: accent }}>
                    {newsCfg.read_more_text || 'Đọc tiếp'} <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main Posts Grid */}
      {gridPosts.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-sm text-gray-500">
          Không tìm thấy bài viết phù hợp với từ khóa "{searchTerm}".
        </div>
      ) : (
        <div className={`grid ${colClass} gap-5`}>
          {gridPosts.map((post: any) => {
            const formattedDate = getDate(post);
            const metaDesc = post.summary || post.seo?.meta_description || 'Xem hướng dẫn chi tiết chăm sóc mèo cưng...';
            return (
              <article
                key={post.id}
                className="group flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <Link href={`/posts/${post.slug}`} className="relative aspect-[16/10] overflow-hidden bg-gray-100 block">
                  <img
                    src={getImg(post)}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <span
                      className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-[10px] font-bold shadow-sm uppercase"
                      style={{ color: accent }}
                    >
                      {post.category || 'Cẩm nang'}
                    </span>
                  </div>
                </Link>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    {formattedDate && (
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formattedDate}</span>
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base transition line-clamp-2 leading-snug">
                      <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {metaDesc}
                    </p>
                  </div>

                  <Link
                    href={`/posts/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold group-hover:translate-x-1 transition-transform pt-2 border-t border-gray-100"
                    style={{ color: accent }}
                  >
                    <span>{newsCfg.read_more_text || 'Đọc tiếp'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
