# KIẾN TRÚC HỆ THỐNG HEADLESS E-COMMERCE (MÈO CƯNG PET SHOP)

> **Dự án:** Hệ thống Thương Mại Điện Tử & Quản Trị Cẩm Nang Chăm Sóc Mèo Cưng  
> **Kiến trúc:** Headless / Decoupled Microservices Architecture  
> **Ngăn xếp công nghệ:** Next.js (Storefront) + PayloadCMS 3.0 (Headless CMS) + MedusaJS v2 (E-commerce Core Engine) + Neon PostgreSQL Cloud.

---

## 1. Sơ đồ Kiến trúc Tổng thể (High-Level Architecture)

```mermaid
flowchart TB
    subgraph ClientLayer ["1. TẦNG TRẢI NGHIỆM NGƯỜI DÙNG (FRONTEND & CLIENT)"]
        SF["🛒 Next.js Storefront\n(Customized ShadCN UI / Saleor Style)\nDeploy: Vercel Production"]
        ADMIN["🛠️ Unified Admin Dashboard\n(Customized ShadCN Admin + Tích hợp PayloadCMS)\nDeploy: Vercel Production"]
    end

    subgraph APILayer ["2. TẦNG DỊCH VỤ HEADLESS & API GATEWAY"]
        subgraph PayloadService ["PayloadCMS 3.0 (Headless CMS Engine)"]
            CMS_AUTH["Auth & Users Module"]
            CMS_POSTS["Cẩm nang nuôi mèo (Datetime Picker, Auto-slug)"]
            CMS_BANNERS["Banners & Sliders Khuyến mãi"]
            CMS_COUPONS["Mã giảm giá & Voucher"]
            CMS_GLOBALS["Site Settings (Header, Footer, Hotline)"]
            CMS_REST["REST & GraphQL API Endpoints"]
        end

        subgraph MedusaService ["MedusaJS v2 Core (E-Commerce Backend)"]
            MED_CART["Cart & Checkout Workflow"]
            MED_ORDER["Order Management Engine"]
            MED_PROD["Product Catalog & Variants"]
            MED_PRICE["Pricing & Multi-currency"]
            MED_AUTH["RBAC & API Keys"]
        end
    end

    subgraph DataLayer ["3. TẦNG DỮ LIỆU ĐÁM MÂY (PERSISTENCE LAYER)"]
        NEON_DB[("🐘 Neon Serverless PostgreSQL\n(Shared High-Performance Cloud Database)")]
    end

    %% Client Interactions
    SF -- "Kéo bài viết cẩm nang, banners (ISR 15s)" --> CMS_REST
    SF -- "Tra cứu sản phẩm, giỏ hàng, đặt hàng" --> MedusaService
    ADMIN -- "Quản trị nội dung cẩm nang, SEO, banner, voucher" --> CMS_REST
    ADMIN -- "Đồng bộ catalog sản phẩm, xem đơn hàng" --> MedusaService

    %% Service to DB Connections
    PayloadService -- "Drizzle / Postgres Adapter (SSL Pooler)" --> NEON_DB
    MedusaService -- "MikroORM / Pg Connection Pool" --> NEON_DB
```

---

## 2. Chi tiết các Phân hệ Kiến trúc

### A. Storefront Next.js (Customized ShadCN / Saleor Style)
- **Công nghệ:** Next.js 15 (App Router), Tailwind CSS, Lucide Icons, ShadCN UI Components.
- **Phong cách thiết kế:** Tối giản, hiện đại theo chuẩn Saleor Storefront, gam màu cam ấm chủ đạo của thương hiệu Mèo Cưng.
- **Nhiệm vụ:**
  - **Trang chủ (`/`):** Hero Banner khuyến mãi (kéo từ PayloadCMS), danh mục sản phẩm nổi bật, bài viết cẩm nang mới nhất.
  - **Danh mục & Chi tiết sản phẩm (`/products`, `/products/[id]`):** Tích hợp giỏ hàng và danh mục hạt, pate, cát vệ sinh.
  - **Trang Cẩm Nang Tin Tức (`/tin-tuc`, `/posts/[slug]`):** Tích hợp cơ chế **ISR (Incremental Static Regeneration)** cập nhật sau mỗi 15 giây khi có bài viết mới từ PayloadCMS.
  - **Nút điều hướng quản trị (`Header`):** Dẫn thẳng vào Unified Admin có kiểm tra quyền đăng nhập.

---

### B. Admin Dashboard (Customized theo ShadCN + Tích hợp PayloadCMS)
- **Kiến trúc tích hợp:** Tận dụng thế mạnh của **PayloadCMS 3.0** (chạy native trên Next.js App Router) kết hợp thiết kế Dark Mode tối giản theo phong cách **ShadCN UI**.
- **Tính năng quản trị tập trung:**
  1. **Quản lý Tài khoản (Users):** Phân quyền Super Admin, Editor, Customer với chuẩn mã hóa PBKDF2 bảo mật.
  2. **Cẩm nang nuôi mèo (`posts`):**
     - Quản lý hơn 100 bài viết cẩm nang chuẩn SEO.
     - Bộ chọn ngày giờ xuất bản (**Datetime Picker**) chính xác.
     - Tự động sinh đường dẫn tĩnh (**Auto Slug hook**) thân thiện từ tiêu đề bài viết.
  3. **Quản lý Bán hàng:**
     - Danh mục **Sản phẩm hạt & pate (`products`)**.
     - Danh mục **Đơn hàng (`orders`)**: Theo dõi trạng thái *Chờ xác nhận, Đang giao, Hoàn thành*.
     - Danh mục **Voucher & Khuyến mãi (`coupons`)**: Quản lý mã giảm giá, hạn sử dụng.
     - Danh mục **Đánh giá (`reviews`)**: Kiểm duyệt số sao và phản hồi của khách hàng.
  4. **Cấu hình toàn trang (Globals Site Settings):** Cài đặt Hotline, Tên shop, Địa chỉ hiển thị thống nhất trên toàn hệ thống.

---

### C. MedusaJS v2 API (Core E-Commerce Engine)
- **Công nghệ:** MedusaJS v2 Framework (Node.js 20).
- **Môi trường triển khai:** Render Web Service (Containerized Node.js 24/7 daemon).
- **Trách nhiệm hệ thống:**
  - Xử lý nghiệp vụ lõi về thương mại điện tử (Core Workflows).
  - Quản lý phiên giỏ hàng (Cart Session), định giá (Price Sets), địa chỉ giao hàng và quy trình đặt hàng.
  - Cung cấp Store API và Admin API được bảo vệ qua JWT và API Key.

---

### D. Cơ sở dữ liệu Neon PostgreSQL Cloud
- **Cơ chế:** Database đám mây phi máy chủ (Serverless PostgreSQL) hỗ trợ tự động co giãn và kết nối an toàn SSL.
- **Chia sẻ dữ liệu:**
  - Lưu trữ các bảng CMS của Payload: `users`, `posts`, `products`, `banners`, `coupons`, `orders`, `reviews`, `site_settings`...
  - Lưu trữ lược đồ E-commerce của Medusa: `cart`, `order`, `product_variant`, `payment`...

---

## 3. Luồng dữ liệu hoạt động (Data Flow Sequence)

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👨‍💼 Quản Trị Viên (Admin)
    actor Customer as 🐱 Khách Hàng (User)
    participant AdminUI as 🛠️ Admin Dashboard (Payload / ShadCN)
    participant SF as 🛒 Next.js Storefront
    participant Medusa as ⚙️ MedusaJS Core API
    participant NeonDB as 🐘 Neon PostgreSQL

    %% Luồng đăng bài cẩm nang
    Admin->>AdminUI: Soạn bài viết cẩm nang (Tiêu đề, Datetime Picker)
    AdminUI->>AdminUI: Hook tự sinh Slug URL từ Tiêu đề
    AdminUI->>NeonDB: Lưu bài viết vào bảng posts (Status: Published)
    NeonDB-->>AdminUI: Xác nhận lưu thành công
    
    %% Luồng đồng bộ sang Storefront
    Customer->>SF: Truy cập /tin-tuc hoặc Trang chủ
    SF->>NeonDB: Fetch dữ liệu bài viết mới qua Payload API (ISR 15s)
    NeonDB-->>SF: Trả về danh sách bài viết & Banners
    SF-->>Customer: Hiển thị bài viết mới ngay lập tức

    %% Luồng đặt hàng E-commerce
    Customer->>SF: Thêm thức ăn hạt vào giỏ & Đặt hàng
    SF->>Medusa: Gửi yêu cầu Create Cart & Checkout Order
    Medusa->>NeonDB: Lưu giao dịch, trừ kho & tạo Order
    Medusa-->>SF: Xác nhận đơn hàng thành công
    Medusa-->>AdminUI: Đồng bộ thông tin đơn hàng sang Dashboard quản trị
```

---

## 4. Bảng phân phối Hạ tầng & Deployment

| Thành phần | Công nghệ | Nền tảng Cloud | Địa chỉ Deployment |
| :--- | :--- | :--- | :--- |
| **Storefront** | Next.js 15, Tailwind, ShadCN | **Vercel** | `https://meocung-ecommerce-seven.vercel.app` |
| **Admin Dashboard & CMS** | PayloadCMS 3.0, ShadCN Dark Theme | **Vercel** | `https://meocung-payload.vercel.app/admin` |
| **E-Commerce API Core** | MedusaJS v2 Framework | **Render** | `https://meocung-medusa.onrender.com` |
| **Cơ sở dữ liệu tập trung**| PostgreSQL Serverless (Pooler) | **Neon Cloud** | `ep-hidden-morning-bigw8w9g...neon.tech` |
