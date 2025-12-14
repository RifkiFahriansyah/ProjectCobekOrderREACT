import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Custom hook to handle browser back button and swipe gestures
 * - On home page: allows default browser behavior (exit to previous site)
 * - On other pages: navigates back within the app
 * - Can provide custom handler for special cases (e.g., closing modals)
 */
export function useBackHandler(isHomePage = false, customHandler = null) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePopState = (event) => {
      // If custom handler provided, use it (e.g., for modal close)
      if (customHandler && typeof customHandler === 'function') {
        event.preventDefault();
        customHandler();
        return;
      }

      // If on home page with no custom handler, let browser handle naturally
      if (isHomePage) {
        return;
      }

      // On other pages, prevent default and navigate within app
      event.preventDefault();
      navigate(-1);
    };

    // Listen to popstate event (triggered by back button/swipe)
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isHomePage, customHandler, navigate, location]);
}
