import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_MEOCUNG_POSTS } from '@/lib/directus';
import { createNeonNewsPost, listNeonNewsPosts } from '@/lib/neon-posts';

export const dynamic = 'force-dynamic';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('where[slug][equals]');
  const neonPosts = await listNeonNewsPosts().catch(() => []);
  const allPosts = [...neonPosts, ...SAMPLE_MEOCUNG_POSTS];

  if (slug) {
    const post = allPosts.find((p: any) => p.slug === slug);
    return NextResponse.json(
      { docs: post ? [post] : [], totalDocs: post ? 1 : 0 },
      { headers: CORS_HEADERS }
    );
  }

  return NextResponse.json(
    {
      docs: allPosts,
      totalDocs: allPosts.length,
      limit: 50,
      page: 1,
      totalPages: 1,
    },
    { headers: CORS_HEADERS }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Thiếu tiêu đề bài viết' }, { status: 400, headers: CORS_HEADERS });
    }
    const doc = await createNeonNewsPost({
      title: String(body.title),
      category: body.category ? String(body.category) : 'Tin tức',
      excerpt: body.excerpt ? String(body.excerpt) : '',
      content: String(body.content || body.excerpt || ''),
      image: body.image ? String(body.image) : '',
    });
    return NextResponse.json({ doc }, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Không thể lưu bài viết.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
