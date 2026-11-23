import { NextResponse } from 'next/server';
import { DEFAULT_BANNERS } from '@/lib/payload';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    docs: DEFAULT_BANNERS,
    totalDocs: DEFAULT_BANNERS.length
  });
}
