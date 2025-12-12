// src/pages/ConfirmQR.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PhoneShell from "../components/PhoneShell";
import { payOrder } from "../lib/api";
import { getOrCreateCustomerSession } from "../utils/customerSession";
import "../paymentqr.css";

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
        <div className="paymentqr-header">
          <h5 className="paymentqr-header-title">QRIS</h5>
        </div>
        <div className="paymentqr-loading">
          <div className="paymentqr-loading-text">Memproses pembayaran...</div>
        </div>
      </PhoneShell>
    );
  }

  if (error) {
    return (
      <PhoneShell noHeader noFooter>
        <div className="paymentqr-header">
          <h5 className="paymentqr-header-title">QRIS</h5>
        </div>
        <div className="confirmqr-content">
          <h2 className="confirmqr-success-text" style={{color: '#dc2626'}}>Pembayaran Gagal</h2>
          <p>Terjadi kesalahan saat memproses pembayaran.</p>
          <button
            className="confirmqr-home-btn"
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
      <div className="paymentqr-header">
        <button 
          className="paymentqr-back-btn" 
          onClick={() => nav(-1)}
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h5 className="paymentqr-header-title">QRIS</h5>
        <div style={{ width: '40px' }}></div>
      </div>

      {/* CONTENT */}
      <div className="confirmqr-content">
        {/* SUCCESS TEXT */}
        <h2 className="confirmqr-success-text">Pembayaran Berhasil</h2>

        {/* SUCCESS CHECKMARK */}
        <div className="confirmqr-checkmark">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* BACK TO HOME BUTTON */}
        <button
          className="confirmqr-home-btn"
          onClick={handleBackToHome}
        >
          Kembali Ke Home
        </button>
      </div>
    </PhoneShell>
  );
}
