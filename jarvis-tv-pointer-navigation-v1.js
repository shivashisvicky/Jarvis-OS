(() => {
  'use strict';
  if (window.__JARVIS_TV_POINTER_NAV_V2__) return;

  const isTvBrowser = () => /jiobrowser|bravia|smart[- ]?tv|android tv|googletv|google tv|hbbtv|tizen tv/i.test(String(navigator.userAgent || ''));
  if (!isTvBrowser()) return;
  window.__JARVIS_TV_POINTER_NAV_V2__ = true;

  const workspace = () => document.querySelector('.workspace');

  // JARVIS intentionally keeps its content inside .workspace, unlike the
  // standalone probe whose document/body is the scroller. On TV we therefore
  // preserve the existing shell and make ONLY .workspace the scroll owner.
  const install = () => {
    const w = workspace();
    if (!(w instanceof HTMLElement)) return false;

    w.style.setProperty('overflow-y', 'auto', 'important');
    w.style.setProperty('overflow-x', 'hidden', 'important');
    w.style.setProperty('height', 'auto', 'important');
    w.style.setProperty('max-height', 'none', 'important');
    w.style.setProperty('min-height', '0', 'important');
    w.style.setProperty('scroll-behavior', 'auto', 'important');
    return true;
  };

  let lastX = null;
  let lastY = null;
  let pending = 0;
  let raf = 0;

  const flush = () => {
    raf = 0;
    const w = workspace();
    if (!(w instanceof HTMLElement) || !pending) {
      pending = 0;
      return;
    }
    const max = Math.max(0, w.scrollHeight - w.clientHeight);
    if (max <= 2) {
      pending = 0;
      return;
    }
    w.scrollTop = Math.max(0, Math.min(max, w.scrollTop + pending));
    pending = 0;
  };

  const onPointerMove = e => {
    if (!isTvBrowser()) return;
    if (!install()) return;

    const x = Number.isFinite(e.clientX) ? e.clientX : null;
    const y = Number.isFinite(e.clientY) ? e.clientY : null;
    if (x == null || y == null) {
      lastX = lastY = null;
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

    // The remote's vertical movement is what JioSphere exposes to the page.
    // Use it to scroll JARVIS's actual scroll owner, .workspace.
    if (Math.abs(dy) < 6 || Math.abs(dy) < Math.abs(dx) * 1.15) return;

    pending += dy * 3;
    if (!raf) raf = requestAnimationFrame(flush);
  };

  window.addEventListener('pointermove', onPointerMove, true);

  // Keep the TV scroll owner correct after JARVIS rerenders pages/modules.
  new MutationObserver(() => { install(); }).observe(document.documentElement, {childList:true, subtree:true});
  install();
})();