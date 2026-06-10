import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls window/main scroll container to top on route change.
 * Prevents jarring "flash" perception when changing tabs.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Window
    window.scrollTo({ top: 0, left: 0 });
    // App main scroll container (AppLayout uses .app-scroll-area)
    const scrollArea = document.querySelector(".app-scroll-area") as HTMLElement | null;
    if (scrollArea) scrollArea.scrollTop = 0;
  }, [pathname]);

  return null;
};

export default ScrollToTop;
