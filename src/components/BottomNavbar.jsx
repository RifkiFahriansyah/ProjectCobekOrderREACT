// src/components/BottomNavbar.jsx
import React from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

export default function BottomNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Show only on home, detail, and history pages
  const showOnPages = ["/", "/history"];
  const isDetailPage = location.pathname.startsWith("/menu/");
  const shouldShow = showOnPages.includes(location.pathname) || isDetailPage;

  if (!shouldShow) return null;

  const isHome = location.pathname === "/";
  const isHistory = location.pathname === "/history";
  
  // Get table number from URL
  const tableNumber = searchParams.get("table");

  return (
    <div className="absolute bottom-0 inset-x-0 h-14 bg-maroon flex items-center justify-around px-4 z-50">
      {/* History Icon - Left */}
      <button
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isHistory ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
        onClick={() => navigate(tableNumber ? `/history?table=${tableNumber}` : "/history")}
        aria-label="History"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </button>

      {/* Home Icon - Center */}
      <button
        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${isHome ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'}`}
        onClick={() => navigate(tableNumber ? `/?table=${tableNumber}` : "/")}
        aria-label="Home"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>

      {/* Back Icon - Right (Navigate to Home) */}
      <button
        className="flex items-center justify-center w-10 h-10 rounded-xl text-white/70 hover:text-white transition-all"
        onClick={() => navigate(tableNumber ? `/?table=${tableNumber}` : "/")}
        aria-label="Back to Home"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
    </div>
  );
}
