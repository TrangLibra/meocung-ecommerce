import { getPayloadPosts, getPayloadBanners } from '@/lib/payload';
import { getMedusaProducts } from '@/lib/medusa';
import HomePageClient from '@/components/HomePageClient';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const homePool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

async function getHomeHeroConfig() {
  try {
    const res = await homePool.query('SELECT pages_config, hotline FROM site_settings ORDER BY id ASC LIMIT 1');
    const row = res.rows[0];
    if (row?.pages_config?.home) {
      return { ...row.pages_config.home, hotline: row.hotline || '0382 542 737' };
    }
  } catch (_) {}
  return null;
}

async function getLiveBanners() {
  try {
    const res = await homePool.query('SELECT id, title, image_url, link_url, position FROM banners WHERE is_active = true ORDER BY id DESC');
    return res.rows || [];
  } catch (_) {
    return [];
  }
}

export default async function HomePage() {
  const [banners, posts, products, homeCfg, liveBanners] = await Promise.all([
    getPayloadBanners(),
    getPayloadPosts(6),
    getMedusaProducts(8),
    getHomeHeroConfig(),
    getLiveBanners(),
  ]);

  const initialBanner = {
    badge: homeCfg?.hero_badge || banners[0]?.badge || '🐾 Mèo Cưng Pet Shop TP.HCM',
    title: homeCfg?.hero_title || banners[0]?.title || 'Thức Ăn & Cẩm Nang Chăm Sóc Mèo Cưng Hoàn Hảo',
    subtitle:
      homeCfg?.hero_subtitle ||
      banners[0]?.subtitle ||
      'Cung cấp các dòng thức ăn hạt, pate thơm ngon, cát vệ sinh cao cấp và toàn bộ kiến thức nuôi dưỡng mèo chuẩn khoa học cho các "sen"!',
    buttonText: homeCfg?.hero_btn_text || banners[0]?.buttonText || 'Khám phá sản phẩm',
    buttonLink: homeCfg?.hero_btn_link || banners[0]?.buttonLink || '/products',
    hotline: homeCfg?.hotline || banners[0]?.hotline || '0382 542 737',
  };

  return (
    <HomePageClient
      initialHomeCfg={homeCfg}
      initialBanner={initialBanner}
      posts={posts}
      products={products}
      liveBanners={liveBanners}
    />
  );
}
