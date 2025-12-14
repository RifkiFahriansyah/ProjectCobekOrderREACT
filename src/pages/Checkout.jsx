import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../state/CartContext";
import PhoneShell from "../components/PhoneShell";
import { useBackHandler } from "../utils/useBackHandler";

export default function Checkout({ tableNumber }) {
  const { items, setQty, remove, subtotal } = useCart();
  const nav = useNavigate();
  
  // Handle back button: navigate within app
  useBackHandler(false);

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
      <div className="absolute top-0 inset-x-0 h-14 bg-maroon flex items-center justify-between px-4 z-10">
        <button 
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" 
          onClick={() => nav(-1)}
          aria-label="Back"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h5 className="text-lg font-bold text-white">Order</h5>
        <div className="w-11"></div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="pt-14 pb-32 h-full overflow-y-auto bg-gray-50">
        {!items.length && (
          <div className="flex flex-col items-center justify-center pt-32 px-8 text-center">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" className="mb-4">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <p className="text-gray-500">Keranjang Anda kosong</p>
          </div>
        )}

        {/* ORDER ITEM LIST */}
        <div className="px-4 py-4 space-y-3">
          {items.map(({ menu, qty }) => (
            <div className="bg-white rounded-2xl p-4 flex gap-3 shadow-sm" key={menu.id}>
              <img
                src={menu.photo_full_url || "https://via.placeholder.com/80"}
                alt={menu.name}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 flex flex-col">
                <h6 className="text-[15px] font-bold text-gray-900 mb-1 leading-tight">{menu.name}</h6>
                <p className="text-sm font-semibold text-maroon mb-3">
                  Rp {Number(menu.price).toLocaleString()}
                </p>
                
                {/* Quantity Controls + Delete */}
                <div className="flex items-center gap-2 mt-auto">
                  <div className="flex items-center bg-gray-100 rounded-lg px-1 py-1">
                    <button
                      className="w-7 h-7 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-semibold flex items-center justify-center transition-all active:scale-95"
                      onClick={() => handleDecreaseQty(menu, qty)}
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <span className="px-3 text-sm font-bold text-gray-900">{qty}</span>
                    <button
                      className="w-7 h-7 rounded-md bg-white hover:bg-gray-50 text-gray-700 font-semibold flex items-center justify-center transition-all active:scale-95"
                      onClick={() => setQty(menu.id, qty + 1)}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="ml-auto w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all active:scale-95"
                    onClick={() => handleDelete(menu)}
                    aria-label="Delete item"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SUBTOTAL + TAX + TOTAL SECTION */}
        {items.length > 0 && (
          <div className="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-sm font-semibold text-gray-900">Rp {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">PPN 10%</span>
              <span className="text-sm font-semibold text-gray-900">Rp {ppn.toLocaleString()}</span>
            </div>
            <div className="w-full h-px bg-gray-200 mb-4"></div>
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-maroon">Rp {total.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM PAYMENT BAR (STICKY) */}
      {items.length > 0 && (
        <div className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-4 flex items-center gap-3 z-20">
          <div className="flex-1">
            <span className="block text-xs text-gray-500 mb-0.5">Total (termasuk PPN 10%)</span>
            <span className="block text-lg font-bold text-gray-900">Rp {total.toLocaleString()}</span>
          </div>
          <button
            className="px-6 py-3 bg-maroon hover:bg-maroon-600 text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
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
            className="fixed inset-0 bg-black/45 backdrop-blur-md z-[60] animate-fade-in"
            onClick={handleCancelDelete}
          />
          
          {/* Modal Box */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[340px] bg-white rounded-3xl p-6 z-[70] shadow-2xl">
            <div className="flex flex-col items-center text-center">
              {/* Delete Icon */}
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Item?</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Apakah Anda yakin ingin menghapus <strong>{confirmDelete.itemName}</strong> dari pesanan?
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-full font-bold hover:bg-gray-50 transition-all"
                  onClick={handleCancelDelete}
                >
                  Batal
                </button>
                <button
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                  onClick={handleConfirmDelete}
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PhoneShell>
  );
}
