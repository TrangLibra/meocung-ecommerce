'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  Eye, 
  RotateCcw,
  Search,
  ExternalLink
} from 'lucide-react';
import { PRODUCTS, Product, CATEGORIES } from '@/lib/products';
import { SAMPLE_MEOCUNG_POSTS, PostModel } from '@/lib/directus';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'posts'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<PostModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Modal / Form state for Editing
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPost, setEditingPost] = useState<PostModel | null>(null);

  useEffect(() => {
    // Nạp dữ liệu từ localStorage để có tính năng Realtime Persist
    const savedProducts = localStorage.getItem('gh_admin_products');
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch {
        setProducts(PRODUCTS);
      }
    } else {
      setProducts(PRODUCTS);
    }

    const savedPosts = localStorage.getItem('gh_admin_posts');
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch {
        setPosts(SAMPLE_MEOCUNG_POSTS);
      }
    } else {
      setPosts(SAMPLE_MEOCUNG_POSTS);
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Lưu sản phẩm
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let updated: Product[];
    const exists = products.some(p => p.id === editingProduct.id);

    if (exists) {
      updated = products.map(p => p.id === editingProduct.id ? editingProduct : p);
      showNotification(`Đã cập nhật sản phẩm "${editingProduct.name}" thành công!`);
    } else {
      updated = [editingProduct, ...products];
      showNotification(`Đã thêm mới sản phẩm "${editingProduct.name}" thành công!`);
    }

    setProducts(updated);
    localStorage.setItem('gh_admin_products', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setEditingProduct(null);
  };

  // Xóa sản phẩm
  const handleDeleteProduct = (id: string) => {
    if (!confirm('Anh/chị có chắc chắn muốn xóa sản phẩm này không?')) return;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem('gh_admin_products', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    showNotification('Đã xóa sản phẩm khỏi danh mục!');
  };

  // Lưu bài viết Cẩm nang
  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    let updated: PostModel[];
    const exists = posts.some(p => p.id === editingPost.id);

    if (exists) {
      updated = posts.map(p => p.id === editingPost.id ? editingPost : p);
      showNotification(`Đã cập nhật bài viết "${editingPost.title}"!`);
    } else {
      updated = [editingPost, ...posts];
      showNotification(`Đã xuất bản bài viết "${editingPost.title}"!`);
    }

    setPosts(updated);
    localStorage.setItem('gh_admin_posts', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    setEditingPost(null);
  };

  // Xóa bài viết
  const handleDeletePost = (id: string | number) => {
    if (!confirm('Anh/chị có chắc chắn muốn xóa bài viết này không?')) return;
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    localStorage.setItem('gh_admin_posts', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage'));
    showNotification('Đã xóa bài viết cẩm nang thành công!');
  };

  // Khôi phục dữ liệu gốc
  const handleResetData = () => {
    if (!confirm('Khôi phục toàn bộ dữ liệu mẫu ban đầu?')) return;
    localStorage.removeItem('gh_admin_products');
    localStorage.removeItem('gh_admin_posts');
    setProducts(PRODUCTS);
    setPosts(SAMPLE_MEOCUNG_POSTS);
    window.dispatchEvent(new Event('storage'));
    showNotification('Đã khôi phục dữ liệu gốc thành công!');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#ff7f5c] transition px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#ff7f5c]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Xem Web Storefront</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Mèo Cưng Admin — Realtime PayloadCMS &amp; Medusa
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetData}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200 transition"
              title="Khôi phục dữ liệu mặc định ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khôi phục gốc</span>
            </button>
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-orange-100 text-[#ff7f5c]">
              <Sparkles className="w-3 h-3" />
              <span>Live Edit Mode</span>
            </span>
          </div>
        </div>
      </header>

      {/* Thông báo cập nhật */}
      {notice && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Banner hướng dẫn Mentor */}
        <div className="bg-gradient-to-r from-orange-500 via-[#ff7f5c] to-amber-500 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-orange-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black">
              Bảng Điều Khiển Quản Trị &amp; Chỉnh Sửa Dữ Liệu Thời Gian Thực
            </h2>
            <p className="text-white/90 text-sm max-w-2xl">
              Anh có thể <strong>Thêm mới</strong>, <strong>Chỉnh sửa giá</strong>, <strong>Cập nhật tồn kho</strong> hoặc <strong>Đăng bài cẩm nang</strong> tại đây. Toàn bộ thay đổi sẽ được phản hồi ngay lập tức ra ngoài trang chủ Vercel mà không cần build lại code!
            </p>
          </div>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#ff7f5c] font-bold text-sm shadow hover:bg-orange-50 transition shrink-0"
          >
            <span>Mở trang chủ kiểm tra</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('products'); setSearchTerm(''); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'products'
                  ? 'bg-[#ff7f5c] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Sản Phẩm Hạt &amp; Pate ({products.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('posts'); setSearchTerm(''); }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                activeTab === 'posts'
                  ? 'bg-[#ff7f5c] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Cẩm Nang Nuôi Mèo ({posts.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm nhanh..."
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#ff7f5c]"
              />
            </div>

            {activeTab === 'products' ? (
              <button
                onClick={() => setEditingProduct({
                  id: `p-${Date.now()}`,
                  name: '',
                  slug: `san-pham-${Date.now()}`,
                  categorySlug: 'thuc-an-hat',
                  categoryName: 'Thức ăn hạt',
                  price: 150000,
                  originalPrice: 180000,
                  image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
                  rating: 5.0,
                  soldCount: 0,
                  weight: '1kg',
                  inStock: true,
                  description: ''
                })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-bold transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Sản Phẩm</span>
              </button>
            ) : (
              <button
                onClick={() => setEditingPost({
                  id: `post-${Date.now()}`,
                  title: '',
                  slug: `cam-nang-${Date.now()}`,
                  category: 'Thức ăn hạt',
                  image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
                  content: '<p>Nội dung chia sẻ kinh nghiệm chăm sóc mèo...</p>',
                  status: 'published',
                  date_created: new Date().toISOString()
                })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-bold transition shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Viết Cẩm Nang Mới</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: SẢN PHẨM (MEDUSA PRODUCT ENGINE) */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Hình ảnh &amp; Tên sản phẩm</th>
                    <th className="px-6 py-3.5">Danh mục</th>
                    <th className="px-6 py-3.5">Giá bán (VNĐ)</th>
                    <th className="px-6 py-3.5">Quy cách</th>
                    <th className="px-6 py-3.5">Trạng thái</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100" 
                          />
                          <div>
                            <div className="font-bold text-slate-900 leading-snug">{p.name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {p.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#ff7f5c] border border-orange-100">
                          {p.categoryName}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {p.price.toLocaleString('vi-VN')}đ
                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-xs text-slate-400 line-through ml-1.5 font-normal">
                            {p.originalPrice.toLocaleString('vi-VN')}đ
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {p.weight || 'Tiêu chuẩn'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${p.inStock ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span>{p.inStock ? 'Còn hàng' : 'Tạm hết'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingProduct({ ...p })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#ff7f5c] hover:bg-orange-50 transition"
                            title="Sửa sản phẩm"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        Không tìm thấy sản phẩm nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CẨM NANG & TIN TỨC (PAYLOADCMS POSTS) */}
        {activeTab === 'posts' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Hình ảnh &amp; Tiêu đề bài viết</th>
                    <th className="px-6 py-3.5">Chuyên mục</th>
                    <th className="px-6 py-3.5">Slug URL</th>
                    <th className="px-6 py-3.5">Trạng thái</th>
                    <th className="px-6 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={post.image || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800'} 
                            alt={post.title} 
                            className="w-14 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100" 
                          />
                          <div className="font-bold text-slate-900 leading-snug max-w-md line-clamp-2">
                            {post.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                          {post.category || 'Cẩm nang'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {post.slug}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Xuất bản</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/posts/${post.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Xem trước bài viết"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setEditingPost({ ...post })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#ff7f5c] hover:bg-orange-50 transition"
                            title="Sửa bài viết"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Xóa bài viết"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPosts.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        Chưa có bài viết cẩm nang nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL EDIT/ADD SẢN PHẨM */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                {products.some(p => p.id === editingProduct.id) ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
              </h3>
              <button 
                onClick={() => setEditingProduct(null)} 
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="VD: Hạt Royal Canin Fit 32..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#ff7f5c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#ff7f5c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giá gốc (Gạch chân)</label>
                  <input
                    type="number"
                    value={editingProduct.originalPrice || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#ff7f5c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Danh mục</label>
                  <select
                    value={editingProduct.categorySlug}
                    onChange={(e) => {
                      const sel = CATEGORIES.find(c => c.slug === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        categorySlug: e.target.value as any,
                        categoryName: sel ? sel.name : 'Thức ăn hạt'
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#ff7f5c]"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Trọng lượng / Quy cách</label>
                  <input
                    type="text"
                    value={editingProduct.weight || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, weight: e.target.value })}
                    placeholder="VD: 1.5kg hoặc 85g"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#ff7f5c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Link Ảnh sản phẩm</label>
                <input
                  type="url"
                  value={editingProduct.image}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#ff7f5c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mô tả công dụng</label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Mô tả thành phần dinh dưỡng, công thức..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#ff7f5c]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="inStockCheck"
                  checked={editingProduct.inStock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                  className="w-4 h-4 rounded-sm text-[#ff7f5c] focus:ring-[#ff7f5c]"
                />
                <label htmlFor="inStockCheck" className="text-sm font-semibold text-slate-700">
                  Sản phẩm còn trong kho bán
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ff7f5c] hover:bg-[#e06645] text-white text-sm font-bold shadow-md transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT/ADD BÀI VIẾT */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900">
                {posts.some(p => p.id === editingPost.id) ? 'Sửa Bài Cẩm Nang' : 'Soạn Bài Cẩm Nang Mới'}
              </h3>
              <button 
                onClick={() => setEditingPost(null)} 
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề bài viết *</label>
                <input
                  type="text"
                  required
                  value={editingPost.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const slug = title
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[đĐ]/g, 'd')
                      .replace(/[^a-z0-9\s-]/g, '')
                      .trim()
                      .replace(/\s+/g, '-');
                    setEditingPost({ ...editingPost, title, slug: slug || editingPost.slug });
                  }}
                  placeholder="VD: Cách chọn cát vệ sinh cho mèo..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#ff7f5c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Chuyên mục</label>
                  <input
                    type="text"
                    value={editingPost.category || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value })}
                    placeholder="VD: Cẩm nang nuôi mèo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#ff7f5c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Đường dẫn Slug</label>
                  <input
                    type="text"
                    required
                    value={editingPost.slug}
                    onChange={(e) => setEditingPost({ ...editingPost, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-hidden focus:border-[#ff7f5c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Ảnh đại diện bài viết</label>
                <input
                  type="url"
                  value={editingPost.image || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-[#ff7f5c]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nội dung HTML bài viết</label>
                <textarea
                  rows={5}
                  value={editingPost.content || ''}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  placeholder="<p>Nội dung bài viết kiến thức...</p>"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-hidden focus:border-[#ff7f5c]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-100 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#ff7f5c] hover:bg-[#e06645] text-white text-sm font-bold shadow-md transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Xuất Bản Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
