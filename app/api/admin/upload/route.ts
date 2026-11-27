import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Chưa có biến BLOB_READ_WRITE_TOKEN. Hãy tạo Blob Store trong Vercel Dashboard -> Storage -> Blob và Connect vào project.',
        },
        { status: 500, headers: corsHeaders }
      );
    }

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'Không tìm thấy file ảnh gửi lên' },
          { status: 400, headers: corsHeaders }
        );
      }

      const safeName = (file.name || 'image.png').replace(/[^a-zA-Z0-9._-]/g, '_');
      const pathname = `meocung/${Date.now()}-${safeName}`;

      const blob = await put(pathname, file, {
        access: 'public',
      });

      return NextResponse.json(
        { success: true, url: blob.url, pathname: blob.pathname },
        { status: 201, headers: corsHeaders }
      );
    }

    // Hỗ trợ upload dạng JSON base64 dự phòng
    const body = await request.json();
    const { filename, data, mimeType } = body || {};
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Thiếu dữ liệu ảnh' },
        { status: 400, headers: corsHeaders }
      );
    }

    const base64Str = String(data).replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Str, 'base64');
    const safeName = String(filename || 'image.png').replace(/[^a-zA-Z0-9._-]/g, '_');
    const pathname = `meocung/${Date.now()}-${safeName}`;

    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: mimeType || 'image/png',
    });

    return NextResponse.json(
      { success: true, url: blob.url, pathname: blob.pathname },
      { status: 201, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[Vercel Blob Upload Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Lỗi upload ảnh lên Vercel Blob' },
      { status: 500, headers: corsHeaders }
    );
  }
}
