(() => {
  'use strict';
  if (window.__JARVIS_TV_SCROLL_V1__) return;
  window.__JARVIS_TV_SCROLL_V1__ = true;

  const isTvBrowser = () => {
    const ua = String(navigator.userAgent || '');
    const tvToken = /(bravia|smart[- ]?tv|hbbtv|android tv|googletv|google tv|aft[abms]|netcast|web0s|viera|tizen tv)/i.test(ua);
    const jioLarge = /jiobrowser/i.test(ua) && Math.max(screen.width || 0, screen.height || 0) >= 1200;
    return tvToken || jioLarge;
  };

  const workspace = () => document.querySelector('.workspace');
  const isEditable = el => el instanceof Element && el.matches('input,textarea,select,[contenteditable="true"]');
  const inGame = el => el instanceof Element && el.closest('.game-card');

  const apply = () => {
    if (!isTvBrowser()) return;
    document.documentElement.classList.add('jarvis-tv-scroll-mode');
    document.body.classList.add('jarvis-tv-scroll-mode');
    const w = workspace();
    if (!w) return;
    w.style.overflowY = 'auto';
    w.style.overflowX = 'hidden';
    w.style.touchAction = 'pan-y';
    w.style.scrollBehavior = 'auto';
    w.style.webkitOverflowScrolling = 'auto';
  };

  const move = (delta, absolute) => {
    const w = workspace();
    if (!w || w.scrollHeight <= w.clientHeight + 2) return false;
    if (absolute === 'top') w.scrollTop = 0;
    else if (absolute === 'bottom') w.scrollTop = w.scrollHeight;
    else w.scrollTop = Math.max(0, Math.min(w.scrollHeight - w.clientHeight, w.scrollTop + delta));
    return true;
  };

  document.addEventListener('keydown', e => {
    if (!isTvBrowser() || e.defaultPrevented) return;
    if (!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key)) return;
    const target = e.target instanceof Element ? e.target : document.activeElement;
    if (isEditable(target) || inGame(target)) return;
    const w = workspace();
    if (!w || w.scrollHeight <= w.clientHeight + 2) return;

    const step = Math.max(220, Math.floor(w.clientHeight * 0.55));
    const handled =
      e.key === 'ArrowDown' ? move(step) :
      e.key === 'ArrowUp' ? move(-step) :
      e.key === 'PageDown' ? move(Math.floor(w.clientHeight * 0.9)) :
      e.key === 'PageUp' ? move(-Math.floor(w.clientHeight * 0.9)) :
      e.key === 'Home' ? move(0, 'top') :
      move(0, 'bottom');

    if (handled) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  document.addEventListener('wheel', e => {
    if (!isTvBrowser()) return;
    const w = workspace();
    if (!w || w.scrollHeight <= w.clientHeight + 2) return;
    const target = e.target instanceof Element ? e.target : null;
    if (target && !w.contains(target)) return;
    if (Math.abs(e.deltaY) < 1) return;
    w.scrollTop = Math.max(0, Math.min(w.scrollHeight - w.clientHeight, w.scrollTop + e.deltaY));
    e.preventDefault();
  }, {capture:true, passive:false});

  new MutationObserver(apply).observe(document.documentElement, {childList:true, subtree:true});
  apply();
})();
