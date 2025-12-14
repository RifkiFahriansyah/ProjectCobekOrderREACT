// src/components/MenuCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../state/CartContext";

export default function MenuCard({ menu, onOpenDetail }) {
  const { qtyOf, inc, dec } = useCart();
  const qty = qtyOf(menu.id);

  const handleCardClick = (e) => {
    // Only open detail if clicking on image/name area, not buttons
    if (e.target.closest('.menu-qty-btn') || e.target.closest('.menu-add-btn')) {
      return;
    }
    if (onOpenDetail) {
      onOpenDetail(menu);
    }
  };

  return (
    <div className="bg-maroon rounded-2xl p-3 shadow-[0_4px_10px_rgba(0,0,0,0.15)] flex flex-col transition-transform hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(0,0,0,0.2)] cursor-pointer" onClick={handleCardClick}>
      {/* Image Box */}
      <div className="bg-white rounded-xl aspect-square overflow-hidden mb-2 pointer-events-none">
        <img
          src={menu.photo_full_url || "https://via.placeholder.com/300x300?text=Menu"}
          alt={menu.name}
          className="w-full h-full object-cover transition-transform duration-300"
        />
      </div>

      {/* Menu Info */}
      <div className="flex-1 flex flex-col">
        {/* Fixed height for menu name to keep cards aligned */}
        <div className="text-sm font-bold text-white mb-1 leading-snug pointer-events-none h-[40px] overflow-hidden line-clamp-2">
          {menu.name}
        </div>
        <div className="text-[13px] font-semibold text-yellow-400 mb-2">
          Rp {Number(menu.price).toLocaleString()}
        </div>

        {/* Add Button or Quantity Controls - pushed to bottom */}
        <div className="mt-auto">
          {qty === 0 ? (
            <button
              className="menu-add-btn w-full py-2 bg-orange text-white rounded-[10px] text-[13px] font-semibold hover:bg-orange-dark hover:scale-[1.02] transition-all pointer-events-auto relative z-[2]"
              onClick={() => inc(menu, 1)}
            >
              Tambah +
            </button>
          ) : (
            <div className="menu-qty-controls flex items-center justify-between bg-white rounded-[10px] py-1 px-1.5 pointer-events-auto relative z-[2]">
              <button
                className="menu-qty-btn w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-semibold flex items-center justify-center transition-all active:scale-95 pointer-events-auto"
                onClick={() => dec(menu.id, 1)}
                aria-label="decrease"
              >
                −
              </button>
              <span className="text-sm font-bold text-gray-900 min-w-[30px] text-center">{qty}</span>
              <button
                className="menu-qty-btn w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-base font-semibold flex items-center justify-center transition-all active:scale-95 pointer-events-auto"
                onClick={() => inc(menu, 1)}
                aria-label="increase"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
