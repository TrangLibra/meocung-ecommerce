import React from 'react';
import { Pool } from 'pg';
import NewsPageClient from '@/components/NewsPageClient';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

async function getLivePosts() {
  try {
    const res = await pool.query(
      'SELECT id, title, slug, category, published_at as "publishedAt", summary, cover_image as "coverImage", status FROM posts ORDER BY id DESC LIMIT 150'
    );
    if (res.rows && res.rows.length > 0) return res.rows;
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
    show_banner: true,
    columns_count: 4,
  };
}

export default async function NewsPage() {
  const [posts, newsCfg] = await Promise.all([getLivePosts(), getNewsPageConfig()]);
  return <NewsPageClient posts={posts} initialNewsCfg={newsCfg} />;
}
