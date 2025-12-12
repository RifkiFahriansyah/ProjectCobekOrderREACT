// src/pages/History.jsx
import React, { useEffect, useState } from "react";
import PhoneShell from "../components/PhoneShell";
import { getCustomerHistory, getUnpaidHistory } from "../lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getOrCreateCustomerSession } from "../utils/customerSession";
import "../history.css";

export default function History() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const tableNumber = params.get("table") || "1";
  
  const [activeTab, setActiveTab] = useState("paid"); // "paid" or "unpaid"
  const [paidOrders, setPaidOrders] = useState([]);
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

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

  return (
    <PhoneShell noHeader noFooter showBottomNav>
      {/* TOP HEADER */}
      <div className="history-header">
        <button 
          className="history-back-btn" 
          onClick={() => nav(-1)}
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h5 className="history-header-title">Riwayat Pesanan</h5>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* TAB TOGGLE */}
      <div className="history-tabs">
        <button
          className={`history-tab ${activeTab === "paid" ? "active" : ""}`}
          onClick={() => setActiveTab("paid")}
        >
          Paid
        </button>
        <button
          className={`history-tab history-tab-right ${activeTab === "unpaid" ? "active" : ""}`}
          onClick={() => setActiveTab("unpaid")}
        >
          Unpaid
        </button>
      </div>

      {/* CONTENT */}
      <div className="history-content">
        {loading ? (
          <div className="history-loading">
            <div className="history-loading-spinner"></div>
            <div className="history-loading-text">Memuat riwayat pesanan...</div>
          </div>
        ) : activeTab === "unpaid" ? (
          <UnpaidTab 
            orders={unpaidOrders} 
            onContinuePayment={handleContinuePayment}
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

        {/* Bottom spacer for navbar */}
        <div style={{ height: '80px' }}></div>
      </div>
    </PhoneShell>
  );
}

// PAID TAB COMPONENT
function PaidTab({ orders, expandedOrderId, toggleOrder, formatDate }) {
  if (orders.length === 0) {
    return (
      <div className="history-empty">
        <svg className="history-empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
        <div className="history-empty-text">Belum ada riwayat pesanan</div>
      </div>
    );
  }

  return (
    <div className="history-orders-list">
      {orders.map((order) => {
        const isExpanded = expandedOrderId === order.order_id;
              
        
        return (
          <div key={order.order_id} className="history-order-card">
            {/* ORDER HEADER */}
            <div 
              className="history-order-header"
              onClick={() => toggleOrder(order.order_id)}
            >
              <div className="history-order-info">
                <div className="history-order-id">Order #{order.order_id}</div>
                <div className="history-order-date">{formatDate(order.created_at)}</div>
              </div>
              <svg 
                className={`history-arrow-icon ${isExpanded ? 'expanded' : ''}`}
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
              <div className="history-order-details">
                {/* MENU ITEMS */}
                <div className="history-items-section">
                  <div className="history-section-label">Menu</div>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="history-item-row">
                      <div className="history-item-info">
                        <div className="history-item-name">{item.menu_name}</div>
                        <div className="history-item-qty">x{item.qty}</div>
                      </div>
                      <div className="history-item-price">
                        Rp {Number(item.line_total).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* DIVIDER */}
                <div className="history-divider"></div>

                {/* TOTALS */}
                <div className="history-totals-section">
                  <div className="history-total-row">
                    <span className="history-total-label">Subtotal</span>
                    <span className="history-total-value">Rp {Number(order.subtotal).toLocaleString()}</span>
                  </div>
                  <div className="history-total-row">
                    <span className="history-total-label">PPN 10%</span>
                    <span className="history-total-value">Rp {Number(order.ppn).toLocaleString()}</span>
                  </div>
                  <div className="history-total-row history-grand-total">
                    <span className="history-total-label-bold">Total</span>
                    <span className="history-total-value-bold">Rp {Number(order.total).toLocaleString()}</span>
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
function UnpaidTab({ orders, onContinuePayment, formatDate }) {
  if (orders.length === 0) {
    return (
      <div className="history-empty">
        <svg className="history-empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        <div className="history-empty-text">Tidak ada pesanan yang belum dibayar</div>
      </div>
    );
  }

  // Show the most recent unpaid order
  const latestOrder = orders[0];

  return (
    <div className="history-unpaid-container">
      <UnpaidOrderCard 
        order={latestOrder} 
        onContinue={onContinuePayment}
        formatDate={formatDate}
      />
    </div>
  );
}

// UNPAID ORDER CARD WITH COUNTDOWN
function UnpaidOrderCard({ order, onContinue, formatDate }) {
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
    <div className="unpaid-order-card">
      <div className="unpaid-card-header">
        <h3 className="unpaid-card-title">Pesanan Belum Selesai</h3>
      </div>

      <div className="unpaid-card-body">
        <div className="unpaid-order-info-row">
          <span className="unpaid-label">Order ID</span>
          <span className="unpaid-value">#{order.order_id}</span>
        </div>
        
        <div className="unpaid-order-info-row">
          <span className="unpaid-label">Dibuat</span>
          <span className="unpaid-value">{formatDate(order.created_at)}</span>
        </div>

        <div className="unpaid-order-info-row">
          <span className="unpaid-label">Jumlah Item</span>
          <span className="unpaid-value">{itemCount} item</span>
        </div>

        <div className="unpaid-order-info-row">
          <span className="unpaid-label">Total</span>
          <span className="unpaid-value-total">Rp {order.total.toLocaleString()}</span>
        </div>

        <div className="unpaid-timer-section">
          <div className="unpaid-timer-label">
            {isExpired ? "Waktu Habis" : "Sisa Waktu Pembayaran"}
          </div>
          <div className={`unpaid-timer ${isExpired ? "expired" : ""}`}>
            {countdownText}
          </div>
        </div>

        {!isExpired && (
          <button
            className="unpaid-continue-btn"
            onClick={() => onContinue(order)}
          >
            Lanjutkan Pembayaran
          </button>
        )}

        {isExpired && (
          <div className="unpaid-expired-message">
            Pesanan telah kedaluwarsa. Silakan buat pesanan baru.
          </div>
        )}
      </div>
    </div>
  );
}
