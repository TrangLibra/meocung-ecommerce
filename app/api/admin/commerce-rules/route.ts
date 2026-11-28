import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export const dynamic = 'force-dynamic';

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:npg_X7DysxtaILK5@ep-hidden-morning-bigw8w9g-pooler.c-5.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

let tableReady = false;

async function ensureCommerceRulesTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS commerce_rules (
      id SERIAL PRIMARY KEY,
      rule_type TEXT NOT NULL,
      name TEXT NOT NULL,
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS cnt FROM commerce_rules`);
  if (rows[0]?.cnt === 0) {
    const seeds = [
      {
        rule_type: 'shipping_zone',
        name: 'Nội thành Hà Nội & TP.HCM',
        is_active: true,
        config: {
          provinces: 'Hà Nội, TP. Hồ Chí Minh',
          base_fee: 20000,
          free_shipping_threshold: 300000,
          estimated_days: 'Giao nhanh 2H - 1 ngày',
        },
      },
      {
        rule_type: 'shipping_zone',
        name: 'Các tỉnh thành khác (Toàn quốc)',
        is_active: true,
        config: {
          provinces: 'Đà Nẵng, Hải Phòng, Cần Thơ, Bình Dương, Toàn quốc',
          base_fee: 35000,
          free_shipping_threshold: 500000,
          estimated_days: '2 - 4 ngày làm việc',
        },
      },
      {
        rule_type: 'flash_sale',
        name: 'Flash Sale Cuối Tuần - Hạt Dinh Dưỡng',
        is_active: true,
        config: {
          discount_percent: 15,
          target_category: 'thuc-an-hat',
          start_at: '2026-11-27T00:00',
          end_at: '2026-12-31T23:59',
        },
      },
    ];
    for (const s of seeds) {
      await pool.query(
        `INSERT INTO commerce_rules (rule_type, name, config, is_active) VALUES ($1, $2, $3::jsonb, $4)`,
        [s.rule_type, s.name, JSON.stringify(s.config), s.is_active]
      );
    }
  }
  tableReady = true;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    await ensureCommerceRulesTable();
    await pool.query(`ALTER TABLE commerce_rules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;`);
    const { searchParams } = new URL(request.url);
    const ruleType = searchParams.get('rule_type');
    const res = ruleType
      ? await pool.query(`SELECT * FROM commerce_rules WHERE rule_type = $1 AND deleted_at IS NULL ORDER BY id DESC`, [ruleType])
      : await pool.query(`SELECT * FROM commerce_rules WHERE deleted_at IS NULL ORDER BY id DESC`);
    return NextResponse.json({ rules: res.rows }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureCommerceRulesTable();
    const body = await request.json();
    if (!body.rule_type || !body.name) {
      return NextResponse.json({ error: 'Thiếu rule_type hoặc name' }, { status: 400, headers: corsHeaders });
    }
    const res = await pool.query(
      `INSERT INTO commerce_rules (rule_type, name, config, is_active)
       VALUES ($1, $2, $3::jsonb, $4)
       RETURNING *`,
      [body.rule_type, body.name, JSON.stringify(body.config || {}), body.is_active !== false]
    );
    return NextResponse.json({ rule: res.rows[0] }, { status: 201, headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureCommerceRulesTable();
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Thiếu id' }, { status: 400, headers: corsHeaders });
    }
    const res = await pool.query(
      `UPDATE commerce_rules
       SET name = COALESCE($2, name),
           config = COALESCE($3::jsonb, config),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        Number(body.id),
        body.name ?? null,
        body.config ? JSON.stringify(body.config) : null,
        typeof body.is_active === 'boolean' ? body.is_active : null,
      ]
    );
    return NextResponse.json({ rule: res.rows[0] }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await ensureCommerceRulesTable();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Thiếu id' }, { status: 400, headers: corsHeaders });
    }
    await pool.query(`ALTER TABLE commerce_rules ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;`);
    await pool.query(`UPDATE commerce_rules SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, [Number(id)]);
    return NextResponse.json({ deleted: true, softDeleted: true, id: Number(id) }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
