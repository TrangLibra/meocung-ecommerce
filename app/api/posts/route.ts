import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('where[slug][equals]') || searchParams.get('slug');

    if (slug) {
      const res = await pool.query(
        'SELECT id, title, slug, category, published_at as "publishedAt", summary, cover_image as "coverImage", status FROM posts WHERE slug = $1 LIMIT 1',
        [slug]
      );
      return NextResponse.json({
        docs: res.rows,
        totalDocs: res.rows.length
      }, { headers: corsHeaders });
    }

    const res = await pool.query(
      'SELECT id, title, slug, category, published_at as "publishedAt", summary, cover_image as "coverImage", status FROM posts ORDER BY id DESC LIMIT 150'
    );

    return NextResponse.json({
      docs: res.rows,
      totalDocs: res.rows.length
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Error fetching posts from PostgreSQL:', err);
    return NextResponse.json({ docs: [], totalDocs: 0, error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, category, summary, coverImage } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400, headers: corsHeaders });
    }

    // Tạo slug tiếng Việt không dấu chuẩn
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'bai-viet-moi';
    
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const res = await pool.query(
      `INSERT INTO posts (title, slug, category, summary, cover_image, status, published_at, created_at, updated_at, _status)
       VALUES ($1, $2, $3, $4, $5, 'published', NOW(), NOW(), NOW(), 'published')
       RETURNING id, title, slug, category, summary, cover_image as "coverImage", status, published_at as "publishedAt"`,
      [
        title,
        slug,
        category || 'kinh-nghiem',
        summary || '',
        coverImage || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800'
      ]
    );

    return NextResponse.json({
      success: true,
      doc: res.rows[0]
    }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    console.error('Error creating post in PostgreSQL:', err);
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
