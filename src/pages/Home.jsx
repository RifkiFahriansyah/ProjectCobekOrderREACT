import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PhoneShell from "../components/PhoneShell";
import StickyDock from "../components/StickyDock";
import MenuCard from "../components/MenuCard";
import DetailModal from "../components/DetailModal";
import { useCart } from "../state/CartContext";
import { fetchMenus } from "../lib/api";

export default function Home({ tableNumber }) {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const { items, subtotal } = useCart();

  // Calculate total quantity of all items
  const totalQty = useMemo(() => {
    return items.reduce((sum, item) => sum + item.qty, 0);
  }, [items]);

  useEffect(() => {
    fetchMenus().then((r) => setData(r.data));
  }, []);

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return data;
    return data
      .map((c) => ({
        ...c,
        menus: (c.menus || []).filter((m) => m.name.toLowerCase().includes(kw)),
      }))
      .filter((c) => c.menus?.length);
  }, [data, q]);

  const openDetail = (menu) => {
    setSelectedMenu(menu);
    setDetailVisible(true);
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setSelectedMenu(null);
  };

  return (
    <PhoneShell noHeader noFooter showBottomNav>
      <div className={`h-full overflow-y-auto ${detailVisible ? 'overflow-hidden pointer-events-none' : ''}`}>
        {/* HEADER AREA - Grilled Fish Photo with Typography */}
        <div className="relative w-full h-[200px] overflow-hidden -mb-8">
          <img
            src="https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800&q=80"
            alt="Grilled Fish"
            className="w-full h-full object-cover brightness-[0.7]"
          />
          <div className="absolute inset-0 flex items-center justify-between px-5">
            <div className="flex-5 pr-6 -mt-4">
              <div className="text-[32px] font-black text-white uppercase leading-[0.95] tracking-tight drop-shadow-[3px_3px_6px_rgba(0,0,0,0.6)] mb-1">COBEK BAKAR</div>
              <div className="text-[32px] font-black text-white uppercase leading-[0.95] tracking-tight drop-shadow-[3px_3px_6px_rgba(0,0,0,0.6)] mb-1">MAS</div>
              <div className="text-[32px] font-black text-white uppercase leading-[0.95] tracking-tight drop-shadow-[3px_3px_6px_rgba(0,0,0,0.6)]">AGUS</div>
            </div>
            <div className="w-15 h-15 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <circle cx="50" cy="50" r="48" fill="#8B2635" />
                <text x="50" y="50" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="24" fontWeight="bold">CB</text>
              </svg>
            </div>
          </div>
        </div>

        {/* RESTAURANT INFO CARD */}
        <div className="mx-4 mb-4 bg-white rounded-[28px] shadow-[0_6px_20px_rgba(0,0,0,0.12)] p-5 relative z-10">
          <div>
            <h5 className="text-lg font-bold text-gray-900 mb-1">Cobek Bakar Mas Agus</h5>
            <p className="text-xs text-gray-500 leading-relaxed">
              Jl. Mayor HM Rasyad Nawawi No. 56115<br />
              Palembang, Sumatera Selatan<br />
              Buka: 10:00 - 22:00
            </p>
          </div>
        </div>

        {/* TABLE NUMBER BAR */}
        <div className="mx-4 mb-3 bg-maroon rounded-2xl py-2 px-4 text-center">
          <span className="text-sm font-semibold text-white">Meja Nomor : {tableNumber || "-"}</span>
        </div>

        {/* SEARCH BAR */}
        <div className="px-4 mb-4">
          <input
            className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:border-maroon transition-all"
            placeholder="🔍 Cari menu..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* MENU GRID */}
        <div className="px-4 pb-20">
          {filtered.map((cat) => (
            <div key={cat.id} className="mb-6">
              <h6 className="text-base font-bold text-gray-900 mb-3 pl-1">{cat.name}</h6>
              <div className="grid grid-cols-2 gap-3">
                {cat.menus?.map((m) => (
                  <MenuCard 
                    key={m.id} 
                    menu={m} 
                    tableNumber={tableNumber}
                    onOpenDetail={openDetail}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ANCHOR for sticky dock */}
        <div id="homeDock" className="w-px h-2 mt-2" />
      </div>

      {/* FLOATING CHECKOUT */}
      {items.length > 0 && (
        <StickyDock anchorId="homeDock">
          <Link
            to={`/checkout?table=${tableNumber}`}
            className="flex items-center justify-between w-full px-6 py-4 bg-gradient-to-r from-orange to-orange-dark text-white rounded-full font-bold shadow-[0_6px_20px_rgba(255,107,53,0.4)] hover:shadow-[0_8px_24px_rgba(255,107,53,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all no-underline"
          >
            <div className="flex items-center gap-3">
              <span className="bg-white/30 px-3 py-1 rounded-2xl text-[15px] font-bold min-w-[32px] text-center">{totalQty}</span>
              <span>Checkout</span>
            </div>
            <span className="bg-white/25 px-3.5 py-1.5 rounded-[20px] text-[15px]">Rp {subtotal.toLocaleString()}</span>
          </Link>
        </StickyDock>
      )}

      {/* DETAIL MODAL LAYER */}
      {selectedMenu && (
        <DetailModal
          menu={selectedMenu}
          isVisible={detailVisible}
          onClose={closeDetail}
        />
      )}
    </PhoneShell>
  );
}
