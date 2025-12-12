// src/pages/Detail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMenu } from "../lib/api";
import { useCart } from "../state/CartContext";
import PhoneShell from "../components/PhoneShell";
import StickyDock from "../components/StickyDock";
import "../detail.css";

export default function Detail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [menu, setMenu] = useState(null);
  const [qty, setQty] = useState(1);
  const { inc } = useCart();

  useEffect(() => { fetchMenu(id).then((res) => setMenu(res.data)); }, [id]);
  if (!menu) return <div className="app-viewport">Memuat...</div>;

  return (
    <PhoneShell noHeader noFooter showBottomNav>
      <div className="detail-wrapper">
        {/* TOP HEADER IMAGE with Back Button */}
        <div className="detail-hero-image">
          <img 
            src={menu.photo_full_url || "https://via.placeholder.com/800x600?text=Menu"} 
            alt={menu.name}
            className="detail-main-image"
          />
          <button 
            className="detail-back-btn" 
            onClick={() => nav(-1)}
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        </div>

        {/* WHITE ROUNDED DETAIL CARD */}
        <div className="detail-info-card">
          <h3 className="detail-menu-name">{menu.name}</h3>
          <div className="detail-menu-price">
            Rp {Number(menu.price).toLocaleString()}
          </div>
          <div className="detail-divider"></div>
          
          {/* Description if exists */}
          {menu.description && (
            <p className="detail-menu-description">{menu.description}</p>
          )}
        </div>

        {/* ANCHOR for sticky dock */}
        <div id="detailDock" className="dock-anchor" />
      </div>

      {/* BOTTOM FLOATING ORDER AREA using StickyDock */}
      <StickyDock anchorId="detailDock">
        <div className="detail-bottom-float-container">
          {/* Single Add Order Button */}
          <button
            className="detail-add-order-btn"
            onClick={() => { inc(menu, qty); nav(-1); }}
          >
            <span>Tambah Pesanan</span>
            <span className="detail-order-price">
              Rp {(Number(menu.price) * qty).toLocaleString()}
            </span>
          </button>
        </div>
      </StickyDock>
    </PhoneShell>
  );
}
