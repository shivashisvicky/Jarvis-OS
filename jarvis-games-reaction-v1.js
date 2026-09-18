(() => {
  'use strict';
  if (window.__JARVIS_GAMES_REACTION_V1__) return;
  window.__JARVIS_GAMES_REACTION_V1__ = true;

  const STYLE_ID = 'jarvis-games-reaction-v1-style';
  const BEST_KEY = 'jarvis-reaction-best-v1';

  const addStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .reaction-v1{display:grid;gap:10px;justify-items:center}
      .reaction-v1-panel{width:min(100%,340px);min-height:180px;display:grid;place-items:center;border:1px solid #173b4d;border-radius:16px;background:radial-gradient(circle at 50% 42%,rgba(53,201,239,.08),transparent 48%),#02070a;overflow:hidden}
      .reaction-v1-target{width:min(42vw,120px);height:min(42vw,120px);max-width:120px;max-height:120px;border-radius:50%;border:2px solid #21495b;background:#071923;color:#7894a0;font-weight:900;letter-spacing:.08em;cursor:pointer;touch-action:manipulation}
      .reaction-v1-target.ready{border-color:#71ddff;background:#0b3140;color:#e4fbff;box-shadow:0 0 34px rgba(53,201,239,.3)}
      .reaction-v1-target.result{border-color:#f0c45c;color:#f0c45c}
      .reaction-v1-state{text-align:center;color:#7894a0;font-size:.78rem;letter-spacing:.07em;min-height:18px}
      .reaction-v1-hud{width:min(100%,340px);display:grid;grid-template-columns:1fr 1fr;gap:6px}
      .reaction-v1-hud b{padding:7px 6px;text-align:center;border:1px solid #173b4d;border-radius:9px;background:#071923;color:#71ddff;font-size:.74rem}
      .reaction-v1-start{min-width:150px}
    `;
    document.head.appendChild(style);
  };

  const install = () => {
    const card = document.getElementById('jarvisReactionGame');
    if (!card || card.dataset.reactionV1 === '1') return false;
    card.dataset.reactionV1 = '1';
    addStyle();

    const panel = card.querySelector('#reactionPanel');
    const target = card.querySelector('#reactionTarget');
    const state = card.querySelector('#reactionState');
    const score = card.querySelector('#reactionScore');
    const bestEl = card.querySelector('#reactionBest');
    const start = card.querySelector('#reactionStart');
    if (!panel || !target || !state || !score || !bestEl || !start) return false;

    let best = Number(localStorage.getItem(BEST_KEY) || 0);
    let timer = 0, startedAt = 0, phase = 'idle';

    const syncBest = () => { bestEl.textContent = `BEST ${best ? best + 'MS' : '---'}`; };
    const resetTarget = () => {
      target.className = 'reaction-v1-target';
      target.textContent = 'WAIT';
    };
    const finish = ms => {
      phase = 'result';
      clearTimeout(timer);
      score.textContent = `LAST ${ms}MS`;
      if (!best || ms < best) {
        best = ms;
        localStorage.setItem(BEST_KEY, String(best));
      }
      syncBest();
      state.textContent = 'REACTION CAPTURED · RUN AGAIN';
      target.className = 'reaction-v1-target result';
      target.textContent = `${ms}MS`;
    };
    const startRun = () => {
      clearTimeout(timer);
      phase = 'waiting';
      score.textContent = 'LAST ---';
      state.textContent = 'WAIT FOR THE SIGNAL';
      resetTarget();
      const delay = 650 + Math.floor(Math.random() * 1150);
      timer = setTimeout(() => {
        phase = 'ready';
        startedAt = performance.now();
        state.textContent = 'NOW · TAP';
        target.className = 'reaction-v1-target ready';
        target.textContent = 'TAP';
      }, delay);
    };
    const tap = () => {
      if (phase === 'ready') {
        finish(Math.max(1, Math.round(performance.now() - startedAt)));
      } else if (phase === 'waiting') {
        clearTimeout(timer);
        phase = 'result';
        score.textContent = 'LAST ---';
        state.textContent = 'TOO EARLY · TRY AGAIN';
        target.className = 'reaction-v1-target result';
        target.textContent = 'EARLY';
      }
    };

    target.addEventListener('pointerdown', tap, {passive:true});
    start.addEventListener('click', startRun);
    syncBest();
    resetTarget();
    state.textContent = 'PRESS START TO TEST';
    return true;
  };

  const scan = () => {
    if (document.querySelector('.workspace h1')?.textContent?.trim() !== 'Games') return;
    install();
  };
  const observer = new MutationObserver(scan);
  observer.observe(document.body, {childList:true, subtree:true});
  scan();
})();
