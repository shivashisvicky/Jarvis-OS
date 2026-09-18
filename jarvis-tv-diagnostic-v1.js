(() => {
  'use strict';
  if (!/[?&]tvdebug=1(?:&|$)/i.test(location.search)) return;
  if (window.__JARVIS_TV_DEBUG_V1__) return;
  window.__JARVIS_TV_DEBUG_V1__ = true;

  const panel = document.createElement('div');
  panel.id = 'jarvisTvDebug';
  panel.style.cssText = 'position:fixed;z-index:2147483647;left:12px;right:12px;top:12px;max-height:72vh;overflow:auto;background:#06131a;color:#dff8ff;border:2px solid #36d9ff;border-radius:12px;padding:12px;font:14px monospace;box-shadow:0 8px 30px #000;';
  panel.innerHTML = '<b>JARVIS TV DIAGNOSTIC</b><button id="jtvDbgClear" style="float:right">CLEAR</button><pre id="jtvDbgLog" style="white-space:pre-wrap;word-break:break-word;margin:10px 0 0"></pre>';
  document.body.appendChild(panel);
  const log = document.getElementById('jtvDbgLog');
  const add = (name, extra={}) => {
    const s = document.scrollingElement || document.documentElement;
    const w = document.querySelector('.workspace');
    const a = document.activeElement;
    const line = JSON.stringify({
      event:name,
      key:extra.key,
      keyCode:extra.keyCode,
      button:extra.button,
      deltaY:extra.deltaY,
      defaultPrevented:extra.defaultPrevented,
      active:a?.tagName + (a?.id ? '#'+a.id : '') + (a?.className ? '.'+String(a.className).split(' ')[0] : ''),
      windowY:window.scrollY,
      docTop:s?.scrollTop,
      docH:s?.scrollHeight,
      winH:window.innerHeight,
      workspaceTop:w?.scrollTop,
      workspaceH:w?.scrollHeight,
      workspaceClient:w?.clientHeight,
      ua:navigator.userAgent
    });
    log.textContent += line + '\n';
    log.scrollTop = log.scrollHeight;
  };
  document.getElementById('jtvDbgClear').onclick=()=>log.textContent='';
  add('BOOT');

  ['keydown','keyup','keypress'].forEach(type => window.addEventListener(type,e => add(type,e), true));
  ['wheel','pointerdown','pointerup','click','touchstart','touchend'].forEach(type => window.addEventListener(type,e => add(type,e), true));
  window.addEventListener('scroll',e=>add('WINDOW_SCROLL'),true);
  document.addEventListener('focusin',e=>add('FOCUSIN'),true);

  setInterval(()=>add('HEARTBEAT'),1000);
})();