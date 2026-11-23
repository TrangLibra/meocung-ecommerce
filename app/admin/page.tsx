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
  RotateCcw,
  Search,
  ShoppingCart,
  Users,
  Tag,
  Settings,
  Layers,
  BarChart3,
  Globe,
  Bell,
  ChevronRight,
  Database,
  Server
} from 'lucide-react';
import { PRODUCTS, Product, CATEGORIES } from '@/lib/products';
import { SAMPLE_MEOCUNG_POSTS, PostModel } from '@/lib/directus';

export default function MedusaAdminDashboardOnline() {
  const [activeMenu, setActiveMenu] = useState<'products' | 'categories' | 'orders' | 'customers' | 'payload-posts'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<PostModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  // Form edit
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingPost, setEditingPost] = useState<PostModel | null>(null);

  useEffect(() => {
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
    setTimeout(() => setNotice(null), 3500);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    let updatedList: Product[];
    const exists = products.some(p => p.id === editingProduct.id);
    if (exists) {
      updatedList = products.map(p => p.id === editingProduct.id ? editingProduct : p);
      showNotification(`Đã cập nhật sản phẩm Medusa: "${editingProduct.name}"`);
    } else {
      updatedList = [editingProduct, ...products];
      showNotification(`Đã tạo mới sản phẩm Medusa: "${editingProduct.name}"`);
    }

    setProducts(updatedList);
    localStorage.setItem('gh_admin_products', JSON.stringify(updatedList));
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa "${name}" khỏi Medusa Store không?`)) return;
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem('gh_admin_products', JSON.stringify(updated));
    showNotification(`Đã xóa sản phẩm: ${name}`);
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    let updatedList: PostModel[];
    const exists = posts.some(p => p.id === editingPost.id);
    if (exists) {
      updatedList = posts.map(p => p.id === editingPost.id ? editingPost : p);
      showNotification(`Đã cập nhật bài viết: "${editingPost.title}"`);
    } else {
      updatedList = [editingPost, ...posts];
      showNotification(`Đã xuất bản bài viết cẩm nang mới: "${editingPost.title}"`);
    }

    setPosts(updatedList);
    localStorage.setItem('gh_admin_posts', JSON.stringify(updatedList));
    setEditingPost(null);
  };

  const handleDeletePost = (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}" không?`)) return;
    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    localStorage.setItem('gh_admin_posts', JSON.stringify(updated));
    showNotification(`Đã xóa bài viết: ${title}`);
  };

  const handleResetData = () => {
    if (!confirm('Khôi phục lại dữ liệu Medusa + Payload mặc định?')) return;
    localStorage.removeItem('gh_admin_products');
    localStorage.removeItem('gh_admin_posts');
    setProducts(PRODUCTS);
    setPosts(SAMPLE_MEOCUNG_POSTS);
    showNotification('Đã khôi phục dữ liệu ban đầu!');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex font-sans antialiased">
      {/* 1. MEDUSA SIDEBAR GỐC */}
      <aside className="w-64 bg-[#1E293B] border-r border-slate-800 flex flex-col justify-between select-none">
        <div>
          {/* Logo & Store Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
                MC
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
                  Mèo Cưng Store
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </h1>
                <p className="text-[11px] text-slate-400">Medusa & Payload Engine</p>
              </div>
            </div>
          </div>

          {/* Medusa Navigation Links */}
          <div className="px-3 py-4 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Medusa Commerce
            </div>

            <button
              onClick={() => { setActiveMenu('products'); setEditingProduct(null); setEditingPost(null); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMenu === 'products' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4" />
                <span>Sản phẩm (Products)</span>
              </div>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{products.length}</span>
            </button>

            <button
              onClick={() => setActiveMenu('categories')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMenu === 'categories' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Danh mục (Categories)</span>
            </button>

            <button
              onClick={() => setActiveMenu('orders')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMenu === 'orders' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Đơn hàng (Orders)</span>
            </button>

            <button
              onClick={() => setActiveMenu('customers')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMenu === 'customers' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Khách hàng (Customers)</span>
            </button>

            <div className="pt-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              PayloadCMS Engine
            </div>

            <button
              onClick={() => { setActiveMenu('payload-posts'); setEditingProduct(null); setEditingPost(null); }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeMenu === 'payload-posts' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>Cẩm nang (Posts)</span>
              </div>
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">{posts.length}</span>
            </button>
          </div>
        </div>

        {/* Backend & Deployment Status */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-400" /> Medusa Render API
              </span>
              <span className="text-emerald-400 font-semibold">Live 🟢</span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">meocung-medusa.onrender.com</p>
          </div>

          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors border border-slate-700"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Mở Trang Chủ Storefront</span>
          </Link>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#1E293B]/60 backdrop-blur-md border-b border-slate-800 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>Admin</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-white font-medium capitalize">
                {activeMenu === 'products' ? 'Sản phẩm hạt & pate' : activeMenu === 'categories' ? 'Danh mục Medusa' : activeMenu === 'orders' ? 'Quản lý đơn hàng' : activeMenu === 'customers' ? 'Khách hàng' : 'Cẩm nang nuôi mèo (PayloadCMS)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetData}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Khôi phục mẫu
            </button>

            {activeMenu === 'products' && (
              <button
                onClick={() => setEditingProduct({
                  id: 'p-' + Date.now(),
                  name: '',
                  price: 50000,
                  category: 'Thức ăn hạt',
                  image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80',
                  weight: '1kg',
                  inStock: true,
                  description: ''
                })}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-lg shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Thêm sản phẩm mới
              </button>
            )}

            {activeMenu === 'payload-posts' && (
              <button
                onClick={() => setEditingPost({
                  id: 'post-' + Date.now(),
                  title: '',
                  slug: 'bai-viet-moi-' + Date.now(),
                  category: 'Kinh nghiệm nuôi mèo',
                  publishedDate: new Date().toISOString().split('T')[0],
                  coverImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
                  summary: '',
                  content: ''
                })}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-xs rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Viết bài cẩm nang mới
              </button>
            )}
          </div>
        </header>

        {/* Notification Toast */}
        {notice && (
          <div className="mx-8 mt-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="p-8">
          {/* TAB 1: SẢN PHẨM MEDUSA */}
          {activeMenu === 'products' && (
            <div className="space-y-6">
              {/* Stats overview */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Tổng sản phẩm</div>
                  <div className="text-2xl font-bold text-white mt-1">{products.length}</div>
                </div>
                <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Thức ăn hạt</div>
                  <div className="text-2xl font-bold text-amber-400 mt-1">
                    {products.filter(p => p.category === 'Thức ăn hạt').length}
                  </div>
                </div>
                <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Pate cho mèo</div>
                  <div className="text-2xl font-bold text-orange-400 mt-1">
                    {products.filter(p => p.category === 'Pate cho mèo').length}
                  </div>
                </div>
                <div className="bg-[#1E293B] p-4 rounded-xl border border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">Cát vệ sinh & Phụ kiện</div>
                  <div className="text-2xl font-bold text-cyan-400 mt-1">
                    {products.filter(p => p.category !== 'Thức ăn hạt' && p.category !== 'Pate cho mèo').length}
                  </div>
                </div>
              </div>

              {/* Table search & filter */}
              <div className="flex items-center justify-between">
                <div className="relative w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên sản phẩm, danh mục..."
                    className="w-full bg-[#1E293B] border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-[#1E293B] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Hình ảnh & Tên sản phẩm</th>
                      <th className="py-3.5 px-4">Danh mục</th>
                      <th className="py-3.5 px-4">Giá bán (VNĐ)</th>
                      <th className="py-3.5 px-4">Quy cách</th>
                      <th className="py-3.5 px-4">Trạng thái kho</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700" />
                            <div>
                              <div className="font-semibold text-white">{p.name}</div>
                              <div className="text-[11px] text-slate-400">ID: {p.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          {p.price.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{p.weight || 'Tiêu chuẩn'}</td>
                        <td className="py-3.5 px-4">
                          {p.inStock ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Còn hàng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Hết hàng
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingProduct(p)}
                              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: DANH MỤC */}
          {activeMenu === 'categories' && (
            <div className="bg-[#1E293B] p-6 rounded-xl border border-slate-800 space-y-4">
              <h2 className="text-base font-bold text-white">Danh mục sản phẩm Medusa</h2>
              <div className="grid grid-cols-3 gap-4">
                {CATEGORIES.map(c => (
                  <div key={c.id} className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="font-semibold text-white">{c.name}</div>
                    <div className="text-xs text-slate-400 mt-1">Slug: /{c.id}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ĐƠN HÀNG */}
          {activeMenu === 'orders' && (
            <div className="bg-[#1E293B] p-8 rounded-xl border border-slate-800 text-center space-y-3">
              <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-white">Danh sách đơn hàng Medusa</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Khi khách hàng đặt hàng hạt & pate trên trang chủ Next.js, đơn hàng sẽ đổ trực tiếp vào đây.
              </p>
            </div>
          )}

          {/* TAB 4: KHÁCH HÀNG */}
          {activeMenu === 'customers' && (
            <div className="bg-[#1E293B] p-8 rounded-xl border border-slate-800 text-center space-y-3">
              <Users className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-white">Quản lý khách hàng thân thiết</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tích hợp dữ liệu khách hàng mua thức ăn cho mèo.
              </p>
            </div>
          )}

          {/* TAB 5: PAYLOAD POSTS */}
          {activeMenu === 'payload-posts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Bài viết cẩm nang (PayloadCMS Engine)</h2>
                  <p className="text-xs text-slate-400 mt-1">Các bài viết kiến thức nuôi mèo hiển thị tại trang chủ</p>
                </div>
              </div>

              <div className="bg-[#1E293B] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Tiêu đề bài viết</th>
                      <th className="py-3.5 px-4">Danh mục</th>
                      <th className="py-3.5 px-4">Ngày đăng (Datetime)</th>
                      <th className="py-3.5 px-4">Trạng thái</th>
                      <th className="py-3.5 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {posts.map(p => (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="py-3.5 px-4 font-medium text-white">{p.title}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">{p.publishedDate}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-emerald-400 font-medium">Xuất bản 🟢</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingPost(p)}
                              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeletePost(p.id, p.title)}
                              className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                {products.some(p => p.id === editingProduct.id) ? 'Chỉnh sửa sản phẩm Medusa' : 'Thêm sản phẩm mới'}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Giá bán (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Danh mục *</label>
                  <select
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Thức ăn hạt">Thức ăn hạt</option>
                    <option value="Pate cho mèo">Pate cho mèo</option>
                    <option value="Cát vệ sinh">Cát vệ sinh</option>
                    <option value="Phụ kiện & Đồ chơi">Phụ kiện & Đồ chơi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Quy cách / Trọng lượng</label>
                  <input
                    type="text"
                    value={editingProduct.weight || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, weight: e.target.value })}
                    placeholder="ví dụ: 2kg, gói 4 thanh..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Trạng thái kho</label>
                  <select
                    value={editingProduct.inStock ? 'true' : 'false'}
                    onChange={e => setEditingProduct({ ...editingProduct, inStock: e.target.value === 'true' })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="true">Còn hàng</option>
                    <option value="false">Hết hàng</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">URL Hình ảnh</label>
                <input
                  type="text"
                  value={editingProduct.image}
                  onChange={e => setEditingProduct({ ...editingProduct, image: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg shadow-lg"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT / TẠO BÀI VIẾT CẨM NANG */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                {posts.some(p => p.id === editingPost.id) ? 'Chỉnh sửa bài viết cẩm nang' : 'Viết bài cẩm nang mới'}
              </h3>
              <button onClick={() => setEditingPost(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tiêu đề bài viết *</label>
                <input
                  type="text"
                  required
                  value={editingPost.title}
                  onChange={e => setEditingPost({ ...editingPost, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Chuyên mục *</label>
                  <select
                    value={editingPost.category}
                    onChange={e => setEditingPost({ ...editingPost, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Thức ăn hạt">Thức ăn hạt</option>
                    <option value="Pate cho mèo">Pate cho mèo</option>
                    <option value="Cát vệ sinh">Cát vệ sinh</option>
                    <option value="Giống mèo">Giống mèo</option>
                    <option value="Kinh nghiệm nuôi mèo">Kinh nghiệm nuôi mèo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Ngày đăng (Datetime) *</label>
                  <input
                    type="date"
                    required
                    value={editingPost.publishedDate}
                    onChange={e => setEditingPost({ ...editingPost, publishedDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Tóm tắt nội dung cẩm nang</label>
                <textarea
                  rows={3}
                  value={editingPost.summary || ''}
                  onChange={e => setEditingPost({ ...editingPost, summary: e.target.value })}
                  placeholder="Nhập tóm tắt bài viết hướng dẫn..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg shadow-lg"
                >
                  Xuất bản ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
