import { NextResponse } from 'next/server';
import { createNeonVoucher, deleteNeonVoucher, listNeonVouchers } from '@/lib/neon-vouchers';
import { listNeonProducts, upsertNeonProduct, deleteNeonProduct } from '@/lib/neon-products';
import { listNeonOrders, updateNeonOrder, type OrderStatus } from '@/lib/neon-orders';
import { createNeonUser, listNeonUsers } from '@/lib/neon-users';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function callGeminiJson(apiKey: string, systemPrompt: string, userMessage: string) {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastErr = '';
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nYêu cầu của Admin: ${userMessage}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (text) return JSON.parse(text);
    } else {
      lastErr = await res.text().catch(() => String(res.status));
    }
  }
  throw new Error(lastErr || 'Không thể gọi Gemini API.');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) {
      return NextResponse.json(
        { error: 'Vui lòng nhập yêu cầu cho Trợ lý AI.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const apiKey = process.env.ADMIN_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình ADMIN_GEMINI_API_KEY trên server.' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Fetch brief live context from Neon so AI can answer stats or find IDs
    const [vouchers, orders, customers, products] = await Promise.all([
      listNeonVouchers().catch(() => []),
      listNeonOrders().catch(() => []),
      listNeonUsers().catch(() => []),
      listNeonProducts().catch(() => []),
    ]);

    const contextSummary = {
      counts: {
        products: products.length,
        orders: orders.length,
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
        customers: customers.length,
        vouchers: vouchers.length,
      },
      vouchers: vouchers.slice(0, 15).map((v) => ({ id: v.id, code: v.code, type: v.type, discount_value: v.discount_value })),
      orders: orders.slice(0, 15).map((o) => ({ id: o.id, code: o.order_code, name: o.customer_name, status: o.status, total: o.grand_total })),
      products: products.slice(0, 15).map((p) => ({ id: p.id, name: p.name, price: p.price, inventory: p.inventory })),
    };

    const systemPrompt = `Bạn là Trợ lý AI Admin của Mèo Cưng Pet Shop. Bạn giúp Admin thao tác nhanh dữ liệu thật trên Neon PostgreSQL (tạo/xóa voucher, tạo mã freeship, thêm/xóa sản phẩm, đổi trạng thái đơn hàng, tạo tài khoản khách hàng, hoặc thống kê).
Dữ liệu hiện tại trên hệ thống: ${JSON.stringify(contextSummary)}

BẮT BUỘC trả về JSON hợp lệ theo đúng cấu trúc:
{
  "reply": "Câu trả lời ngắn gọn, rõ ràng bằng tiếng Việt",
  "action": {
    "type": "none" | "create_voucher" | "delete_voucher" | "create_product" | "delete_product" | "update_order_status" | "create_customer",
    "payload": {}
  }
}

Quy tắc payload theo từng action.type:
- "create_voucher": { "code": "UPPERCASE", "title": "Tên chương trình", "type": "percent"|"fixed"|"freeship", "discount_value": number (0 nếu freeship), "min_order": number }
- "delete_voucher": { "code": "MÃ_VOUCHER" }
- "create_product": { "name": "Tên SP", "price": number, "inventory": number, "weight": "1kg", "category": "thuc-an-hat"|"pate-cho-meo"|"cat-ve-sinh"|"phu-kien" }
- "delete_product": { "name": "Tên SP cần xóa" }
- "update_order_status": { "order_code": "MC...", "status": "pending"|"confirmed"|"shipping"|"delivered"|"cancelled" }
- "create_customer": { "name": "Tên", "email": "email@...", "phone": "09...", "password": "ít nhất 6 ký tự" }
- "none": {} (khi chỉ hỏi thống kê/tư vấn)`;

    const aiResult = await callGeminiJson(apiKey, systemPrompt, message);
    const actionType = aiResult?.action?.type || 'none';
    const payload = aiResult?.action?.payload || {};
    let reply = String(aiResult?.reply || 'Đã xử lý yêu cầu của bạn.');
    let actionExecuted = false;
    const refreshTargets: string[] = [];

    if (actionType === 'create_voucher' && payload.code) {
      const created = await createNeonVoucher({
        code: String(payload.code),
        title: String(payload.title || `Khuyến mãi ${payload.code}`),
        type: payload.type === 'fixed' || payload.type === 'freeship' ? payload.type : 'percent',
        discount_value: Number(payload.discount_value) || 0,
        min_order: Number(payload.min_order) || 0,
      });
      actionExecuted = true;
      refreshTargets.push('vouchers');
      reply = `✅ Đã tạo mã **${created.code}** (${created.title}) và lưu trực tiếp vào bảng \`voucher\` trên Neon!`;
    } else if (actionType === 'delete_voucher' && payload.code) {
      const target = vouchers.find((v) => v.code.toUpperCase() === String(payload.code).toUpperCase());
      if (target) {
        await deleteNeonVoucher(target.id);
        actionExecuted = true;
        refreshTargets.push('vouchers');
        reply = `🗑️ Đã xóa mã voucher **${target.code}** khỏi Neon PostgreSQL!`;
      } else {
        reply = `⚠️ Không tìm thấy mã voucher **${payload.code}** trên hệ thống.`;
      }
    } else if (actionType === 'create_product' && payload.name) {
      const created = await upsertNeonProduct({
        name: String(payload.name),
        price: Number(payload.price) || 100000,
        inventory: Number(payload.inventory) || 50,
        weight: String(payload.weight || '1kg'),
        category: String(payload.category || 'thuc-an-hat'),
      });
      actionExecuted = true;
      refreshTargets.push('products');
      reply = `✅ Đã thêm sản phẩm **${created.name}** (${created.price.toLocaleString('vi-VN')}₫, tồn kho ${created.inventory}) vào Neon!`;
    } else if (actionType === 'delete_product' && payload.name) {
      const q = String(payload.name).toLowerCase();
      const target = products.find((p) => p.name.toLowerCase().includes(q));
      if (target) {
        await deleteNeonProduct(target.id);
        actionExecuted = true;
        refreshTargets.push('products');
        reply = `🗑️ Đã xóa sản phẩm **${target.name}** khỏi Neon!`;
      } else {
        reply = `⚠️ Không tìm thấy sản phẩm khớp với "${payload.name}".`;
      }
    } else if (actionType === 'update_order_status' && payload.order_code && payload.status) {
      const codeNorm = String(payload.order_code).replace(/^#/, '').toLowerCase();
      const target = orders.find((o) => o.order_code.toLowerCase() === codeNorm);
      if (target) {
        await updateNeonOrder(target.id, { status: payload.status as OrderStatus });
        actionExecuted = true;
        refreshTargets.push('orders');
        reply = `✅ Đã cập nhật đơn **#${target.order_code}** sang trạng thái **${payload.status}** trên Neon!`;
      } else {
        reply = `⚠️ Không tìm thấy đơn hàng **#${payload.order_code}**.`;
      }
    } else if (actionType === 'create_customer' && payload.email) {
      const created = await createNeonUser({
        name: String(payload.name || 'Khách hàng mới'),
        email: String(payload.email),
        phone: payload.phone ? String(payload.phone) : undefined,
        password: String(payload.password || '123456'),
      });
      actionExecuted = true;
      refreshTargets.push('customers');
      reply = `✅ Đã tạo tài khoản khách hàng **${created.name}** (${created.email}) vào bảng \`users\` trên Neon!`;
    }

    return NextResponse.json(
      { reply, actionExecuted, actionType, refreshTargets },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Trợ lý AI gặp lỗi khi xử lý.' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
