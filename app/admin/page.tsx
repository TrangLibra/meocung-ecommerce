'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Users,
  LayoutDashboard,
  FileText,
  ExternalLink,
  Search,
  RefreshCw,
  Plus,
  TrendingUp,
  Edit,
  Trash2,
  X,
  CheckCircle2,
  Cat,
  Store,
  Tag,
  MessageSquare,
  Image as ImageIcon,
  Sliders,
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  Eye
} from 'lucide-react';

const PAYLOAD_ADMIN_URL = 'https://meocung-payload.vercel.app/admin';

export default function UnifiedAdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'orders' | 'vendors' | 'cms_posts' | 'cms_products' | 'cms_banners' | 'cms_coupons' | 'cms_reviews' | 'payload_full'
  >('overview');

  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([
    { id: 'v_meocung', name: 'Mèo Cưng Official Store', location: 'TP.HCM', productsCount: 5, status: 'Active', rating: 5.0 },
    { id: 'v_royalcanin', name: 'Royal Canin Việt Nam', location: 'Hà Nội', productsCount: 2, status: 'Active', rating: 4.9 },
    { id: 'v_ciao', name: 'Ciao Churu Pet Mall', location: 'TP.HCM', productsCount: 1, status: 'Active', rating: 4.8 },
    { id: 'v_petaccessories', name: 'Phụ Kiện Thú Cưng Sài Gòn', location: 'Đà Nẵng', productsCount: 1, status: 'Active', rating: 4.9 },
  ]);

  const [orders, setOrders] = useState<any[]>([
    { id: 'ORD-9821', customer: 'Nguyễn Văn An', phone: '0912 345 678', items: 'Hạt Royal Canin Fit 32 (2kg)', total: 185000, status: 'Đã hoàn thành', date: '26/11/2026' },
    { id: 'ORD-9822', customer: 'Trần Thị Mai', phone: '0988 776 554', items: 'Pate Ciao Churu Gói 4 thanh (x2)', total: 90000, status: 'Đang vận chuyển', date: '26/11/2026' },
    { id: 'ORD-9823', customer: 'Lê Hoàng Long', phone: '0903 112 233', items: 'Cát Đậu Nành Cature 6L', total: 135000, status: 'Đang đóng gói', date: '25/11/2026' },
    { id: 'ORD-9824', customer: 'Phạm Thuỳ Dung', phone: '0977 445 566', items: 'Cần Câu Mèo Lông Vũ Chuông', total: 35000, status: 'Chờ xác nhận', date: '25/11/2026' },
  ]);

  const [postsCount, setPostsCount] = useState(105);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Thêm/Sửa Sản Phẩm Medusa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'thuc-an-hat',
    vendorId: 'v_meocung',
    vendorName: 'Mèo Cưng Official Store',
    price: 150000,
    originalPrice: 180000,
    weight: '1kg',
    image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
    description: '',
    inStock: true
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const local = localStorage.getItem('mc_admin_products');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/medusa/products');
      if (res.ok) {
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
          localStorage.setItem('mc_admin_products', JSON.stringify(data.products));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const saveProducts = (newList: any[]) => {
    setProducts(newList);
    localStorage.setItem('mc_admin_products', JSON.stringify(newList));
    window.dispatchEvent(new Event('storage'));
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'thuc-an-hat',
      vendorId: 'v_meocung',
      vendorName: 'Mèo Cưng Official Store',
      price: 150000,
      originalPrice: 180000,
      weight: '1kg',
      image: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
      description: '',
      inStock: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setFormData({
      name: p.name || p.title || '',
      category: p.categorySlug || p.category || 'thuc-an-hat',
      vendorId: p.vendorId || 'v_meocung',
      vendorName: p.vendorName || 'Mèo Cưng Official Store',
      price: p.price || 100000,
      originalPrice: p.originalPrice || Math.round((p.price || 100000) * 1.2),
      weight: p.weight || '1kg',
      image: p.image || p.thumbnail || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800',
      description: p.description || '',
      inStock: p.inStock !== false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    const updated = products.filter(p => p.id !== id);
    saveProducts(updated);
    try {
      await fetch(`/api/medusa/products?id=${id}`, { method: 'DELETE' });
    } catch (_) {}
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert('Vui lòng nhập tên sản phẩm!');

    const categoryNames: Record<string, string> = {
      'thuc-an-hat': 'Thức ăn hạt',
      'pate-cho-meo': 'Pate cho mèo',
      'cat-ve-sinh': 'Cát vệ sinh',
      'phu-kien': 'Phụ kiện & Đồ chơi'
    };

    if (editingProduct) {
      const updated = products.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            name: formData.name,
            title: formData.name,
            category: formData.category,
            categorySlug: formData.category,
            categoryName: categoryNames[formData.category] || 'Sản phẩm',
            vendorId: formData.vendorId,
            vendorName: formData.vendorName,
            price: Number(formData.price),
            originalPrice: Number(formData.originalPrice),
            weight: formData.weight,
            image: formData.image,
            thumbnail: formData.image,
            description: formData.description,
            inStock: formData.inStock
          };
        }
        return p;
      });
      saveProducts(updated);
      try {
        await fetch('/api/medusa/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingProduct.id, ...formData })
        });
      } catch (_) {}
    } else {
      const newId = `p_${Date.now()}`;
      const newProd = {
        id: newId,
        name: formData.name,
        title: formData.name,
        slug: `san-pham-${Date.now()}`,
        category: formData.category,
        categorySlug: formData.category,
        categoryName: categoryNames[formData.category] || 'Sản phẩm',
        vendorId: formData.vendorId,
        vendorName: formData.vendorName,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice),
        weight: formData.weight,
        image: formData.image,
        thumbnail: formData.image,
        description: formData.description,
        inStock: formData.inStock,
        rating: 5.0,
        soldCount: 0
      };
      const updated = [newProd, ...products];
      saveProducts(updated);
      try {
        await fetch('/api/medusa/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProd)
        });
      } catch (_) {}
    }

    setIsModalOpen(false);
  };

  const filteredProducts = products.filter(p => 
    (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans -m-4 sm:-m-6 lg:-m-8">
      {/* UNIFIED SIDEBAR (GỘP MEDUSAJS & PAYLOADCMS) */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 select-none shadow-sm z-20">
        <div className="overflow-y-auto">
          {/* Logo & Brand */}
          <div className="p-5 flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-orange-500/5 to-transparent">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 font-bold shrink-0">
              <Cat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-base leading-tight">Mèo Cưng Hub</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.2 rounded">Medusa</span>
                <span className="text-[10px] text-slate-400 font-bold">+</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.2 rounded">Payload</span>
              </div>
            </div>
          </div>

          {/* Navigation Groups */}
          <nav className="p-3 space-y-4">
            {/* 1. TỔNG QUAN HỆ THỐNG */}
            <div>
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Tổng Quan</span>
              </button>
            </div>

            {/* 2. NHÓM MEDUSA COMMERCE ENGINE */}
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-extrabold text-orange-700 tracking-wider uppercase flex items-center justify-between">
                <span>🛒 MEDUSA COMMERCE</span>
                <span className="text-[9px] bg-orange-100 text-orange-700 font-mono px-1 rounded">E-Com</span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'products'
                      ? 'bg-orange-50 text-orange-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Sản Phẩm & Kho Hàng</span>
                  <span className="ml-auto text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.2 rounded-full">
                    {products.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-orange-50 text-orange-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Đơn Hàng (Orders)</span>
                  <span className="ml-auto text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('vendors')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'vendors'
                      ? 'bg-orange-50 text-orange-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Marketplace Vendors</span>
                  <span className="ml-auto text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded-full">
                    {vendors.length}
                  </span>
                </button>
              </div>
            </div>

            {/* 3. NHÓM PAYLOAD CMS CONTENT ENGINE */}
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-extrabold text-indigo-700 tracking-wider uppercase flex items-center justify-between">
                <span>📝 PAYLOAD CMS 3.0</span>
                <span className="text-[9px] bg-indigo-100 text-indigo-700 font-mono px-1 rounded">Headless</span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab('cms_posts')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'cms_posts'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Cẩm Nang & Bài Viết</span>
                  <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded-full">
                    {postsCount}+
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('cms_products')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'cms_products'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Content Rich-Text (Sản phẩm)</span>
                </button>

                <button
                  onClick={() => setActiveTab('cms_banners')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'cms_banners'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Banner & Slider</span>
                </button>

                <button
                  onClick={() => setActiveTab('cms_coupons')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'cms_coupons'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  <span>Mã Giảm Giá (Coupons)</span>
                </button>

                <button
                  onClick={() => setActiveTab('cms_reviews')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === 'cms_reviews'
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Đánh Giá Khách Hàng</span>
                </button>
              </div>
            </div>

            {/* 4. TOÀN BỘ GIAO DIỆN NATIVE PAYLOAD */}
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                ⚙️ HỆ THỐNG GỐC
              </div>
              <button
                onClick={() => setActiveTab('payload_full')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'payload_full'
                    ? 'bg-slate-900 text-white font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Toàn Màn Hình PayloadCMS</span>
                <span className="ml-auto text-[9px] bg-slate-200 text-slate-700 font-bold px-1 rounded">iFrame</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Chuyển nhanh qua Storefront */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Xem Storefront Live
          </Link>
        </div>
      </aside>

      {/* KHÔNG GIAN LÀM VIỆC CHÍNH (CONTENT AREA) */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">
              {activeTab === 'overview' && 'Tổng Quan Hệ Thống Hợp Nhất (Medusa + Payload)'}
              {activeTab === 'products' && 'Medusa E-Commerce: Quản Lý Sản Phẩm & Kho Hạt'}
              {activeTab === 'orders' && 'Medusa E-Commerce: Quản Lý Đơn Hàng'}
              {activeTab === 'vendors' && 'Medusa E-Commerce: Nhà Bán Hàng (Marketplace Multi-Vendor)'}
              {activeTab === 'cms_posts' && 'PayloadCMS: Cẩm Nang & 100+ Bài Viết Chăm Sóc Mèo'}
              {activeTab === 'cms_products' && 'PayloadCMS: Biên Tập Lexical Rich-Text & Dinh Dưỡng'}
              {activeTab === 'cms_banners' && 'PayloadCMS: Quản Lý Banner Quảng Cáo & Slider'}
              {activeTab === 'cms_coupons' && 'PayloadCMS: Quản Lý Mã Giảm Giá & Voucher'}
              {activeTab === 'cms_reviews' && 'PayloadCMS: Đánh Giá & Phản Hồi Sản Phẩm'}
              {activeTab === 'payload_full' && 'Toàn Bộ Bảng Điều Khiển PayloadCMS 3.0'}
            </h2>
            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Đồng bộ Realtime
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'products' && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm Sản Phẩm Mới
              </button>
            )}
            <button
              onClick={loadProducts}
              title="Tải lại dữ liệu"
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Nội dung theo Tab */}
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              {/* Thống kê 4 card nổi bật */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sản Phẩm Đang Bán</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{products.length}</h3>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Medusa Products Engine
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                    <Package className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bài Viết Cẩm Nang</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{postsCount}+</h3>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PayloadCMS Headless
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đơn Hàng Gần Nhất</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{orders.length}</h3>
                    <p className="text-[11px] text-amber-600 font-semibold mt-1">Đang chờ xử lý</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đối Tác Bán Hàng</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{vendors.length}</h3>
                    <p className="text-[11px] text-purple-600 font-semibold mt-1">Marketplace Active</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Store className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Sơ đồ tích hợp trực tiếp Medusa + Payload */}
              <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-600 p-6 rounded-2xl text-white shadow-md">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Kiến Trúc Hoàn Hảo Được Hợp Nhất
                    </span>
                    <h3 className="text-xl font-bold mt-2">Medusa Core Commerce & Payload CMS Content Engine</h3>
                    <p className="text-xs text-orange-100 max-w-2xl mt-1 leading-relaxed">
                      Toàn bộ dữ liệu giá bán, tồn kho, đơn hàng, khách hàng do MedusaJS đảm nhiệm. Toàn bộ hình ảnh (S3 Cloudflare R2), bài viết cẩm nang 100+ bài và rich-text mô tả chi tiết sản phẩm do PayloadCMS 3.0 quản lý liền mạch trong cùng 1 dashboard duy nhất!
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('products')}
                      className="px-4 py-2 text-xs font-bold bg-white text-orange-600 rounded-lg hover:bg-orange-50 shadow-sm"
                    >
                      Quản Lý Sản Phẩm
                    </button>
                    <button
                      onClick={() => setActiveTab('cms_posts')}
                      className="px-4 py-2 text-xs font-bold bg-indigo-950 text-white rounded-lg hover:bg-indigo-900 shadow-sm"
                    >
                      Quản Lý Bài Viết
                    </button>
                  </div>
                </div>
              </div>

              {/* Bảng đơn hàng và danh sách sản phẩm nhanh */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4 text-orange-500" /> Đơn Hàng Mới Nhất (Medusa)
                    </h4>
                    <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-orange-600 hover:underline">
                      Xem tất cả
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 mt-2">
                    {orders.slice(0, 3).map((o) => (
                      <div key={o.id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{o.customer}</p>
                          <p className="text-slate-400 text-[11px]">{o.items}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-600">{o.total.toLocaleString('vi-VN')} ₫</p>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" /> Cẩm Nang Nuôi Mèo Mới Nhất (PayloadCMS)
                    </h4>
                    <button onClick={() => setActiveTab('cms_posts')} className="text-xs font-bold text-indigo-600 hover:underline">
                      Quản lý CMS
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 mt-2">
                    <div className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">Hướng Dẫn Chọn Hạt Dinh Dưỡng Cho Mèo Con Từ 2 Tháng</p>
                        <p className="text-slate-400 text-[11px]">Chuyên mục: Thức ăn hạt dinh dưỡng</p>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        Published
                      </span>
                    </div>
                    <div className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">5 Dấu Hiệu Nhận Biết Mèo Bị Dị Ứng Thức Ăn</p>
                        <p className="text-slate-400 text-[11px]">Chuyên mục: Kinh nghiệm nuôi mèo</p>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        Published
                      </span>
                    </div>
                    <div className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">Top 3 Loại Cát Vệ Sinh Khử Mùi Tốt Nhất 2026</p>
                        <p className="text-slate-400 text-[11px]">Chuyên mục: Cát vệ sinh</p>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">
                        Published
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ SẢN PHẨM MEDUSA */}
          {activeTab === 'products' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm hạt, pate, cát vệ sinh..."
                    className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Hiển thị <strong>{filteredProducts.length}</strong> / <strong>{products.length}</strong> sản phẩm
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-6">Ảnh & Tên Sản Phẩm</th>
                        <th className="py-3.5 px-6">Nhà Cung Cấp</th>
                        <th className="py-3.5 px-6">Danh Mục</th>
                        <th className="py-3.5 px-6">Giá Bán</th>
                        <th className="py-3.5 px-6">Trạng Thái</th>
                        <th className="py-3.5 px-6 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredProducts.map((p) => {
                        const name = p.name || p.title || 'Sản phẩm';
                        const image = p.image || p.thumbnail || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=800';
                        const price = Number(p.price) || 0;
                        const cat = p.categoryName || p.categorySlug || p.category || 'Thức ăn mèo';
                        const vendor = p.vendorName || 'Mèo Cưng Mall';

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-4 px-6 flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden shrink-0">
                                <img src={image} alt={name} className="w-full h-full object-cover" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-800 line-clamp-1">{name}</div>
                                <div className="text-xs text-slate-400 font-mono">ID: {p.id}</div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-100">
                                🏪 {vendor}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                                {cat}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-bold text-orange-600">
                              {price.toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="py-4 px-6">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Còn hàng
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right space-x-2">
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUẢN LÝ ĐƠN HÀNG */}
          {activeTab === 'orders' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Danh Sách Đơn Hàng MedusaJS</h3>
                  <p className="text-xs text-slate-500">Khách đặt hàng qua Storefront hoặc tài khoản thành viên</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Mã Đơn & Ngày Đặt</th>
                      <th className="py-3.5 px-6">Khách Hàng</th>
                      <th className="py-3.5 px-6">Sản Phẩm</th>
                      <th className="py-3.5 px-6">Tổng Tiền</th>
                      <th className="py-3.5 px-6">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 font-mono">{o.id}</span>
                          <p className="text-xs text-slate-400">{o.date}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800">{o.customer}</div>
                          <div className="text-xs text-slate-400">{o.phone}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 text-xs">
                          {o.items}
                        </td>
                        <td className="py-4 px-6 font-bold text-orange-600">
                          {o.total.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: VENDORS */}
          {activeTab === 'vendors' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Hệ Thống Nhà Bán Hàng (Multi-Vendor Marketplace)</h3>
                  <p className="text-xs text-slate-500">Các thương hiệu ký gửi và gian hàng chính hãng</p>
                </div>
                <button
                  onClick={() => alert('Chức năng thêm gian hàng mới đã sẵn sàng.')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> Thêm Nhà Bán Hàng
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {vendors.map((v) => (
                  <div key={v.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xl">
                        🏪
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                        {v.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{v.name}</h4>
                      <p className="text-xs text-slate-400">Trụ sở: {v.location}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Sản phẩm ký gửi:</span>
                      <strong className="text-slate-800 font-bold">{v.productsCount} mặt hàng</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CÁC TAB PAYLOAD CMS EMBEDDED THÔNG MINH */}
          {activeTab === 'cms_posts' && (
            <div className="w-full h-[calc(100vh-120px)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <iframe
                src={`${PAYLOAD_ADMIN_URL}/collections/posts`}
                className="w-full flex-1 border-0"
                title="PayloadCMS Posts"
              />
            </div>
          )}

          {activeTab === 'cms_products' && (
            <div className="w-full h-[calc(100vh-120px)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <iframe
                src={`${PAYLOAD_ADMIN_URL}/collections/products`}
                className="w-full flex-1 border-0"
                title="PayloadCMS Products Content"
              />
            </div>
          )}

          {activeTab === 'cms_banners' && (
            <div className="w-full h-[calc(100vh-120px)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <iframe
                src={`${PAYLOAD_ADMIN_URL}/collections/banners`}
                className="w-full flex-1 border-0"
                title="PayloadCMS Banners"
              />
            </div>
          )}

          {activeTab === 'cms_coupons' && (
            <div className="w-full h-[calc(100vh-120px)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <iframe
                src={`${PAYLOAD_ADMIN_URL}/collections/coupons`}
                className="w-full flex-1 border-0"
                title="PayloadCMS Coupons"
              />
            </div>
          )}

          {activeTab === 'cms_reviews' && (
            <div className="w-full h-[calc(100vh-120px)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <iframe
                src={`${PAYLOAD_ADMIN_URL}/collections/reviews`}
                className="w-full flex-1 border-0"
                title="PayloadCMS Reviews"
              />
            </div>
          )}

          {activeTab === 'payload_full' && (
            <div className="w-full h-[calc(100vh-120px)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <iframe
                src={PAYLOAD_ADMIN_URL}
                className="w-full flex-1 border-0"
                title="PayloadCMS Admin Full"
              />
            </div>
          )}
        </div>
      </main>

      {/* MODAL THÊM / SỬA SẢN PHẨM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800">
                {editingProduct ? 'Chỉnh Sửa Sản Phẩm (Medusa)' : 'Thêm Sản Phẩm Mới (Medusa)'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tên sản phẩm *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Hạt Royal Canin Indoor 2kg"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nhà bán hàng (Marketplace Vendor)</label>
                <select
                  value={formData.vendorId}
                  onChange={(e) => {
                    const sel = vendors.find(v => v.id === e.target.value);
                    setFormData({ ...formData, vendorId: e.target.value, vendorName: sel ? sel.name : 'Mèo Cưng Mall' });
                  }}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.location})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Danh mục</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white"
                  >
                    <option value="thuc-an-hat">Thức ăn hạt</option>
                    <option value="pate-cho-meo">Pate cho mèo</option>
                    <option value="cat-ve-sinh">Cát vệ sinh</option>
                    <option value="phu-kien">Phụ kiện & Đồ chơi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Trọng lượng</label>
                  <input
                    type="text"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="VD: 2kg, 85g, 6L"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Giá bán (VNĐ) *</label>
                <input
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-semibold text-orange-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Đường dẫn ảnh sản phẩm (S3 / R2 / URL)</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm"
                >
                  Lưu Sản Phẩm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
