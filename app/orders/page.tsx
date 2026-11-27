'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Truck, CheckCircle2, Clock, XCircle, RefreshCw, MapPin, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface CustomerOrder {
  id: string;
  order_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  note: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping_fee: number;
  grand_total: number;
  status: OrderStatus;
  tracking_code: string | null;
  created_at: string;
}

const STATUS_TABS: {
  key: OrderStatus;
  label: string;
  badgeClass: string;
  icon: typeof Clock;
}[] = [
  {
    key: 'pending',
    label: 'Chờ xác nhận',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  {
    key: 'confirmed',
    label: 'Đã xác nhận',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Package,
  },
  {
    key: 'shipping',
    label: 'Đang vận chuyển',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Truck,
  },
  {
    key: 'delivered',
    label: 'Đã giao hàng',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  {
    key: 'cancelled',
    label: 'Đã hủy',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
];

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<OrderStatus>('pending');
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancelOrder = async (order: CustomerOrder) => {
    if (!window.confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${order.order_code}?`)) {
      return;
    }
    setCancellingId(order.id);
    setError('');
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Không thể hủy đơn hàng.');
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: 'cancelled' } : o))
        );
        setActiveTab('cancelled');
      }
    } catch {
      setError('Lỗi kết nối khi hủy đơn hàng.');
    } finally {
      setCancellingId(null);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Không thể tải danh sách đơn hàng.');
      } else {
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      }
    } catch {
      setError('Lỗi kết nối khi tải đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchOrders();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [authLoading, user]);

  const countByStatus = (status: OrderStatus) =>
    orders.filter((o) => o.status === status).length;

  const filteredOrders = orders.filter((o) => o.status === activeTab);
  const activeTabInfo = STATUS_TABS.find((t) => t.key === activeTab) || STATUS_TABS[0];

  if (!authLoading && !user) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-4">
          <Package className="w-12 h-12 text-[#ff7f5c] mx-auto" />
          <h1 className="text-xl font-extrabold text-gray-900">Trạng thái đơn hàng</h1>
          <p className="text-sm text-gray-500">
            Vui lòng đăng nhập để theo dõi trạng thái đơn hàng của bạn.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-[#ff7f5c] hover:bg-[#ff663d] text-white font-bold text-sm transition"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Đơn hàng của tôi</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Theo dõi trạng thái đơn hàng theo thời gian thực ({orders.length} đơn hàng)
          </p>
        </div>
        <button
          type="button"
          onClick={fetchOrders}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:border-[#ff7f5c] hover:text-[#ff7f5c] text-xs font-bold text-gray-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* 5 Tab trạng thái đơn hàng */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const count = countByStatus(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive
                  ? 'bg-[#ff7f5c] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-[#ff7f5c]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Danh sách đơn hàng theo tab */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-sm text-gray-500">
          Đang tải danh sách đơn hàng...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3">
          <Package className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-bold text-gray-700">
            Chưa có đơn hàng nào ở trạng thái &ldquo;{activeTabInfo.label}&rdquo;
          </p>
          <Link
            href="/products"
            className="inline-flex items-center px-5 py-2 rounded-full bg-orange-50 text-[#ff7f5c] hover:bg-orange-100 text-xs font-bold transition"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-3.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-gray-50/60">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-extrabold text-sm text-[#ff7f5c]">
                    #{order.order_code}
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString('vi-VN')
                      : ''}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${activeTabInfo.badgeClass}`}
                >
                  {activeTabInfo.label}
                </span>
              </div>

              <div className="p-5 space-y-3">
                {order.items && order.items.length > 0 && (
                  <div className="divide-y divide-gray-100">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="py-2 flex items-center justify-between text-xs gap-4"
                      >
                        <div className="font-semibold text-gray-800">
                          {item.name}{' '}
                          <span className="text-gray-400 font-normal">× {item.quantity}</span>
                        </div>
                        <div className="font-bold text-gray-900 shrink-0">
                          {(item.price * item.quantity).toLocaleString('vi-VN')} ₫
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1 text-gray-600">
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {order.customer_name} • {order.customer_phone}
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{order.shipping_address}</span>
                    </p>
                    {order.tracking_code && (
                      <p className="flex items-center gap-1.5 text-blue-600 font-semibold">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Mã vận đơn: {order.tracking_code}</span>
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 space-y-2">
                    <div>
                      <p className="text-[11px] text-gray-400">Tổng thanh toán</p>
                      <p className="text-lg font-extrabold text-[#ff7f5c]">
                        {Number(order.grand_total || 0).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button
                        type="button"
                        disabled={cancellingId === order.id}
                        onClick={() => handleCancelOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{cancellingId === order.id ? 'Đang hủy...' : 'Hủy đơn hàng'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
