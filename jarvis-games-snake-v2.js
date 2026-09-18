(() => {
  'use strict';
  if (window.__JARVIS_GAMES_SNAKE_V2__) return;
  window.__JARVIS_GAMES_SNAKE_V2__ = true;

  const STYLE_ID = 'jarvis-games-snake-v2-style';
  const BEST_KEY = 'jarvis-snake-best-v2';

  const addStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .snake-v2-shell{display:grid;gap:8px;justify-items:center;width:100%}
      .snake-v2-hud{width:min(100%,340px);display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .snake-v2-hud b{display:block;padding:7px 6px;text-align:center;border:1px solid #173b4d;border-radius:9px;background:linear-gradient(180deg,#0a202b,#071923);color:#71ddff;font-size:.74rem;letter-spacing:.04em}
      .snake-v2-state{min-height:18px;color:#7894a0;font-size:.78rem;text-align:center;letter-spacing:.06em}
      .snake-v2-shell{width:100%}
      .snake-v2-shell canvas{width:min(100%,340px);height:auto;aspect-ratio:1;image-rendering:pixelated;touch-action:none}
      .snake-v2-shell .dpad{grid-template-columns:repeat(3,52px);gap:7px}
      .snake-v2-shell .dpad button{width:52px;height:46px;font-size:17px}
      @media(max-width:600px){
        .snake-v2-shell canvas{width:min(100%,340px)}
        .snake-v2-shell .dpad{grid-template-columns:repeat(3,54px)}
        .snake-v2-shell .dpad button{width:54px;height:48px}
      }
    `;
    document.head.appendChild(style);
  };

  const install = () => {
    const canvas = document.querySelector('#snakeCanvas');
    const wrap = canvas?.closest('.snake-wrap');
    const scoreEl = document.querySelector('#snakeScore');
    if (!canvas || !wrap || !scoreEl || wrap.dataset.snakeV2 === '1') return false;

    wrap.dataset.snakeV2 = '1';
    wrap.classList.add('snake-v2-shell');

    const hud = document.createElement('div');
    hud.className = 'snake-v2-hud';
    hud.innerHTML = '<b id="snakeV2Score">SCORE 0</b><b id="snakeV2Best">BEST 0</b>';
    const state = document.createElement('div');
    state.id = 'snakeV2State';
    state.className = 'snake-v2-state';
    state.textContent = 'PLAYING · SURVIVE';
    canvas.parentElement?.insertBefore(hud, canvas);
    canvas.parentElement?.insertBefore(state, canvas.nextSibling);

    let best = Number(localStorage.getItem(BEST_KEY) || 0);
    const bestEl = hud.querySelector('#snakeV2Best');
    const scoreHud = hud.querySelector('#snakeV2Score');
    const sync = () => {
      const raw = scoreEl.textContent || 'SCORE 0';
      const match = raw.match(/SCORE\s+(\d+)/);
      const score = match ? Number(match[1]) : 0;
      if (score > best) {
        best = score;
        localStorage.setItem(BEST_KEY, String(best));
      }
      scoreHud.textContent = `SCORE ${score}`;
      bestEl.textContent = `BEST ${best}`;
      state.textContent = /GAME OVER/.test(raw) ? 'GAME OVER · NEW RUN' : 'PLAYING · SURVIVE';
    };
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(scoreEl, {childList:true, characterData:true, subtree:true});

    let sx=0, sy=0, tracking=false;
    const dispatch = key => window.dispatchEvent(new KeyboardEvent('keydown', {key, code:key, bubbles:true, cancelable:true}));
    const down = e => {
      if (e.pointerType === 'mouse') return;
      sx=e.clientX; sy=e.clientY; tracking=true;
    };
    const up = e => {
      if (!tracking) return;
      tracking=false;
      const dx=e.clientX-sx, dy=e.clientY-sy;
      if (Math.max(Math.abs(dx),Math.abs(dy)) < 18) return;
      if (Math.abs(dx) > Math.abs(dy)) dispatch(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
      else dispatch(dy > 0 ? 'ArrowDown' : 'ArrowUp');
    };
    const cancel = () => { tracking=false; };

    canvas.addEventListener('pointerdown', down, {passive:true});
    canvas.addEventListener('pointerup', up, {passive:true});
    canvas.addEventListener('pointercancel', cancel, {passive:true});

    const reset = document.querySelector('#snakeReset');
    reset?.addEventListener('click', () => { state.textContent='PLAYING · SURVIVE'; }, {passive:true});

    canvas.__jarvisSnakeV2Cleanup = () => {
      observer.disconnect();
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', cancel);
    };
    return true;
  };

  addStyle();
  const scan = () => {
    if (document.querySelector('.workspace h1')?.textContent?.trim() !== 'Games') return;
    install();
  };
  const observer = new MutationObserver(scan);
  observer.observe(document.body, {childList:true, subtree:true});
  scan();
})();