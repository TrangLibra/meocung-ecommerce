import { NextResponse } from 'next/server';
import { listAdminAuditLogs, recordAdminAuditLog } from '@/lib/neon-audit-logs';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  try {
    const logs = await listAdminAuditLogs(100);
    return NextResponse.json({ logs }, { status: 200, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Không thể tải nhật ký hoạt động.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body.action || '').trim();
    if (!action) {
      return NextResponse.json({ error: 'Thiếu action' }, { status: 400, headers: CORS_HEADERS });
    }
    const log = await recordAdminAuditLog({
      actor: body.actor ? String(body.actor) : 'Admin',
      action,
      target: body.target ? String(body.target) : '',
      detail: body.detail ? String(body.detail) : '',
      items: Array.isArray(body.items) ? body.items : [],
    });
    return NextResponse.json({ log }, { status: 201, headers: CORS_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Không thể ghi nhật ký.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
