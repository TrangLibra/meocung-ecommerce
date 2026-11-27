'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight, BookOpen } from 'lucide-react';

export default function NewsPageClient({ posts, initialNewsCfg }: { posts: any[]; initialNewsCfg: any }) {
  const [newsCfg, setNewsCfg] = useState<any>(initialNewsCfg || {});

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

  return (
    <div
      className="space-y-8 rounded-3xl p-2"
      style={{
        backgroundColor: newsCfg.bg_color && newsCfg.bg_color !== '#ffffff' ? newsCfg.bg_color : undefined,
        color: newsCfg.text_color || undefined,
        fontFamily: newsCfg.font_family && newsCfg.font_family !== 'inherit' ? newsCfg.font_family : undefined,
      }}
    >
      {/* Banner */}
      {newsCfg.show_banner !== false && (
        <div className="bg-gradient-to-r from-orange-50 via-white to-orange-50 p-6 sm:p-8 rounded-3xl border border-orange-100 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: accent }}>
            <BookOpen className="w-4 h-4" />
            {newsCfg.badge_text}
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900">
            {newsCfg.title}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            {newsCfg.subtitle}
          </p>
        </div>
      )}

      {/* Posts Grid */}
      <div className={`grid ${colClass} gap-6`}>
        {posts.map((post: any) => {
          const formattedDate =
            post.publishedAt || post.date_created
              ? new Date(post.publishedAt || post.date_created).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
              : null;

          const imageUrl =
            post.coverImage ||
            post.image ||
            'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80';
          const metaDesc = post.summary || post.seo?.meta_description || 'Xem hướng dẫn chi tiết chăm sóc mèo cưng...';

          return (
            <article
              key={post.id}
              className="group flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                  src={imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <span
                    className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold shadow-sm uppercase"
                    style={{ color: accent }}
                  >
                    {post.category || 'Cẩm nang'}
                  </span>
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  {formattedDate && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formattedDate}</span>
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base transition line-clamp-2 leading-snug">
                    {post.title}
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
    </div>
  );
}
