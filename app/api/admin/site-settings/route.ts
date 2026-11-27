import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const DEFAULT_NAVBAR_LINKS = [
  { label: 'Danh mục sản phẩm', href: '/products' },
  { label: 'Trang chủ', href: '/' },
  { label: 'Thức ăn hạt', href: '/collections/thuc-an-hat' },
  { label: 'Pate cho mèo', href: '/collections/pate-cho-meo' },
  { label: 'Cát vệ sinh', href: '/collections/cat-ve-sinh' },
  { label: 'Cẩm nang nuôi mèo', href: '/tin-tuc' },
];

const DEFAULT_PAGES_CONFIG = {
  home: {
    hero_badge: '🐾 Mèo Cưng Pet Shop TP.HCM',
    hero_title: 'Thức Ăn & Cẩm Nang Chăm Sóc Mèo Cưng Hoàn Hảo',
    hero_subtitle:
      'Cung cấp các dòng thức ăn hạt, pate thơm ngon, cát vệ sinh cao cấp và toàn bộ kiến thức nuôi dưỡng mèo chuẩn khoa học cho các "sen"!',
    hero_btn_text: 'Khám phá sản phẩm',
    hero_btn_link: '/products',
  },
  product_detail: {
    in_stock_text: 'Còn hàng',
    add_cart_text: 'Thêm vào giỏ hàng',
    buy_now_text: 'Mua ngay',
    badge_shipping: 'Giao 2H TP.HCM',
    badge_authentic: '100% Chính hãng',
    badge_return: 'Đổi trả 7 ngày',
  },
  news_page: {
    badge_text: 'PayloadCMS 3.0 Headless CMS',
    title: 'Cẩm Nang Chăm Sóc Mèo & Tin Tức Mới',
    subtitle:
      'Tổng hợp 100+ kiến thức dinh dưỡng, cách phòng bệnh và cẩm nang nuôi dưỡng thú cưng chuẩn khoa học từ PayloadCMS',
    read_more_text: 'Đọc tiếp',
  },
  footer: {
    col2_title: 'Danh Mục Nổi Bật',
    col2_links: [
      { label: 'Thức ăn hạt dinh dưỡng', href: '/products?category=thuc-an-hat' },
      { label: 'Pate & Súp thưởng cho mèo', href: '/products?category=pate-cho-meo' },
      { label: 'Cát vệ sinh khử mùi', href: '/products?category=cat-ve-sinh' },
      { label: 'Cẩm nang chăm sóc mèo cưng', href: '/tin-tuc' },
    ],
    col3_title: 'Chính Sách & Hỗ Trợ',
    col3_links: [
      { label: 'Chính sách giao hàng 2H', href: '/chinh-sach#giao-hang' },
      { label: 'Chính sách đổi trả trong 7 ngày', href: '/chinh-sach#doi-tra' },
      { label: 'Hướng dẫn mua hàng & thanh toán', href: '/chinh-sach#mua-hang' },
      { label: 'Cam kết sản phẩm chính hãng', href: '/chinh-sach#chinh-hang' },
    ],
    col4_title: 'Kết Nối Với Mèo Cưng',
    col4_desc: 'Đăng ký nhận thông tin khuyến mãi và bí quyết chăm sóc hoàng thượng khỏe mạnh!',
    col4_btn: 'Gửi',
  },
};

let schemaReady = false;
async function ensureSiteSettingsColumns() {
  if (schemaReady) return;
  await pool.query(`
    ALTER TABLE site_settings
      ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '',
      ADD COLUMN IF NOT EXISTS logo_emoji TEXT DEFAULT '🐱',
      ADD COLUMN IF NOT EXISTS tagline TEXT DEFAULT 'Thức ăn & Cẩm nang mèo',
      ADD COLUMN IF NOT EXISTS top_notice TEXT DEFAULT 'Mèo Cưng - Hệ thống phân phối thức ăn & cẩm nang chăm sóc mèo hàng đầu TP.HCM • Giao hàng hỏa tốc 2H!',
      ADD COLUMN IF NOT EXISTS shipping_badge TEXT DEFAULT 'Giao nhanh 2h tại TP.HCM',
      ADD COLUMN IF NOT EXISTS navbar_links JSONB,
      ADD COLUMN IF NOT EXISTS footer_about TEXT DEFAULT 'Mèo Cưng - Địa chỉ tin cậy chuyên cung cấp thức ăn hạt, pate dinh dưỡng, cát vệ sinh và cẩm nang nuôi dưỡng thú cưng hàng đầu tại TP. Hồ Chí Minh.',
      ADD COLUMN IF NOT EXISTS footer_copyright TEXT DEFAULT 'Bản quyền thuộc về Mèo Cưng Storefront.',
      ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#ff7f5c',
      ADD COLUMN IF NOT EXISTS pages_config JSONB;
  `);
  schemaReady = true;
}

function normalizeSettings(row: any) {
  const rawPages = row?.pages_config || {};
  return {
    id: row?.id || 1,
    site_name: row?.site_name || 'Mèo Cưng',
    hotline: row?.hotline || '0382 542 737',
    address: row?.address || 'Quận 1, TP. Hồ Chí Minh, Việt Nam',
    facebook_url: row?.facebook_url || 'https://facebook.com/meocung',
    logo_url: row?.logo_url || '',
    logo_emoji: row?.logo_emoji || '🐱',
    tagline: row?.tagline || 'Thức ăn & Cẩm nang mèo',
    top_notice:
      row?.top_notice ||
      'Mèo Cưng - Hệ thống phân phối thức ăn & cẩm nang chăm sóc mèo hàng đầu TP.HCM • Giao hàng hỏa tốc 2H!',
    shipping_badge: row?.shipping_badge || 'Giao nhanh 2h tại TP.HCM',
    navbar_links:
      Array.isArray(row?.navbar_links) && row.navbar_links.length > 0
        ? row.navbar_links
        : DEFAULT_NAVBAR_LINKS,
    footer_about:
      row?.footer_about ||
      'Mèo Cưng - Địa chỉ tin cậy chuyên cung cấp thức ăn hạt, pate dinh dưỡng, cát vệ sinh và cẩm nang nuôi dưỡng thú cưng hàng đầu tại TP. Hồ Chí Minh.',
    footer_copyright: row?.footer_copyright || 'Bản quyền thuộc về Mèo Cưng Storefront.',
    primary_color: row?.primary_color || '#ff7f5c',
    pages_config: {
      home: { ...DEFAULT_PAGES_CONFIG.home, ...(rawPages.home || {}) },
      product_detail: { ...DEFAULT_PAGES_CONFIG.product_detail, ...(rawPages.product_detail || {}) },
      news_page: { ...DEFAULT_PAGES_CONFIG.news_page, ...(rawPages.news_page || {}) },
      footer: {
        ...DEFAULT_PAGES_CONFIG.footer,
        ...(rawPages.footer || {}),
        col2_links:
          Array.isArray(rawPages.footer?.col2_links) && rawPages.footer.col2_links.length > 0
            ? rawPages.footer.col2_links
            : DEFAULT_PAGES_CONFIG.footer.col2_links,
        col3_links:
          Array.isArray(rawPages.footer?.col3_links) && rawPages.footer.col3_links.length > 0
            ? rawPages.footer.col3_links
            : DEFAULT_PAGES_CONFIG.footer.col3_links,
      },
    },
    updated_at: row?.updated_at || null,
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    await ensureSiteSettingsColumns();
    const res = await pool.query('SELECT * FROM site_settings ORDER BY id ASC LIMIT 1');
    const settings = normalizeSettings(res.rows[0]);
    return NextResponse.json({ settings }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('[GET /api/admin/site-settings]:', err);
    return NextResponse.json(
      { settings: normalizeSettings(null), error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureSiteSettingsColumns();
    const body = await request.json();

    const navbarLinksJson = Array.isArray(body.navbar_links)
      ? JSON.stringify(body.navbar_links.filter((x: any) => x && x.label && x.href))
      : JSON.stringify(DEFAULT_NAVBAR_LINKS);
    const pagesConfigJson = JSON.stringify(body.pages_config || DEFAULT_PAGES_CONFIG);

    const existing = await pool.query('SELECT id FROM site_settings ORDER BY id ASC LIMIT 1');
    let res;
    if (existing.rows.length > 0) {
      res = await pool.query(
        `UPDATE site_settings
         SET site_name = $2,
             hotline = $3,
             address = $4,
             facebook_url = $5,
             logo_url = $6,
             logo_emoji = $7,
             tagline = $8,
             top_notice = $9,
             shipping_badge = $10,
             navbar_links = $11::jsonb,
             footer_about = $12,
             footer_copyright = $13,
             primary_color = $14,
             pages_config = $15::jsonb,
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [
          existing.rows[0].id,
          body.site_name || 'Mèo Cưng',
          body.hotline || '0382 542 737',
          body.address || '',
          body.facebook_url || '',
          body.logo_url || '',
          body.logo_emoji || '🐱',
          body.tagline || '',
          body.top_notice || '',
          body.shipping_badge || '',
          navbarLinksJson,
          body.footer_about || '',
          body.footer_copyright || '',
          body.primary_color || '#ff7f5c',
          pagesConfigJson,
        ]
      );
    } else {
      res = await pool.query(
        `INSERT INTO site_settings (
           site_name, hotline, address, facebook_url, logo_url, logo_emoji, tagline,
           top_notice, shipping_badge, navbar_links, footer_about, footer_copyright, primary_color, pages_config,
           created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12,$13,$14::jsonb,NOW(),NOW())
         RETURNING *`,
        [
          body.site_name || 'Mèo Cưng',
          body.hotline || '0382 542 737',
          body.address || '',
          body.facebook_url || '',
          body.logo_url || '',
          body.logo_emoji || '🐱',
          body.tagline || '',
          body.top_notice || '',
          body.shipping_badge || '',
          navbarLinksJson,
          body.footer_about || '',
          body.footer_copyright || '',
          body.primary_color || '#ff7f5c',
          pagesConfigJson,
        ]
      );
    }

    return NextResponse.json(
      { success: true, settings: normalizeSettings(res.rows[0]) },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[PUT /api/admin/site-settings]:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
