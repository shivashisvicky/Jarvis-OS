(() => {
  'use strict';
  if (window.__JARVIS_GAMES_2048_V2__) return;
  window.__JARVIS_GAMES_2048_V2__ = true;

  const STYLE_ID = 'jarvis-games-2048-v2-style';
  const BEST_KEY = 'jarvis-2048-best-v2';

  const addStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = `
      .game-card.two-v2-card{grid-column:1 / -1}.two-v2-shell{display:grid;gap:9px;justify-items:center;width:100%}
      .two-v2-hud{width:min(100%,340px);display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .two-v2-hud b{padding:7px 6px;text-align:center;border:1px solid #173b4d;border-radius:9px;background:#071923;color:#71ddff;font-size:.74rem;letter-spacing:.04em}
      .two-v2-state{min-height:18px;text-align:center;color:#7894a0;font-size:.76rem;letter-spacing:.06em}
      .two-v2-shell .board2048{width:min(100%,340px);max-width:340px;gap:6px;padding:7px;border:1px solid #173b4d;border-radius:14px;background:#02070a;touch-action:none;user-select:none}
      .two-v2-shell .board2048 b{background:#10212b;border:1px solid #173b4d;min-width:0;font-size:clamp(15px,5vw,21px);font-weight:900}
      .two-v2-controls{display:grid;grid-template-columns:repeat(3,48px);gap:6px;justify-content:center}
      .two-v2-controls button{width:48px;height:42px;padding:0;font-size:16px}
      .two-v2-controls .blank{visibility:hidden}
      @media(max-width:600px){
        .two-v2-shell .board2048{width:min(100%,340px)}
        .two-v2-controls{grid-template-columns:repeat(3,52px)}
        .two-v2-controls button{width:52px;height:46px}
      }
    `;
    document.head.appendChild(s);
  };

  const install = () => {
    const board = document.getElementById('twoBoard');
    const wrap = board?.closest('.game-card');
    const score = document.getElementById('twoScore');
    const reset = document.getElementById('twoReset');
    if (!board || !wrap || !score || !reset || wrap.dataset.twoV2 === '1') return false;

    wrap.dataset.twoV2 = '1';
    addStyle();
    wrap.classList.add('two-v2-shell','two-v2-card');

    const hud = document.createElement('div');
    hud.className = 'two-v2-hud';
    hud.innerHTML = '<b id="twoV2Score">SCORE 0</b><b id="twoV2Best">BEST 0</b>';
    const state = document.createElement('div');
    state.id = 'twoV2State';
    state.className = 'two-v2-state';
    state.textContent = 'READY · MERGE TILES';

    const controls = document.createElement('div');
    controls.className = 'two-v2-controls';
    controls.innerHTML = '<button class="blank" type="button">·</button><button data-two="U" type="button">▲</button><button class="blank" type="button">·</button><button data-two="L" type="button">◀</button><button data-two="D" type="button">▼</button><button data-two="R" type="button">▶</button>';

    score.style.display = 'none';
    board.parentElement?.insertBefore(hud, board);
    board.parentElement?.insertBefore(state, board);
    board.parentElement?.appendChild(controls);

    let best = Number(localStorage.getItem(BEST_KEY) || 0);
    const scoreHud = hud.querySelector('#twoV2Score');
    const bestHud = hud.querySelector('#twoV2Best');
    const sync = () => {
      const raw = score.textContent || 'SCORE 0';
      const match = raw.match(/SCORE\s+(\d+)/);
      const value = match ? Number(match[1]) : 0;
      if (value > best) {
        best = value;
        localStorage.setItem(BEST_KEY, String(best));
      }
      scoreHud.textContent = `SCORE ${value}`;
      bestHud.textContent = `BEST ${best}`;
      state.textContent = /GAME OVER/.test(raw) ? 'GAME OVER · NEW GAME' : 'PLAYING · MERGE';
    };
    sync();

    const observer = new MutationObserver(sync);
    observer.observe(score, {childList:true, characterData:true, subtree:true});

    const dispatch = key => window.dispatchEvent(new KeyboardEvent('keydown', {key, code:key, bubbles:true, cancelable:true}));
    controls.querySelectorAll('[data-two]').forEach(btn => btn.addEventListener('pointerdown', () => dispatch(({U:'ArrowUp',D:'ArrowDown',L:'ArrowLeft',R:'ArrowRight'})[btn.dataset.two]), {passive:true}));

    let sx=0,sy=0,tracking=false;
    board.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      sx=e.clientX; sy=e.clientY; tracking=true;
    }, {passive:true});
    board.addEventListener('pointerup', e => {
      if (!tracking) return;
      tracking=false;
      const dx=e.clientX-sx, dy=e.clientY-sy;
      if (Math.max(Math.abs(dx),Math.abs(dy))<20) return;
      dispatch(Math.abs(dx)>Math.abs(dy) ? (dx>0?'ArrowRight':'ArrowLeft') : (dy>0?'ArrowDown':'ArrowUp'));
    }, {passive:true});

    reset.addEventListener('click', () => {
      state.textContent='PLAYING · MERGE';
      sync();
    }, {passive:true});
    return true;
  };

  const scan = () => {
    if (document.querySelector('.workspace h1')?.textContent?.trim() !== 'Games') return;
    install();
  };
  new MutationObserver(scan).observe(document.body, {childList:true, subtree:true});
  addStyle();
  scan();
})();
