import { getMedusaProducts } from './medusa';
import { Product, PRODUCTS } from './products';

export interface SearchResult {
  hits: Product[];
  total: number;
  source: 'meilisearch' | 'local-fuzzy';
  processingTimeMs: number;
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

// Fast Levenshtein distance for typo-tolerant fallback search
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = dp[j];
      dp[j] =
        a[i - 1] === b[j - 1]
          ? prev
          : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[b.length];
}

function fuzzyMatchScore(product: Product, query: string): number {
  const qLower = query.toLowerCase().trim();
  const qNorm = normalizeVietnamese(query);
  if (!qNorm) return 1;

  const titleLower = product.name.toLowerCase();
  const titleNorm = normalizeVietnamese(product.name);
  const titleWords = titleNorm.split(' ').filter(Boolean);
  const catNorm = normalizeVietnamese(product.categoryName);
  const descNorm = normalizeVietnamese(`${product.description} ${product.weight || ''}`);
  const descWords = descNorm.split(' ').filter(Boolean);

  let score = 0;

  // 1. Exact Vietnamese accent match in title (highest priority: "cần" -> "Cần Câu Mèo")
  if (titleLower.includes(qLower)) {
    score += 60;
  }

  // 2. Exact phrase match in normalized title
  if (titleNorm.startsWith(qNorm)) {
    score += 40;
  } else if (titleWords.some((w) => w === qNorm)) {
    score += 35;
  } else if (titleWords.some((w) => w.startsWith(qNorm))) {
    score += 25;
  } else if (catNorm.includes(qNorm)) {
    score += 15;
  }

  // 3. Token-by-token matching following Meilisearch typo-tolerance rules:
  //    - length < 4: 0 typos allowed (prefix/exact word only)
  //    - length 4..7: max 1 typo
  //    - length >= 8: max 2 typos
  const qTokens = qNorm.split(' ').filter((t) => t.length >= 2);
  let matchedTokens = 0;

  for (const token of qTokens) {
    const exactTitleWord = titleWords.some((w) => w === token);
    const prefixTitleWord = titleWords.some((w) => w.startsWith(token));
    const exactDescWord = descWords.some((w) => w === token || w.startsWith(token));

    if (exactTitleWord) {
      score += 20;
      matchedTokens++;
    } else if (prefixTitleWord) {
      score += 12;
      matchedTokens++;
    } else if (catNorm.split(' ').some((w) => w.startsWith(token))) {
      score += 8;
      matchedTokens++;
    } else if (exactDescWord) {
      score += 5;
      matchedTokens++;
    } else if (token.length >= 4) {
      const maxEdits = token.length >= 8 ? 2 : 1;
      const fuzzyTitle = titleWords.some(
        (w) => w.length >= 4 && editDistance(token, w) <= maxEdits
      );
      if (fuzzyTitle) {
        score += 10;
        matchedTokens++;
      }
    }
  }

  // Require all query tokens to match when user types multiple words (e.g. "royl canin")
  if (qTokens.length > 1 && matchedTokens < qTokens.length) {
    return 0;
  }

  return score;
}

export async function searchProductsWithMeilisearch(options: {
  query: string;
  category?: string;
  limit?: number;
}): Promise<SearchResult> {
  const startedAt = Date.now();
  const query = options.query.trim();
  const category = options.category?.trim() || '';
  const limit = Math.min(Math.max(options.limit || 8, 1), 24);

  const host = process.env.MEILISEARCH_HOST?.replace(/[\uFEFF\r\n\/]+$/g, '').trim();
  const apiKey = process.env.MEILISEARCH_API_KEY?.replace(/[\uFEFF\r\n]/g, '').trim();
  const indexName =
    process.env.MEILISEARCH_INDEX_NAME?.replace(/[\uFEFF\r\n]/g, '').trim() ||
    'products';

  // 1. Try real Meilisearch instance (Medusa Cloud / Meilisearch Cloud)
  if (host) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers.Authorization = `Bearer ${apiKey}`;
      }

      const payload: Record<string, unknown> = {
        q: query,
        limit,
      };
      if (category && category !== 'all') {
        payload.filter = [`categorySlug = "${category}"`];
      }

      const res = await fetch(`${host}/indexes/${encodeURIComponent(indexName)}/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.hits)) {
          const hits: Product[] = data.hits.map((h: Record<string, unknown>) => ({
            id: String(h.id || ''),
            name: String(h.name || h.title || ''),
            slug: String(h.slug || h.handle || h.id || ''),
            categorySlug: (String(h.categorySlug || 'thuc-an-hat') as Product['categorySlug']),
            categoryName: String(h.categoryName || 'Sản phẩm Mèo'),
            price: Number(h.price) || 0,
            originalPrice: h.originalPrice ? Number(h.originalPrice) : undefined,
            image:
              String(h.image || h.thumbnail || '') ||
              'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80',
            rating: Number(h.rating) || 4.8,
            soldCount: Number(h.soldCount) || 100,
            description: String(h.description || ''),
            weight: h.weight ? String(h.weight) : undefined,
            inStock: h.inStock !== false,
          }));

          return {
            hits,
            total: Number(data.estimatedTotalHits ?? hits.length),
            source: 'meilisearch',
            processingTimeMs: Number(data.processingTimeMs ?? Date.now() - startedAt),
          };
        }
      }
    } catch (err) {
      console.warn('[Meilisearch] Không thể kết nối, fallback sang local-fuzzy:', err);
    }
  }

  // 2. Fallback: Typo-tolerant Vietnamese fuzzy search on store catalog
  const medusaProducts = await getMedusaProducts(50).catch(() => PRODUCTS);
  let pool: Product[] = medusaProducts.length > 0 ? medusaProducts : PRODUCTS;

  if (category && category !== 'all') {
    pool = pool.filter((p) => p.categorySlug === category);
  }

  const scored = query
    ? pool
        .map((p) => ({ p, score: fuzzyMatchScore(p, query) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.p)
    : pool;

  return {
    hits: scored.slice(0, limit),
    total: scored.length,
    source: 'local-fuzzy',
    processingTimeMs: Math.max(1, Date.now() - startedAt),
  };
}
