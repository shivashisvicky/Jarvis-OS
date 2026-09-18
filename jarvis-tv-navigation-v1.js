(() => {
  'use strict';
  if (window.__JARVIS_TV_NAVIGATION_V1__) return;
  window.__JARVIS_TV_NAVIGATION_V1__ = true;

  const workspace = () => document.querySelector('.workspace');
  const isEditable = el => {
    if (!(el instanceof HTMLElement)) return false;
    return el.matches('textarea,select,[contenteditable="true"]') || (el.matches('input') && el.type !== 'text' && el.type !== 'search');
  };
  const inGame = el => !!(el instanceof Element && el.closest('.arcade,.game-card'));

  const focusables = () => Array.from(document.querySelectorAll(
    '.os button:not([disabled]), .os a[href], .os input:not([disabled]), .os select:not([disabled]), .os textarea:not([disabled]), .os [tabindex="0"]'
  )).filter(el => {
    if (!(el instanceof HTMLElement)) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  });

  const spatialMove = direction => {
    const all = focusables();
    if (!all.length) return false;
    const current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const cr = current?.getBoundingClientRect();
    const origin = cr || {left:window.innerWidth/2, right:window.innerWidth/2, top:window.innerHeight/2, bottom:window.innerHeight/2, width:0, height:0};
    const cx = (origin.left + origin.right) / 2, cy = (origin.top + origin.bottom) / 2;
    const candidates = all.filter(el => el !== current).map(el => {
      const r = el.getBoundingClientRect();
      const x = (r.left+r.right)/2, y=(r.top+r.bottom)/2;
      const dx=x-cx, dy=y-cy;
      const primary = direction==='left' ? -dx : direction==='right' ? dx : direction==='up' ? -dy : dy;
      const secondary = direction==='left'||direction==='right' ? Math.abs(dy) : Math.abs(dx);
      return {el,r,primary,secondary,distance:Math.hypot(dx,dy)};
    }).filter(x => x.primary > 6)
      .sort((a,b) => (a.secondary-b.secondary)*3 + a.distance-b.distance);
    const next = candidates[0]?.el;
    if (!next) return false;
    next.focus({preventScroll:true});
    next.scrollIntoView({behavior:'auto',block:'nearest',inline:'nearest'});
    return true;
  };

  const scrollPage = direction => {
    const step = Math.max(180, Math.floor(window.innerHeight * .45));
    if (direction==='down') window.scrollBy(0, step);
    else if (direction==='up') window.scrollBy(0, -step);
    else return false;
    return true;
  };

  window.addEventListener('keydown', e => {
    if (e.defaultPrevented) return;
    const raw = String(e.key || '').toLowerCase();
    const keyCode = Number(e.keyCode || 0);
    const key = raw==='left'||keyCode===37 ? 'left' :
      raw==='right'||keyCode===39 ? 'right' :
      raw==='up'||keyCode===38 ? 'up' :
      raw==='down'||keyCode===40 ? 'down' : '';
    if (!key) return;

    const target = e.target instanceof Element ? e.target : document.activeElement;
    if (isEditable(target)) return;

    let handled = spatialMove(key);
    if (!handled && (key==='down'||key==='up')) handled = scrollPage(key);
    if (handled) {
      e.preventDefault();
      e.stopImmediatePropagation();
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
