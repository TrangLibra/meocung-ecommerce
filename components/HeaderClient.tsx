'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  Phone,
  Search,
  ShoppingCart,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#ff7f5c] to-[#ff9e84] flex items-center justify-center text-white shadow-md shadow-orange-200 group-hover:scale-105 transition-transform">
            <span className="text-2xl">🐱</span>
          </div>
          <div>
            <span className="text-2xl font-black text-[#ff7f5c] tracking-tight block leading-none">
              Mèo Cưng
            </span>
            <span className="text-[11px] font-semibold text-gray-500 tracking-wide uppercase">
              Thức ăn & Cẩm nang mèo
            </span>
          </div>
        </Link>

        {/* Pill Search Bar with working submit */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-xl items-center rounded-full border border-gray-300 p-1 pl-4 hover:border-[#ff7f5c] transition focus-within:border-[#ff7f5c] focus-within:ring-2 focus-within:ring-[#ff7f5c]/20 bg-white"
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 pr-3 border-r border-gray-200 cursor-pointer select-none">
            <span>Tất cả</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm thức ăn hạt, pate, cát vệ sinh..."
            className="flex-1 bg-transparent px-3 py-1.5 text-sm outline-none text-gray-800 placeholder-gray-400"
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-full bg-[#ff7f5c] hover:bg-[#f0643d] flex items-center justify-center text-white transition shadow-sm shrink-0 cursor-pointer"
            aria-label="Tìm kiếm"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>

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
            href="tel:0382542737"
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-orange-50 text-[#ff7f5c] hover:bg-orange-100 transition font-semibold text-xs border border-orange-200"
          >
            <Phone className="w-4 h-4 animate-bounce" />
            <span>0382 542 737</span>
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
                    {user.name.charAt(0)}
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
      <div className="bg-[#ff7f5c] text-white shadow-inner">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-sm font-semibold">
          <div className="flex items-center overflow-x-auto scrollbar-none py-1">
            <Link
              href="/products"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg hover:bg-white/15 transition shrink-0 font-bold"
            >
              <Menu className="w-4 h-4" />
              <span>Danh mục sản phẩm</span>
            </Link>
            <Link href="/" className="px-3.5 py-2.5 rounded-lg hover:bg-white/15 transition shrink-0">
              Trang chủ
            </Link>
            <Link href="/collections/thuc-an-hat" className="px-3.5 py-2.5 rounded-lg hover:bg-white/15 transition shrink-0">
              Thức ăn hạt
            </Link>
            <Link href="/collections/pate-cho-meo" className="px-3.5 py-2.5 rounded-lg hover:bg-white/15 transition shrink-0">
              Pate cho mèo
            </Link>
            <Link href="/collections/cat-ve-sinh" className="px-3.5 py-2.5 rounded-lg hover:bg-white/15 transition shrink-0">
              Cát vệ sinh
            </Link>
            <Link href="/tin-tuc" className="px-3.5 py-2.5 rounded-lg hover:bg-white/15 transition shrink-0 flex items-center gap-1.5 text-yellow-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cẩm nang nuôi mèo</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-white/90">
            <Truck className="w-4 h-4" />
            <span>Giao nhanh 2h tại TP.HCM</span>
          </div>
        </div>
      </div>
    </header>
  );
}
