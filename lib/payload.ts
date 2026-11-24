import { PostModel, SAMPLE_MEOCUNG_POSTS } from './directus';

export interface PayloadBanner {
  id: string | number;
  title: string;
  subtitle?: string;
  badge?: string;
  buttonText?: string;
  buttonLink?: string;
  hotline?: string;
  imageUrl?: string;
  bgColor?: string;
  active: boolean;
}

export interface PayloadCategory {
  id?: string | number;
  slug: string;
  name: string;
  icon: string;
  description: string;
}

// URL chính thức của PayloadCMS Standalone trên Vercel
export const PAYLOAD_CMS_URL =
  process.env.NEXT_PUBLIC_PAYLOAD_URL || 'https://meocung-payload.vercel.app';

// Banners quảng cáo Mèo Cưng chuẩn thiết kế
export const DEFAULT_BANNERS: PayloadBanner[] = [
  {
    id: 'banner-hero-1',
    title: 'Thức Ăn & Cẩm Nang Chăm Sóc Mèo Cưng Hoàn Hảo',
    subtitle: 'Cung cấp đầy đủ các dòng thức ăn hạt cao cấp, pate thơm ngon, cát vệ sinh khử mùi và toàn bộ kiến thức nuôi dưỡng mèo chuẩn khoa học cho các "sen"!',
    badge: '🐾 Mèo Cưng Pet Shop TP.HCM',
    buttonText: 'Khám phá sản phẩm',
    buttonLink: '/products',
    hotline: '0382 542 737',
    active: true
  }
];

export const DEFAULT_CATEGORIES: PayloadCategory[] = [
  { slug: 'thuc-an-hat', name: 'Thức ăn hạt', icon: '🥣', description: 'Hạt dinh dưỡng cao cấp, ngừa sỏi thận' },
  { slug: 'pate-cho-meo', name: 'Pate cho mèo', icon: '🥫', description: 'Bổ sung nước, kích thích ăn ngon' },
  { slug: 'cat-ve-sinh', name: 'Cát vệ sinh', icon: '📦', description: 'Vón hút nhanh, khử mùi 100%' },
  { slug: 'kinh-nghiem', name: 'Kinh nghiệm nuôi mèo', icon: '🐈', description: 'Cẩm nang nuôi mèo chuẩn khoa học' },
  { slug: 'giong-meo', name: 'Giống mèo', icon: '🐾', description: 'Tìm hiểu các giống mèo phổ biến' },
];

/**
 * Lấy danh sách bài viết cẩm nang trực tiếp từ PayloadCMS Vercel API
 */
export async function getPayloadPosts(limit = 100): Promise<PostModel[]> {
  try {
    const res = await fetch(`${PAYLOAD_CMS_URL}/api/posts?limit=${limit}&sort=-publishedAt`, {
      next: { revalidate: 15 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.docs) && data.docs.length > 0) {
        return data.docs.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          category: doc.category || 'kinh-nghiem',
          image: doc.coverImage || doc.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
          content: doc.content || `<p>${doc.summary || ''}</p>`,
          status: doc.status || 'published',
          date_created: doc.publishedAt || doc.createdAt,
          date_updated: doc.updatedAt,
          seo: {
            title: doc.title,
            meta_description: doc.summary,
            canonical_url: `https://meocung-ecommerce-seven.vercel.app/posts/${doc.slug}`,
            og_image: doc.coverImage,
          },
        }));
      }
    }
  } catch (err) {
    console.warn('[PayloadCMS] Không thể fetch posts từ API, fallback sang bài viết mẫu:', err);
  }

  return SAMPLE_MEOCUNG_POSTS;
}

/**
 * Lấy chi tiết 1 bài viết cẩm nang theo Slug từ PayloadCMS
 */
export async function getPayloadPostBySlug(slug: string): Promise<PostModel | null> {
  try {
    const res = await fetch(`${PAYLOAD_CMS_URL}/api/posts?where[slug][equals]=${encodeURIComponent(slug)}&limit=1`, {
      next: { revalidate: 15 },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.docs) && data.docs.length > 0) {
        const doc = data.docs[0];
        return {
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          category: doc.category || 'kinh-nghiem',
          content: doc.content || `<p>${doc.summary || ''}</p>`,
          image: doc.coverImage || doc.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
          status: doc.status || 'published',
          date_created: doc.publishedAt || doc.createdAt,
          date_updated: doc.updatedAt,
          seo: {
            title: doc.title,
            meta_description: doc.summary,
            canonical_url: `https://meocung-ecommerce-seven.vercel.app/posts/${doc.slug}`,
            og_image: doc.coverImage,
          },
        };
      }
    }
  } catch (err) {
    console.warn(`[PayloadCMS] Fallback bài viết slug ${slug}:`, err);
  }

  const found = SAMPLE_MEOCUNG_POSTS.find(p => p.slug === slug);
  return found || null;
}

/**
 * Lấy thông tin banner trang chủ từ PayloadCMS
 */
export async function getPayloadBanners(): Promise<PayloadBanner[]> {
  try {
    const res = await fetch(`${PAYLOAD_CMS_URL}/api/banners?where[isActive][equals]=true`, {
      next: { revalidate: 30 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.docs) && data.docs.length > 0) {
        return data.docs.map((b: any) => ({
          id: b.id,
          title: b.title,
          subtitle: 'Ưu đãi thức ăn hạt & pate cho mèo cưng',
          imageUrl: b.imageUrl,
          buttonText: 'Xem ngay',
          buttonLink: b.linkUrl || '/products',
          active: b.isActive,
        }));
      }
    }
  } catch (err) {
    console.warn('[PayloadCMS] Lấy banners lỗi, nạp mặc định:', err);
  }
  return DEFAULT_BANNERS;
}
