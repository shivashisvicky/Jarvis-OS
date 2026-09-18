(() => {
  'use strict';
  if (window.__JARVIS_TV_POINTER_NAV_V1__) return;

  const isTvBrowser = () => {
    const ua = String(navigator.userAgent || '');
    return /(bravia|smart[- ]?tv|hbbtv|android tv|googletv|google tv|aft[abms]|netcast|web0s|viera|tizen tv|jiobrowser)/i.test(ua) ||
      (Math.max(screen.width || 0, screen.height || 0) >= 1200 && navigator.maxTouchPoints === 0);
  };
  if (!isTvBrowser()) return;
  window.__JARVIS_TV_POINTER_NAV_V1__ = true;

  const scroller = () => document.scrollingElement || document.documentElement;
  const canScroll = () => {
    const s = scroller();
    return !!s && s.scrollHeight > window.innerHeight + 2;
  };

  let lastY = null;
  let lastX = null;
  let pending = 0;
  let raf = 0;

  const flush = () => {
    raf = 0;
    if (!canScroll() || !pending) {
      pending = 0;
      return;
    }
    const s = scroller();
    const max = Math.max(0, s.scrollHeight - window.innerHeight);
    const next = Math.max(0, Math.min(max, (s.scrollTop || 0) + pending));
    s.scrollTop = next;
    pending = 0;
  };

  window.addEventListener('pointermove', e => {
    if (!isTvBrowser()) return;
    const x = Number.isFinite(e.clientX) ? e.clientX : null;
    const y = Number.isFinite(e.clientY) ? e.clientY : null;

    if (x == null || y == null) {
      lastX = null;
      lastY = null;
      return;
    }

    if (lastX == null || lastY == null) {
      lastX = x;
      lastY = y;
      return;
    }

    const dx = x - lastX;
    const dy = y - lastY;
    lastX = x;
    lastY = y;

    // JioSphere's physical D-pad is observed as vertical pointer movement.
    // Translate only meaningful vertical movement into TV-only document scroll.
    // No keyboard events, clicks, focus changes, or shared OS behavior are touched.
    if (Math.abs(dy) < 6 || Math.abs(dy) < Math.abs(dx) * 1.15) return;
    if (!canScroll()) return;

    pending += dy * 3;
    if (!raf) raf = requestAnimationFrame(flush);
  }, true);
})();