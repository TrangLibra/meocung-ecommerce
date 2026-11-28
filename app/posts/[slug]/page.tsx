import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Pool } from 'pg';
import { getPayloadPostBySlug, getPayloadPosts } from '@/lib/payload';
import { Calendar, Clock, BookOpen, ChevronRight, Phone, ArrowLeft, Sparkles, Tag } from 'lucide-react';

interface Props {
  params: {
    slug: string;
  };
}

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

function normalizeHtmlContent(raw: any, summary?: string): string {
  if (!raw) return summary ? `<p>${summary}</p>` : '';
  if (typeof raw === 'string') {
    return raw.includes('<p>') || raw.includes('<h') ? raw : raw.split(/\n\n+/).map((p) => `<p>${p}</p>`).join('');
  }
  if (typeof raw === 'object') {
    if (typeof raw.html === 'string' && raw.html.trim()) return raw.html;
    if (typeof raw.text === 'string' && raw.text.trim()) {
      const txt = raw.text.trim();
      return txt.includes('<p>') || txt.includes('<h') ? txt : txt.split(/\n\n+/).map((p: string) => `<p>${p}</p>`).join('');
    }
    if (raw.root && Array.isArray(raw.root.children)) {
      const htmlParts = raw.root.children
        .map((node: any) => {
          const text = Array.isArray(node.children) ? node.children.map((c: any) => c.text || '').join('') : node.text || '';
          if (!text.trim()) return '';
          if (node.type === 'heading') return `<h2>${text}</h2>`;
          return `<p>${text}</p>`;
        })
        .filter(Boolean)
        .join('');
      if (htmlParts) return htmlParts;
    }
  }
  return summary ? `<p>${summary}</p>` : '';
}

async function getNeonPostBySlug(slug: string) {
  try {
    const res = await pool.query(
      `SELECT * FROM posts WHERE slug = $1 OR id::text = $1 LIMIT 1`,
      [slug]
    );
    if (res.rows[0]) {
      const r = res.rows[0];
      return {
        id: String(r.id),
        title: String(r.title || ''),
        slug: String(r.slug || slug),
        category: String(r.category || 'Cẩm nang nuôi mèo'),
        summary: String(r.summary || ''),
        contentHtml: normalizeHtmlContent(r.content, r.summary),
        image: String(r.cover_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1000&auto=format&fit=crop&q=80'),
        date_created: r.published_at || r.created_at,
        date_updated: r.updated_at,
      };
    }
  } catch (_) {}
  return null;
}

async function getRelatedNeonPosts(currentSlug: string) {
  try {
    const res = await pool.query(
      `SELECT id, title, slug, category, summary, cover_image, published_at, created_at
       FROM posts WHERE slug <> $1 ORDER BY id DESC LIMIT 6`,
      [currentSlug]
    );
    return res.rows.map((r: any) => ({
      id: String(r.id),
      title: String(r.title || ''),
      slug: String(r.slug || ''),
      category: String(r.category || 'Cẩm nang'),
      summary: String(r.summary || ''),
      image: String(r.cover_image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80'),
      date_created: r.published_at || r.created_at,
    }));
  } catch (_) {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const neonPost = await getNeonPostBySlug(params.slug);
  const post = neonPost || (await getPayloadPostBySlug(params.slug));

  if (!post) {
    return { title: 'Không tìm thấy bài viết | Mèo Cưng' };
  }

  const metaTitle = post.title;
  const metaDescription = (post as any).summary || (post as any).seo?.meta_description || 'Cẩm nang nuôi dưỡng và chăm sóc mèo cưng chuẩn khoa học tại Mèo Cưng.';
  const ogImageUrl = post.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1000';

  return {
    title: `${metaTitle} | Tạp Chí Mèo Cưng`,
    description: metaDescription,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      images: [{ url: ogImageUrl }],
      type: 'article',
    },
  };
}

export default async function PostDetailPage({ params }: Props) {
  const neonPost = await getNeonPostBySlug(params.slug);
  const fallbackPost = neonPost ? null : await getPayloadPostBySlug(params.slug);
  const post = neonPost || (fallbackPost ? {
    id: String(fallbackPost.id),
    title: fallbackPost.title,
    slug: fallbackPost.slug,
    category: fallbackPost.category || 'Cẩm nang nuôi mèo',
    summary: fallbackPost.seo?.meta_description || '',
    contentHtml: normalizeHtmlContent(fallbackPost.content, fallbackPost.seo?.meta_description),
    image: fallbackPost.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1000',
    date_created: fallbackPost.date_created,
  } : null);

  if (!post) {
    notFound();
  }

  let relatedPosts = await getRelatedNeonPosts(post.slug);
  if (relatedPosts.length === 0) {
    const pPosts = await getPayloadPosts(6);
    relatedPosts = pPosts.filter((p) => p.slug !== post.slug).slice(0, 5).map((p) => ({
      id: String(p.id),
      title: p.title,
      slug: p.slug,
      category: p.category || 'Cẩm nang',
      summary: p.seo?.meta_description || '',
      image: p.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
      date_created: p.date_created,
    }));
  }

  const formattedDate = post.date_created
    ? new Date(post.date_created).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Mới cập nhật';

  const wordCount = post.contentHtml.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
  const readMinutes = Math.max(2, Math.ceil(wordCount / 180));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb báo điện tử */}
      <nav className="flex flex-wrap items-center gap-2 text-xs text-gray-500 pt-1">
        <Link href="/" className="hover:text-[#ff7f5c] transition">Trang chủ</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/tin-tuc" className="hover:text-[#ff7f5c] transition font-semibold">Tạp chí & Cẩm nang</Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[#ff7f5c] font-bold uppercase">{post.category}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột chính: Nội dung bài báo (8 cột) */}
        <article className="lg:col-span-8 bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-10 space-y-6">
            {/* Header bài báo */}
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-2.5 text-xs">
                <span className="px-3 py-1 rounded-full bg-[#ff7f5c]/10 text-[#ff7f5c] font-extrabold uppercase tracking-wider">
                  {post.category}
                </span>
                <span className="inline-flex items-center gap-1 text-gray-500">
                  <Calendar className="w-3.5 h-3.5 text-[#ff7f5c]" />
                  <span>{formattedDate}</span>
                </span>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-1 text-gray-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#ff7f5c]" />
                  <span>{readMinutes} phút đọc</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight leading-[1.22]">
                {post.title}
              </h1>

              {/* Tác giả */}
              <div className="flex items-center justify-between pt-2 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff7f5c] to-amber-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                    🐾
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-gray-900">Ban Biên Tập Mèo Cưng</div>
                    <div className="text-[11px] text-gray-500">Chuyên mục Chăm sóc & Dinh dưỡng Thú cưng</div>
                  </div>
                </div>
                <Link
                  href="/tin-tuc"
                  className="inline-flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-[#ff7f5c] transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Tất cả bài viết</span>
                </Link>
              </div>
            </header>

            {/* Sapo nổi bật kiểu báo chí */}
            {post.summary && (
              <div className="border-l-4 border-[#ff7f5c] bg-orange-50/50 px-5 py-4 rounded-r-2xl text-gray-800 font-semibold text-sm sm:text-base leading-relaxed italic">
                {post.summary}
              </div>
            )}

            {/* Ảnh bìa bài báo */}
            {post.image && (
              <figure className="space-y-2">
                <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-100">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                </div>
                <figcaption className="text-center text-xs text-gray-400 italic">
                  Hình ảnh minh họa: {post.title} — Nguồn: Mèo Cưng Pet Shop
                </figcaption>
              </figure>
            )}

            {/* Nội dung chi tiết bài viết */}
            <div
              className="prose prose-slate max-w-none text-gray-800 text-[15px] sm:text-base leading-[1.85]
                [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:font-black [&>h2]:text-gray-900 [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:border-l-4 [&>h2]:border-[#ff7f5c] [&>h2]:pl-3
                [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-gray-900 [&>h3]:mt-6 [&>h3]:mb-2
                [&>p]:mb-4
                [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ul]:mb-5
                [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>ol]:mb-5
                [&>blockquote]:border-l-4 [&>blockquote]:border-amber-400 [&>blockquote]:bg-amber-50/60 [&>blockquote]:px-4 [&>blockquote]:py-3 [&>blockquote]:rounded-r-xl [&>blockquote]:italic [&>blockquote]:text-gray-700 [&>blockquote]:my-5"
              dangerouslySetInnerHTML={{ __html: post.contentHtml || '<p>Nội dung đang được cập nhật...</p>' }}
            />

            {/* Tags & Nguồn */}
            <div className="pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 text-gray-500 font-semibold">
                  <Tag className="w-3.5 h-3.5" /> Từ khóa:
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">#{post.category}</span>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">#chamsocmeo</span>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium">#meocung</span>
              </div>
              <span className="text-xs text-gray-400">Nguồn: Tạp Chí Mèo Cưng</span>
            </div>

            {/* Box tư vấn */}
            <div className="mt-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-[#fff5f2] to-amber-50/60 border border-[#ffded6] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-extrabold text-gray-900 text-sm sm:text-base flex items-center justify-center sm:justify-start gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#ff7f5c]" />
                  <span>Cần bác sĩ thú y hoặc chuyên viên dinh dưỡng tư vấn?</span>
                </h4>
                <p className="text-xs text-gray-600">Đội ngũ Mèo Cưng hỗ trợ chọn hạt, pate và giải đáp sức khỏe bé mèo miễn phí!</p>
              </div>
              <a
                href="tel:0382542737"
                className="px-5 py-2.5 rounded-full bg-[#ff7f5c] hover:bg-[#f0643d] text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Gọi 0382 542 737</span>
              </a>
            </div>
          </div>
        </article>

        {/* Sidebar phải (4 cột): Tin liên quan & Gợi ý sản phẩm */}
        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm space-y-4">
            <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider border-b border-gray-100 pb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#ff7f5c]" />
              <span>Bài Viết Cùng Chuyên Đề</span>
            </h3>

            <div className="divide-y divide-gray-100">
              {relatedPosts.map((related: any) => (
                <Link
                  key={related.id}
                  href={`/posts/${related.slug}`}
                  className="py-3 flex gap-3.5 group items-start first:pt-1 last:pb-0"
                >
                  <div className="w-24 aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <img
                      src={related.image}
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-[#ff7f5c] block">{related.category}</span>
                    <h4 className="font-bold text-gray-900 text-xs sm:text-sm line-clamp-2 group-hover:underline leading-snug">
                      {related.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>

            <Link
              href="/tin-tuc"
              className="block text-center py-2.5 rounded-xl bg-gray-50 hover:bg-orange-50 text-xs font-bold text-[#ff7f5c] transition"
            >
              Xem tất cả bài viết →
            </Link>
          </div>

          <div className="rounded-3xl p-6 text-white space-y-3 shadow-md bg-gradient-to-br from-[#ff7f5c] to-amber-500">
            <div className="text-xs font-bold uppercase tracking-wider opacity-90">🛒 Cửa Hàng Mèo Cưng</div>
            <h3 className="text-lg font-black leading-snug">Hạt dinh dưỡng & Pate chính hãng cho boss</h3>
            <p className="text-xs opacity-90">Đầy đủ Royal Canin, Whiskas, Ciao Churu, cát đậu nành giao nhanh 2H.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-[#ff7f5c] text-xs font-bold shadow-sm hover:opacity-95 transition"
            >
              <span>Mua sắm ngay</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
