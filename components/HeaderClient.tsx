'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/lib/products';
import {
  Phone,
  Search,
  ShoppingCart,
  Package,
  Menu,
  Sparkles,
  Truck,
  ChevronDown,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HeaderClient() {
  const { totalItems } = useCart();
  const { user, loading: authLoading, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchHits, setSearchHits] = useState<Product[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchMeta, setSearchMeta] = useState<{ source: string; ms: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [siteCfg, setSiteCfg] = useState<any>({
    site_name: 'Mèo Cưng',
    logo_url: '',
    logo_emoji: '🐱',
    tagline: 'Thức ăn & Cẩm nang mèo',
    hotline: '0382 542 737',
    shipping_badge: 'Giao nhanh 2h tại TP.HCM',
    primary_color: '#ff7f5c',
    navbar_links: [
      { label: 'Danh mục sản phẩm', href: '/products' },
      { label: 'Trang chủ', href: '/' },
      { label: 'Thức ăn hạt', href: '/collections/thuc-an-hat' },
      { label: 'Pate cho mèo', href: '/collections/pate-cho-meo' },
      { label: 'Cát vệ sinh', href: '/collections/cat-ve-sinh' },
      { label: 'Cẩm nang nuôi mèo', href: '/tin-tuc' },
    ],
  });

  useEffect(() => {
    fetch('/api/admin/site-settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.settings) setSiteCfg(data.settings);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = searchTerm.trim();
    if (!q) {
      setSearchHits([]);
      setSearchMeta(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q, limit: '5' });
        if (searchCategory !== 'all') params.set('category', searchCategory);
        const res = await fetch(`/api/search?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSearchHits(Array.isArray(data.hits) ? data.hits : []);
          setSearchMeta({
            source: data.source || 'meilisearch',
            ms: data.processingTimeMs || 1,
          });
          setSearchOpen(true);
        }
      } catch {
        setSearchHits([]);
      } finally {
        setSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchTerm, searchCategory]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.refresh();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          {siteCfg.logo_url ? (
            <img
              src={siteCfg.logo_url}
              alt={siteCfg.site_name}
              className="w-12 h-12 rounded-2xl object-cover shadow-md shadow-orange-200 group-hover:scale-105 transition-transform border border-orange-100"
            />
          ) : (
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-orange-200 group-hover:scale-105 transition-transform"
              style={{ backgroundColor: siteCfg.primary_color || '#ff7f5c' }}
            >
              <span className="text-2xl">{siteCfg.logo_emoji || '🐱'}</span>
            </div>
          )}
          <div>
            <span
              className="text-2xl font-black tracking-tight block leading-none"
              style={{ color: siteCfg.primary_color || '#ff7f5c' }}
            >
              {siteCfg.site_name || 'Mèo Cưng'}
            </span>
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
              {siteCfg.tagline || 'Thức ăn & Cẩm nang mèo'}
            </span>
          </div>
        </Link>

        {/* Pill Instant Search Bar (Meilisearch + Typo-Tolerant) */}
        <div ref={searchRef} className="hidden md:block flex-1 max-w-xl relative">
          <form
            onSubmit={(e) => {
              setSearchOpen(false);
              handleSearch(e);
            }}
            className="flex items-center rounded-full border border-gray-300 p-1 pl-3 hover:border-[#ff7f5c] transition focus-within:border-[#ff7f5c] focus-within:ring-2 focus-within:ring-[#ff7f5c]/20 bg-white"
          >
            <select
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              aria-label="Danh mục tìm kiếm"
              className="text-xs font-semibold text-gray-600 pr-2 mr-1 border-r border-gray-200 bg-transparent outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="thuc-an-hat">Thức ăn hạt</option>
              <option value="pate-cho-meo">Pate mèo</option>
              <option value="cat-ve-sinh">Cát vệ sinh</option>
              <option value="phu-kien">Phụ kiện</option>
            </select>
            <input
              type="text"
              value={searchTerm}
              onFocus={() => searchHits.length > 0 && setSearchOpen(true)}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm nhanh hạt, pate, cát vệ sinh (hỗ trợ gõ không dấu)..."
              className="flex-1 bg-transparent px-2.5 py-1.5 text-sm outline-none text-gray-800 placeholder-gray-400"
            />
            <button
              type="submit"
              className="w-10 h-10 rounded-full bg-[#ff7f5c] hover:bg-[#f0643d] flex items-center justify-center text-white transition shadow-sm shrink-0 cursor-pointer"
              aria-label="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>

          {searchOpen && searchTerm.trim() && (
            <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              {searching ? (
                <div className="p-4 text-xs text-gray-500 text-center">
                  Đang tìm kiếm...
                </div>
              ) : searchHits.length > 0 ? (
                <>
                  <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                    {searchHits.map((item) => (
                      <Link
                        key={item.id}
                        href={`/products/${item.id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-3 p-3 hover:bg-orange-50/60 transition"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-11 h-11 rounded-xl object-cover bg-gray-50 border border-gray-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-gray-400">{item.categoryName}</p>
                        </div>
                        <span className="text-xs font-black text-[#ff7f5c] shrink-0">
                          {item.price.toLocaleString('vi-VN')}₫
                        </span>
                      </Link>
                    ))}
                  </div>
                  <div className="px-3.5 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    <span className="text-gray-400">
                      {searchMeta?.source === 'meilisearch' ? '⚡ Meilisearch' : '⚡ Instant Search'} • {searchMeta?.ms || 1}ms
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        router.push(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
                      }}
                      className="font-bold text-[#ff7f5c] hover:underline cursor-pointer"
                    >
                      Xem tất cả kết quả →
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 text-xs text-gray-500 text-center">
                  Không tìm thấy sản phẩm phù hợp với &ldquo;{searchTerm}&rdquo;.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions: Admin Edit, Hotline & Cart with real count */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href="https://meocung-payload.vercel.app/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white hover:bg-black text-xs font-bold transition shadow-xs"
            title="Mở trang quản trị chính thức PayloadCMS (Cần đăng nhập)"
          >
            <span>⚙️ Quản Trị CMS</span>
          </a>

          <a
            href={`tel:${(siteCfg.hotline || '0382542737').replace(/\s+/g, '')}`}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-orange-50 hover:bg-orange-100 transition font-semibold text-xs border border-orange-200"
            style={{ color: siteCfg.primary_color || '#ff7f5c' }}
          >
            <Phone className="w-4 h-4 animate-bounce" />
            <span>{siteCfg.hotline || '0382 542 737'}</span>
          </a>

          <Link
            href="/cart"
            className="flex items-center gap-2 p-2 sm:px-3.5 sm:py-2 rounded-full hover:bg-orange-50 text-gray-700 transition relative"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 text-[#ff7f5c]" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-[#ff7f5c] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="hidden lg:inline text-xs font-semibold">Giỏ hàng</span>
          </Link>

          {/* Auth Controls */}
          {!authLoading && (
            user ? (
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-orange-200 bg-orange-50/70 hover:bg-orange-100/80 transition cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-[#ff7f5c] text-white font-bold text-xs flex items-center justify-center uppercase">
                    {user.name?.trim().charAt(0) || 'U'}
                  </div>
                  <span className="hidden md:inline text-xs font-bold text-gray-800 max-w-[110px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/cart"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#ff7f5c] transition"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Giỏ hàng của tôi ({totalItems})</span>
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-orange-50 hover:text-[#ff7f5c] transition"
                    >
                      <Package className="w-4 h-4" />
                      <span>Trạng thái đơn hàng</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 hover:border-[#ff7f5c] hover:text-[#ff7f5c] text-gray-700 text-xs font-bold transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </Link>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#ff7f5c] hover:bg-[#f0643d] text-white text-xs font-bold transition shadow-sm"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Đăng ký</span>
                </Link>
              </div>
            )
          )}
        </div>
      </div>

      {/* Sub Navigation Bar */}
      <div className="text-white shadow-inner" style={{ backgroundColor: siteCfg.primary_color || '#ff7f5c' }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-sm font-semibold">
          <div className="flex items-center overflow-x-auto scrollbar-none py-1">
            {(siteCfg.navbar_links || []).map((nav: any, idx: number) => (
              <Link
                key={`${nav.href}-${idx}`}
                href={nav.href || '/'}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg hover:bg-white/15 transition shrink-0 ${
                  idx === 0 ? 'font-bold' : ''
                } ${nav.href === '/tin-tuc' ? 'text-yellow-200' : ''}`}
              >
                {idx === 0 && <Menu className="w-4 h-4" />}
                {nav.href === '/tin-tuc' && <Sparkles className="w-3.5 h-3.5" />}
                <span>{nav.label}</span>
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-white/90">
            <Truck className="w-4 h-4" />
            <span>{siteCfg.shipping_badge || 'Giao nhanh 2h tại TP.HCM'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
