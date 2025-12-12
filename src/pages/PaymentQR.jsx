// src/pages/PaymentQR.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode.react";
import PhoneShell from "../components/PhoneShell";
import { useCart } from "../state/CartContext";
import { getOrder, createPayment, cancelOrder } from "../lib/api";
import { updateOrderStatus } from "../utils/history";
import "../paymentqr.css";

export default function PaymentQR() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");

  const nav = useNavigate();
  const { clear } = useCart();

  const [state, setState] = useState({
    loading: true,
     order: null,
    qr: "",
  });

  const [remaining, setRemaining] = useState(null); // will be calculated from order created_at
  const [timerStarted, setTimerStarted] = useState(false);

  // home url berdasarkan meja dari order
  const homeUrl = useMemo(() => {
    const table = state.order?.table_number;
    return table ? `/?table=${table}` : "/";
  }, [state.order]);

  // --- ambil order + QR ---
  useEffect(() => {
    if (!orderId) {
      nav("/", { replace: true });
      return;
    }

    (async () => {
      try {
        const or = (await getOrder(orderId)).data;

        // kalau status sudah final langsung lempar balik
        if (["paid", "expired", "cancelled"].includes(or.status)) {
          alert(`Order sudah ${or.status}.`);
          nav(homeUrl, { replace: true });
          return;
        }

        let qr = or.qr_string;
        if (!qr) {
          const pay = await createPayment(or.id);
          qr = pay.data.qr_string;
        }

        setState({ loading: false, order: or, qr });
        
        // Calculate remaining time from order created_at
        const createdAt = new Date(or.created_at);
        const now = new Date();
        const elapsed = Math.floor((now - createdAt) / 1000); // seconds elapsed
        const timeLeft = Math.max(0, 1200 - elapsed); // 1200 = 20 minutes
        setRemaining(timeLeft);
        setTimerStarted(true);
        
        clear(); // cart dikosongkan setelah order berhasil dibuat
      } catch (e) {
        console.error(e);
        alert("Gagal memuat QR. Silakan kembali dan ulangi order.");
        nav("/", { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // --- hitung mundur dari remaining time yang sudah dihitung ---
  useEffect(() => {
    if (!timerStarted) return; // wait until timer is started
    
    const tick = () => {
      setRemaining(prev => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    };

    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [timerStarted]);

  // --- polling status setiap 3 detik ---
  useEffect(() => {
    if (!state.order) return;

    const t = setInterval(async () => {
      try {
        const or = (await getOrder(orderId)).data;

        if (or.status === "paid") {
          updateOrderStatus(or.id, "paid");
          clearInterval(t);
          alert("Pembayaran berhasil!");
          nav(homeUrl, { replace: true });
        } else if (or.status === "expired") {
          updateOrderStatus(or.id, "expired");
          clearInterval(t);
          alert("Order expired. Silakan buat order baru.");
          nav(homeUrl, { replace: true });
        } else if (or.status === "cancelled") {
          updateOrderStatus(or.id, "cancelled");
          clearInterval(t);
          alert("Order sudah dibatalkan.");
          nav(homeUrl, { replace: true });
        }
      } catch (e) {
        console.error(e);
      }
    }, 3000);

    return () => clearInterval(t);
  }, [state.order, orderId, homeUrl, nav]);

  // format countdown MM:SS
  const countdownText = useMemo(() => {
    if (remaining == null) return "-";
    if (remaining <= 0) return "00:00";
    const m = String(Math.floor(remaining / 60)).padStart(2, "0");
    const s = String(remaining % 60).padStart(2, "0");
    return `${m} : ${s}`;
  }, [remaining]);

  // --- PAY NOW - Navigate to ConfirmQR ---
  const handlePayNow = () => {
    if (!orderId || !state.order) return;
    const table = state.order.table_number;
    nav(`/confirmqr?orderId=${orderId}&table=${table}`);
  };

  // --- DOWNLOAD QR ---
  const handleDownloadQR = () => {
    if (!state.qr) return;
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `QR-${state.order?.order_code || 'order'}.png`;
      link.click();
    }
  };

  // --- CANCEL dengan konfirmasi ---
  const handleCancel = async () => {
    if (!orderId || !state.order) return;

    const ok = window.confirm(
      "Yakin ingin membatalkan pesanan?"
    );
    if (!ok) return;

    try {
      const res = await cancelOrder(orderId); // panggil API ubah status
      const or = res.data;
      updateOrderStatus(or.id, or.status);
      alert("Order telah dibatalkan.");
      nav(homeUrl, { replace: true });
    } catch (e) {
      console.error(e);
      alert(
        "Gagal membatalkan order. Mungkin order sudah dibayar atau expired."
      );
    }
  };

  const disabledActions =
    !state.order || state.order.status !== "pending" || remaining === 0;

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

      {state.loading ? (
        <div className="paymentqr-loading">
          <div className="paymentqr-loading-text">Menyiapkan pembayaran...</div>
        </div>
      ) : (
        <div className="paymentqr-content">
          {/* TIMER SECTION */}
          <div className="paymentqr-timer-section">
            <div className="paymentqr-timer-label">Selesaikan Pembayaran Dalam</div>
            <div className={`paymentqr-timer ${remaining === 0 ? "expired" : ""}`}>
              {countdownText}
            </div>
          </div>

          {/* ORDER ID */}
          <div className="paymentqr-order-id">
            Order ID: #{state.order?.order_code}
          </div>

          {/* EXPIRED MESSAGE */}
          {remaining === 0 && (
            <div className="paymentqr-expired">
              Waktu habis. Silakan kembali dan buat order baru.
            </div>
          )}

          {/* QR CODE BOX */}
          {state.qr ? (
            <div className="paymentqr-qr-box">
              <QRCode value={state.qr} size={240} />
            </div>
          ) : (
            <div className="paymentqr-expired">QR tidak tersedia.</div>
          )}

          {/* TOTAL AMOUNT */}
          <div className="paymentqr-total-section">
            <div className="paymentqr-total-label">Total Pembayaran</div>
            <div className="paymentqr-total-amount">
              Rp {Number(state.order?.total || 0).toLocaleString()}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="paymentqr-actions">
            <button
              className="paymentqr-pay-btn"
              onClick={handlePayNow}
              disabled={disabledActions}
            >
              Pay Now
            </button>
            <button
              className="paymentqr-download-btn"
              onClick={handleDownloadQR}
              disabled={disabledActions}
              aria-label="Download QR"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>

          {/* PAYMENT INSTRUCTIONS */}
          <div className="paymentqr-instructions">
            <h6 className="paymentqr-instructions-title">Cara Pembayaran :</h6>
            <ul className="paymentqr-instructions-list">
              <li className="paymentqr-instruction-item">
                <div className="paymentqr-instruction-number">1</div>
                <div className="paymentqr-instruction-text">
                  Buka Pembayaran QR di m-Bank atau e-wallet
                </div>
              </li>
              <li className="paymentqr-instruction-item">
                <div className="paymentqr-instruction-number">2</div>
                <div className="paymentqr-instruction-text">
                  Scan Kode QR
                </div>
              </li>
              <li className="paymentqr-instruction-item">
                <div className="paymentqr-instruction-number">3</div>
                <div className="paymentqr-instruction-text">
                  Cek transaksimu dan lakukan pembayaran
                </div>
              </li>
              <li className="paymentqr-instruction-item">
                <div className="paymentqr-instruction-number">4</div>
                <div className="paymentqr-instruction-text">
                  Klik Pay Now
                </div>
              </li>
            </ul>
          </div>

          {/* CANCEL BUTTON (Optional) */}
          <div className="paymentqr-cancel-section">
            <button
              className="paymentqr-cancel-btn"
              onClick={handleCancel}
              disabled={disabledActions}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </PhoneShell>
  );
}
