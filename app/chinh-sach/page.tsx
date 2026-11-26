import Link from 'next/link';
import { Truck, RefreshCw, CreditCard, ShieldCheck, Phone, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Chính Sách & Hỗ Trợ | Mèo Cưng',
  description:
    'Chính sách giao hàng hỏa tốc 2H, đổi trả trong 7 ngày, hướng dẫn mua hàng và cam kết chính hãng tại Mèo Cưng TP.HCM.',
};

export default function PolicyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#ff7f5c] mb-2 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            Chính Sách & Hỗ Trợ Khách Hàng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Cam kết dịch vụ minh bạch, nhanh chóng và an toàn cho hoàng thượng của bạn.
          </p>
        </div>
      </div>

      <div className="space-y-5">
        <section
          id="giao-hang"
          className="bg-white rounded-3xl border border-gray-200 p-6 space-y-2.5 scroll-mt-28"
        >
          <div className="flex items-center gap-2.5 text-[#ff7f5c]">
            <Truck className="w-5 h-5" />
            <h2 className="text-lg font-black text-gray-900">
              1. Chính sách giao hàng hỏa tốc 2H
            </h2>
          </div>
          <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-5 leading-relaxed">
            <li>
              <strong>Giao hỏa tốc trong 2 giờ</strong> tại tất cả các quận nội thành TP. Hồ Chí Minh (khung giờ 8:00 – 21:00 hàng ngày).
            </li>
            <li>
              <strong>Miễn phí vận chuyển (Freeship)</strong> cho mọi đơn hàng từ <strong>300.000₫</strong> trở lên.
            </li>
            <li>
              Đơn hàng dưới 300.000₫ áp dụng phí giao hàng đồng giá <strong>25.000₫</strong>.
            </li>
          </ul>
        </section>

        <section
          id="doi-tra"
          className="bg-white rounded-3xl border border-gray-200 p-6 space-y-2.5 scroll-mt-28"
        >
          <div className="flex items-center gap-2.5 text-[#ff7f5c]">
            <RefreshCw className="w-5 h-5" />
            <h2 className="text-lg font-black text-gray-900">
              2. Chính sách đổi trả trong 7 ngày
            </h2>
          </div>
          <ul className="text-sm text-gray-600 space-y-1.5 list-disc pl-5 leading-relaxed">
            <li>
              Hỗ trợ đổi mới hoặc hoàn tiền 100% trong vòng <strong>7 ngày</strong> nếu sản phẩm bị rách bao bì, lỗi từ nhà sản xuất hoặc giao nhầm mặt hàng.
            </li>
            <li>
              Sản phẩm đổi trả cần còn nguyên tem nhãn và chưa qua sử dụng (trừ trường hợp phát hiện lỗi chất lượng khi mở bao).
            </li>
          </ul>
        </section>

        <section
          id="mua-hang"
          className="bg-white rounded-3xl border border-gray-200 p-6 space-y-2.5 scroll-mt-28"
        >
          <div className="flex items-center gap-2.5 text-[#ff7f5c]">
            <CreditCard className="w-5 h-5" />
            <h2 className="text-lg font-black text-gray-900">
              3. Hướng dẫn mua hàng & thanh toán
            </h2>
          </div>
          <ol className="text-sm text-gray-600 space-y-1.5 list-decimal pl-5 leading-relaxed">
            <li>Chọn sản phẩm yêu thích và bấm <strong>Thêm vào giỏ</strong>.</li>
            <li>Đăng nhập tài khoản Mèo Cưng để theo dõi đơn hàng và nhận Gmail xác nhận.</li>
            <li>Điền địa chỉ nhận hàng tại TP.HCM và bấm <strong>Xác Nhận Đặt Hàng Hỏa Tốc (COD)</strong> — thanh toán tiền mặt khi nhận hàng.</li>
          </ol>
        </section>

        <section
          id="chinh-hang"
          className="bg-white rounded-3xl border border-gray-200 p-6 space-y-2.5 scroll-mt-28"
        >
          <div className="flex items-center gap-2.5 text-[#ff7f5c]">
            <ShieldCheck className="w-5 h-5" />
            <h2 className="text-lg font-black text-gray-900">
              4. Cam kết sản phẩm chính hãng 100%
            </h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Toàn bộ thức ăn hạt (Royal Canin, Reflex Plus...), pate (Ciao Churu, Whiskas...) và cát vệ sinh tại Mèo Cưng đều có nguồn gốc xuất xứ rõ ràng, hạn sử dụng dài và bảo quản đúng tiêu chuẩn.
          </p>
        </section>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">Cần hỗ trợ nhanh về đơn hàng?</h3>
          <p className="text-xs text-gray-600 mt-0.5">
            Đội ngũ Mèo Cưng sẵn sàng tư vấn 24/7 qua Hotline hoặc Trợ lý AI ở góc phải màn hình.
          </p>
        </div>
        <a
          href="tel:0382542737"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ff7f5c] hover:bg-[#f0643d] text-white font-bold text-xs transition shrink-0"
        >
          <Phone className="w-4 h-4" />
          <span>Gọi 0382 542 737</span>
        </a>
      </div>
    </div>
  );
}
