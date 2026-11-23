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
  id: string | number;
  slug: string;
  name: string;
  icon: string;
  description: string;
}

// URL PayloadCMS (nếu deploy trên Vercel cùng Next.js hoặc backend độc lập)
export const PAYLOAD_CMS_URL =
  process.env.NEXT_PUBLIC_PAYLOAD_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

// Banners quảng cáo Mèo Cưng chuẩn thiết kế
export const DEFAULT_BANNERS: PayloadBanner[] = [
  {
    id: 'banner-hero-1',
    title: 'Thức Ăn & Cẩm Nang Chăm Sóc Mèo Cưng Hoàn Hảo',
    subtitle: 'Cung cấp đầy đủ 8 dòng thức ăn hạt cao cấp, pate thơm ngon, cát vệ sinh khử mùi và toàn bộ kiến thức nuôi dưỡng mèo chuẩn khoa học cho các "sen"!',
    badge: '🐾 Mèo Cưng Pet Shop TP.HCM',
    buttonText: 'Khám phá 8 sản phẩm',
    buttonLink: '/products',
    hotline: '0382 542 737',
    active: true
  }
];

// Danh mục cẩm nang & sản phẩm chăm sóc mèo
export const DEFAULT_CATEGORIES: PayloadCategory[] = [
  { slug: 'thuc-an-hat', name: 'Thức ăn hạt', icon: '🥣', description: 'Hạt dinh dưỡng cao cấp, ngừa sỏi thận' },
  { slug: 'pate-cho-meo', name: 'Pate cho mèo', icon: '🥫', description: 'Bổ sung nước, kích thích ăn ngon' },
  { slug: 'cat-ve-sinh', name: 'Cát vệ sinh', icon: '📦', description: 'Vón hút nhanh, khử mùi 100%' },
  { slug: 'phu-kien', name: 'Phụ kiện & Đồ chơi', icon: '🧶', description: 'Đồ chơi xả stress, dụng cụ chăm sóc' },
];

/**
 * Lấy danh sách bài viết cẩm nang từ PayloadCMS (với fallback tự động sang bài viết mẫu)
 */
export async function getPayloadPosts(limit = 10): Promise<PostModel[]> {
  try {
    const res = await fetch(`${PAYLOAD_CMS_URL}/api/posts?limit=${limit}`, {
      next: { revalidate: 60 }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.docs) && data.docs.length > 0) {
        return data.docs.map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          content: doc.content,
          image: doc.image?.url || doc.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
          category: doc.category?.name || doc.category || 'Cẩm nang nuôi mèo',
          status: doc.status || 'published',
          date_created: doc.createdAt,
          date_updated: doc.updatedAt,
          seo: {
            title: doc.seo?.title || doc.title,
            meta_description: doc.seo?.meta_description || doc.title,
            og_image: doc.seo?.og_image || doc.image?.url
          }
        }));
      }
    }
  } catch (err) {
    console.warn('[PayloadCMS] Không kết nối được API, đang nạp dữ liệu cẩm nang Mèo Cưng dự phòng:', err);
  }
  return SAMPLE_MEOCUNG_POSTS;
}

/**
 * Lấy chi tiết 1 bài viết cẩm nang theo Slug
 */
export async function getPayloadPostBySlug(slug: string): Promise<PostModel | null> {
  try {
    const res = await fetch(`${PAYLOAD_CMS_URL}/api/posts?where[slug][equals]=${slug}&limit=1`, {
      next: { revalidate: 60 }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.docs) && data.docs.length > 0) {
        const doc = data.docs[0];
        return {
          id: doc.id,
          title: doc.title,
          slug: doc.slug,
          content: doc.content,
          image: doc.image?.url || doc.image,
          category: doc.category?.name || doc.category,
          status: doc.status,
          date_created: doc.createdAt,
          seo: doc.seo
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
    const res = await fetch(`${PAYLOAD_CMS_URL}/api/banners?where[active][equals]=true`, {
      next: { revalidate: 60 }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.docs) && data.docs.length > 0) {
        return data.docs;
      }
    }
  } catch (err) {
    console.warn('[PayloadCMS] Lấy banners lỗi, nạp mặc định:', err);
  }
  return DEFAULT_BANNERS;
}
