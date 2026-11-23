import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_MEOCUNG_POSTS } from '@/lib/directus';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('where[slug][equals]');

  if (slug) {
    const post = SAMPLE_MEOCUNG_POSTS.find(p => p.slug === slug);
    return NextResponse.json({
      docs: post ? [post] : [],
      totalDocs: post ? 1 : 0
    });
  }

  return NextResponse.json({
    docs: SAMPLE_MEOCUNG_POSTS,
    totalDocs: SAMPLE_MEOCUNG_POSTS.length,
    limit: 10,
    page: 1,
    totalPages: 1
  });
}
