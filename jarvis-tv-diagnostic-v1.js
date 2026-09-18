(() => {
  'use strict';
  if (!/[?&]tvdebug=1(?:&|$)/i.test(location.search)) return;
  if (window.__JARVIS_TV_DEBUG_V2__) return;
  window.__JARVIS_TV_DEBUG_V2__ = true;

  const panel = document.createElement('div');
  panel.id = 'jarvisTvDebug';
  panel.style.cssText = 'position:fixed;z-index:2147483647;left:12px;right:12px;top:12px;max-height:72vh;overflow:auto;background:#06131a;color:#dff8ff;border:2px solid #36d9ff;border-radius:12px;padding:12px;font:14px monospace;box-shadow:0 8px 30px #000;';
  panel.innerHTML = '<b>JARVIS TV POINTER DIAGNOSTIC</b><button id="jtvDbgClear" style="float:right">CLEAR</button><pre id="jtvDbgLog" style="white-space:pre-wrap;word-break:break-word;margin:10px 0 0"></pre>';
  document.body.appendChild(panel);

  const log = document.getElementById('jtvDbgLog');
  const lines = [];
  const add = (event, data = {}) => {
    lines.push(JSON.stringify({event, ...data}));
    if (lines.length > 24) lines.shift();
    log.textContent = lines.join('\n') + '\n';
    log.scrollTop = log.scrollHeight;
  };
  document.getElementById('jtvDbgClear').onclick = () => {
    lines.length = 0;
    log.textContent = '';
  };

  add('BOOT');

  let last = null;
  let lastLogAt = 0;

  window.addEventListener('pointermove', e => {
    const now = Date.now();
    if (now - lastLogAt < 150) return;
    lastLogAt = now;

    const x = Number.isFinite(e.clientX) ? Math.round(e.clientX) : null;
    const y = Number.isFinite(e.clientY) ? Math.round(e.clientY) : null;
    const dx = x == null || last == null ? null : x - last.x;
    const dy = y == null || last == null ? null : y - last.y;
    const direction =
      dx == null || dy == null ? 'INITIAL' :
      Math.abs(dx) >= Math.abs(dy)
        ? (dx > 0 ? 'RIGHT' : dx < 0 ? 'LEFT' : 'NONE')
        : (dy > 0 ? 'DOWN' : dy < 0 ? 'UP' : 'NONE');

    last = {x, y};
    add('POINTERMOVE', {x, y, dx, dy, direction});
  }, true);

  window.addEventListener('keydown', e => {
    const k = String(e.key || '');
    if (/Arrow|Page|Home|End/i.test(k) || [33,34,35,36,37,38,39,40].includes(Number(e.keyCode))) {
      add('KEYDOWN', {key:k, keyCode:Number(e.keyCode || 0), defaultPrevented:e.defaultPrevented});
    }
  }, true);

  window.addEventListener('scroll', () => {
    const s = document.scrollingElement || document.documentElement;
    add('SCROLL', {windowY:Math.round(window.scrollY || 0), docTop:Math.round(s?.scrollTop || 0)});
  }, true);
})();