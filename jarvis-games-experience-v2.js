(() => {
  'use strict';
  if (window.__JARVIS_GAMES_EXPERIENCE_V2__) return;
  window.__JARVIS_GAMES_EXPERIENCE_V2__ = true;

  const STYLE_ID = 'jarvis-games-experience-v2-style';

  const addStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .arcade.g2-ready{gap:20px}
      .g2-feature{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr);gap:22px;align-items:stretch;padding:24px;border:1px solid #24536a;border-radius:24px;background:radial-gradient(circle at 80% 15%,rgba(53,201,239,.13),transparent 35%),linear-gradient(145deg,rgba(8,29,40,.98),rgba(2,10,16,.98));box-shadow:0 18px 55px rgba(0,0,0,.2)}
      .g2-feature:after{content:'';position:absolute;inset:auto -80px -110px auto;width:260px;height:260px;border:1px solid rgba(113,221,255,.12);border-radius:50%;box-shadow:0 0 0 32px rgba(113,221,255,.025),0 0 0 64px rgba(113,221,255,.018);pointer-events:none}
      .g2-kicker{margin:0 0 8px;color:#71ddff;font-size:.72rem;letter-spacing:.16em;font-weight:800}
      .g2-feature h2{margin:0;font-size:clamp(1.7rem,4vw,2.7rem);letter-spacing:-.03em}
      .g2-copy{max-width:620px;color:#91aab5;margin:10px 0 18px;line-height:1.55}
      .g2-meta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
      .g2-chip{border:1px solid #21495b;border-radius:999px;padding:6px 9px;color:#9ec5d2;background:rgba(3,13,20,.65);font-size:.72rem}
      .g2-play{border:1px solid #71ddff!important;background:#0a2632!important;color:#e4fbff!important;border-radius:12px!important;padding:11px 15px!important;font-weight:800!important;box-shadow:0 8px 24px rgba(53,201,239,.12)}
      .g2-feature-board{display:grid;place-items:center;min-height:210px;border:1px solid #173b4d;border-radius:18px;background:rgba(1,7,11,.68);padding:18px}
      .g2-feature-board .g2-grid{display:grid;grid-template-columns:repeat(6,14px);grid-auto-rows:14px;gap:3px;transform:rotate(-4deg);opacity:.95}
      .g2-feature-board i{display:block;width:14px;height:14px;border-radius:3px;background:#10232c}
      .g2-feature-board i.on{background:#35c9ef;box-shadow:0 0 10px rgba(53,201,239,.24)}
      .g2-feature-board i.gold{background:#f0c45c;box-shadow:0 0 10px rgba(240,196,92,.2)}
      .arcade-grid.g2-grid-layout{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
      .arcade-grid.g2-grid-layout .game-card.g2-tetris-card{grid-column:1 / -1;border-color:#24536a}
      .game-card.g2-tetris-card{box-shadow:0 16px 48px rgba(0,0,0,.22)}
      .game-card.g2-secondary{opacity:.96}
      .g2-section-label{grid-column:1 / -1;margin:4px 2px -2px;color:#6f8994;font-size:.7rem;letter-spacing:.14em;font-weight:800}
      @media(max-width:760px){
        .g2-feature{grid-template-columns:1fr;padding:20px}
        .g2-feature-board{min-height:150px}
        .arcade-grid.g2-grid-layout{grid-template-columns:1fr}
        .arcade-grid.g2-grid-layout .game-card.g2-tetris-card{grid-column:auto}
        .g2-section-label{grid-column:auto}
      }
    `;
    document.head.appendChild(style);
  };

  const enhance = () => {
    const arcade = document.querySelector('.arcade');
    const grid = arcade?.querySelector('.arcade-grid');
    const tetris = document.querySelector('#tetrisGame')?.closest('.game-card');
    if (!arcade || !grid || !tetris || document.getElementById('games-experience-v2')) return false;

    addStyle();
    arcade.classList.add('g2-ready');
    grid.classList.add('g2-grid-layout');
    tetris.classList.add('g2-tetris-card');

    const feature = document.createElement('section');
    feature.id = 'games-experience-v2';
    feature.className = 'g2-feature';
    feature.innerHTML = `
      <div>
        <p class="g2-kicker">JARVIS ARCADE // FEATURED</p>
        <h2>TETRIS</h2>
        <p class="g2-copy">The classic drop zone, now with a proper JARVIS launch bay. Start a clean run, chase your score, and keep the board in view while the rest of the arcade stays one tap away.</p>
        <div class="g2-meta"><span class="g2-chip">CLASSIC</span><span class="g2-chip">LOCAL SCORE</span><span class="g2-chip">TOUCH + KEYBOARD</span></div>
        <button id="games-feature-play" class="g2-play" type="button">PLAY TETRIS</button>
      </div>
      <div class="g2-feature-board" aria-hidden="true">
        <div class="g2-grid">
          ${Array.from({length:72},(_,i)=>`<i class="${[14,15,16,20,21,27,28,29,33,39,40,41,45,46,47,52,53,58,59,64,65].includes(i)?'on':[22,23,34,35,36,42,48,54,60].includes(i)?'gold':''}"></i>`).join('')}
        </div>
      </div>`;

    arcade.querySelector('.arcade-hero')?.insertAdjacentElement('afterend', feature);

    const label = document.createElement('div');
    label.className = 'g2-section-label';
    label.textContent = 'ALL GAMES // QUICK PLAY';
    grid.insertBefore(label, grid.firstChild);
    grid.appendChild(tetris);

    document.getElementById('games-feature-play')?.addEventListener('click', () => {
      const board = document.getElementById('tetrisGame');
      const reset = document.getElementById('tetReset');
      board?.scrollIntoView({behavior:'smooth', block:'center'});
      reset?.focus({preventScroll:true});
    });
    return true;
  };

  const tryEnhance = () => {
    try { return enhance(); } catch (error) { console.warn('[JARVIS games experience]', error); return false; }
  };

  if (!tryEnhance()) {
    const observer = new MutationObserver(() => {
      if (tryEnhance()) observer.disconnect();
    });
    observer.observe(document.body, {childList:true, subtree:true});
  }
})();
