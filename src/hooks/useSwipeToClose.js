import { useEffect } from 'react';

/**
 * Custom hook for swipe-to-close gesture
 * Detects downward swipe and triggers close callback
 * 
 * @param {boolean} isEnabled - Whether swipe detection is active
 * @param {function} onSwipeDown - Callback when valid swipe down detected
 * @param {number} threshold - Minimum swipe distance (default: 100px)
 */
export function useSwipeToClose(isEnabled, onSwipeDown, threshold = 100) {
  useEffect(() => {
    if (!isEnabled) return;

    let startY = 0;
    let startX = 0;
    let currentY = 0;
    let isSwiping = false;

    const handleTouchStart = (e) => {
      // Only detect swipes on the sheet header area
      const target = e.target;
      const sheetHeader = target.closest('[data-sheet-header]');
      
      if (sheetHeader) {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        isSwiping = true;
      }
    };

    const handleTouchMove = (e) => {
      if (!isSwiping) return;
      
      currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      
      const deltaY = currentY - startY;
      const deltaX = Math.abs(currentX - startX);
      
      // Cancel if horizontal swipe (scrolling)
      if (deltaX > deltaY) {
        isSwiping = false;
      }
    };

    const handleTouchEnd = () => {
      if (!isSwiping) return;

      const deltaY = currentY - startY;

      // If downward swipe exceeds threshold, close
      if (deltaY > threshold) {
        onSwipeDown();
      }

      isSwiping = false;
      startY = 0;
      currentY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isEnabled, onSwipeDown, threshold]);
}
