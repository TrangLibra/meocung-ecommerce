import { NextRequest, NextResponse } from 'next/server';
import { SAMPLE_MEOCUNG_POSTS, PostModel } from '@/lib/directus';

export const dynamic = 'force-dynamic';

let serverPosts: PostModel[] = [...SAMPLE_MEOCUNG_POSTS];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('where[slug][equals]') || searchParams.get('slug');

  if (slug) {
    const post = serverPosts.find(p => p.slug === slug);
    return NextResponse.json({
      docs: post ? [post] : [],
      totalDocs: post ? 1 : 0
    });
  }

  return NextResponse.json({
    docs: serverPosts,
    totalDocs: serverPosts.length,
    limit: 10,
    page: 1,
    totalPages: 1
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.title) {
      return NextResponse.json({ success: false, message: 'Tiêu đề bài viết không được để trống' }, { status: 400 });
    }

    const newPost: PostModel = {
      id: body.id || `post_${Date.now()}`,
      title: body.title,
      slug: body.slug || `cam-nang-${Date.now()}`,
      content: body.content || '',
      image: body.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
      category: body.category || 'Cẩm nang nuôi mèo',
      status: 'published',
      date_created: new Date().toISOString()
    };

    serverPosts = [newPost, ...serverPosts];
    return NextResponse.json({ success: true, post: newPost });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.id) {
      return NextResponse.json({ success: false, message: 'Thiếu ID bài viết' }, { status: 400 });
    }

    serverPosts = serverPosts.map(p => p.id === body.id ? { ...p, ...body } : p);
    return NextResponse.json({ success: true, message: 'Đã cập nhật bài viết' });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ success: false, message: 'Thiếu ID cần xóa' }, { status: 400 });
  }

  serverPosts = serverPosts.filter(p => String(p.id) !== String(id));
  return NextResponse.json({ success: true, message: 'Đã xóa bài viết' });
}
