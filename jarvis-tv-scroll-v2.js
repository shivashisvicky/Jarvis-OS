(() => {
  'use strict';

  if (window.__JARVIS_TV_SCROLL_V4__) return;

  const isTvBrowser = () => {
    const ua = String(navigator.userAgent || '');
    return /(jiobrowser|jiosphere|bravia|smart[- ]?tv|android tv|googletv|google tv|hbbtv|tizen tv|aft[abms]|netcast|web0s|viera)/i.test(ua);
  };

  if (!isTvBrowser()) return;
  window.__JARVIS_TV_SCROLL_V4__ = true;

  // TV ONLY.
  //
  // JioSphere behaves much more like the spatial 3D viewport than a normal
  // desktop browser: it exposes a virtual pointer and reliable pointer
  // gestures, while DOM arrow-key delivery is inconsistent. The 3D workbench
  // already proves that an explicit pointer-drag interaction works well.
  //
  // Mimic that interaction for the page itself:
  //   pointer move alone = normal JARVIS navigation
  //   press + vertical drag on workspace = scroll
  //
  // This deliberately avoids a permanent TV overlay and avoids stealing
  // ordinary clicks from buttons, links, games, inputs, and cards.

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
    return true;
  };

  const updateScrollState = () => {
    const w = workspace();
    if (!(w instanceof HTMLElement)) return;
    w.dataset.jarvisTvScrollable =
      (w.scrollHeight - w.clientHeight > 2) ? 'true' : 'false';
  };

  const isInteractive = target => {
    if (!(target instanceof Element)) return false;
    return !!target.closest(
      'button,a[href],input,textarea,select,[contenteditable="true"],' +
      '[role="button"],[role="link"],.arcade,.game-card,canvas,' +
      '#commandForm,#jarvis-tv-scroll-controls'
    );
  };

  let drag = null;

  const stopDrag = () => {
    drag = null;
  };

  const onPointerDown = event => {
    if (event.button !== undefined && event.button !== 0) return;

    const w = workspace();
    if (!(w instanceof HTMLElement) || !w.contains(event.target)) return;
    if (isInteractive(event.target)) return;

    const max = Math.max(0, w.scrollHeight - w.clientHeight);
    if (max <= 2) return;

    drag = {
      pointerId: Number.isFinite(event.pointerId) ? event.pointerId : null,
      startX: Number(event.clientX) || 0,
      startY: Number(event.clientY) || 0,
      lastY: Number(event.clientY) || 0,
      active: false
    };
  };

  const onPointerMove = event => {
    if (!drag) return;
    if (
      drag.pointerId !== null &&
      Number.isFinite(event.pointerId) &&
      event.pointerId !== drag.pointerId
    ) return;

    const x = Number(event.clientX) || 0;
    const y = Number(event.clientY) || 0;
    const totalX = x - drag.startX;
    const totalY = y - drag.startY;
    const dy = y - drag.lastY;

    // Require a deliberate vertical drag. A tiny cursor correction should
    // never turn into scrolling.
    if (!drag.active) {
      if (Math.abs(totalY) < 14 || Math.abs(totalY) < Math.abs(totalX) * 1.25) return;
      drag.active = true;
    }

    if (Math.abs(dy) < 0.5) return;

    const w = workspace();
    if (!(w instanceof HTMLElement)) {
      stopDrag();
      return;
    }

    const before = w.scrollTop;
    const max = Math.max(0, w.scrollHeight - w.clientHeight);

    // Match the familiar content-drag gesture used by the working 3D
    // viewport: dragging upward reveals content below, dragging downward
    // reveals content above.
    const next = Math.max(0, Math.min(max, before - dy * 2.2));

    if (Math.abs(next - before) > 0.5) {
      w.scrollTop = next;
      event.preventDefault();
      event.stopPropagation();
    }

    drag.lastY = y;
    updateScrollState();
  };

  const onPointerUp = event => {
    if (!drag) return;

    if (drag.active) {
      event.preventDefault();
      event.stopPropagation();
    }

    stopDrag();
  };

  window.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('pointermove', onPointerMove, true);
  window.addEventListener('pointerup', onPointerUp, true);
  window.addEventListener('pointercancel', stopDrag, true);
  window.addEventListener('pointerleave', stopDrag, true);

  // Keep wheel support if JioSphere exposes it.
  window.addEventListener('wheel', event => {
    const w = workspace();
    if (!(w instanceof HTMLElement)) return;

    const delta = Number(event.deltaY || 0);
    if (Math.abs(delta) < 0.5) return;

    const before = w.scrollTop;
    const max = Math.max(0, w.scrollHeight - w.clientHeight);
    const next = Math.max(0, Math.min(max, before + delta));

    if (Math.abs(next - before) > 0.5) {
      w.scrollTop = next;
      event.preventDefault();
    }

    updateScrollState();
  }, {capture:true, passive:false});

  // Focus navigation remains useful when a TV browser actually supplies
  // focus/keyboard events. Keep it independent from the drag gesture.
  document.addEventListener('focusin', event => {
    const target = event.target instanceof Element ? event.target : null;
    const w = workspace();

    if (!target || !(w instanceof HTMLElement) || !w.contains(target)) return;
    if (target.matches('input,textarea,select,[contenteditable="true"]')) return;

    try {
      target.scrollIntoView({block:'nearest', inline:'nearest', behavior:'auto'});
    } catch {
      target.scrollIntoView();
    }

    updateScrollState();
  }, true);

  const observer = new MutationObserver(() => {
    installWorkspaceScroll();
    updateScrollState();
  });

  const start = () => {
    installWorkspaceScroll();
    updateScrollState();
    observer.observe(document.documentElement, {childList:true, subtree:true});
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else {
    start();
  }

  window.addEventListener('resize', updateScrollState, {passive:true});
  window.addEventListener('scroll', updateScrollState, {passive:true});
})();
