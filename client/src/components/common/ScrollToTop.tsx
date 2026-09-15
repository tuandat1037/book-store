import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Smart scroll handling for the SPA:
 * - Normal navigation (click a link, go to a new page)  -> jump to top.
 * - Browser Back / Forward (popstate)                   -> restore the exact
 *   scroll position the page had when the user left it, so pressing "back"
 *   from a book detail lands right where the book was clicked on the homepage.
 *
 * Positions live in sessionStorage (survives route remounts, cleared per tab
 * close) and are capped to the most recent 30 pages.
 */

const SCROLL_KEY = 'kimd…s';

function readPositions(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(SCROLL_KEY) || '{}');
  } catch {
    return {};
  }
}

function savePosition(key: string, y: number) {
  try {
    const positions = readPositions();
    positions[key] = y;
    // keep the map small: drop oldest insertions beyond 30 entries
    const keys = Object.keys(positions);
    if (keys.length > 30) {
      keys.slice(0, keys.length - 30).forEach((k) => delete positions[k]);
    }
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(positions));
  } catch {
    /* private mode / quota: ignore, scroll restore is non-critical */
  }
}

/** Retry until the page has grown tall enough to hold targetY (data loads async). */
function restoreScroll(targetY: number) {
  let attempts = 0;
  const tick = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    attempts += 1;
    if (maxScroll >= targetY || attempts > 20) {
      window.scrollTo(0, targetY);
      return;
    }
    setTimeout(tick, 100);
  };
  requestAnimationFrame(tick);
}

export const ScrollToTop: React.FC = () => {
  const location = useLocation();
  const locationKey = location.pathname + location.search;

  const prevKeyRef = useRef('');
  const isPopRef = useRef(false);

  // Take full control of scroll restoration so a manual reload (e.g. clicking
  // the logo on the homepage) always starts at the top instead of the browser
  // reopening at the old offset. Back/forward is handled by us below.
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
    return () => {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Flag browser back/forward navigations (fires before React re-renders)
  useEffect(() => {
    const onPop = () => { isPopRef.current = true; };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    // The page we are leaving keeps its current scroll offset for a later "back"
    if (prevKeyRef.current) {
      savePosition(prevKeyRef.current, window.scrollY);
    }
    prevKeyRef.current = locationKey;

    const wasPop = isPopRef.current;
    isPopRef.current = false;

    if (wasPop) {
      const saved = readPositions()[locationKey];
      if (typeof saved === 'number' && saved > 0) {
        restoreScroll(saved);
        return;
      }
    }

    window.scrollTo(0, 0);
  }, [locationKey]);

  return null;
};
