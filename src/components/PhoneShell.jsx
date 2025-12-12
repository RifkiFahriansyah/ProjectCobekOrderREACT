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
    <div className="app-viewport">
      <div className="phone-wrapper">
        <div className="phone-screen">
          <div className="phone">
            {!noHeader && <div className="phone-header">{header}</div>}
            <div className={`phone-content ${noFooter ? "no-footer" : ""} ${noHeader ? "no-header" : ""} ${showBottomNav ? "with-bottom-nav" : ""}`}>
              {children}
            </div>
            {!noFooter && !showBottomNav && <div className="phone-footer">{footer}</div>}
            {showBottomNav && <BottomNavbar />}
          </div>
        </div>
      </div>
    </div>
  );
}
