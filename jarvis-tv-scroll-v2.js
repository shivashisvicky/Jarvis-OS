(() => {
  'use strict';

  if (window.__JARVIS_TV_SCROLL_V3__) return;

  const isTvBrowser = () => {
    const ua = String(navigator.userAgent || '');
    return /(jiobrowser|jiosphere|bravia|smart[- ]?tv|android tv|googletv|google tv|hbbtv|tizen tv|aft[abms]|netcast|web0s|viera)/i.test(ua);
  };

  if (!isTvBrowser()) return;
  window.__JARVIS_TV_SCROLL_V3__ = true;

  // TV ONLY.
  // JioSphere exposes the remote as a virtual pointer, not reliable DOM
  // keydown events. Therefore scrolling must be an explicit clickable action,
  // not inferred from ordinary pointer movement.
  const workspace = () => document.querySelector('.workspace');

  const installWorkspaceScroll = () => {
    const w = workspace();
    if (!(w instanceof HTMLElement)) return false;

    // Keep JARVIS' existing workspace as the sole scroll owner.
    w.style.setProperty('overflow-y', 'auto', 'important');
    w.style.setProperty('overflow-x', 'hidden', 'important');
    w.style.setProperty('min-height', '0', 'important');
    w.style.setProperty('max-height', 'none', 'important');
    w.style.setProperty('scroll-behavior', 'auto', 'important');
    w.style.setProperty('overscroll-behavior-y', 'contain', 'important');
    return true;
  };

  const maxScroll = () => {
    const w = workspace();
    if (!(w instanceof HTMLElement)) return 0;
    return Math.max(0, w.scrollHeight - w.clientHeight);
  };

  const updateButtonState = () => {
    const root = document.getElementById('jarvis-tv-scroll-controls');
    const w = workspace();
    if (!(root instanceof HTMLElement) || !(w instanceof HTMLElement)) return;

    const max = Math.max(0, w.scrollHeight - w.clientHeight);
    const top = w.scrollTop;

    root.hidden = max <= 2;
    const up = root.querySelector('[data-jarvis-tv-scroll="up"]');
    const down = root.querySelector('[data-jarvis-tv-scroll="down"]');

    if (up instanceof HTMLButtonElement) up.disabled = top <= 2;
    if (down instanceof HTMLButtonElement) down.disabled = top >= max - 2;
  };

  const scrollByPage = direction => {
    const w = workspace();
    if (!(w instanceof HTMLElement)) return false;

    const max = Math.max(0, w.scrollHeight - w.clientHeight);
    if (max <= 2) return false;

    // A large, deterministic page step is easier to use with a TV pointer
    // than continuous pointer-delta scrolling.
    const step = Math.max(220, Math.floor(w.clientHeight * 0.72));
    const before = w.scrollTop;
    const next = Math.max(0, Math.min(max, before + direction * step));

    if (Math.abs(next - before) <= 0.5) {
      updateButtonState();
      return false;
    }

    w.scrollTop = next;
    updateButtonState();
    return true;
  };

  const scrollToEdge = direction => {
    const w = workspace();
    if (!(w instanceof HTMLElement)) return false;

    const max = Math.max(0, w.scrollHeight - w.clientHeight);
    if (max <= 2) return false;

    w.scrollTop = direction < 0 ? 0 : max;
    updateButtonState();
    return true;
  };

  const style = document.createElement('style');
  style.id = 'jarvis-tv-scroll-controls-style';
  style.textContent = `
    #jarvis-tv-scroll-controls {
      position: fixed;
      right: clamp(14px, 1.8vw, 34px);
      top: 50%;
      transform: translateY(-50%);
      z-index: 2147483000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: auto;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    #jarvis-tv-scroll-controls[hidden] {
      display: none !important;
    }

    #jarvis-tv-scroll-controls button {
      width: clamp(64px, 5.2vw, 96px);
      height: clamp(64px, 5.2vw, 96px);
      padding: 0;
      border: 2px solid rgba(120, 220, 255, .72);
      border-radius: 16px;
      background: rgba(3, 15, 24, .92);
      color: #dff8ff;
      box-shadow: 0 8px 28px rgba(0,0,0,.38), inset 0 0 18px rgba(80,210,255,.08);
      font-size: clamp(28px, 2.3vw, 42px);
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      pointer-events: auto;
      touch-action: manipulation;
      user-select: none;
    }

    #jarvis-tv-scroll-controls button:focus,
    #jarvis-tv-scroll-controls button:hover {
      outline: 3px solid rgba(170,235,255,.95);
      outline-offset: 3px;
      background: rgba(8, 30, 45, .98);
    }

    #jarvis-tv-scroll-controls button:active {
      transform: scale(.96);
    }

    #jarvis-tv-scroll-controls button:disabled {
      opacity: .28;
      filter: saturate(.45);
    }

    #jarvis-tv-scroll-controls .jarvis-tv-scroll-edge {
      font-size: clamp(20px, 1.45vw, 28px);
      height: clamp(38px, 3vw, 54px);
      border-radius: 11px;
    }
  `;

  const installControls = () => {
    if (!document.head) return false;

    if (!document.getElementById(style.id)) {
      document.head.appendChild(style);
    }

    let root = document.getElementById('jarvis-tv-scroll-controls');
    if (!(root instanceof HTMLElement)) {
      root = document.createElement('div');
      root.id = 'jarvis-tv-scroll-controls';
      root.setAttribute('aria-label', 'JARVIS TV page scrolling');
      root.innerHTML = `
        <button type="button" class="jarvis-tv-scroll-edge" data-jarvis-tv-scroll="top" aria-label="Scroll to top" title="Scroll to top">⇈</button>
        <button type="button" data-jarvis-tv-scroll="up" aria-label="Scroll up" title="Scroll up">▲</button>
        <button type="button" data-jarvis-tv-scroll="down" aria-label="Scroll down" title="Scroll down">▼</button>
        <button type="button" class="jarvis-tv-scroll-edge" data-jarvis-tv-scroll="bottom" aria-label="Scroll to bottom" title="Scroll to bottom">⇊</button>
      `;

      root.addEventListener('click', event => {
        const target = event.target instanceof Element
          ? event.target.closest('button[data-jarvis-tv-scroll]')
          : null;
        if (!(target instanceof HTMLButtonElement) || target.disabled) return;

        const action = target.getAttribute('data-jarvis-tv-scroll');
        if (action === 'up') scrollByPage(-1);
        else if (action === 'down') scrollByPage(1);
        else if (action === 'top') scrollToEdge(-1);
        else if (action === 'bottom') scrollToEdge(1);
      });

      document.body.appendChild(root);
    }

    updateButtonState();
    return true;
  };

  // Keep wheel support where the TV browser exposes it, but never translate
  // ordinary pointer movement into scrolling.
  window.addEventListener('wheel', event => {
    if (Math.abs(event.deltaY || 0) < 0.5) return;
    const w = workspace();
    if (!(w instanceof HTMLElement)) return;

    const before = w.scrollTop;
    const max = Math.max(0, w.scrollHeight - w.clientHeight);
    const next = Math.max(0, Math.min(max, before + Number(event.deltaY)));

    if (Math.abs(next - before) > 0.5) {
      w.scrollTop = next;
      updateButtonState();
      event.preventDefault();
    }
  }, {capture:true, passive:false});

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

    updateButtonState();
  }, true);

  const observer = new MutationObserver(() => {
    installWorkspaceScroll();
    installControls();
    updateButtonState();
  });

  const start = () => {
    installWorkspaceScroll();
    installControls();
    updateButtonState();
    observer.observe(document.documentElement, {childList:true, subtree:true});
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, {once:true});
  } else {
    start();
  }

  window.addEventListener('resize', updateButtonState, {passive:true});
  window.addEventListener('scroll', updateButtonState, {passive:true});
})();
