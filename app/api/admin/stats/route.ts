import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const [prodRes, orderRes, userRes, postRes, catRes, revRes] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS cnt FROM product WHERE deleted_at IS NULL').catch(() => ({ rows: [{ cnt: 0 }] })),
      pool.query('SELECT COUNT(*)::int AS cnt, COALESCE(SUM(grand_total), 0)::bigint AS revenue FROM orders').catch(() => ({ rows: [{ cnt: 0, revenue: 0 }] })),
      pool.query('SELECT COUNT(*)::int AS cnt FROM storefront_user').catch(() => ({ rows: [{ cnt: 0 }] })),
      pool.query('SELECT COUNT(*)::int AS cnt FROM posts').catch(() => ({ rows: [{ cnt: 0 }] })),
      pool.query('SELECT COUNT(*)::int AS cnt FROM product_category WHERE deleted_at IS NULL').catch(() => ({ rows: [{ cnt: 0 }] })),
      pool.query('SELECT COUNT(*)::int AS cnt FROM reviews').catch(() => ({ rows: [{ cnt: 0 }] })),
    ]);

    return NextResponse.json(
      {
        stats: {
          products_count: prodRes.rows[0]?.cnt || 0,
          orders_count: orderRes.rows[0]?.cnt || 0,
          total_revenue: Number(orderRes.rows[0]?.revenue || 0),
          customers_count: userRes.rows[0]?.cnt || 0,
          posts_count: postRes.rows[0]?.cnt || 0,
          categories_count: catRes.rows[0]?.cnt || 0,
          reviews_count: revRes.rows[0]?.cnt || 0,
        },
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ stats: {}, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
