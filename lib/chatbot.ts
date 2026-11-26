import { getMedusaProducts } from './medusa';
import { getPayloadPosts } from './payload';
import { Product, PRODUCTS, CATEGORIES } from './products';
import { PostModel } from './directus';

export interface ChatProductSuggestion {
  id: string;
  name: string;
  price: number;
  image: string;
  categoryName: string;
  product: Product;
}

export interface ChatPostSuggestion {
  slug: string;
  title: string;
  category?: string;
}

function normalizeVietnamese(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const SYSTEM_INSTRUCTION = `Bạn là chuyên viên tư vấn thú cưng thân thiện, giàu kinh nghiệm của cửa hàng "Mèo Cưng" tại TP.HCM.

NGUYÊN TẮC TƯ VẤN CHUYÊN SÂU:
1. Luôn chủ động gọi ngay các công cụ (tools) để tra cứu dữ liệu thật của cửa hàng trước khi trả lời. Nếu khách hỏi chung (vd: "các sp cao nhất", "sản phẩm rẻ nhất", "mèo 10 tháng ăn gì"), hãy gọi ngay search_products (và search_guides nếu liên quan chăm sóc/sức khỏe) thay vì hỏi lại.
2. Tuyệt đối không bịa tên sản phẩm, giá tiền hoặc bài viết không có trong kết quả tool.
3. Tư vấn có chiều sâu như nhân viên pet shop thật:
   - Giải thích ngắn gọn **tại sao sản phẩm phù hợp** với độ tuổi/tình trạng mèo (mèo con, mèo trưởng thành, kén ăn, rụng lông/búi lông, tiêu hóa/táo bón, khử mùi...).
   - Gợi ý cách cho ăn hợp lý (vd: trộn hạt + pate để bổ sung nước và kích thích ăn ngon) hoặc ghép **combo đạt 300.000₫ để được Freeship**.
4. Trình bày gọn gàng bằng tiếng Việt tự nhiên, dùng bullet (•) và **in đậm** tên sản phẩm, giá tiền.
5. Chính sách shop: Giao hỏa tốc 2H tại TP.HCM, miễn phí ship đơn từ 300.000₫ (dưới 300.000₫ phí 25.000₫), thanh toán COD, đổi trả 7 ngày, Hotline: 0382 542 737.`;

export const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'get_store_overview',
        description:
          'Lấy tổng quan cửa hàng Mèo Cưng: tất cả danh mục đang bán, tổng số sản phẩm, khoảng giá và các sản phẩm tiêu biểu. Dùng khi khách hỏi shop bán gì, có những loại nào, giới thiệu cửa hàng.',
        parameters: {
          type: 'OBJECT',
          properties: {},
        },
      },
      {
        name: 'search_products',
        description:
          'Tìm kiếm, lọc và sắp xếp sản phẩm thật trong kho Mèo Cưng theo từ khóa, danh mục, khoảng giá hoặc thứ tự giá (cao nhất / thấp nhất / bán chạy).',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Từ khóa tìm kiếm sản phẩm (vd: "royal canin", "cá hồi", "đậu nành", "cào móng"). Có thể bỏ trống nếu chỉ lọc theo danh mục hoặc sắp xếp theo giá.',
            },
            category: {
              type: 'STRING',
              description:
                'Slug danh mục sản phẩm: "thuc-an-hat", "pate-cho-meo", "cat-ve-sinh", hoặc "phu-kien". Bỏ trống nếu tìm trên toàn bộ kho.',
            },
            minPrice: {
              type: 'NUMBER',
              description: 'Giá tối thiểu (VNĐ).',
            },
            maxPrice: {
              type: 'NUMBER',
              description: 'Giá tối đa (VNĐ), ví dụ 200000 cho "dưới 200k".',
            },
            sortBy: {
              type: 'STRING',
              description:
                'Cách sắp xếp: "price_desc" (giá cao nhất trước), "price_asc" (giá thấp nhất trước), hoặc "popular" (bán chạy nhất).',
            },
            limit: {
              type: 'NUMBER',
              description: 'Số lượng sản phẩm tối đa trả về (mặc định 4, tối đa 10).',
            },
          },
        },
      },
      {
        name: 'search_guides',
        description:
          'Tìm bài viết cẩm nang chăm sóc mèo (dinh dưỡng, bệnh lý, táo bón, triệt sản, giống mèo...) từ hệ thống bài viết của Mèo Cưng.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'Chủ đề hoặc từ khóa cần tìm trong cẩm nang chăm sóc mèo.',
            },
          },
          required: ['query'],
        },
      },
    ],
  },
];

export interface ToolExecutionAccumulator {
  products: Product[];
  posts: PostModel[];
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const globalCache = globalThis as unknown as {
  __meocungProductsCache?: { data: Product[]; expiresAt: number };
  __meocungPostsCache?: { data: PostModel[]; expiresAt: number };
};

async function getCachedProducts(): Promise<Product[]> {
  if (
    globalCache.__meocungProductsCache &&
    Date.now() < globalCache.__meocungProductsCache.expiresAt
  ) {
    return globalCache.__meocungProductsCache.data;
  }
  const medusaProducts = await getMedusaProducts(50).catch(() => PRODUCTS);
  const data = medusaProducts.length > 0 ? medusaProducts : PRODUCTS;
  globalCache.__meocungProductsCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

async function getCachedPosts(): Promise<PostModel[]> {
  if (
    globalCache.__meocungPostsCache &&
    Date.now() < globalCache.__meocungPostsCache.expiresAt
  ) {
    return globalCache.__meocungPostsCache.data;
  }
  const data = await getPayloadPosts(30).catch(() => [] as PostModel[]);
  globalCache.__meocungPostsCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
  return data;
}

export async function executeAgentTool(
  name: string,
  args: Record<string, unknown>,
  acc: ToolExecutionAccumulator
): Promise<Record<string, unknown>> {
  const allProducts = await getCachedProducts();

  if (name === 'get_store_overview') {
    const prices = allProducts.map((p) => p.price);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const maxPrice = prices.length ? Math.max(...prices) : 0;

    // Pick 1 representative product per category for UI cards
    const seen = new Set<string>();
    const sampleProducts: Product[] = [];
    for (const p of allProducts) {
      if (!seen.has(p.categorySlug)) {
        seen.add(p.categorySlug);
        sampleProducts.push(p);
      }
    }
    for (const p of sampleProducts.slice(0, 3)) {
      if (!acc.products.some((x) => x.id === p.id)) acc.products.push(p);
    }

    return {
      storeName: 'Mèo Cưng Pet Shop TP.HCM',
      totalProducts: allProducts.length,
      priceRange: { minPrice, maxPrice },
      categories: CATEGORIES.map((c) => ({
        slug: c.slug,
        name: c.name,
        description: c.desc,
        productCount: allProducts.filter((p) => p.categorySlug === c.slug).length,
      })),
      featuredProducts: sampleProducts.map((p) => ({
        id: p.id,
        name: p.name,
        categoryName: p.categoryName,
        price: p.price,
        weight: p.weight,
      })),
    };
  }

  if (name === 'search_products') {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    const category = typeof args.category === 'string' ? args.category.trim() : '';
    let minPrice =
      typeof args.minPrice === 'number' && Number.isFinite(args.minPrice) && args.minPrice >= 0
        ? args.minPrice
        : undefined;
    let maxPrice =
      typeof args.maxPrice === 'number' && Number.isFinite(args.maxPrice) && args.maxPrice >= 0
        ? args.maxPrice
        : undefined;
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }
    const sortBy = typeof args.sortBy === 'string' ? args.sortBy : 'popular';
    const rawLimit = Number(args.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.floor(rawLimit), 1), 10)
      : 4;

    let filtered = [...allProducts];

    if (category) {
      filtered = filtered.filter((p) => p.categorySlug === category);
    }
    if (minPrice !== undefined) {
      filtered = filtered.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      filtered = filtered.filter((p) => p.price <= maxPrice);
    }
    if (query) {
      const qNorm = normalizeVietnamese(query);
      const qTokens = qNorm.split(' ').filter((t) => t.length >= 2);
      filtered = filtered
        .map((p) => {
          const hay = normalizeVietnamese(
            `${p.name} ${p.categoryName} ${p.description} ${p.weight || ''}`
          );
          let score = hay.includes(qNorm) ? 10 : 0;
          for (const t of qTokens) {
            if (hay.includes(t)) score += 3;
          }
          return { p, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.p);
    }

    if (sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (!query) {
      filtered.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    }

    const result = filtered.slice(0, limit);
    for (const p of result) {
      if (!acc.products.some((x) => x.id === p.id)) acc.products.push(p);
    }

    return {
      count: result.length,
      products: result.map((p) => ({
        id: p.id,
        name: p.name,
        categoryName: p.categoryName,
        price: p.price,
        originalPrice: p.originalPrice,
        weight: p.weight,
        description: p.description,
        inStock: p.inStock,
      })),
    };
  }

  if (name === 'search_guides') {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    const posts = await getCachedPosts();
    const qTokens = normalizeVietnamese(query)
      .split(' ')
      .filter((t) => t.length >= 2);

    const matched =
      qTokens.length === 0
        ? posts.slice(0, 3)
        : posts
            .map((post) => {
              const hay = normalizeVietnamese(
                `${post.title} ${post.category || ''} ${(post.content || '').replace(/<[^>]+>/g, ' ').slice(0, 600)}`
              );
              let score = 0;
              for (const t of qTokens) {
                if (hay.includes(t)) score += 3;
              }
              return { post, score };
            })
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((x) => x.post);

    for (const post of matched) {
      if (!acc.posts.some((x) => x.slug === post.slug)) acc.posts.push(post);
    }

    return {
      count: matched.length,
      guides: matched.map((p) => ({
        title: p.title,
        slug: `/posts/${p.slug}`,
        category: p.category,
        excerpt: (p.content || '').replace(/<[^>]+>/g, ' ').slice(0, 220),
      })),
    };
  }

  return { error: `Unknown tool: ${name}` };
}

export function mapProductsToSuggestions(products: Product[]): ChatProductSuggestion[] {
  return products.slice(0, 3).map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    image: p.image,
    categoryName: p.categoryName,
    product: p,
  }));
}

export function mapPostsToSuggestions(posts: PostModel[]): ChatPostSuggestion[] {
  return posts.slice(0, 2).map((p) => ({
    slug: p.slug,
    title: p.title,
    category: p.category,
  }));
}
