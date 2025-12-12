// src/components/MenuCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../state/CartContext";

export default function MenuCard({ menu, tableNumber, onOpenDetail }) {
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
    <div className="menu-card-home" onClick={handleCardClick}>
      {/* Image Box */}
      <div className="menu-image-box">
        <img
          src={menu.photo_full_url || "https://via.placeholder.com/300x300?text=Menu"}
          alt={menu.name}
        />
      </div>

      {/* Menu Info */}
      <div className="menu-card-info">
        <div className="menu-card-name">
          {menu.name}
        </div>
        <div className="menu-card-price">
          Rp {Number(menu.price).toLocaleString()}
        </div>

        {/* Add Button or Quantity Controls */}
        {qty === 0 ? (
          <button
            className="menu-add-btn"
            onClick={() => inc(menu, 1)}
          >
            Tambah +
          </button>
        ) : (
          <div className="menu-qty-controls">
            <button
              className="menu-qty-btn"
              onClick={() => dec(menu.id, 1)}
              aria-label="decrease"
            >
              −
            </button>
            <span className="menu-qty-display">{qty}</span>
            <button
              className="menu-qty-btn"
              onClick={() => inc(menu, 1)}
              aria-label="increase"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
