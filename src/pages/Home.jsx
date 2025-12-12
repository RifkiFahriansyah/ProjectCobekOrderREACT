import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PhoneShell from "../components/PhoneShell";
import StickyDock from "../components/StickyDock";
import MenuCard from "../components/MenuCard";
import DetailModal from "../components/DetailModal";
import { useCart } from "../state/CartContext";
import { fetchMenus } from "../lib/api";
import "../home.css";

export default function Home({ tableNumber }) {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const { items, subtotal } = useCart();

  // Calculate total quantity of all items
  const totalQty = useMemo(() => {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }, [items]);

  useEffect(() => {
    fetchMenus().then((r) => setData(r.data));
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return data;
    return data
      .map((c) => ({
        ...c,
        menus: (c.menus || []).filter((m) => m.name.toLowerCase().includes(kw)),
      }))
      .filter((c) => c.menus?.length);
  }, [data, q]);

  const openDetail = (menu) => {
    setSelectedMenu(menu);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    // Clear selected menu after animation completes
    setTimeout(() => setSelectedMenu(null), 300);
  };

  return (
    <PhoneShell noHeader noFooter showBottomNav>
      <div className={`home-wrapper ${detailVisible ? 'modal-open' : ''}`}>
        {/* HEADER AREA - Grilled Fish Photo with Typography */}
        <div className="home-hero-section">
          <img
            src="https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&q=80"
            alt="Grilled Fish"
            className="hero-background-image"
          />
          <div className="hero-overlay">
            <div className="hero-typography">
              <div className="hero-text-line">COBEK BAKAR</div>
              <div className="hero-text-line">GURAME</div>
              <div className="hero-text-line">COBEK</div>
            </div>
            <div className="hero-logo-circle">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="48" fill="#8B2635" />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="24" fontWeight="bold">CB</text>
              </svg>
            </div>
          </div>
        </div>

        {/* RESTAURANT INFO CARD */}
        <div className="restaurant-info-card">
          <div className="restaurant-info-content">
            <div className="restaurant-details">
              <h5 className="restaurant-name">Cobek Bakar Gurame</h5>
              <p className="restaurant-meta">
                Jl. Raya Cobek No. 123, Jakarta<br />
                Buka: 10:00 - 22:00
              </p>
            </div>
            <button className="restaurant-arrow-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* TABLE NUMBER BAR */}
        <div className="table-number-bar">
          <span>Meja Nomor : {tableNumber || "-"}</span>
        </div>

        {/* SEARCH BAR */}
        <div className="search-section">
          <input
            className="search-input"
            placeholder="🔍 Cari menu..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* MENU GRID */}
        <div className="menu-grid-container">
          {filtered.map((cat) => (
            <div key={cat.id} className="menu-category-section">
              <h6 className="category-title">{cat.name}</h6>
              <div className="menu-grid">
                {cat.menus?.map((m) => (
                  <MenuCard 
                    key={m.id} 
                    menu={m} 
                    tableNumber={tableNumber}
                    onOpenDetail={openDetail}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ANCHOR for sticky dock */}
        <div id="homeDock" className="dock-anchor" />
      </div>

      {/* FLOATING CHECKOUT */}
      {items.length > 0 && (
        <StickyDock anchorId="homeDock">
          <Link
            to={`/checkout?table=${tableNumber}`}
            className="btn-checkout-float"
          >
            <div className="checkout-left">
              <span className="checkout-qty-badge">{totalQty}</span>
              <span>Checkout</span>
            </div>
            <span className="checkout-price">Rp {subtotal.toLocaleString()}</span>
          </Link>
        </StickyDock>
      )}

      {/* DETAIL MODAL LAYER */}
      {selectedMenu && (
        <DetailModal
          menu={selectedMenu}
          isVisible={detailVisible}
          onClose={closeDetail}
        />
      )}
    </PhoneShell>
  );
}
