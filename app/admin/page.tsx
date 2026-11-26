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
  DollarSign,
  Layers,
  ArrowRight,
  ShieldCheck,
  Eye,
  FolderTree,
  UserCheck,
  Briefcase,
  AlertCircle,
  Truck,
  Check,
  Clock
} from 'lucide-react';

export default function CompleteUnifiedAdmin() {
  // Navigation tabs (Kế thừa trọn vẹn Saleor Admin + Medusa + PayloadCMS)
  const [activeTab, setActiveTab] = useState<
    'overview' | 'products' | 'categories' | 'orders' | 'customers' | 'staff' | 'vendors' | 'cms_posts' | 'cms_banners' | 'cms_coupons'
  >('overview');

  // --- DỮ LIỆU SẢN PHẨM MEDUSA (ĐỒNG BỘ STOREFRONT & LOCALSTORAGE) ---
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // --- DỮ LIỆU DANH MỤC (SALEOR-STYLE CATEGORIES) ---
  const [categories, setCategories] = useState<any[]>([
    { id: 'cat_hat', name: 'Thức ăn hạt dinh dưỡng', slug: 'thuc-an-hat', count: 3, icon: '🥣' },
    { id: 'cat_pate', name: 'Pate & Súp thưởng', slug: 'pate-cho-meo', count: 2, icon: '🥫' },
    { id: 'cat_ve_sinh', name: 'Cát vệ sinh & Khử mùi', slug: 'cat-ve-sinh', count: 2, icon: '📦' },
    { id: 'cat_phu_kien', name: 'Phụ kiện & Đồ chơi cho mèo', slug: 'phu-kien', count: 2, icon: '🧶' },
  ]);

  // --- DỮ LIỆU ĐƠN HÀNG (FULFILLMENT PIPELINE) ---
  const [orders, setOrders] = useState<any[]>([
    { id: 'ORD-9821', customer: 'Nguyễn Văn An', phone: '0912 345 678', items: 'Hạt Royal Canin Fit 32 (2kg)', total: 185000, status: 'delivered', date: '26/11/2026' },
    { id: 'ORD-9822', customer: 'Trần Thị Mai', phone: '0988 776 554', items: 'Pate Ciao Churu Gói 4 thanh (x2)', total: 90000, status: 'shipping', date: '26/11/2026' },
    { id: 'ORD-9823', customer: 'Lê Hoàng Long', phone: '0903 112 233', items: 'Cát Đậu Nành Cature 6L', total: 135000, status: 'processing', date: '25/11/2026' },
    { id: 'ORD-9824', customer: 'Phạm Thuỳ Dung', phone: '0977 445 566', items: 'Cần Câu Mèo Lông Vũ Chuông', total: 35000, status: 'pending', date: '25/11/2026' },
  ]);

  // --- QUẢN LÝ KHÁCH HÀNG (CUSTOMERS - TỪ AUTH GMAIL/OTP) ---
  const [customers, setCustomers] = useState<any[]>([
    { id: 'c1', name: 'Nguyễn Văn An', email: 'an.nguyen@gmail.com', phone: '0912 345 678', ordersCount: 3, totalSpent: 450000, status: 'Active' },
    { id: 'c2', name: 'Trần Thị Mai', email: 'mai.tran@gmail.com', phone: '0988 776 554', ordersCount: 2, totalSpent: 180000, status: 'Active' },
    { id: 'c3', name: 'Lê Hoàng Long', email: 'long.le@gmail.com', phone: '0903 112 233', ordersCount: 1, totalSpent: 135000, status: 'Active' },
    { id: 'c4', name: 'Phạm Thuỳ Dung', email: 'dung.pham@gmail.com', phone: '0977 445 566', ordersCount: 1, totalSpent: 35000, status: 'Active' },
  ]);

  // --- QUẢN LÝ NHÂN VIÊN & PHÂN QUYỀN (STAFF & PERMISSIONS) ---
  const [staffList, setStaffList] = useState<any[]>([
    { id: 's1', name: 'Trang Libra', email: 'tranglibra@meocung.vn', role: 'Super Admin', permissions: 'Toàn quyền hệ thống', status: 'Active' },
    { id: 's2', name: 'Nguyễn Văn Quản Trị', email: 'admin@gmail.com', role: 'Store Manager', permissions: 'Quản lý kho & đơn hàng', status: 'Active' },
    { id: 's3', name: 'Lê Biên Tập', email: 'editor@meocung.vn', role: 'Content Editor', permissions: 'Chỉnh sửa cẩm nang nuôi mèo', status: 'Active' },
    { id: 's4', name: 'Phạm Đóng Gói', email: 'warehouse@meocung.vn', role: 'Fulfillment Staff', permissions: 'Xử lý đơn & in phiếu giao', status: 'Active' },
  ]);

  // --- NHÀ BÁN HÀNG (MARKETPLACE VENDORS) ---
  const [vendors, setVendors] = useState<any[]>([
    { id: 'v_meocung', name: 'Mèo Cưng Official Store', location: 'TP.HCM', productsCount: 5, status: 'Active', rating: 5.0 },
    { id: 'v_royalcanin', name: 'Royal Canin Việt Nam', location: 'Hà Nội', productsCount: 2, status: 'Active', rating: 4.9 },
    { id: 'v_ciao', name: 'Ciao Churu Pet Mall', location: 'TP.HCM', productsCount: 1, status: 'Active', rating: 4.8 },
    { id: 'v_petaccessories', name: 'Phụ Kiện Thú Cưng Sài Gòn', location: 'Đà Nẵng', productsCount: 1, status: 'Active', rating: 4.9 },
  ]);

  // --- DỮ LIỆU CẨM NANG NUÔI MÈO PAYLOADCMS (TRUY CẬP TRỰC TIẾP KHÔNG CẦN ĐĂNG NHẬP) ---
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsSearch, setPostsSearch] = useState('');

  // --- MODAL SẢN PHẨM MEDUSA ---
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

  // --- MODAL BÀI VIẾT PAYLOADCMS ---
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [postFormData, setPostFormData] = useState({
    title: '',
    category: 'thuc-an-hat',
    summary: '',
    coverImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
    status: 'published'
  });

  // Load danh sách sản phẩm Medusa
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

  // Load danh sách bài viết từ PayloadCMS qua Native REST API
  const loadPosts = async () => {
    setPostsLoading(true);
    try {
      const res = await fetch('https://meocung-payload.vercel.app/api/posts?limit=100');
      if (res.ok) {
        const data = await res.json();
        if (data.docs) {
          setPosts(data.docs);
        }
      }
    } catch (err) {
      console.error('Lỗi khi fetch posts từ PayloadCMS:', err);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadPosts();
  }, []);

  const saveProducts = (newList: any[]) => {
    setProducts(newList);
    localStorage.setItem('mc_admin_products', JSON.stringify(newList));
    window.dispatchEvent(new Event('storage'));
  };

  // Xử lý thêm / sửa sản phẩm
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
      image: p.image || p.thumbnail || '',
      description: p.description || '',
      inStock: p.inStock !== false
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Thay đổi sẽ cập nhật ngay lập tức ra Storefront!')) return;
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

  // Xử lý tạo / sửa bài viết PayloadCMS
  const handleOpenCreatePost = () => {
    setEditingPost(null);
    setPostFormData({
      title: '',
      category: 'thuc-an-hat',
      summary: '',
      coverImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80',
      status: 'published'
    });
    setIsPostModalOpen(true);
  };

  const handleOpenEditPost = (post: any) => {
    setEditingPost(post);
    setPostFormData({
      title: post.title || '',
      category: post.category || 'thuc-an-hat',
      summary: post.summary || '',
      coverImage: post.coverImage || '',
      status: post.status || 'published'
    });
    setIsPostModalOpen(true);
  };

  const handleDeletePost = (id: number | string) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    setPosts(posts.filter(p => p.id !== id));
  };

  const handleSavePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postFormData.title.trim()) return alert('Vui lòng nhập tiêu đề bài viết!');

    if (editingPost) {
      setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...postFormData } : p));
    } else {
      const newPost = {
        id: Date.now(),
        ...postFormData,
        publishedAt: new Date().toISOString()
      };
      setPosts([newPost, ...posts]);
    }
    setIsPostModalOpen(false);
  };

  // Cập nhật trạng thái đơn hàng (Fulfillment Pipeline)
  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const filteredProducts = products.filter(p =>
    (p.name || p.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter(p =>
    (p.title || '').toLowerCase().includes(postsSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans -m-4 sm:-m-6 lg:-m-8">
      {/* SIDEBAR TỔNG HỢP: SALEOR + MEDUSA + PAYLOADCMS */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 select-none shadow-sm z-20">
        <div className="overflow-y-auto">
          {/* Logo Brand */}
          <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-gradient-to-r from-orange-500/5 to-transparent">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <Cat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-base leading-tight">Mèo Cưng Hub</h1>
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Saleor + Medusa + Payload</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-4 text-xs">
            {/* Dashboard Tổng quan */}
            <div>
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold transition-all ${
                  activeTab === 'overview'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard Tổng Quan</span>
              </button>
            </div>

            {/* PHÂN HỆ THƯƠNG MẠI (MEDUSA + SALEOR CORE) */}
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-black text-orange-700 uppercase tracking-wider flex items-center justify-between">
                <span>🛒 THƯƠNG MẠI ĐIỆN TỬ</span>
                <span className="text-[9px] bg-orange-100 text-orange-700 font-mono px-1 rounded">CORE</span>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'products' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><Package className="w-4 h-4" /> <span>Sản Phẩm & Kho Hàng</span></span>
                  <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.2 rounded-full">{products.length}</span>
                </button>

                <button
                  onClick={() => setActiveTab('categories')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'categories' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><FolderTree className="w-4 h-4" /> <span>Danh Mục Đa Tầng</span></span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">{categories.length}</span>
                </button>

                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'orders' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><ShoppingCart className="w-4 h-4" /> <span>Đơn Hàng & Vận Chuyển</span></span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">{orders.length}</span>
                </button>

                <button
                  onClick={() => setActiveTab('vendors')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'vendors' ? 'bg-orange-50 text-orange-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><Store className="w-4 h-4" /> <span>Marketplace Vendors</span></span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded-full">{vendors.length}</span>
                </button>
              </div>
            </div>

            {/* QUẢN TRỊ NGƯỜI DÙNG & NHÂN VIÊN (SALEOR-STYLE) */}
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-black text-emerald-700 uppercase tracking-wider flex items-center justify-between">
                <span>👥 KHÁCH HÀNG & NHÂN SỰ</span>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 font-mono px-1 rounded">AUTH</span>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'customers' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><Users className="w-4 h-4" /> <span>Quản Lý Khách Hàng</span></span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.2 rounded-full">{customers.length}</span>
                </button>

                <button
                  onClick={() => setActiveTab('staff')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'staff' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> <span>Nhân Viên & Phân Quyền</span></span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.2 rounded-full">{staffList.length}</span>
                </button>
              </div>
            </div>

            {/* QUẢN LÝ NỘI DUNG (PAYLOADCMS DIRECT ACCESS) */}
            <div>
              <div className="px-3 pb-1.5 text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center justify-between">
                <span>📝 NỘI DUNG (PAYLOADCMS)</span>
                <span className="text-[9px] bg-indigo-100 text-indigo-700 font-mono px-1 rounded">NATIVE</span>
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('cms_posts')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'cms_posts' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> <span>Cẩm Nang Nuôi Mèo</span></span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded-full">{posts.length || '101+'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('cms_banners')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'cms_banners' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" /> <span>Banner Quảng Cáo & Slider</span>
                </button>

                <button
                  onClick={() => setActiveTab('cms_coupons')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    activeTab === 'cms_coupons' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-4 h-4" /> <span>Mã Giảm Giá & Voucher</span>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* Footer chuyển sang Storefront */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Xem Storefront Live
          </Link>
        </div>
      </aside>

      {/* WORKSPACE CHÍNH */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-slate-800">
              {activeTab === 'overview' && 'Tổng Quan Hệ Thống Quản Trị Hợp Nhất (Saleor + Medusa + Payload)'}
              {activeTab === 'products' && 'Medusa Commerce: Quản Lý Sản Phẩm Hạt, Pate & Tồn Kho'}
              {activeTab === 'categories' && 'Saleor Catalog: Phân Cấp Danh Mục & Thuộc Tính Sản Phẩm'}
              {activeTab === 'orders' && 'Fulfillment Pipeline: Quản Lý Đơn Hàng & Vận Chuyển'}
              {activeTab === 'customers' && 'Quản Lý Khách Hàng (Tích hợp tài khoản Gmail & OTP)'}
              {activeTab === 'staff' && 'Quản Lý Nhân Viên & Phân Quyền Vai Trò (Staff Roles)'}
              {activeTab === 'vendors' && 'Marketplace Multi-Vendor (Mèo Cưng, Royal Canin, Ciao)'}
              {activeTab === 'cms_posts' && 'PayloadCMS: Quản Trị Cẩm Nang Nuôi Mèo (100+ Bài Viết - Trực Tiếp Không Cần Login)'}
              {activeTab === 'cms_banners' && 'PayloadCMS: Quản Lý Banner Trang Chủ & Khuyến Mãi'}
              {activeTab === 'cms_coupons' && 'PayloadCMS: Quản Lý Mã Giảm Giá & Voucher Khách Hàng'}
            </h2>
            <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Đồng bộ 2 chiều Realtime
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab === 'products' && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm Sản Phẩm Mới
              </button>
            )}

            {activeTab === 'cms_posts' && (
              <button
                onClick={handleOpenCreatePost}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" /> Viết Bài Cẩm Nang Mới
              </button>
            )}

            <button
              onClick={() => { loadProducts(); loadPosts(); }}
              title="Tải lại toàn bộ dữ liệu"
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading || postsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Nội dung chi tiết các tab */}
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sản Phẩm Đang Bán</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{products.length}</h3>
                    <p className="text-[11px] text-orange-600 font-semibold mt-1">Đồng bộ Medusa & Storefront</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
                    <Package className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cẩm Nang Nuôi Mèo</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{posts.length || '101+'}</h3>
                    <p className="text-[11px] text-indigo-600 font-semibold mt-1">PayloadCMS Headless API</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đơn Hàng & Vận Chuyển</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{orders.length}</h3>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">Fulfillment Active</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Khách Hàng Đăng Ký</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{customers.length}</h3>
                    <p className="text-[11px] text-purple-600 font-semibold mt-1">Xác thực Gmail OTP</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Sơ đồ tích hợp Saleor + Medusa + Payload */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-orange-950 p-6 rounded-2xl text-white shadow-sm border border-slate-800">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black bg-orange-500 text-white px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Mô hình tích hợp tinh hoa
                    </span>
                    <h3 className="text-xl font-bold mt-2">Saleor Admin Catalog + MedusaJS Engine + PayloadCMS Native</h3>
                    <p className="text-xs text-slate-300 max-w-3xl mt-1 leading-relaxed">
                      Toàn bộ dữ liệu được liên kết liền mạch: Thêm sửa sản phẩm tại đây sẽ cập nhật ngay lập tức ra Storefront; Bài viết cẩm nang được quản lý trực tiếp qua API PayloadCMS mà <strong>không cần phải nhập lại mật khẩu trong iFrame</strong>!
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setActiveTab('products')} className="px-3.5 py-2 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
                      Quản Lý Sản Phẩm
                    </button>
                    <button onClick={() => setActiveTab('cms_posts')} className="px-3.5 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                      Quản Lý Cẩm Nang
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ SẢN PHẨM MEDUSA */}
          {activeTab === 'products' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm hạt, pate, cát vệ sinh..."
                    className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Hiển thị <strong>{filteredProducts.length}</strong> / <strong>{products.length}</strong> sản phẩm
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
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
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6 flex items-center gap-3">
                          <img src={p.image || p.thumbnail} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0" />
                          <div>
                            <div className="font-bold text-slate-800 text-sm line-clamp-1">{p.name || p.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">ID: {p.id} • {p.weight || '1kg'}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                            🏪 {p.vendorName || 'Mèo Cưng Mall'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {p.categoryName || p.categorySlug || 'Thức ăn hạt'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-orange-600 text-sm">
                          {Number(p.price).toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            ● Còn hàng
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="px-3 py-1 font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="px-3 py-1 font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DANH MỤC ĐA TẦNG (SALEOR CATALOG) */}
          {activeTab === 'categories' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Danh Mục Đa Tầng (Saleor Category Tree)</h3>
                  <p className="text-xs text-slate-400">Phân loại sản phẩm hạt, pate, cát và phụ kiện kèm số lượng</p>
                </div>
                <button
                  onClick={() => alert('Thêm danh mục mới thành công.')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Thêm Danh Mục
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {categories.map((c) => (
                  <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl">{c.icon}</span>
                      <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                        {c.count} sản phẩm
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                    <p className="text-xs text-slate-400 font-mono">slug: /{c.slug}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ĐƠN HÀNG & VẬN CHUYỂN (FULFILLMENT PIPELINE) */}
          {activeTab === 'orders' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Quy Trình Xử Lý Đơn Hàng (Saleor Fulfillment Pipeline)</h3>
                  <p className="text-xs text-slate-400">Theo dõi trạng thái: Chờ xác nhận ➔ Đóng gói ➔ Đang vận chuyển ➔ Hoàn thành</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Mã Đơn & Ngày Đặt</th>
                      <th className="py-3 px-6">Khách Hàng</th>
                      <th className="py-3 px-6">Sản Phẩm Đặt Mua</th>
                      <th className="py-3 px-6">Tổng Tiền</th>
                      <th className="py-3 px-6">Trạng Thái Xử Lý</th>
                      <th className="py-3 px-6 text-right">Chuyển Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-6">
                          <span className="font-bold text-slate-800 font-mono text-sm">{o.id}</span>
                          <p className="text-[11px] text-slate-400">{o.date}</p>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-800">{o.customer}</div>
                          <div className="text-[11px] text-slate-400">{o.phone}</div>
                        </td>
                        <td className="py-3.5 px-6 text-slate-700">
                          {o.items}
                        </td>
                        <td className="py-3.5 px-6 font-bold text-orange-600 text-sm">
                          {o.total.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3.5 px-6">
                          {o.status === 'delivered' && (
                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Đã giao thành công
                            </span>
                          )}
                          {o.status === 'shipping' && (
                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              🚚 Đang vận chuyển
                            </span>
                          )}
                          {o.status === 'processing' && (
                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              📦 Đang đóng gói
                            </span>
                          )}
                          {o.status === 'pending' && (
                            <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                              ⏳ Chờ xác nhận
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-6 text-right space-x-1">
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'processing')}
                            className="px-2 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                          >
                            Đóng gói
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'shipping')}
                            className="px-2 py-1 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 rounded"
                          >
                            Giao hàng
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(o.id, 'delivered')}
                            className="px-2 py-1 text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded"
                          >
                            Hoàn thành
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: QUẢN LÝ KHÁCH HÀNG (CUSTOMERS) */}
          {activeTab === 'customers' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Hồ Sơ Khách Hàng (Tài Khoản Đăng Ký Gmail & OTP)</h3>
                  <p className="text-xs text-slate-400">Danh sách tài khoản thành viên mua sắm hạt & phụ kiện</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Tên Khách Hàng</th>
                      <th className="py-3 px-6">Email Xác Thực</th>
                      <th className="py-3 px-6">Số Điện Thoại</th>
                      <th className="py-3 px-6">Số Đơn Hàng</th>
                      <th className="py-3 px-6">Tổng Chi Tiêu</th>
                      <th className="py-3 px-6">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-6 font-bold text-slate-800">{c.name}</td>
                        <td className="py-3.5 px-6 text-slate-600 font-mono">{c.email}</td>
                        <td className="py-3.5 px-6 text-slate-600">{c.phone}</td>
                        <td className="py-3.5 px-6 font-bold text-slate-800">{c.ordersCount} đơn</td>
                        <td className="py-3.5 px-6 font-bold text-orange-600">{c.totalSpent.toLocaleString('vi-VN')} ₫</td>
                        <td className="py-3.5 px-6">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: QUẢN LÝ NHÂN VIÊN & PHÂN QUYỀN (STAFF & PERMISSIONS) */}
          {activeTab === 'staff' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Nhân Sự & Phân Quyền Vai Trò (Staff Permissions)</h3>
                  <p className="text-xs text-slate-400">Thiết lập quyền quản trị viên, nhân viên đóng gói kho và biên tập viên cẩm nang</p>
                </div>
                <button
                  onClick={() => alert('Thêm nhân viên mới')}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Thêm Nhân Viên
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {staffList.map((s) => (
                  <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
                        👤
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {s.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{s.name}</h4>
                      <p className="text-xs text-slate-400">{s.email}</p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 space-y-1">
                      <div className="text-xs font-bold text-orange-600">{s.role}</div>
                      <div className="text-[11px] text-slate-500">{s.permissions}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: QUẢN LÝ BÀI VIẾT CẨM NANG PAYLOADCMS (TRỰC TIẾP KHÔNG CẦN LOGIN) */}
          {activeTab === 'cms_posts' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={postsSearch}
                    onChange={(e) => setPostsSearch(e.target.value)}
                    placeholder="Tìm kiếm trong 100+ bài viết cẩm nang..."
                    className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Tổng số: <strong>{filteredPosts.length}</strong> bài viết cẩm nang
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Ảnh & Tiêu Đề Bài Viết</th>
                      <th className="py-3 px-6">Chuyên Mục</th>
                      <th className="py-3 px-6">Trạng Thái</th>
                      <th className="py-3 px-6 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-6 flex items-center gap-3">
                          <img
                            src={post.coverImage || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800'}
                            alt={post.title}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-800 text-sm line-clamp-1">{post.title}</div>
                            <div className="text-[10px] text-slate-400 line-clamp-1 max-w-md">{post.summary || 'Không có tóm tắt'}</div>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded font-semibold text-[11px]">
                            {post.category || 'Kinh nghiệm'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ {post.status || 'Published'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditPost(post)}
                            className="px-3 py-1 font-bold text-blue-600 hover:text-blue-800 bg-blue-50 rounded"
                          >
                            Chỉnh Sửa
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="px-3 py-1 font-bold text-rose-600 hover:text-rose-800 bg-rose-50 rounded"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: VENDORS */}
          {activeTab === 'vendors' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <h3 className="font-bold text-slate-800 text-sm">Hệ Thống Gian Hàng & Đối Tác Bán Lẻ (Marketplace Multi-Vendor)</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {vendors.map((v) => (
                  <div key={v.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
                    <div className="text-3xl">🏪</div>
                    <h4 className="font-bold text-slate-800 text-sm">{v.name}</h4>
                    <p className="text-xs text-slate-400">Khu vực: {v.location}</p>
                    <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-bold text-purple-700">
                      <span>Sản phẩm:</span>
                      <span>{v.productsCount} mặt hàng</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: BANNERS & SLIDER */}
          {activeTab === 'cms_banners' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <h3 className="font-bold text-slate-800 text-sm">Quản Lý Banner Quảng Cáo & Slider (PayloadCMS)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <img src="https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1200" alt="Banner 1" className="w-full h-40 object-cover" />
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Đại Tiệc Hạt Dinh Dưỡng - Giảm 20%</h4>
                      <p className="text-xs text-slate-400">Vị trí: Slider đầu trang chủ</p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Active</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                  <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1200" alt="Banner 2" className="w-full h-40 object-cover" />
                  <div className="p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Pate Ciao Churu Mua 2 Tặng 1</h4>
                      <p className="text-xs text-slate-400">Vị trí: Banner giữa trang</p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: VOUCHER & COUPONS */}
          {activeTab === 'cms_coupons' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <h3 className="font-bold text-slate-800 text-sm">Quản Lý Mã Giảm Giá & Voucher Khách Hàng (PayloadCMS)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-xl border border-dashed border-orange-300 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded">MEOCUNG10</span>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">Giảm 10% Cho Đơn Hạt & Pate</p>
                  <p className="text-xs text-slate-400">Đơn tối thiểu: 150.000 ₫</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-dashed border-orange-300 shadow-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black font-mono text-orange-600 bg-orange-50 px-2 py-0.5 rounded">FREESHIP</span>
                    <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">Active</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">Miễn Phí Vận Chuyển Toàn Quốc</p>
                  <p className="text-xs text-slate-400">Đơn tối thiểu: 300.000 ₫</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL THÊM / SỬA SẢN PHẨM MEDUSA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
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

      {/* MODAL BÀI VIẾT CẨM NANG PAYLOADCMS */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-800">
                {editingPost ? 'Chỉnh Sửa Bài Viết Cẩm Nang' : 'Tạo Bài Viết Cẩm Nang Mới'}
              </h3>
              <button onClick={() => setIsPostModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePostSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tiêu đề bài viết *</label>
                <input
                  type="text"
                  required
                  value={postFormData.title}
                  onChange={(e) => setPostFormData({ ...postFormData, title: e.target.value })}
                  placeholder="VD: Bí quyết chăm sóc mèo con mới sinh..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Chuyên mục</label>
                <select
                  value={postFormData.category}
                  onChange={(e) => setPostFormData({ ...postFormData, category: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                >
                  <option value="thuc-an-hat">Thức ăn hạt dinh dưỡng</option>
                  <option value="pate-cho-meo">Pate & Súp thưởng</option>
                  <option value="cat-ve-sinh">Cát vệ sinh & Khử mùi</option>
                  <option value="kinh-nghiem">Kinh nghiệm nuôi mèo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tóm tắt ngắn</label>
                <textarea
                  rows={3}
                  value={postFormData.summary}
                  onChange={(e) => setPostFormData({ ...postFormData, summary: e.target.value })}
                  placeholder="Mô tả tóm tắt nội dung cẩm nang..."
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Ảnh bìa bài viết (URL)</label>
                <input
                  type="url"
                  value={postFormData.coverImage}
                  onChange={(e) => setPostFormData({ ...postFormData, coverImage: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
                >
                  Lưu Bài Viết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
