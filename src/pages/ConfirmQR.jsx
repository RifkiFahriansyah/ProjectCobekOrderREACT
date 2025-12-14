// src/pages/ConfirmQR.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PhoneShell from "../components/PhoneShell";
import { payOrder } from "../lib/api";
import { getOrCreateCustomerSession } from "../utils/customerSession";

export default function ConfirmQR() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const table = params.get("table") || "1";
  
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!orderId || !table) {
      nav(`/?table=${table}`);
      return;
    }

    // Trigger payment immediately when component loads
    (async () => {
      try {
        const customerToken = getOrCreateCustomerSession(table);
        
        await payOrder(orderId, {
          table_number: table,
          customer_token: customerToken
        });
        
        setProcessing(false);
      } catch (err) {
        console.error("Payment error:", err);
        setError(true);
        setProcessing(false);
      }
    })();
  }, [orderId, table, nav]);

  const handleBackToHome = () => {
    nav(`/?table=${table}`);
  };

  if (processing) {
    return (
      <PhoneShell noHeader noFooter>
        <div className="absolute top-0 inset-x-0 h-14 bg-maroon flex items-center justify-center z-10">
          <h5 className="text-lg font-bold text-white">QRIS</h5>
        </div>
        <div className="flex flex-col items-center justify-center h-full bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-maroon border-t-transparent mb-4"></div>
          <div className="text-base font-semibold text-gray-700">Memproses pembayaran...</div>
        </div>
      </PhoneShell>
    );
  }

  if (error) {
    return (
      <PhoneShell noHeader noFooter>
        <div className="absolute top-0 inset-x-0 h-14 bg-maroon flex items-center justify-center z-10">
          <h5 className="text-lg font-bold text-white">QRIS</h5>
        </div>
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 px-8 text-center">
          <h2 className="text-3xl font-bold text-red-600 mb-4">Pembayaran Gagal</h2>
          <p className="text-gray-600 mb-8">Terjadi kesalahan saat memproses pembayaran.</p>
          <button
            className="px-8 py-4 bg-gradient-to-r from-orange to-orange-dark text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
            onClick={handleBackToHome}
          >
            Kembali Ke Home
          </button>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell noHeader noFooter>
      {/* TOP HEADER */}
      <div className="absolute top-0 inset-x-0 h-14 bg-maroon flex items-center justify-between px-4 z-10">
        <button 
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" 
          onClick={() => nav(-1)}
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h5 className="text-lg font-bold text-white">QRIS</h5>
        <div className="w-11"></div>
      </div>

      {/* CONTENT */}
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 px-8 text-center">
        {/* SUCCESS TEXT */}
        <h2 className="text-3xl font-bold text-green-600 mb-8">Pembayaran Berhasil</h2>

        {/* SUCCESS CHECKMARK */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-12 shadow-[0_8px_32px_rgba(34,197,94,0.3)] animate-bounce">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* BACK TO HOME BUTTON */}
        <button
          className="px-8 py-4 bg-gradient-to-r from-orange to-orange-dark text-white rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
          onClick={handleBackToHome}
        >
          Kembali Ke Home
        </button>
      </div>
    </PhoneShell>
  );
}
