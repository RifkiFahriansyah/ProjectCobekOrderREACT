// src/pages/PaymentQR.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode.react";
import PhoneShell from "../components/PhoneShell";
import { useCart } from "../state/CartContext";
import { getOrder, createPayment, cancelOrder } from "../lib/api";
import { updateOrderStatus } from "../utils/history";

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
  const [showCancelModal, setShowCancelModal] = useState(false);

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
  const handleCancelClick = () => {
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderId || !state.order) return;

    try {
      const res = await cancelOrder(orderId);
      const or = res.data;
      updateOrderStatus(or.id, or.status);
      nav(homeUrl, { replace: true });
    } catch (e) {
      console.error(e);
      alert(
        "Gagal membatalkan order. Mungkin order sudah dibayar atau expired."
      );
    } finally {
      setShowCancelModal(false);
    }
  };

  const disabledActions =
    !state.order || state.order.status !== "pending" || remaining === 0;

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

      {state.loading ? (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-maroon border-t-transparent mx-auto mb-4"></div>
            <div className="text-base font-semibold text-gray-700">Menyiapkan pembayaran...</div>
          </div>
        </div>
      ) : (
        <div className="pt-14 pb-6 h-full overflow-y-auto bg-gray-50">
          {/* TIMER SECTION */}
          <div className="mx-4 mt-6 mb-4 bg-white rounded-2xl p-5 shadow-sm text-center">
            <div className="text-sm text-gray-500 mb-2">Selesaikan Pembayaran Dalam</div>
            <div className={`text-4xl font-black tracking-wider ${
              remaining === 0 ? "text-red-500" : "text-maroon"
            }`}>
              {countdownText}
            </div>
          </div>

          {/* ORDER ID */}
          <div className="mx-4 mb-4 bg-gradient-to-r from-maroon to-maroon-600 text-white text-sm font-semibold py-3 px-4 rounded-xl text-center shadow-sm">
            Order ID: #{state.order?.order_code}
          </div>

          {/* EXPIRED MESSAGE */}
          {remaining === 0 && (
            <div className="mx-4 mb-4 bg-red-50 border border-red-200 text-red-600 text-sm py-3 px-4 rounded-xl text-center font-semibold">
              Waktu habis. Silakan kembali dan buat order baru.
            </div>
          )}

          {/* QR CODE BOX */}
          {state.qr ? (
            <div className="mx-4 mb-4 bg-white rounded-2xl p-8 shadow-lg flex items-center justify-center">
              <QRCode value={state.qr} size={240} />
            </div>
          ) : (
            <div className="mx-4 mb-4 bg-red-50 border border-red-200 text-red-600 text-sm py-3 px-4 rounded-xl text-center font-semibold">
              QR tidak tersedia.
            </div>
          )}

          {/* TOTAL AMOUNT */}
          <div className="mx-4 mb-4 bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-sm text-gray-500 mb-1">Total Pembayaran</div>
            <div className="text-2xl font-bold text-maroon">
              Rp {Number(state.order?.total || 0).toLocaleString()}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mx-4 mb-4 flex gap-3">
            <button
              className="flex-1 py-4 bg-gradient-to-r from-orange to-orange-dark text-white rounded-full font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              onClick={handlePayNow}
              disabled={disabledActions}
            >
              Pay Now
            </button>
            <button
              className="w-14 h-14 bg-white border-2 border-maroon text-maroon rounded-full flex items-center justify-center hover:bg-maroon/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
          <div className="mx-4 mb-4 bg-white rounded-2xl p-5 shadow-sm">
            <h6 className="text-base font-bold text-gray-900 mb-4">Cara Pembayaran :</h6>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-maroon text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div className="text-sm text-gray-700 pt-0.5">
                  Buka Pembayaran QR di m-Bank atau e-wallet
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-maroon text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div className="text-sm text-gray-700 pt-0.5">
                  Scan Kode QR
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-maroon text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div className="text-sm text-gray-700 pt-0.5">
                  Cek transaksimu dan lakukan pembayaran
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-maroon text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  4
                </div>
                <div className="text-sm text-gray-700 pt-0.5">
                  Klik Pay Now
                </div>
              </li>
            </ul>
          </div>

          {/* CANCEL BUTTON (Optional) */}
          <div className="mx-4 mb-6">
            <button
              className="w-full py-3 bg-white border-2 border-red-500 text-red-500 rounded-full font-bold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              onClick={handleCancelClick}
              disabled={disabledActions}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-md z-[60] animate-fade-in"
            onClick={() => setShowCancelModal(false)}
          />
          
          {/* Modal Box */}
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[340px] bg-white rounded-3xl p-6 z-[70] shadow-2xl">
            <div className="flex flex-col items-center text-center">
              {/* Warning Icon */}
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Batalkan Pesanan?</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-6">
                Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  className="flex-1 px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-full font-bold hover:bg-gray-50 transition-all"
                  onClick={() => setShowCancelModal(false)}
                >
                  Kembali
                </button>
                <button
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold hover:shadow-lg transition-all"
                  onClick={handleConfirmCancel}
                >
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </PhoneShell>
  );
}
