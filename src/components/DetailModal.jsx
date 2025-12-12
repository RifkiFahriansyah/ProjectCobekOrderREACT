// src/components/DetailModal.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../state/CartContext";
import "../detail-modal.css";

export default function DetailModal({ menu, isVisible, onClose }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const qty = 1; // Fixed quantity of 1 for simplicity
  const { inc } = useCart();

  useEffect(() => {
    if (isVisible) {
      // Trigger slide-up animation
      setIsAnimating(true);
      setIsClosing(false);
    } else {
      // Trigger slide-down animation
      setIsClosing(true);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  }, [isVisible]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 280);
  };

  const handleAddOrder = () => {
    inc(menu, qty);
    handleClose();
  };

  if (!isAnimating && !isVisible) return null;

  const modalContent = (
    <div 
      className={`detail-modal-overlay ${isAnimating ? 'active' : ''} ${isClosing ? 'closing' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={`detail-slide-sheet ${isAnimating ? 'active' : ''} ${isClosing ? 'closing' : ''}`}>
        {/* TOP HEADER IMAGE */}
        <div className="detail-modal-hero">
          <img 
            src={menu.photo_full_url || "https://via.placeholder.com/800x600?text=Menu"} 
            alt={menu.name}
            className="detail-modal-image"
          />
        </div>

        {/* WHITE ROUNDED DETAIL CARD */}
        <div className="detail-modal-info">
          <h3 className="detail-modal-name">{menu.name}</h3>
          <div className="detail-modal-price">
            Rp {Number(menu.price).toLocaleString()}
          </div>
          <div className="detail-modal-divider"></div>
          
          {/* Description if exists */}
          {menu.description && (
            <p className="detail-modal-description">{menu.description}</p>
          )}
        </div>

        {/* BOTTOM FLOATING ORDER AREA */}
        <div className="detail-modal-footer">
          <button
            className="detail-modal-add-btn"
            onClick={handleAddOrder}
          >
            <span>Tambah Pesanan</span>
            <span className="detail-modal-price-badge">
              Rp {(Number(menu.price) * qty).toLocaleString()}
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  // Portal to render outside PhoneShell
  const phoneElement = document.querySelector('.phone');
  return phoneElement ? createPortal(modalContent, phoneElement) : null;
}
