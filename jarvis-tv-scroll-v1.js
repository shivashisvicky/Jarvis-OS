(() => {
  'use strict';
  if (window.__JARVIS_TV_SCROLL_V1__) return;
  window.__JARVIS_TV_SCROLL_V1__ = true;

  const isTvBrowser = () => {
    const ua = String(navigator.userAgent || '');
    const tvToken = /(bravia|smart[- ]?tv|hbbtv|android tv|googletv|google tv|aft[abms]|netcast|web0s|viera|tizen tv)/i.test(ua);
    const jioBrowser = /jiobrowser/i.test(ua);
    const largeNonTouch = Math.max(screen.width || 0, screen.height || 0) >= 1200 && navigator.maxTouchPoints === 0;
    return tvToken || jioBrowser || largeNonTouch;
  };

  const workspace = () => document.querySelector('.workspace');
  const pageScroll = () => document.scrollingElement || document.documentElement;
  const isEditable = el => el instanceof Element && el.matches('input,textarea,select,[contenteditable="true"]');
  const inGame = el => el instanceof Element && el.closest('.game-card');

  const apply = () => {
    if (!isTvBrowser()) return;
    document.documentElement.classList.add('jarvis-tv-scroll-mode');
    document.body.classList.add('jarvis-tv-scroll-mode');
    const w = workspace();
    if (!w) return;
    // TV browsers get native document scrolling. The desktop/iOS/Android
    // internal workspace scroller remains untouched because this class is TV-only.
    document.documentElement.style.overflowY = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflowY = 'auto';
    document.body.style.height = 'auto';
    const app = document.querySelector('#app');
    if (app) {
      app.style.height = 'auto';
      app.style.minHeight = '100vh';
      app.style.overflow = 'visible';
    }
    const os = document.querySelector('.os');
    if (os) {
      os.style.height = 'auto';
      os.style.minHeight = '100vh';
      os.style.overflow = 'visible';
      os.style.display = 'block';
    }
    const main = document.querySelector('.os-main');
    if (main) {
      main.style.minHeight = '0';
      main.style.height = 'auto';
      main.style.display = 'grid';
      main.style.gridTemplateRows = 'auto';
    }
    w.style.overflow = 'visible';
    w.style.minHeight = '0';
    w.style.height = 'auto';
    w.style.maxHeight = 'none';
    w.style.touchAction = 'pan-y';
    w.style.scrollBehavior = 'auto';
    w.style.webkitOverflowScrolling = 'auto';
  };

  const move = (delta, absolute) => {
    const s = pageScroll();
    const max = Math.max(0, (s?.scrollHeight || document.documentElement.scrollHeight) - window.innerHeight);
    if (max <= 2) return false;
    const current = window.scrollY || s?.scrollTop || 0;
    const next = absolute === 'top' ? 0 : absolute === 'bottom' ? max : Math.max(0, Math.min(max, current + delta));
    window.scrollTo(0, next);
    if (Math.abs((window.scrollY || s?.scrollTop || 0) - next) > 2) {
      if (s) s.scrollTop = next;
    }
    return true;
  };




  const installTvLayout = () => {
    if (!isTvBrowser()) return;
    const styleId = 'jarvis-tv-scroll-v4-layout';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      html.jarvis-tv-scroll-mode,
      body.jarvis-tv-scroll-mode,
      body.jarvis-tv-scroll-mode #app { height:auto !important; min-height:100vh !important; overflow:visible !important; }
      body.jarvis-tv-scroll-mode .os { height:auto !important; min-height:100vh !important; overflow:visible !important; display:block !important; }
      body.jarvis-tv-scroll-mode .os-main { height:auto !important; min-height:0 !important; grid-template-rows:auto !important; }
      body.jarvis-tv-scroll-mode .workspace { height:auto !important; min-height:0 !important; max-height:none !important; overflow:visible !important; }
      body.jarvis-tv-scroll-mode .rail { height:auto !important; overflow:visible !important; }
    `;
    document.head.appendChild(style);
  };

  const installFocusDestinations = () => {
    const w = workspace();
    if (!w) return;
    w.querySelectorAll('.page-head,.panel,.module-card,.settings-card,.info-card').forEach(el => {
      if (!(el instanceof HTMLElement) || el.dataset.tvFocusBound === '1') return;
      el.dataset.tvFocusBound = '1';
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex','0');
    });
  };

  document.addEventListener('focusin', e => {
    if (!isTvBrowser()) return;
    const target = e.target instanceof Element ? e.target : null;
    const w = workspace();
    if (!target || !w || !w.contains(target)) return;
    if (target.closest('input,textarea,select,button,[contenteditable="true"]')) return;
    try {
      target.scrollIntoView({block:'center', inline:'nearest', behavior:'auto'});
    } catch {
      target.scrollIntoView();
    }
  }, true);

  document.addEventListener('keydown', e => {
    if (!isTvBrowser()) return;
    const rawKey = String(e.key || '').toLowerCase();
    const key = rawKey === 'down' ? 'ArrowDown' : rawKey === 'up' ? 'ArrowUp' : rawKey === 'left' ? 'ArrowLeft' : rawKey === 'right' ? 'ArrowRight' : rawKey;
    if (key !== 'ArrowDown' && key !== 'ArrowUp') return;
    if (e.defaultPrevented) return;
    const target = e.target instanceof Element ? e.target : document.activeElement;
    if (isEditable(target) || inGame(target)) return;
    const w = workspace();
    if (!w) return;
    const focusables = Array.from(w.querySelectorAll('[tabindex="0"]')).filter(el => el instanceof HTMLElement);
    if (!focusables.length) return;
    const y = (target instanceof Element ? target.getBoundingClientRect().top : window.innerHeight / 2);
    const candidates = focusables
      .map(el => ({el, r:el.getBoundingClientRect()}))
      .filter(x => key === 'ArrowDown' ? x.r.top > y + 8 : x.r.bottom < y - 8)
      .sort((a,b) => key === 'ArrowDown' ? a.r.top - b.r.top : b.r.bottom - a.r.bottom);
    const next = candidates[0]?.el;
    if (next) {
      e.preventDefault();
      next.focus({preventScroll:true});
      try { next.scrollIntoView({block:'center', inline:'nearest', behavior:'auto'}); } catch { next.scrollIntoView(); }
      e.stopImmediatePropagation();
    }
  }, false);
  const handleRemoteScroll = e => {
    if (!isTvBrowser() || e.defaultPrevented) return;
    const rawKey = String(e.key || '');
    const legacyKey = ({40:'ArrowDown',38:'ArrowUp',34:'PageDown',33:'PageUp',36:'Home',35:'End'})[e.keyCode];
    const key = ['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(rawKey) ? rawKey : legacyKey;
    if (!key) return;
    const target = e.target instanceof Element ? e.target : document.activeElement;
    if (isEditable(target) || inGame(target)) return;
    const s = pageScroll();
    if (!s || s.scrollHeight <= window.innerHeight + 2) return;

    const step = Math.max(220, Math.floor(window.innerHeight * 0.55));
    const handled =
      key === 'ArrowDown' ? move(step) :
      key === 'ArrowUp' ? move(-step) :
      key === 'PageDown' ? move(Math.floor(window.innerHeight * 0.9)) :
      key === 'PageUp' ? move(-Math.floor(window.innerHeight * 0.9)) :
      key === 'Home' ? move(0, 'top') :
      move(0, 'bottom');

    if (handled) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };

  window.addEventListener('keydown', handleRemoteScroll, true);
  window.addEventListener('keyup', handleRemoteScroll, true);

  document.addEventListener('wheel', e => {
    if (!isTvBrowser()) return;
    const s = pageScroll();
    if (!s || s.scrollHeight <= window.innerHeight + 2) return;
    if (Math.abs(e.deltaY) < 1) return;
    s.scrollTop = Math.max(0, Math.min(s.scrollHeight - window.innerHeight, s.scrollTop + e.deltaY));
    e.preventDefault();
  }, {capture:true, passive:false});

  new MutationObserver(() => { apply(); installTvLayout(); installFocusDestinations(); }).observe(document.documentElement, {childList:true, subtree:true});
  apply();
  installTvLayout();
  installFocusDestinations();
})();
