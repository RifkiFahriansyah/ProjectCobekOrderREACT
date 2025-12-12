import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../state/CartContext";
import PhoneShell from "../components/PhoneShell";
import "../checkout.css";

export default function Checkout({ tableNumber }) {
  const { items, setQty, remove, subtotal } = useCart();
  const nav = useNavigate();

  // Confirmation modal state
  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    itemId: null,
    itemName: "",
  });

  // Hitung PPN & total
  const ppn = Math.round(subtotal * 0.1);        // 10% dari subtotal
  const total = subtotal + ppn;

  // Handle decrease quantity - show modal if qty === 1
  const handleDecreaseQty = (menu, qty) => {
    if (qty === 1) {
      setConfirmDelete({ show: true, itemId: menu.id, itemName: menu.name });
    } else {
      setQty(menu.id, qty - 1);
    }
  };

  // Handle delete button click
  const handleDelete = (menu) => {
    setConfirmDelete({ show: true, itemId: menu.id, itemName: menu.name });
  };

  // Confirm deletion
  const handleConfirmDelete = () => {
    remove(confirmDelete.itemId);
    setConfirmDelete({ show: false, itemId: null, itemName: "" });

    // Navigate to homepage if cart is empty after deletion
    setTimeout(() => {
      if (items.length === 1) {
        nav(-1);
      }
    }, 50);
  };

  // Cancel deletion
  const handleCancelDelete = () => {
    setConfirmDelete({ show: false, itemId: null, itemName: "" });
  };

  return (
    <PhoneShell noHeader noFooter>
      {/* TOP HEADER BAR */}
      <div className="checkout-header">
        <button 
          className="checkout-back-btn" 
          onClick={() => nav(-1)}
          aria-label="Back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h5 className="checkout-title">Order</h5>
        <div style={{ width: '44px' }}></div> {/* Spacer for centering */}
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="checkout-content">
        {!items.length && (
          <div className="checkout-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p>Keranjang Anda kosong</p>
          </div>
        )}

        {/* ORDER ITEM LIST */}
        <div className="checkout-items-container">
          {items.map(({ menu, qty }) => (
            <div className="checkout-item-card" key={menu.id}>
              <img
                src={menu.photo_full_url || "https://via.placeholder.com/80"}
                alt={menu.name}
                className="checkout-item-image"
              />
              <div className="checkout-item-details">
                <h6 className="checkout-item-name">{menu.name}</h6>
                <p className="checkout-item-price">
                  Rp {Number(menu.price).toLocaleString()}
                </p>
                
                {/* Quantity Controls + Delete */}
                <div className="checkout-item-actions">
                  <div className="checkout-qty-controls">
                    <button
                      className="checkout-qty-btn"
                      onClick={() => handleDecreaseQty(menu, qty)}
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="checkout-qty-number">{qty}</span>
                    <button
                      className="checkout-qty-btn"
                      onClick={() => setQty(menu.id, qty + 1)}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="checkout-delete-btn"
                    onClick={() => handleDelete(menu)}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SUBTOTAL + TAX + TOTAL SECTION */}
        {items.length > 0 && (
          <div className="checkout-summary-card">
            <div className="checkout-summary-row">
              <span className="checkout-summary-label">Subtotal</span>
              <span className="checkout-summary-value">Rp {subtotal.toLocaleString()}</span>
            </div>
            <div className="checkout-summary-row">
              <span className="checkout-summary-label">PPN 10%</span>
              <span className="checkout-summary-value">Rp {ppn.toLocaleString()}</span>
            </div>
            <div className="checkout-summary-divider"></div>
            <div className="checkout-summary-row checkout-summary-total">
              <span className="checkout-summary-label-bold">Total</span>
              <span className="checkout-summary-value-bold">Rp {total.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Bottom spacer */}
        <div style={{ height: '120px' }}></div>
      </div>

      {/* BOTTOM PAYMENT BAR (STICKY) */}
      {items.length > 0 && (
        <div className="checkout-bottom-bar">
          <div className="checkout-bottom-left">
            <span className="checkout-bottom-label">Total (termasuk PPN 10%)</span>
            <span className="checkout-bottom-total">Rp {total.toLocaleString()}</span>
          </div>
          <button
            className="checkout-payment-btn"
            onClick={() => nav(`/payment?table=${tableNumber}`)}
          >
            Continue to Payment
          </button>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmDelete.show && (
        <>
          {/* Overlay */}
          <div 
            className="checkout-modal-overlay"
            onClick={handleCancelDelete}
          />
          
          {/* Modal Box */}
          <div className="checkout-modal-box">
            <div className="checkout-modal-content">
              <h3 className="checkout-modal-title">Remove Item?</h3>
              <p className="checkout-modal-text">
                Are you sure you want to remove <strong>{confirmDelete.itemName}</strong> from your order?
              </p>
              
              <div className="checkout-modal-buttons">
                <button
                  className="checkout-modal-btn checkout-modal-btn-cancel"
                  onClick={handleCancelDelete}
                >
                  Cancel
                </button>
                <button
                  className="checkout-modal-btn checkout-modal-btn-confirm"
                  onClick={handleConfirmDelete}
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PhoneShell>
  );
}
