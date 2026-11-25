import Link from 'next/link';
import { getPayloadPosts, getPayloadBanners } from '@/lib/payload';
import { getMedusaProducts } from '@/lib/medusa';
import { CATEGORIES } from '@/lib/products';
import ProductCard from '@/components/ProductCard';
import { Sparkles, ArrowRight, BookOpen, Calendar, ChevronRight, ShoppingBag } from 'lucide-react';

export const revalidate = 30;

export default async function HomePage() {
  // Lấy đồng thời: Nội dung Banner & Cẩm nang từ PayloadCMS + Sản phẩm từ MedusaJS
  const [banners, posts, products] = await Promise.all([
    getPayloadBanners(),
    getPayloadPosts(6),
    getMedusaProducts(8),
  ]);

  const activeBanner = banners[0] || {
    badge: '🐾 Mèo Cưng Pet Shop TP.HCM',
    title: 'Thức Ăn & Cẩm Nang Chăm Sóc Mèo Cưng Hoàn Hảo',
    subtitle: 'Cung cấp các dòng thức ăn hạt, pate thơm ngon, cát vệ sinh cao cấp và toàn bộ kiến thức nuôi dưỡng mèo chuẩn khoa học cho các "sen"!',
    buttonText: 'Khám phá sản phẩm',
    buttonLink: '/products',
    hotline: '0382 542 737'
  };

  const policies = [
    { title: 'Sản phẩm an toàn', subtitle: '100% nguồn gốc rõ ràng', bgColor: '#FAF7CA', icon: '🛡️' },
    { title: 'Chất lượng chính hãng', subtitle: 'Hạt & pate dinh dưỡng cao', bgColor: '#E3FFD3', icon: '✨' },
    { title: 'Dịch vụ uy tín', subtitle: 'Tư vấn nuôi mèo 24/7', bgColor: '#FED5DC', icon: '🎖️' },
    { title: 'Giao hàng hoả tốc', subtitle: 'Nhanh chóng trong 2h tại HCM', bgColor: '#E4E7FF', icon: '🚀' },
  ];

  return (
    <div className="space-y-12">
      {/* 1. Hero Promotional Banner (Powered by PayloadCMS) */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#ff7f5c] via-[#ff9577] to-[#ffb19b] p-8 sm:p-12 text-white shadow-xl shadow-orange-100">
        <div className="max-w-2xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider text-white border border-white/20">
            <span>{activeBanner.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight drop-shadow-sm">
            {activeBanner.title}
          </h1>

          <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-xl">
            {activeBanner.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={activeBanner.buttonLink === '/san-pham' ? '/products' : activeBanner.buttonLink || '/products'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#ff7f5c] font-bold text-sm hover:bg-orange-50 transition shadow-md"
            >
              <span>{activeBanner.buttonText || 'Mua sắm ngay'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {activeBanner.hotline && (
              <a
                href={`tel:${activeBanner.hotline.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black/15 hover:bg-black/25 text-white font-semibold text-sm transition border border-white/20"
              >
                <span>Hotline: {activeBanner.hotline}</span>
              </a>
            )}
          </div>
        </div>

        <div className="absolute right-4 bottom-0 text-[160px] sm:text-[220px] select-none opacity-25 pointer-events-none transform translate-y-8">
          🐱
        </div>
      </section>

      {/* 2. 4 Policy Cards Pastel */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {policies.map((policy, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-2xl border border-black/5 p-4 sm:p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
              style={{ backgroundColor: policy.bgColor }}
            >
              <div className="w-12 h-12 rounded-xl bg-white/90 flex items-center justify-center text-2xl shadow-sm shrink-0">
                {policy.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                  {policy.title}
                </h3>
                <p className="text-xs text-gray-600 mt-0.5 truncate">
                  {policy.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Categories Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
              <span>Danh Mục Nổi Bật</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 text-[#ff7f5c] font-bold">
                Chọn lọc
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Đầy đủ các dòng thức ăn hạt, pate thơm ngon và vật dụng thiết yếu
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/collections/${cat.slug}`}
              className="group p-4 rounded-2xl border border-gray-100 bg-white hover:border-[#ff7f5c]/40 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-200 flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-orange-50 group-hover:bg-[#ff7f5c] flex items-center justify-center text-2xl transition-colors duration-200 shadow-sm">
                <span>{cat.icon}</span>
              </div>
              <h3 className="font-bold text-gray-800 text-sm sm:text-base mt-3 group-hover:text-[#ff7f5c] transition">
                {cat.name}
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                {cat.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Featured Products (Powered by MedusaJS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sản phẩm bán chạy</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Thức Ăn & Phụ Kiện Yêu Thích Nhất
            </h2>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center gap-1 text-sm font-bold text-[#ff7f5c] hover:text-[#e06645] transition group"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. Cẩm nang Mèo Cưng Blog (Powered by PayloadCMS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Cẩm nang chăm sóc mèo</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">
              Kiến Thức & Kinh Nghiệm Nuôi Mèo
            </h2>
          </div>

          <Link
            href="/tin-tuc"
            className="inline-flex items-center gap-1 text-sm font-bold text-[#ff7f5c] hover:text-[#e06645] transition group"
          >
            <span>Xem thêm bài viết</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {posts.slice(0, 3).map((post) => (
            <article
              key={post.id}
              className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col"
            >
              <Link href={`/posts/${post.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                  src={post.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800'}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  loading="lazy"
                />
                {post.category && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                    {post.category}
                  </span>
                )}
              </Link>

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 group-hover:text-[#ff7f5c] transition leading-snug">
                  <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                </h3>

                <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-50">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {post.date_created
                        ? new Date(post.date_created).toLocaleDateString('vi-VN')
                        : 'Mới cập nhật'}
                    </span>
                  </span>
                  <Link
                    href={`/posts/${post.slug}`}
                    className="font-bold text-[#ff7f5c] inline-flex items-center gap-0.5"
                  >
                    <span>Đọc tiếp</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
