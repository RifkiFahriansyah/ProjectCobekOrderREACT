// src/components/StickyDock.jsx
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function StickyDock({
  anchorId,
  rootSelector = ".phone .phone-content",
  phoneSelector = ".phone",
  children,
}) {
  const [docked, setDocked] = useState(false);
  const [phoneEl, setPhoneEl] = useState(null);

  useEffect(() => {
    // siapkan root phone utk portal
    const p = document.querySelector(phoneSelector);
    setPhoneEl(p);
  }, [phoneSelector]);

  useEffect(() => {
    let io;
    let raf;

    const setup = () => {
      const rootEl = document.querySelector(rootSelector);
      const anchorEl = document.getElementById(anchorId);
      if (!rootEl || !anchorEl) { raf = requestAnimationFrame(setup); return; }

      io = new IntersectionObserver(
        ([entry]) => setDocked(entry.isIntersecting),
        { root: rootEl, threshold: 0.9 } // sedikit longgar agar mudah “docked”
      );
      io.observe(anchorEl);
    };

    setup();
    return () => { if (io) io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [anchorId, rootSelector]);

  // Render tombol di root ".phone" agar absolute-nya mengacu ke frame HP
  if (!phoneEl) return null;
  return createPortal(
    <div className={`
      ${docked ? 'absolute' : 'fixed'}
      left-1/2 -translate-x-1/2
      bottom-[70px] z-50
      w-[calc(100%-48px)] max-w-[390px]
      pointer-events-none
      transition-all duration-300
    `}>
      <div className="pointer-events-auto">
        {children}
      </div>
    </div>,
    phoneEl
  );
}
