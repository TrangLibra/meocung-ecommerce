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
  Cat
} from 'lucide-react';

const PAYLOAD_ADMIN_URL = 'https://meocung-payload.vercel.app/admin';

export default function UnifiedAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'products' | 'dashboard' | 'vendors' | 'payload'>('products');
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([
    { id: 'v_meocung', name: 'Mèo Cưng Official Store', location: 'TP.HCM', productsCount: 5, status: 'Active' },
    { id: 'v_royalcanin', name: 'Royal Canin Việt Nam', location: 'Hà Nội', productsCount: 2, status: 'Active' },
    { id: 'v_ciao', name: 'Ciao Churu Pet Mall', location: 'TP.HCM', productsCount: 1, status: 'Active' },
    { id: 'v_petaccessories', name: 'Phụ Kiện Thú Cưng Sài Gòn', location: 'Đà Nẵng', productsCount: 1, status: 'Active' },
  ]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal Thêm/Sửa
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
      // 1. Kiểm tra localStorage
      const local = localStorage.getItem('mc_admin_products');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
          setLoading(false);
          return;
        }
      }

      // 2. Fetch API nội bộ
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
    // Thông báo cho component storefront cùng browser
    window.dispatchEvent(new Event('storage'));
  };

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'thuc-an-hat',
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
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 font-bold">
              <Cat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">Mèo Cưng</h1>
              <p className="text-xs text-orange-600 font-semibold tracking-wide uppercase">Unified Admin</p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              E-Commerce Management
            </div>
            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-orange-50 text-orange-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              Sản Phẩm & Kho Hạt
              <span className="ml-auto text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
                {products.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'vendors'
                  ? 'bg-orange-50 text-orange-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Nhà Bán Hàng (Marketplace)
              <span className="ml-auto text-xs bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                {vendors.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-orange-50 text-orange-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Tổng Quan Hệ Thống
            </button>

            <div className="pt-4 px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Content Management (CMS)
            </div>
            <button
              onClick={() => setActiveTab('payload')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'payload'
                  ? 'bg-orange-50 text-orange-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              PayloadCMS (iFrame)
              <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                100 Bài
              </span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Xem Storefront
          </Link>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'products' && 'Quản Lý Sản Phẩm (Thêm - Xóa - Sửa)'}
            {activeTab === 'dashboard' && 'Tổng Quan Hệ Thống E-Commerce'}
            {activeTab === 'payload' && 'Quản Trị Nội Dung PayloadCMS 3.0'}
          </h2>

          <div className="flex items-center gap-3">
            {activeTab === 'products' && (
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm Sản Phẩm Mới
              </button>
            )}
            <button
              onClick={loadProducts}
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 border border-slate-200 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          {activeTab === 'products' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm sản phẩm hạt, pate, cát..."
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
                        <th className="py-3.5 px-6">Danh Mục</th>
                        <th className="py-3.5 px-6">Giá Bán</th>
                        <th className="py-3.5 px-6">Trọng Lượng</th>
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
                              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-medium">
                                {cat}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-bold text-orange-600">
                              {price.toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="py-4 px-6 text-slate-600">
                              {p.weight || '1kg'}
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

          {activeTab === 'vendors' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Mô hình Multi-Vendor Marketplace (Medusa v2)</h3>
                  <p className="text-xs text-slate-500">Quản lý các thương hiệu và đối tác bán lẻ cung cấp hạt & phụ kiện</p>
                </div>
                <button
                  onClick={() => alert('Chức năng onboard Nhà bán lẻ đối tác mới đang sẵn sàng!')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Thêm Nhà Bán Hàng
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
                      <h4 className="font-bold text-slate-800 text-base">{v.name}</h4>
                      <p className="text-xs text-slate-400">Khu vực: {v.location}</p>
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

          {activeTab === 'payload' && (
            <div className="w-full h-[calc(100vh-120px)] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <iframe
                src={PAYLOAD_ADMIN_URL}
                className="w-full flex-1 border-0"
                title="PayloadCMS Admin"
              />
            </div>
          )}
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">
                {editingProduct ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
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
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Nhà bán hàng (Vendor / Marketplace)</label>
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
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Đường dẫn ảnh sản phẩm (URL)</label>
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
