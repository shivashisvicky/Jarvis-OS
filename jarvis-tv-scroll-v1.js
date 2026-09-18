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
    document.body.style.overflowY = 'auto';
    const os = document.querySelector('.os');
    if (os) {
      os.style.height = 'auto';
      os.style.minHeight = '100vh';
      os.style.overflow = 'visible';
    }
    const main = document.querySelector('.os-main');
    if (main) {
      main.style.minHeight = 'auto';
    }
    w.style.overflow = 'visible';
    w.style.minHeight = '0';
    w.style.height = 'auto';
    w.style.touchAction = 'pan-y';
    w.style.scrollBehavior = 'auto';
    w.style.webkitOverflowScrolling = 'auto';
  };

  const move = (delta, absolute) => {
    const s = pageScroll();
    if (!s || s.scrollHeight <= window.innerHeight + 2) return false;
    if (absolute === 'top') s.scrollTop = 0;
    else if (absolute === 'bottom') s.scrollTop = s.scrollHeight;
    else s.scrollTop = Math.max(0, Math.min(s.scrollHeight - window.innerHeight, s.scrollTop + delta));
    return true;
  };

  document.addEventListener('keydown', e => {
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
  }, true);

  document.addEventListener('wheel', e => {
    if (!isTvBrowser()) return;
    const s = pageScroll();
    if (!s || s.scrollHeight <= window.innerHeight + 2) return;
    if (Math.abs(e.deltaY) < 1) return;
    s.scrollTop = Math.max(0, Math.min(s.scrollHeight - window.innerHeight, s.scrollTop + e.deltaY));
    e.preventDefault();
  }, {capture:true, passive:false});

  new MutationObserver(apply).observe(document.documentElement, {childList:true, subtree:true});
  apply();
})();
