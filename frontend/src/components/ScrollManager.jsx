import { useLayoutEffect, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Disable browser's automatic scroll restoration on load
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

/**
 * ScrollManager — Definitive Global Route Scroll Reset
 * 
 * Synchronously resets window and container scroll positions on every route transition
 * before the new page renders, avoiding visual scroll jumps or inherited scroll positions.
 */
export default function ScrollManager() {
  const location = useLocation();

  useLayoutEffect(() => {
    // Preserve intentional anchor links (e.g., #features, #contact)
    if (location.hash) {
      const targetElement = document.querySelector(location.hash);
      if (targetElement) {
        targetElement.scrollIntoView();
        return;
      }
    }

    // 1. Synchronously reset window scroll with instant behavior
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    } catch {
      window.scrollTo(0, 0);
    }

    // 2. Direct DOM reset on root scrolling elements
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
      document.documentElement.scrollLeft = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
    }

    // 3. Reset any scroll containers inside the layout
    const customScrollContainers = document.querySelectorAll(
      '.main-content, #root, .app-layout, .page-container, [data-scroll-container]'
    );
    customScrollContainers.forEach(container => {
      if (container && container.scrollTop > 0) {
        container.scrollTop = 0;
      }
    });
  }, [location.pathname, location.search, location.hash]);

  // Backup animation frame tick to guarantee top positioning post-mount
  useEffect(() => {
    if (!location.hash) {
      const rafId = requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      });
      return () => cancelAnimationFrame(rafId);
    }
  }, [location.pathname, location.search]);

  return null;
}
