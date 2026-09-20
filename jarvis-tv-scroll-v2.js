(() => {
  'use strict';

  if (window.__JARVIS_TV_SCROLL_V2__) return;

  const isTvBrowser = () => {
    const ua = String(navigator.userAgent || '');
    return /(jiobrowser|jiosphere|bravia|smart[- ]?tv|android tv|googletv|google tv|hbbtv|tizen tv|aft[abms]|netcast|web0s|viera)/i.test(ua);
  };

  if (!isTvBrowser()) return;
  window.__JARVIS_TV_SCROLL_V2__ = true;

  // Keep TV scrolling isolated to the existing JARVIS workspace.
  // Do not promote html/body/app/os into document scrolling mode.
  const workspace = () => document.querySelector('.workspace');

  const installWorkspaceScroll = () => {
    const w = workspace();
    if (!(w instanceof HTMLElement)) return false;

    w.style.setProperty('overflow-y', 'auto', 'important');
    w.style.setProperty('overflow-x', 'hidden', 'important');
    w.style.setProperty('min-height', '0', 'important');
    w.style.setProperty('max-height', 'none', 'important');
    w.style.setProperty('scroll-behavior', 'auto', 'important');
    w.style.setProperty('overscroll-behavior-y', 'contain', 'important');
    w.style.setProperty('touch-action', 'pan-y', 'important');
    return true;
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const tryScrollElement = (el, delta) => {
    if (!(el instanceof HTMLElement)) return false;

    const max = Math.max(0, el.scrollHeight - el.clientHeight);
    if (max <= 2) return false;

    const before = el.scrollTop;
    const next = clamp(before + delta, 0, max);
    if (Math.abs(next - before) <= 0.5) return false;

    el.scrollTop = next;
    return Math.abs(el.scrollTop - before) > 0.5;
  };

  const scroll = delta => {
    if (!Number.isFinite(delta) || Math.abs(delta) < 0.5) return false;

    const w = workspace();
    if (w instanceof HTMLElement && tryScrollElement(w, delta)) return true;

    const root = document.scrollingElement || document.documentElement;
    if (root instanceof HTMLElement && tryScrollElement(root, delta)) return true;

    return false;
  };

  let lastX = null;
  let lastY = null;
  let edgeDirection = 0;
  let edgeRaf = 0;

  const edgeTick = () => {
    edgeRaf = 0;
    if (!edgeDirection) return;

    if (!scroll(edgeDirection * 14)) return;
    edgeRaf = requestAnimationFrame(edgeTick);
  };

  const scheduleEdgeScroll = direction => {
    if (edgeDirection === direction) {
      if (!edgeRaf) edgeRaf = requestAnimationFrame(edgeTick);
      return;
    }
    edgeDirection = direction;
    if (!edgeRaf) edgeRaf = requestAnimationFrame(edgeTick);
  };

  const onPointerMove = event => {
    installWorkspaceScroll();

    const x = Number.isFinite(event.clientX) ? event.clientX : null;
    const y = Number.isFinite(event.clientY) ? event.clientY : null;

    if (x == null || y == null) {
      lastX = lastY = null;
      edgeDirection = 0;
      return;
    }

    if (lastX == null || lastY == null) {
      lastX = x;
      lastY = y;
    } else {
      const dx = x - lastX;
      const dy = y - lastY;
      lastX = x;
      lastY = y;

      // JioSphere exposes the remote cursor as pointer movement rather than
      // DOM keyboard events. Convert meaningful vertical movement into a
      // deterministic scroll on JARVIS's real scroll owner.
      if (Math.abs(dy) >= 4 && Math.abs(dy) >= Math.abs(dx) * 1.1) {
        scroll(dy * 4);
      }
    }

    const h = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
    const edge = Math.min(90, Math.max(54, Math.floor(h * 0.13)));

    if (y <= edge) {
      scheduleEdgeScroll(-1);
    } else if (y >= h - edge) {
      scheduleEdgeScroll(1);
    } else {
      edgeDirection = 0;
    }
  };

  window.addEventListener('pointermove', onPointerMove, true);

  window.addEventListener('pointerleave', () => {
    edgeDirection = 0;
    lastX = lastY = null;
  }, true);

  window.addEventListener('wheel', event => {
    if (!isTvBrowser()) return;
    if (Math.abs(event.deltaY || 0) < 0.5) return;
    if (scroll(Number(event.deltaY))) event.preventDefault();
  }, {capture:true, passive:false});

  document.addEventListener('focusin', event => {
    if (!isTvBrowser()) return;

    const target = event.target instanceof Element ? event.target : null;
    const w = workspace();

    if (!target || !(w instanceof HTMLElement) || !w.contains(target)) return;
    if (target.matches('input,textarea,select,[contenteditable="true"]')) return;

    try {
      target.scrollIntoView({block:'nearest', inline:'nearest', behavior:'auto'});
    } catch {
      target.scrollIntoView();
    }
  }, true);

  new MutationObserver(() => {
    installWorkspaceScroll();
  }).observe(document.documentElement, {childList:true, subtree:true});

  installWorkspaceScroll();
})();
