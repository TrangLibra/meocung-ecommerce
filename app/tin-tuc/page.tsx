import React from 'react';
import Link from 'next/link';
import { Pool } from 'pg';
import { Calendar, ChevronRight, BookOpen, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});

async function getLivePosts() {
  try {
    const res = await pool.query(
      'SELECT id, title, slug, category, published_at as "publishedAt", summary, cover_image as "coverImage", status FROM posts ORDER BY id DESC LIMIT 150'
    );
    if (res.rows && res.rows.length > 0) {
      return res.rows;
    }
  } catch (e) {
    console.error('Error fetching live posts in tin-tuc page:', e);
  }
  return [];
}

async function getNewsPageConfig() {
  try {
    const res = await pool.query('SELECT pages_config FROM site_settings ORDER BY id ASC LIMIT 1');
    const news = res.rows[0]?.pages_config?.news_page;
    if (news) return news;
  } catch (_) {}
  return {
    badge_text: 'PayloadCMS 3.0 Headless CMS',
    title: 'Cẩm Nang Chăm Sóc Mèo & Tin Tức Mới',
    subtitle: 'Tổng hợp 100+ kiến thức dinh dưỡng, cách phòng bệnh và cẩm nang nuôi dưỡng thú cưng chuẩn khoa học từ PayloadCMS',
    read_more_text: 'Đọc tiếp',
  };
}

export default async function NewsPage() {
  const [posts, newsCfg] = await Promise.all([getLivePosts(), getNewsPageConfig()]);

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="bg-gradient-to-r from-orange-50 via-white to-orange-50 p-6 sm:p-8 rounded-3xl border border-orange-100 space-y-2">
        <span className="text-xs font-bold text-[#ff7f5c] uppercase tracking-wider flex items-center gap-1.5">
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

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {posts.map((post: any) => {
          const formattedDate = post.publishedAt || post.date_created
            ? new Date(post.publishedAt || post.date_created).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : null;

          const imageUrl = post.coverImage || post.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80';
          const metaDesc = post.summary || post.seo?.meta_description || 'Xem hướng dẫn chi tiết chăm sóc mèo cưng...';

          return (
            <article
              key={post.id}
              className="group flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-[#ff7f5c]/50 hover:shadow-xl transition-all duration-300"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                  src={imageUrl}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-[#ff7f5c] shadow-sm uppercase">
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
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-[#ff7f5c] transition line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {metaDesc}
                  </p>
                </div>

                <Link
                  href={`/posts/${post.slug}`}
                  className="inline-flex items-center justify-between text-xs font-bold text-[#ff7f5c] group-hover:translate-x-0.5 transition pt-2 border-t border-gray-50"
                >
                  <span>Xem chi tiết</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
