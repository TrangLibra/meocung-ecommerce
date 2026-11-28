import { Pool } from 'pg';

const DEFAULT_NEON_URL =
  'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

export interface NeonNewsPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  summary: string;
  content: string;
  image: string;
  coverImage: string;
  publishedAt: string;
}

const globalForPostPg = globalThis as unknown as {
  __meocungNeonPool?: Pool;
};

function getPool(): Pool {
  if (!globalForPostPg.__meocungNeonPool) {
    globalForPostPg.__meocungNeonPool = new Pool({
      connectionString: process.env.DATABASE_URL || DEFAULT_NEON_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return globalForPostPg.__meocungNeonPool;
}

function toSlug(title: string): string {
  const base = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'tin-tuc'}-${Date.now().toString().slice(-4)}`;
}

function extractTextFromContent(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object') {
    if (typeof raw.text === 'string') return raw.text;
    if (raw.root && Array.isArray(raw.root.children)) {
      return raw.root.children
        .map((node: any) =>
          Array.isArray(node.children)
            ? node.children.map((c: any) => c.text || '').join('')
            : node.text || ''
        )
        .filter(Boolean)
        .join('\n\n');
    }
    return JSON.stringify(raw);
  }
  return String(raw);
}

function mapPostRow(r: any): NeonNewsPost {
  const img = String(r.cover_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80');
  const sum = String(r.summary || '');
  return {
    id: String(r.id),
    title: String(r.title || ''),
    slug: String(r.slug || ''),
    category: String(r.category || 'Tin tức'),
    excerpt: sum,
    summary: sum,
    content: extractTextFromContent(r.content) || sum,
    image: img,
    coverImage: img,
    publishedAt: r.published_at ? new Date(r.published_at).toISOString() : new Date(r.created_at || Date.now()).toISOString(),
  };
}

export async function listNeonNewsPosts(): Promise<NeonNewsPost[]> {
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM "posts" ORDER BY COALESCE("published_at", "created_at") DESC LIMIT 100`
  );
  return rows.map(mapPostRow);
}

export async function createNeonNewsPost(input: {
  title: string;
  category?: string;
  excerpt?: string;
  content: string;
  image?: string;
}): Promise<NeonNewsPost> {
  const pool = getPool();
  const slug = toSlug(input.title);
  const summary = (input.excerpt || input.content.slice(0, 180)).trim();
  const coverImage =
    input.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80';
  const contentJson = { text: input.content };

  const { rows } = await pool.query(
    `INSERT INTO "posts" ("title", "slug", "category", "summary", "cover_image", "status", "_status", "content", "published_at", "created_at", "updated_at")
     VALUES ($1, $2, $3, $4, $5, 'published', 'published', $6::jsonb, now(), now(), now())
     RETURNING *`,
    [input.title.trim(), slug, input.category || 'Tin tức', summary, coverImage, JSON.stringify(contentJson)]
  );
  return mapPostRow(rows[0]);
}

export async function updateNeonNewsPost(
  id: string,
  patch: Partial<{ title: string; category: string; excerpt: string; content: string; image: string }>
): Promise<NeonNewsPost | null> {
  const pool = getPool();
  const { rows: cur } = await pool.query(`SELECT * FROM "posts" WHERE "id"::text = $1`, [String(id)]);
  if (!cur.length) return null;
  const existing = cur[0];
  const nextContent = patch.content !== undefined ? JSON.stringify({ text: patch.content }) : JSON.stringify(existing.content || {});
  const { rows } = await pool.query(
    `UPDATE "posts"
     SET "title" = $2, "category" = $3, "summary" = $4, "cover_image" = $5, "content" = $6::jsonb, "updated_at" = now()
     WHERE "id"::text = $1
     RETURNING *`,
    [
      String(id),
      patch.title ?? existing.title,
      patch.category ?? existing.category,
      patch.excerpt ?? existing.summary,
      patch.image ?? existing.cover_image,
      nextContent,
    ]
  );
  return mapPostRow(rows[0]);
}

export async function deleteNeonNewsPost(id: string): Promise<boolean> {
  const pool = getPool();
  const { rowCount } = await pool.query(`DELETE FROM "posts" WHERE "id"::text = $1`, [String(id)]);
  return (rowCount || 0) > 0;
}
