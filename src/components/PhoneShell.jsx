// src/components/PhoneShell.jsx
import React, { useEffect, useState } from "react";
import BottomNavbar from "./BottomNavbar";

/**
 * PhoneShell — Responsive version
 * Desktop: Shows phone frame
 * Mobile: Full-screen responsive layout
 */
export default function PhoneShell({ 
  header, 
  footer, 
  noFooter = false, 
  noHeader = false,
  showBottomNav = false,
  children 
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect if device is real mobile
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Only apply desktop scaling if not mobile
    if (isMobile) return;

    const phone = document.querySelector(".phone");
    if (!phone) return;

    const baseHeight = 749;
    const resize = () => {
      const screenH = window.innerHeight;
      const scale = Math.min(1, screenH / baseHeight);
      phone.style.setProperty("--scale", scale);
    };

    resize();
    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, [isMobile]);

  return (
    <div className={`${isMobile ? 'fixed inset-0' : 'min-h-screen w-full'} bg-gray-100 flex items-center justify-center overflow-hidden`}>
      <div className={`${isMobile ? 'w-full h-full' : 'w-[430px] h-[749px]'} mx-auto bg-transparent relative`}>
        <div className={`w-full h-full ${isMobile ? '' : 'rounded-[28px]'} overflow-hidden bg-white`}>
          <div 
            className="phone relative w-full h-full bg-white overflow-hidden"
            style={!isMobile ? { transformOrigin: 'top center', transform: 'scale(var(--scale, 1))' } : {}}
          >
            {!noHeader && <div className="h-14 flex items-center">{header}</div>}
            <div className={`
              overflow-y-auto overflow-x-hidden h-full
              ${noFooter ? '' : 'pb-16'}
              ${noHeader ? '' : 'pt-0'}
              ${showBottomNav ? 'pb-14' : ''}
            `}>
              {children}
            </div>
            {!noFooter && !showBottomNav && <div className="absolute bottom-0 inset-x-0 h-16 bg-white">{footer}</div>}
            {showBottomNav && <BottomNavbar />}
          </div>
        </div>
      </div>
    </div>
  );
}
