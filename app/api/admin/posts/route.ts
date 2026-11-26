import { NextRequest, NextResponse } from 'next/server';
import { getPayloadPosts } from '@/lib/payload';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const posts = await getPayloadPosts(100);
    return NextResponse.json({ docs: posts, totalDocs: posts.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, docs: [] }, { status: 500 });
  }
}
