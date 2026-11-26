# 📊 BẢNG SO SÁNH & TÍCH HỢP TÍNH NĂNG: SALEOR ADMIN vs MEDUSAJS vs PAYLOADCMS

> **Chỉ đạo của Mentor:** *"Coi admin của Saleor nó có gì hay, list ra để bổ sung vào dashboard custom dựa trên MedusaJS nha. Nắm mấy cái này mới quan trọng hơn nắm code."*

---

## 🌟 1. Những Điểm Hay Nhất Của Saleor Admin Cần Học Hỏi & Đưa Vào Dashboard

| Phân hệ (Module) | Điểm hay vượt trội của Saleor Dashboard | Cách áp dụng vào Dashboard Mèo Cưng (MedusaJS + PayloadCMS) |
| :--- | :--- | :--- |
| **Catalog & Danh mục** | Phân cấp danh mục đa tầng (Categories & Collections), cấu hình thuộc tính sản phẩm linh hoạt (Attributes: khối lượng, vị thức ăn, độ tuổi mèo). | Tích hợp bộ lọc đa tầng (Hạt, Pate, Cát, Phụ kiện), thuộc tính dinh dưỡng, quy cách đóng gói (1kg, 2kg, 6L). |
| **Quản lý Khách hàng & Nhân viên** | Phân quyền vai trò cực chi tiết (Staff Permissions: Super Admin, Đóng gói, CSKH, Biên tập nội dung); lịch sử mua hàng, địa chỉ, tổng chi tiêu của Customer. | Bổ sung module **Quản lý Nhân viên (Staff)** và **Quản lý Khách hàng (Customers & Users)** với thẻ trạng thái, vai trò. |
| **Đơn hàng & Thực hiện (Fulfillment)** | Quy trình xử lý đơn rõ ràng: Chưa thanh toán ➔ Đã thanh toán ➔ Đang đóng gói ➔ Đang giao ➔ Hoàn thành; in phiếu đơn hàng; hoàn tiền. | Thêm bộ lọc trạng thái đơn hàng Medusa, cập nhật trực tiếp trạng thái đơn và theo dõi mã vận đơn. |
| **Khuyến mãi & Marketing (Discounts)** | Quản lý voucher mã giảm giá (Vouchers), chiến dịch giảm giá theo danh mục/sản phẩm (Sales & Promotions). | Kết nối phân hệ **Mã Giảm Giá & Voucher** từ PayloadCMS sang hiển thị và áp dụng trực tiếp trong Dashboard. |
| **Đa kênh / Đa kho (Multi-Warehouse & Channels)** | Quản lý tồn kho theo từng kho hàng, phân bổ tồn kho đa chi nhánh (TP.HCM, Hà Nội, Đà Nẵng). | Hiển thị kho hàng theo từng **Nhà Bán Hàng (Marketplace Vendors)**: Mèo Cưng Official, Royal Canin VN, Ciao Churu. |
| **Nội dung & Trang tĩnh (Pages)** | Quản lý nội dung bài viết, tin tức trực tiếp trong admin dashboard mà không phải mở công cụ khác. | **Gộp Native API của PayloadCMS:** Xem, tạo, sửa, xóa 105+ bài viết cẩm nang nuôi mèo ngay trên giao diện dashboard, **không cần đăng nhập lại**! |

---

## 🎯 2. Kiến Trúc Dashboard Hợp Nhất Hoàn Chỉnh

```
+---------------------------------------------------------------------------------------------------+
|                           MÈO CƯNG PET SHOP - UNIFIED ADMIN DASHBOARD                             |
|                                (Custom ShadCN + Saleor Theme)                                     |
+-------------------+-------------------------------------------------------------------------------+
| SIDEBAR           | MAIN WORKSPACE (Xử lý dữ liệu không cần đăng nhập lặp lại)                   |
|                   |                                                                               |
| [📊 Dashboard]    | 1. Tổng quan KPI (Doanh thu, Đơn hàng, Tồn kho, Bài viết)                     |
|                   | 2. Quản lý Sản Phẩm & Danh Mục (Medusa Core + Payload Rich-Text)              |
| [🛒 MEDUSA CORE]  | 3. Quản lý Đơn Hàng & Vận Chuyển (Saleor-style Fulfillment Pipeline)          |
| - Sản phẩm & Kho  | 4. Quản lý Khách Hàng (Tích hợp tài khoản đăng ký Gmail OTP)                 |
| - Danh mục        | 5. Quản lý Nhân Viên & Phân Quyền (Super Admin, Editor, Staff)                |
| - Đơn hàng        | 6. Marketplace Multi-Vendor (Mèo Cưng, Royal Canin, Ciao Churu)              |
| - Khách hàng      |                                                                               |
| - Nhân viên       | 7. Cẩm Nang Nuôi Mèo 105+ bài (Gọi trực tiếp API PayloadCMS, CRUD tức thì)    |
| - Nhà bán hàng    | 8. Khuyến Mãi, Voucher & Banner Trang Chủ                                     |
|                   |                                                                               |
| [📝 PAYLOAD CMS]  | DỮ LIỆU ĐỒNG BỘ 2 CHIỀU:                                                      |
| - Cẩm nang 105+   | • Sửa trong Admin Dashboard ➔ Cập nhật ngay lập tức ra Storefront!             |
| - Banners/Slider  | • Không cần iFrame đăng nhập nhiều lần!                                       |
| - Voucher/Coupons |                                                                               |
+-------------------+-------------------------------------------------------------------------------+
```
