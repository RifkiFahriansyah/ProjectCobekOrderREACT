// src/components/DetailModal.jsx
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCart } from "../state/CartContext";
import { useBottomSheetDetail } from "../hooks/useBottomSheetDetail";
import { useSwipeToClose } from "../hooks/useSwipeToClose";

export default function DetailModal({ menu, isVisible, onClose }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { inc } = useCart();

  /**
   * UNIFIED CLOSE FUNCTION - Single source of truth
   * Handles animation before calling onClose
   */
  const handleClose = () => {
    if (isClosing) return; // Prevent double-calls
    
    // Close immediately without animation
    onClose();
  };

  // Setup bottom sheet behavior (history, back button)
  const { closeDetail } = useBottomSheetDetail(isVisible, handleClose);

  // Setup swipe-to-close gesture
  useSwipeToClose(isVisible && !isClosing, closeDetail, 80);

  // Handle opening/closing animations
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      setIsClosing(false);
    } else {
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }
  }, [isVisible]);

  const handleAddOrder = () => {
    inc(menu, 1);
    closeDetail(); // Use unified close function
  };

  if (!isAnimating && !isVisible) return null;

  const modalContent = (
    <>
      {/* OVERLAY */}
      <div 
        className={`
          fixed inset-0 bg-black/60 z-40
          transition-opacity duration-300 ease-in-out
          ${isAnimating && !isClosing ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={closeDetail}
        aria-hidden="true"
      />

      {/* BOTTOM SHEET - 70% Height */}
      <div 
        className={`
          fixed bottom-0 left-0 right-0 
          h-[70vh] max-h-[70vh]
          bg-white rounded-t-[30px] z-50 
          overflow-hidden flex flex-col
          shadow-[0_-8px_32px_rgba(0,0,0,0.15)]
          transition-transform duration-300 ease-out
          ${isAnimating && !isClosing ? 'translate-y-0' : 'translate-y-full'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* SHEET HEADER - Swipeable Handle Area */}
        <div 
          data-sheet-header 
          className="flex-shrink-0 py-3 flex justify-center cursor-grab active:cursor-grabbing"
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* TOP IMAGE */}
        <div className="relative w-full h-[220px] flex-shrink-0 bg-gray-100 overflow-hidden">
          <img 
            src={menu.photo_full_url || "https://via.placeholder.com/800x600?text=Menu"} 
            alt={menu.name}
            className="w-full h-full object-contain object-center bg-gray-50"
          />
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 bg-white">
          <h3 className="text-2xl font-extrabold text-gray-900 mb-3 leading-tight">{menu.name}</h3>
          <div className="text-xl font-bold text-maroon mb-4">
            Rp {Number(menu.price).toLocaleString()}
          </div>
          <div className="w-full h-px bg-gray-200 my-4"></div>
          
          {menu.description && (
            <p className="text-[15px] leading-relaxed text-gray-600">{menu.description}</p>
          )}
        </div>

        {/* BOTTOM FLOATING ORDER BUTTON */}
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4 pb-6 bg-white border-t border-gray-100 z-25">
          <button
            className="flex items-center justify-between w-full px-6 py-4 bg-gradient-to-r from-orange to-orange-dark text-white rounded-full font-bold shadow-[0_6px_20px_rgba(255,107,53,0.4)] hover:shadow-[0_8px_24px_rgba(255,107,53,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
            onClick={handleAddOrder}
          >
            <span>Tambah Pesanan</span>
            <span className="bg-white/25 px-3.5 py-1.5 rounded-[20px] text-[15px]">
              Rp {Number(menu.price).toLocaleString()}
            </span>
          </button>
        </div>
      </div>
    </>
  );

  // Portal to render outside PhoneShell
  const phoneElement = document.querySelector('.phone');
  return phoneElement ? createPortal(modalContent, phoneElement) : null;
}
