import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook for bottom sheet detail
 * Pure UI layer - handles ESC key and provides unified close function
 */
export function useBottomSheetDetail(isOpen, onAnimationComplete) {
  const isClosingRef = useRef(false);

  /**
   * CORE CLOSE FUNCTION - Single source of truth
   */
  const closeDetail = useCallback(() => {
    if (isClosingRef.current) return;
    
    isClosingRef.current = true;

    // Close immediately
    if (onAnimationComplete) {
      onAnimationComplete();
    }

    isClosingRef.current = false;
  }, [onAnimationComplete]);

  /**
   * Handle ESC key to close
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closeDetail();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeDetail]);

  return { closeDetail };
}
