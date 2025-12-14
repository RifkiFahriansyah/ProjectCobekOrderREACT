// src/pages/Detail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchMenu } from "../lib/api";
import { useCart } from "../state/CartContext";
import PhoneShell from "../components/PhoneShell";
import StickyDock from "../components/StickyDock";
import { useBackHandler } from "../utils/useBackHandler";

export default function Detail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [menu, setMenu] = useState(null);
  const { inc } = useCart();
  
  // Handle back button: navigate within app
  useBackHandler(false);

  useEffect(() => { fetchMenu(id).then((res) => setMenu(res.data)); }, [id]);
  if (!menu) return <div className="flex items-center justify-center h-screen bg-gray-50">Memuat...</div>;

  return (
    <PhoneShell noHeader noFooter showBottomNav>
      <div className="pb-20 bg-gray-50">
        {/* TOP HEADER IMAGE with Back Button */}
        <div className="relative w-full h-[280px] bg-gray-100">
          <img 
            src={menu.photo_full_url || "https://via.placeholder.com/800x600?text=Menu"} 
            alt={menu.name}
            className="w-full h-full object-cover"
          />
          <button 
            className="absolute top-4 left-4 w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm hover:bg-black/40 flex items-center justify-center transition-colors" 
            onClick={() => nav(-1)}
            aria-label="Back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        </div>

        {/* WHITE ROUNDED DETAIL CARD */}
        <div className="bg-white rounded-t-[28px] -mt-6 relative z-10 px-6 py-6 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] min-h-[400px]">
          <h3 className="text-2xl font-extrabold text-gray-900 mb-3 leading-tight">{menu.name}</h3>
          <div className="text-xl font-bold text-maroon mb-4">
            Rp {Number(menu.price).toLocaleString()}
          </div>
          <div className="w-full h-px bg-gray-200 my-4"></div>
          
          {/* Description if exists */}
          {menu.description && (
            <p className="text-[15px] leading-relaxed text-gray-600">{menu.description}</p>
          )}
        </div>

        {/* ANCHOR for sticky dock */}
        <div id="detailDock" className="h-0" />
      </div>

      {/* BOTTOM FLOATING ORDER AREA using StickyDock */}
      <StickyDock anchorId="detailDock">
        <div className="w-full px-4">
          {/* Single Add Order Button */}
          <button
            className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange to-orange-dark text-white rounded-full font-bold shadow-[0_6px_20px_rgba(255,107,53,0.4)] hover:shadow-[0_8px_24px_rgba(255,107,53,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
            onClick={() => { inc(menu, 1); nav(-1); }}
          >
            <span>Tambah Pesanan</span>
            <span className="bg-white/25 px-3.5 py-1.5 rounded-[20px] text-[15px]">
              Rp {Number(menu.price).toLocaleString()}
            </span>
          </button>
        </div>
      </StickyDock>
    </PhoneShell>
  );
}
