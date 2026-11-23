# MÈO CƯNG E-COMMERCE — NEXT.JS + MEDUSAJS + PAYLOADCMS

Hệ thống Thương Mại Điện Tử & Cẩm Nang Chăm Sóc Mèo Cưng chuẩn kiến trúc Headless hiện đại, tích hợp song song:
1. **MedusaJS (v2)**: E-commerce Engine quản lý Danh mục sản phẩm (Hạt, Pate, Cát vệ sinh, Phụ kiện), Biến thể, Giỏ hàng (Cart) và Đơn hàng.
2. **PayloadCMS / Directus**: Headless CMS quản lý Nội dung Banner marketing, Cẩm nang nuôi dưỡng thú cưng, Bài viết SEO.
3. **Storefront Next.js 14 App Router**: Giao diện người dùng tối ưu hóa SEO, hiển thị mượt mà trên Vercel.

---

## 1. Cấu Trúc Dự Án (`C:\ky5\thuctap\meocung-ecommerce`)

```text
meocung-ecommerce/
├── app/
│   ├── api/
│   │   ├── posts/         # API Endpoint PayloadCMS Cẩm nang Mèo Cưng
│   │   └── banners/       # API Endpoint PayloadCMS Banners trang chủ
│   ├── cart/              # Trang Giỏ hàng (Medusa Cart integration)
│   ├── collections/       # Trang Danh mục sản phẩm (Hạt, Pate, Cát...)
│   ├── posts/             # Trang danh sách & chi tiết Cẩm nang (PayloadCMS)
│   ├── products/          # Trang danh sách & chi tiết Sản phẩm (MedusaJS)
│   ├── layout.tsx         # Layout chính chuẩn thương hiệu Mèo Cưng
│   └── page.tsx           # Trang chủ kết hợp Banner (Payload) + Sản phẩm (Medusa)
├── components/
│   ├── HeaderClient.tsx   # Header điều hướng, giỏ hàng real-time & hotline
│   └── ProductCard.tsx    # Card sản phẩm hiển thị giá, đánh giá, nút mua hàng
├── lib/
│   ├── medusa.ts          # MedusaJS Store API Client & Cart Engine
│   ├── payload.ts         # PayloadCMS API Client & Cẩm nang Blog Engine
│   ├── directus.ts        # Directus Client dự phòng
│   └── products.ts        # Dữ liệu sản phẩm & Danh mục Mèo Cưng
└── tailwind.config.ts     # Bảng màu pastel ấm áp chuẩn Pet Shop
```

---

## 2. Hướng Dẫn Chạy Cục Bộ (Local Development)

```bash
cd C:\ky5\thuctap\meocung-ecommerce

# 1. Cài đặt thư viện
npm install

# 2. Khởi chạy Storefront
npm run dev
```

Mở trình duyệt tại: `http://localhost:3000`

---

## 3. Hướng Dẫn Deploy Miễn Phí Lên Vercel

1. Đẩy thư mục này lên GitHub cá nhân của bạn:
   ```bash
   git add .
   git commit -m "feat: complete meocung ecommerce with MedusaJS and PayloadCMS integration"
   git remote add origin https://github.com/TrangLibra/meocung-ecommerce.git
   git push -u origin main
   ```
2. Truy cập [vercel.com](https://vercel.com) $\rightarrow$ **Add New Project** $\rightarrow$ Chọn repo vừa tạo.
3. Thêm các biến môi trường trong mục **Environment Variables** (theo file `.env.example`).
4. Nhấn **Deploy** $\rightarrow$ Vercel sẽ tự động build và cấp tên miền `https://meocung-ecommerce.vercel.app`.
