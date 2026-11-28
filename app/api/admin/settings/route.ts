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
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const DEFAULT_SETTINGS = {
  store_name: 'Mèo Cưng Pet Shop',
  support_email: 'hotro@meocung.vn',
  support_hotline: '0382 542 737',
  warehouse_address: '123 Cầu Giấy, Hà Nội',
  currency: 'VND',
  tax_percent: 0,
  low_stock_threshold: 10,
  enable_cod: true,
  enable_bank_qr: true,
  bank_name: 'Vietcombank',
  bank_account_no: '',
  bank_account_name: 'MEO CUNG PET SHOP',
  notify_new_order_email: true,
  auto_confirm_order: false,
  // Cài đặt chi tiết Đặt hàng & Checkout
  order_prefix: 'MC-',
  min_order_value: 50000,
  max_cod_amount: 5000000,
  auto_cancel_unpaid_hours: 24,
  allow_guest_checkout: true,
  // Cài đặt Đóng gói & Vận chuyển mặc định
  default_shipping_carrier: 'GHN',
  default_package_weight_g: 500,
  free_ship_global_threshold: 300000,
  enable_express_2h: true,
  // Cài đặt SEO, Bảo trì & Giao diện hệ thống
  meta_title_suffix: ' | Mèo Cưng Pet Shop',
  items_per_page: 20,
  enable_ai_chatbot: true,
  maintenance_mode: false,
  maintenance_message: 'Hệ thống đang bảo trì nâng cấp định kỳ, quý khách vui lòng quay lại sau ít phút!',
};

let tableReady = false;

async function ensureAdminSettingsTable() {
  if (tableReady) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      config JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  const { rows } = await pool.query(`SELECT id FROM admin_settings WHERE id = 1`);
  if (rows.length === 0) {
    await pool.query(`INSERT INTO admin_settings (id, config) VALUES (1, $1::jsonb)`, [
      JSON.stringify(DEFAULT_SETTINGS),
    ]);
  }
  tableReady = true;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    await ensureAdminSettingsTable();
    const { rows } = await pool.query(`SELECT config, updated_at FROM admin_settings WHERE id = 1`);
    return NextResponse.json(
      { settings: { ...DEFAULT_SETTINGS, ...(rows[0]?.config || {}) }, updated_at: rows[0]?.updated_at },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureAdminSettingsTable();
    const body = await request.json();
    const { rows: existing } = await pool.query(`SELECT config FROM admin_settings WHERE id = 1`);
    const merged = { ...DEFAULT_SETTINGS, ...(existing[0]?.config || {}), ...(body.settings || body) };
    await pool.query(`UPDATE admin_settings SET config = $1::jsonb, updated_at = NOW() WHERE id = 1`, [
      JSON.stringify(merged),
    ]);
    return NextResponse.json({ success: true, settings: merged }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
