// src/pages/History.jsx
import React, { useEffect, useState } from "react";
import PhoneShell from "../components/PhoneShell";
import { getCustomerHistory, getUnpaidHistory, cancelOrder } from "../lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getOrCreateCustomerSession } from "../utils/customerSession";
import { updateOrderStatus } from "../utils/history";
import { useBackHandler } from "../utils/useBackHandler";

export default function History() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const tableNumber = params.get("table") || "1";
  
  // Handle back button: navigate within app
  useBackHandler(false);
  
  const [activeTab, setActiveTab] = useState("paid"); // "paid" or "unpaid"
  const [paidOrders, setPaidOrders] = useState([]);
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNumber]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const customerToken = getOrCreateCustomerSession(tableNumber);
      
      // Fetch both paid and unpaid orders in parallel
      const [paidResponse, unpaidResponse] = await Promise.all([
        getCustomerHistory({ table: tableNumber, token: customerToken }),
        getUnpaidHistory({ table: tableNumber, token: customerToken })
      ]);
      
      setPaidOrders(transformOrders(paidResponse.data || []));
      setUnpaidOrders(transformOrders(unpaidResponse.data || []));
    } catch (error) {
      console.error("Failed to load history:", error);
      setPaidOrders([]);
      setUnpaidOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const transformOrders = (ordersData) => {
    return ordersData.map((order) => {
      const items = (order.items || []).map(item => ({
        menu_name: item.menu_name,
        unit_price: item.unit_price,
        qty: item.qty,
        line_total: item.line_total,
      }));

      return {
        id: order.id,
        order_id: order.order_code || order.id,
        created_at: order.created_at,
        expires_at: order.expires_at,
        items: items,
        subtotal: order.subtotal,
        ppn: order.other_fees,
        total: order.total,
        status: order.status,
      };
    });
  };

  const toggleOrder = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} • ${hours}:${minutes}`;
  };

  const handleContinuePayment = (order) => {
    nav(`/payment/qr?orderId=${order.id}&table=${tableNumber}`);
  };

  const handleCancelClick = (order) => {
    setOrderToCancel(order);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;

    try {
      const res = await cancelOrder(orderToCancel.id);
      const or = res.data;
      updateOrderStatus(or.id, or.status);
      
      // Refresh history after cancellation
      await loadHistory();
    } catch (e) {
      console.error(e);
      alert("Gagal membatalkan pesanan. Mungkin pesanan sudah dibayar atau expired.");
    } finally {
      setShowCancelModal(false);
      setOrderToCancel(null);
    }
  };

  return (
    <PhoneShell noHeader noFooter showBottomNav>
      {/* TOP HEADER */}
      <div className="absolute top-0 inset-x-0 h-14 bg-maroon flex items-center justify-between px-4 z-10">
        <button 
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" 
          onClick={() => nav(-1)}
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h5 className="text-lg font-bold text-white">Riwayat Pesanan</h5>
        <div className="w-11"></div>
      </div>

      {/* TAB TOGGLE */}
      <div className="absolute top-14 inset-x-0 bg-white border-b border-gray-200 flex z-10">
        <button
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            activeTab === "paid" 
              ? "text-maroon border-b-2 border-maroon" 
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("paid")}
        >
          Paid
        </button>
        <button
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            activeTab === "unpaid" 
              ? "text-maroon border-b-2 border-maroon" 
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("unpaid")}
        >
          Unpaid
        </button>
      </div>

      {/* CONTENT */}
      <div className="pt-[7.5rem] pb-20 h-full overflow-y-auto bg-gray-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center pt-32">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-maroon border-t-transparent mb-4"></div>
            <div className="text-base font-semibold text-gray-700">Memuat riwayat pesanan...</div>
          </div>
        ) : activeTab === "unpaid" ? (
          <UnpaidTab 
            orders={unpaidOrders} 
            onContinuePayment={handleContinuePayment}
            onCancelOrder={handleCancelClick}
            formatDate={formatDate}
          />
        ) : (
          <PaidTab
            orders={paidOrders}
            expandedOrderId={expandedOrderId}
            toggleOrder={toggleOrder}
            formatDate={formatDate}
          />
        )}
      </div>

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-md z-[60] animate-fade-in"
            onClick={() => setShowCancelModal(false)}
          />
          
          {/* Modal Box */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[340px] bg-white rounded-3xl p-6 z-[70] shadow-2xl">
            <div className="flex flex-col items-center text-center">
              {/* Warning Icon */}
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Batalkan Pesanan?</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Apakah Anda yakin ingin membatalkan pesanan <strong>#{orderToCancel?.order_id}</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-full font-bold hover:bg-gray-50 transition-all"
                  onClick={() => setShowCancelModal(false)}
                >
                  Kembali
                </button>
                <button
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                  onClick={handleConfirmCancel}
                >
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PhoneShell>
  );
}

// PAID TAB COMPONENT
function PaidTab({ orders, expandedOrderId, toggleOrder, formatDate }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 px-8 text-center">
        <svg className="mb-4 text-gray-300" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
        <div className="text-gray-500 text-base">Belum ada riwayat pesanan</div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {orders.map((order) => {
        const isExpanded = expandedOrderId === order.order_id;
              
        
        return (
          <div key={order.order_id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* ORDER HEADER */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleOrder(order.order_id)}
            >
              <div>
                <div className="text-sm font-bold text-gray-900">Order #{order.order_id}</div>
                <div className="text-xs text-gray-500 mt-1">{formatDate(order.created_at)}</div>
              </div>
              <svg 
                className={`text-gray-400 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* ORDER DETAILS (EXPANDED) */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100">
                {/* MENU ITEMS */}
                <div className="pt-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Menu</div>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{item.menu_name}</div>
                        <div className="text-xs text-gray-500">x{item.qty}</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        Rp {Number(item.line_total).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* DIVIDER */}
                <div className="w-full h-px bg-gray-200 my-4"></div>

                {/* TOTALS */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold text-gray-900">Rp {Number(order.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">PPN 10%</span>
                    <span className="font-semibold text-gray-900">Rp {Number(order.ppn).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-base font-bold text-maroon">Rp {Number(order.total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// UNPAID TAB COMPONENT
function UnpaidTab({ orders, onContinuePayment, onCancelOrder, formatDate }) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center pt-32 px-8 text-center">
        <svg className="mb-4 text-gray-300" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <div className="text-gray-500 text-base">Tidak ada pesanan yang belum dibayar</div>
      </div>
    );
  }

  // Show the most recent unpaid order
  const latestOrder = orders[0];

  return (
    <div className="px-4 py-4">
      <UnpaidOrderCard 
        order={latestOrder} 
        onContinue={onContinuePayment}
        onCancel={onCancelOrder}
        formatDate={formatDate}
      />
    </div>
  );
}

// UNPAID ORDER CARD WITH COUNTDOWN
function UnpaidOrderCard({ order, onContinue, onCancel, formatDate }) {
  const [remaining, setRemaining] = React.useState(0);

  React.useEffect(() => {
    const calculateRemaining = () => {
      if (!order.expires_at) return 0;
      
      const expiresAt = new Date(order.expires_at);
      const now = new Date();
      const diffMs = expiresAt - now;
      const diffSeconds = Math.floor(diffMs / 1000);
      
      return Math.max(0, diffSeconds);
    };

    setRemaining(calculateRemaining());

    const timer = setInterval(() => {
      const newRemaining = calculateRemaining();
      setRemaining(newRemaining);
      
      if (newRemaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order.expires_at]);

  const countdownText = React.useMemo(() => {
    if (remaining <= 0) return "00:00";
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [remaining]);

  const itemCount = order.items.length;
  const isExpired = remaining <= 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-orange to-orange-dark text-white py-3 px-5">
        <h3 className="text-base font-bold">Pesanan Belum Selesai</h3>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-600">Order ID</span>
          <span className="text-sm font-semibold text-gray-900">#{order.order_id}</span>
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-600">Dibuat</span>
          <span className="text-sm font-semibold text-gray-900">{formatDate(order.created_at)}</span>
        </div>

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-600">Jumlah Item</span>
          <span className="text-sm font-semibold text-gray-900">{itemCount} item</span>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-base font-bold text-maroon">Rp {order.total.toLocaleString()}</span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
          <div className="text-xs text-gray-500 mb-2">
            {isExpired ? "Waktu Habis" : "Sisa Waktu Pembayaran"}
          </div>
          <div className={`text-3xl font-black tracking-wider ${
            isExpired ? "text-red-500" : "text-maroon"
          }`}>
            {countdownText}
          </div>
        </div>

        {!isExpired && (
          <>
            <button
              className="w-full py-3 bg-gradient-to-r from-orange to-orange-dark text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all mb-3"
              onClick={() => onContinue(order)}
            >
              Lanjutkan Pembayaran
            </button>
            <button
              className="w-full py-3 bg-white border-2 border-red-500 text-red-500 rounded-full font-bold hover:bg-red-50 transition-all"
              onClick={() => onCancel(order)}
            >
              Batalkan Pesanan
            </button>
          </>
        )}

        {isExpired && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm py-3 px-4 rounded-xl text-center">
            Pesanan telah kedaluwarsa. Silakan buat pesanan baru.
          </div>
        )}
      </div>
    </div>
  );
}
