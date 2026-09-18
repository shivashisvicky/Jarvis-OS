(() => {
  'use strict';
  if (window.__JARVIS_TV_NAVIGATION_V1__) return;
  window.__JARVIS_TV_NAVIGATION_V1__ = true;

  const workspace = () => document.querySelector('.workspace');
  const isEditable = el => {
    if (!(el instanceof HTMLElement)) return false;
    return el.matches('input,textarea,select,[contenteditable="true"]');
  };
  const inGame = el => !!(el instanceof Element && el.closest('.arcade,.game-card'));

  document.addEventListener('keydown', e => {
    if (e.defaultPrevented) return;
    if (!['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key)) return;

    const target = e.target instanceof Element ? e.target : document.activeElement;
    if (isEditable(target) || inGame(target)) return;

    const w = workspace();
    if (!w || w.scrollHeight <= w.clientHeight + 2) return;

    let handled = true;
    const step = Math.max(180, Math.floor(w.clientHeight * 0.42));
    if (e.key === 'ArrowDown') w.scrollBy({top:72,behavior:'smooth'});
    else if (e.key === 'ArrowUp') w.scrollBy({top:-72,behavior:'smooth'});
    else if (e.key === 'PageDown') w.scrollBy({top:Math.floor(w.clientHeight * 0.82),behavior:'smooth'});
    else if (e.key === 'PageUp') w.scrollBy({top:-Math.floor(w.clientHeight * 0.82),behavior:'smooth'});
    else if (e.key === 'Home') w.scrollTo({top:0,behavior:'smooth'});
    else if (e.key === 'End') w.scrollTo({top:w.scrollHeight,behavior:'smooth'});
    else handled = false;

    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  document.addEventListener('focusin', e => {
    const el = e.target;
    if (!(el instanceof HTMLElement) || !el.matches('input,textarea,select')) return;
    const w = workspace();
    if (!w || !w.contains(el)) return;
    requestAnimationFrame(() => {
      const r = el.getBoundingClientRect(), wr = w.getBoundingClientRect();
      if (r.top < wr.top + 24 || r.bottom > wr.bottom - 24) {
        el.scrollIntoView({behavior:'smooth',block:'center',inline:'nearest'});
      }
    });
  });
})();
