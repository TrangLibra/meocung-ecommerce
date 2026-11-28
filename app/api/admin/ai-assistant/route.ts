import { NextResponse } from 'next/server';
import { createNeonVoucher, deleteNeonVoucher, listNeonVouchers } from '@/lib/neon-vouchers';
import {
  listNeonProducts,
  upsertNeonProduct,
  deleteNeonProduct,
  listNeonCategories,
  createNeonCategory,
  deleteNeonCategory,
} from '@/lib/neon-products';
import { listNeonOrders, updateNeonOrder, type OrderStatus } from '@/lib/neon-orders';
import { createNeonUser, listNeonUsers } from '@/lib/neon-users';
import { recordAdminAuditLog } from '@/lib/neon-audit-logs';

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
    const attachedImage = typeof body.image === 'string' ? body.image.trim() : '';
    const excelRows = Array.isArray(body.excelRows) ? body.excelRows : [];

    // Fast bulk import OR bulk delete from Excel + matched folder images
    if (excelRows.length > 0) {
      const pickField = (row: Record<string, any>, regex: RegExp) => {
        const k = Object.keys(row).find((key) => regex.test(key));
        return k ? row[k] : undefined;
      };
      const isDeleteIntent = /(xóa|xoa|delete|remove|gỡ|huỷ|hủy)/i.test(message);

      if (isDeleteIntent) {
        const existingProducts = await listNeonProducts().catch(() => []);
        const targetNames = new Set<string>();
        const targetSkus = new Set<string>();
        for (const raw of excelRows.slice(0, 200)) {
          if (!raw || typeof raw !== 'object') continue;
          const n = String(pickField(raw, /ten|tên|name|title|san pham|sản phẩm/i) || '').trim().toLowerCase();
          const s = String(pickField(raw, /sku|ma|mã/i) || '').trim().toLowerCase();
          if (n) targetNames.add(n);
          if (s) targetSkus.add(s);
        }
        let deletedCount = 0;
        const deletedItems: any[] = [];
        for (const p of existingProducts) {
          const pName = (p.name || '').trim().toLowerCase();
          const pSku = (p.sku || '').trim().toLowerCase();
          if ((pName && targetNames.has(pName)) || (pSku && targetSkus.has(pSku))) {
            await deleteNeonProduct(p.id);
            deletedCount++;
            deletedItems.push({ name: p.name, sku: p.sku || '', price: p.price, note: 'Đã xóa' });
          }
        }
        if (deletedCount > 0) {
          await recordAdminAuditLog({
            actor: 'Admin (Trợ lý AI)',
            action: 'Xóa hàng loạt từ Excel',
            target: `${deletedCount} sản phẩm`,
            detail: `Đã xóa ${deletedCount} sản phẩm khớp với file Excel`,
            items: deletedItems,
          }).catch(() => {});
        }
        return NextResponse.json(
          {
            reply: deletedCount > 0
              ? `🗑️ Đã đọc file Excel và xóa thành công **${deletedCount} sản phẩm** khỏi hệ thống!`
              : '⚠️ Không tìm thấy sản phẩm nào khớp với file Excel để xóa.',
            actionExecuted: deletedCount > 0,
            actionType: 'bulk_delete_excel',
            refreshTargets: deletedCount > 0 ? ['products'] : [],
          },
          { status: 200, headers: CORS_HEADERS }
        );
      }

      const DEFAULT_CAT_IMGS: Record<string, string> = {
        'thuc-an-hat': 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80',
        'pate-cho-meo': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&auto=format&fit=crop&q=80',
        'cat-ve-sinh': 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=800&auto=format&fit=crop&q=80',
        'phu-kien': 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&auto=format&fit=crop&q=80',
      };
      const existingProducts = await listNeonProducts().catch(() => []);
      const createdList: string[] = [];
      const mergedList: string[] = [];
      const auditItems: any[] = [];
      let matchedImgCount = 0;
      for (const raw of excelRows.slice(0, 100)) {
        if (!raw || typeof raw !== 'object') continue;
        const name = String(pickField(raw, /ten|tên|name|title|san pham|sản phẩm/i) || '').trim();
        if (!name) continue;
        const priceRaw = String(pickField(raw, /gia|giá|price/i) || '100000').replace(/[^\d]/g, '');
        const price = Number(priceRaw) || 100000;
        const invRaw = String(pickField(raw, /ton|tồn|kho|inventory|stock|so luong|số lượng/i) || '50').replace(/[^\d]/g, '');
        const inventory = Number(invRaw) || 50;
        const weight = String(pickField(raw, /khoi luong|khối lượng|weight|size/i) || '1kg').trim();
        const sku = String(pickField(raw, /sku|ma|mã/i) || '').trim();
        const catRaw = String(pickField(raw, /danh muc|danh mục|category|loai|loại/i) || 'thuc-an-hat').trim().toLowerCase();
        const category = catRaw.includes('pate') ? 'pate-cho-meo' : catRaw.includes('cat') || catRaw.includes('cát') ? 'cat-ve-sinh' : catRaw.includes('phu') || catRaw.includes('phụ') || catRaw.includes('do choi') || catRaw.includes('đồ chơi') ? 'phu-kien' : 'thuc-an-hat';
        const desc = String(pickField(raw, /mo ta|mô tả|desc/i) || `Sản phẩm ${name} chính hãng Mèo Cưng Pet Shop.`).trim();
        const directImg = String(pickField(raw, /^(ảnh|anh|hình|hinh|image|img|photo|thumbnail|url ảnh|link ảnh|file ảnh)/i) || '').trim();
        const matchedImg = typeof raw.__matchedImage === 'string' && raw.__matchedImage ? raw.__matchedImage : '';
        if (matchedImg) matchedImgCount++;
        const finalImg = matchedImg || (directImg.startsWith('http') || directImg.startsWith('data:') ? directImg : DEFAULT_CAT_IMGS[category]);

        // Nếu trùng SKU hoặc trùng Tên sản phẩm -> cộng dồn số lượng tồn kho
        const duplicate = existingProducts.find((ep) => {
          const sameSku = sku && ep.sku && ep.sku.trim().toLowerCase() === sku.toLowerCase();
          const sameName = ep.name && ep.name.trim().toLowerCase() === name.toLowerCase();
          return Boolean(sameSku || sameName);
        });

        if (duplicate) {
          const nextInventory = (Number(duplicate.inventory) || 0) + inventory;
          const updated = await upsertNeonProduct({
            ...duplicate,
            id: duplicate.id,
            price,
            inventory: nextInventory,
            weight: weight || duplicate.weight,
            image: finalImg || duplicate.image,
            description: desc || duplicate.description,
          });
          duplicate.inventory = updated.inventory;
          mergedList.push(`${name} (+${inventory} → ${nextInventory})`);
          auditItems.push({
            name,
            sku,
            category,
            weight,
            price,
            inventory: nextInventory,
            image: finalImg,
            description: desc,
            note: `Cộng dồn tồn kho +${inventory} (tổng ${nextInventory})`,
          });
        } else {
          const created = await upsertNeonProduct({
            name,
            sku,
            price,
            inventory,
            weight,
            category,
            image: finalImg,
            description: desc,
          });
          existingProducts.push(created);
          createdList.push(name);
          auditItems.push({
            name,
            sku,
            category,
            weight,
            price,
            inventory,
            image: finalImg,
            description: desc,
            note: `Thêm mới (tồn kho ${inventory})`,
          });
        }
      }

      const totalAffected = createdList.length + mergedList.length;
      if (totalAffected > 0) {
        await recordAdminAuditLog({
          actor: 'Admin (Trợ lý AI)',
          action: 'Nhập Excel sản phẩm',
          target: `${totalAffected} sản phẩm`,
          detail: `Thêm mới ${createdList.length} SP, cộng dồn tồn kho ${mergedList.length} SP trùng`,
          items: auditItems,
        }).catch(() => {});
      }

      const parts: string[] = [];
      if (createdList.length > 0) parts.push(`thêm mới **${createdList.length} sản phẩm**`);
      if (mergedList.length > 0) parts.push(`cộng dồn tồn kho **${mergedList.length} sản phẩm trùng**`);

      return NextResponse.json(
        {
          reply: totalAffected > 0
            ? `✅ Đã đọc file Excel: ${parts.join(' và ')}${matchedImgCount > 0 ? ` (tự khớp **${matchedImgCount} ảnh**)` : ''}!`
            : '⚠️ Không tìm thấy cột tên sản phẩm hợp lệ trong file Excel (hãy đặt cột tên là "Tên sản phẩm" hoặc "name").',
          actionExecuted: totalAffected > 0,
          actionType: 'bulk_import_excel',
          refreshTargets: totalAffected > 0 ? ['products'] : [],
        },
        { status: 200, headers: CORS_HEADERS }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Vui lòng nhập yêu cầu cho Trợ lý AI.' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const apiKey = (process.env.ADMIN_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chưa cấu hình ADMIN_GEMINI_API_KEY trên server.' },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Fetch brief live context from Neon so AI can answer stats or find IDs
    const [vouchers, orders, customers, products, categories] = await Promise.all([
      listNeonVouchers().catch(() => []),
      listNeonOrders().catch(() => []),
      listNeonUsers().catch(() => []),
      listNeonProducts().catch(() => []),
      listNeonCategories().catch(() => []),
    ]);

    const contextSummary = {
      counts: {
        products: products.length,
        categories: categories.length,
        orders: orders.length,
        pendingOrders: orders.filter((o) => o.status === 'pending').length,
        customers: customers.length,
        vouchers: vouchers.length,
      },
      categories: categories.map((c) => ({ id: c.id, name: c.name, handle: c.handle })),
      vouchers: vouchers.slice(0, 15).map((v) => ({ id: v.id, code: v.code, type: v.type, discount_value: v.discount_value })),
      orders: orders.slice(0, 15).map((o) => ({ id: o.id, code: o.order_code, name: o.customer_name, status: o.status, total: o.grand_total })),
      products: products.slice(0, 15).map((p) => ({ id: p.id, name: p.name, price: p.price, inventory: p.inventory })),
    };

    const systemPrompt = `Bạn là Trợ lý AI Admin của Mèo Cưng Pet Shop. Bạn giúp Admin thao tác nhanh dữ liệu cửa hàng (tạo/xóa voucher, tạo mã freeship, thêm/sửa/xóa sản phẩm, thêm/xóa danh mục sản phẩm, đổi trạng thái đơn hàng, tạo tài khoản khách hàng, hoặc thống kê).
KHÔNG nhắc tới tên kỹ thuật như Neon, PostgreSQL, database hay tên bảng trong câu trả lời cho Admin.
Dữ liệu hiện tại trên hệ thống: ${JSON.stringify(contextSummary)}

BẮT BUỘC trả về JSON hợp lệ theo đúng cấu trúc:
{
  "reply": "Câu trả lời ngắn gọn, rõ ràng bằng tiếng Việt",
  "action": {
    "type": "none" | "create_voucher" | "delete_voucher" | "create_product" | "update_product" | "delete_product" | "create_category" | "delete_category" | "update_order_status" | "create_customer",
    "payload": {}
  }
}

Quy tắc payload theo từng action.type:
- "create_voucher": { "code": "UPPERCASE", "title": "Tên chương trình", "type": "percent"|"fixed"|"freeship", "discount_value": number (0 nếu freeship), "min_order": number }
- "delete_voucher": { "code": "MÃ_VOUCHER" }
- "create_product": { "name": "Tên SP", "price": number, "inventory": number, "weight": "1kg", "category": "handle danh mục", "image": "url ảnh nếu có", "description": "mô tả ngắn" }
- "update_product": { "name": "Tên SP cần sửa", "price": number (tuỳ chọn), "inventory": number (tuỳ chọn), "image": "url ảnh nếu có", "description": "mô tả nếu có" }
- "delete_product": { "name": "Tên SP cần xóa" }
- "create_category": { "name": "Tên danh mục mới", "description": "mô tả ngắn (tuỳ chọn)" }
- "delete_category": { "name": "Tên danh mục cần xóa" }
- "update_order_status": { "order_code": "MC...", "status": "pending"|"confirmed"|"shipping"|"delivered"|"cancelled" }
- "create_customer": { "name": "Tên", "email": "email@...", "phone": "09...", "password": "ít nhất 6 ký tự" }
- "none": {} (khi chỉ hỏi thống kê/tư vấn)`;

    const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
      'thuc-an-hat': 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800&auto=format&fit=crop&q=80',
      'pate-cho-meo': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&auto=format&fit=crop&q=80',
      'cat-ve-sinh': 'https://images.unsplash.com/photo-1563865436874-9aef32095fad?w=800&auto=format&fit=crop&q=80',
      'phu-kien': 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=800&auto=format&fit=crop&q=80',
    };

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
      reply = `✅ Đã tạo mã **${created.code}** (${created.title}) thành công!`;
    } else if (actionType === 'delete_voucher' && payload.code) {
      const target = vouchers.find((v) => v.code.toUpperCase() === String(payload.code).toUpperCase());
      if (target) {
        await deleteNeonVoucher(target.id);
        actionExecuted = true;
        refreshTargets.push('vouchers');
        reply = `🗑️ Đã xóa mã voucher **${target.code}**!`;
      } else {
        reply = `⚠️ Không tìm thấy mã voucher **${payload.code}** trên hệ thống.`;
      }
    } else if (actionType === 'create_product' && payload.name) {
      const cat = String(payload.category || 'thuc-an-hat');
      const img = attachedImage || (typeof payload.image === 'string' && payload.image.trim()) || DEFAULT_CATEGORY_IMAGES[cat] || DEFAULT_CATEGORY_IMAGES['thuc-an-hat'];
      const created = await upsertNeonProduct({
        name: String(payload.name),
        price: Number(payload.price) || 100000,
        inventory: Number(payload.inventory) || 50,
        weight: String(payload.weight || '1kg'),
        category: cat,
        image: img,
        description: String(payload.description || `Sản phẩm ${payload.name} chính hãng Mèo Cưng Pet Shop.`),
      });
      actionExecuted = true;
      refreshTargets.push('products');
      reply = `✅ Đã thêm sản phẩm **${created.name}** (${created.price.toLocaleString('vi-VN')}₫, tồn kho ${created.inventory}) thành công!`;
    } else if (actionType === 'update_product' && payload.name) {
      const q = String(payload.name).toLowerCase();
      const target = products.find((p) => p.name.toLowerCase().includes(q));
      if (target) {
        const nextImg = attachedImage || (typeof payload.image === 'string' && payload.image.trim()) || target.image;
        const updated = await upsertNeonProduct({
          ...target,
          price: payload.price !== undefined ? Number(payload.price) : target.price,
          inventory: payload.inventory !== undefined ? Number(payload.inventory) : target.inventory,
          image: nextImg,
          description: payload.description ? String(payload.description) : target.description,
        });
        actionExecuted = true;
        refreshTargets.push('products');
        reply = `✅ Đã cập nhật sản phẩm **${updated.name}** (giá ${updated.price.toLocaleString('vi-VN')}₫, tồn kho ${updated.inventory}${nextImg ? ', đã cập nhật ảnh' : ''})!`;
      } else {
        reply = `⚠️ Không tìm thấy sản phẩm khớp với "${payload.name}".`;
      }
    } else if (actionType === 'delete_product' && payload.name) {
      const q = String(payload.name).toLowerCase();
      const target = products.find((p) => p.name.toLowerCase().includes(q));
      if (target) {
        await deleteNeonProduct(target.id);
        actionExecuted = true;
        refreshTargets.push('products');
        reply = `🗑️ Đã xóa sản phẩm **${target.name}**!`;
      } else {
        reply = `⚠️ Không tìm thấy sản phẩm khớp với "${payload.name}".`;
      }
    } else if (actionType === 'create_category' && payload.name) {
      const created = await createNeonCategory({
        name: String(payload.name),
        description: payload.description ? String(payload.description) : '',
      });
      actionExecuted = true;
      refreshTargets.push('categories');
      reply = `✅ Đã thêm danh mục **${created.name}** thành công!`;
    } else if (actionType === 'delete_category' && payload.name) {
      const q = String(payload.name).toLowerCase();
      const target = categories.find((c) => c.name.toLowerCase().includes(q) || c.handle.toLowerCase().includes(q));
      if (target) {
        await deleteNeonCategory(target.id);
        actionExecuted = true;
        refreshTargets.push('categories');
        reply = `🗑️ Đã xóa danh mục **${target.name}**!`;
      } else {
        reply = `⚠️ Không tìm thấy danh mục khớp với "${payload.name}".`;
      }
    } else if (actionType === 'update_order_status' && payload.order_code && payload.status) {
      const codeNorm = String(payload.order_code).replace(/^#/, '').toLowerCase();
      const target = orders.find((o) => o.order_code.toLowerCase() === codeNorm);
      if (target) {
        await updateNeonOrder(target.id, { status: payload.status as OrderStatus });
        actionExecuted = true;
        refreshTargets.push('orders');
        reply = `✅ Đã cập nhật đơn **#${target.order_code}** sang trạng thái **${payload.status}**!`;
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
      reply = `✅ Đã tạo tài khoản khách hàng **${created.name}** (${created.email}) thành công!`;
    }

    if (actionExecuted) {
      await recordAdminAuditLog({
        actor: 'Admin (Trợ lý AI)',
        action: actionType,
        target: String(payload.name || payload.code || payload.order_code || payload.email || ''),
        detail: reply.replace(/\*\*/g, ''),
        items: [
          {
            name: payload.name || payload.title || payload.code || payload.order_code || payload.email || actionType,
            sku: payload.sku || payload.code || payload.order_code || '',
            category: payload.category || payload.type || payload.status || '',
            weight: payload.weight || '',
            price: payload.price || payload.discount_value || 0,
            inventory: payload.inventory ?? '',
            image: attachedImage || payload.image || '',
            description: payload.description || payload.phone || payload.email || '',
            note: reply.replace(/\*\*/g, ''),
          },
        ],
      }).catch(() => {});
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
