import { NextResponse } from 'next/server';
import { searchProductsWithMeilisearch } from '@/lib/meilisearch';
import { listNeonProducts } from '@/lib/neon-products';

function normalizeVn(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const limit = Number(searchParams.get('limit')) || 8;
  const started = Date.now();

  try {
    const [meiliRes, neonProducts] = await Promise.all([
      searchProductsWithMeilisearch({ query, category, limit }).catch(() => ({
        hits: [],
        estimatedTotalHits: 0,
        processingTimeMs: 0,
      })),
      listNeonProducts().catch(() => []),
    ]);

    const qNorm = normalizeVn(query);
    const catNorm = normalizeVn(category);
    const tokens = qNorm.split(/\s+/).filter(Boolean);

    const neonHits = neonProducts
      .filter((p) => {
        if (catNorm && catNorm !== 'all' && catNorm !== 'tat ca') {
          const pCat = normalizeVn(`${p.category} ${p.category_name}`);
          if (!pCat.includes(catNorm)) return false;
        }
        if (!tokens.length) return true;
        const hay = normalizeVn(`${p.name} ${p.sku} ${p.category_name} ${p.description} ${p.weight}`);
        return tokens.every((t) => hay.includes(t));
      })
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.price,
        category: p.category,
        categoryName: p.category_name || 'Sản phẩm Mèo Cưng',
        image: p.image || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&auto=format&fit=crop&q=80',
        weight: p.weight,
        description: p.description,
      }));

    const stripSizeSuffix = (name: string) =>
      name.replace(/\s*\(\s*Size\s+[A-Za-z0-9]+\s*\)\s*$/i, '').trim();

    const seen = new Set<string>();
    const mergedHits: any[] = [];
    // Sort neonHits by price ascending so the representative item shows the starting price (Size M)
    const sortedNeonHits = [...neonHits].sort((a, b) => (a.price || 0) - (b.price || 0));
    for (const item of [...sortedNeonHits, ...(meiliRes.hits || [])]) {
      const cleanName = stripSizeSuffix(item.name || '');
      const key = normalizeVn(cleanName || item.id || '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      mergedHits.push({
        ...item,
        name: cleanName || item.name,
      });
      if (mergedHits.length >= limit) break;
    }

    return NextResponse.json({
      hits: mergedHits,
      estimatedTotalHits: Math.max(mergedHits.length, neonHits.length + (meiliRes.estimatedTotalHits || 0)),
      processingTimeMs: Date.now() - started,
    });
  } catch {
    return NextResponse.json(
      { error: 'Không thể tìm kiếm sản phẩm lúc này.' },
      { status: 500 }
    );
  }
}
