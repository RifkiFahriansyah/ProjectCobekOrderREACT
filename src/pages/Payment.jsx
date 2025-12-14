// src/pages/Payment.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOrder } from "../lib/api";
import { useCart } from "../state/CartContext";
import PhoneShell from "../components/PhoneShell";
import { addOrderHistory } from "../utils/history";
import { getOrCreateCustomerSession } from "../utils/customerSession";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Payment({ tableNumber }) {
  const nav = useNavigate();
  const { items, subtotal } = useCart();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    note: "", // catatan
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Hitung PPN & total
  const ppn = Math.round(subtotal * 0.1);      // 10% dari subtotal
  const total = subtotal + ppn;

  // --- VALIDASI ---
  const validation = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = true;
    if (!form.phone.trim()) e.phone = true;
    else if (!/^\d+$/.test(form.phone.trim())) e.phone = true;
    if (!form.email.trim()) e.email = true;
    else if (!emailRegex.test(form.email.trim())) e.email = true;
    if (!items.length) e.items = true;
    return { valid: Object.keys(e).length === 0, e };
  }, [form, items.length]);

  async function submit() {
    if (!validation.valid) {
      setErrors(validation.e);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      // Get or create customer token
      const customerToken = getOrCreateCustomerSession(tableNumber);
      
      const payload = {
        table_number: tableNumber,
        customer_token: customerToken,
        items: items.map(({ menu, qty }) => ({ menu_id: menu.id, qty })),
        other_fees: ppn, // kirim PPN 10% (backend tetap bisa hitung ulang)
        customer_name: form.name.trim(),
        customer_phone: form.phone.trim(),
        customer_email: form.email.trim(),
        customer_note: form.note.trim() || null,
      };

      const res = await createOrder(payload);
      addOrderHistory({
        id: res.data.id,
        order_code: res.data.order_code,
        total: res.data.total,
        created_at: res.data.created_at,
        status: res.data.status,
      });
      nav(`/payment/qr?orderId=${res.data.id}&table=${tableNumber}`);
    } catch (err) {
      if (err?.response?.status === 422) {
        const be = err.response.data?.errors || {};
        const flat = {};
        Object.keys(be).forEach(
          (k) => (flat[k] = Array.isArray(be[k]) ? be[k][0] : String(be[k]))
        );
        setErrors((prev) => ({ ...prev, ...flat }));
      } else {
        alert("Gagal membuat order. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  // khusus Phone: hanya angka
  const onPhoneChange = (v) => {
    const digitsOnly = v.replace(/\D+/g, "");
    setForm((f) => ({ ...f, phone: digitsOnly }));
    if (errors.phone) setErrors((x) => ({ ...x, phone: undefined }));
  };

  return (
    <PhoneShell noHeader noFooter>
      {/* TOP HEADER AREA */}
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
        <h5 className="text-lg font-bold text-white">Pembayaran</h5>
        <div className="w-11"></div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="pt-14 pb-24 h-full overflow-y-auto bg-gray-50">
        {/* ORDER TYPE BANNER */}
        <div className="mx-4 mt-4 mb-3 bg-gradient-to-r from-maroon to-maroon-600 text-white text-sm font-semibold py-3 px-4 rounded-xl shadow-sm">
          Tipe Order : Makan Ditempat
        </div>

        {/* ERROR BANNER */}
        {"items" in errors && (
          <div className="mx-4 mb-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm py-3 px-4 rounded-xl">
            Keranjang kosong. Tambahkan item terlebih dahulu.
          </div>
        )}

        {/* CUSTOMER INFORMATION FORM */}
        <div className="mx-4 bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nama Lengkap <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.name ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-maroon/20"
                }`}
                placeholder="Masukkan nama lengkap"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  if (errors.name) setErrors((x) => ({ ...x, name: undefined }));
                }}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nomor Telepon <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <input
                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.phone ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-maroon/20"
                }`}
                placeholder="08xxxxxxxxxx"
                value={form.phone}
                inputMode="numeric"
                pattern="\d*"
                onChange={(e) => onPhoneChange(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              <input
                className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  errors.email ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-maroon/20"
                }`}
                placeholder="email@example.com"
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors((x) => ({ ...x, email: undefined }));
                }}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nomor Meja <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <input
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                value={tableNumber}
                disabled
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Catatan (opsional)</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-maroon/20 transition-all resize-none"
              rows={3}
              placeholder="Contoh: sambal dipisah, tanpa es, dsb."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>
        </div>

        {/* PAYMENT METHOD SECTION */}
        <div className="mx-4 bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h6 className="text-base font-bold text-gray-900 mb-3">Metode Pembayaran</h6>
          <div className="bg-gradient-to-r from-maroon/5 to-maroon/10 border border-maroon/20 text-maroon font-semibold py-3 px-4 rounded-xl text-center">
            Pembayaran Online
          </div>
        </div>

        <div className="mx-4 bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h6 className="text-base font-bold text-gray-900 mb-3">Pilih Pembayaran</h6>
          <div className="flex items-center gap-3 bg-white border-2 border-maroon rounded-xl py-3 px-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8B2635" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            <span className="text-base font-bold text-maroon">QRIS</span>
          </div>
        </div>

        {/* TOTAL PAYMENT SUMMARY */}
        <div className="mx-4 bg-white rounded-2xl p-5 shadow-sm mb-4">
          <div className="text-sm text-gray-500 mb-1">Total Pembayaran</div>
          <div className="text-2xl font-bold text-maroon mb-4">Rp {total.toLocaleString()}</div>
          <div className="pt-3 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold text-gray-900">Rp {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">PPN 10%</span>
              <span className="font-semibold text-gray-900">Rp {ppn.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="h-24"></div>
      </div>

      {/* PAY BUTTON (STICKY AT BOTTOM) */}
      <div className="absolute bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-4 z-20">
        <button
          className={`w-full py-4 rounded-full font-bold text-white shadow-lg transition-all ${
            validation.valid 
              ? "bg-gradient-to-r from-orange to-orange-dark hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0" 
              : "bg-gray-300 cursor-not-allowed"
          }`}
          disabled={loading || !validation.valid}
          onClick={submit}
        >
          {loading ? "Processing..." : "Bayar"}
        </button>
      </div>
    </PhoneShell>
  );
}
