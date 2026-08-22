(() => {
  'use strict';
  if (window.__JARVIS_GAMES_MOBILE_FIX__) return;
  window.__JARVIS_GAMES_MOBILE_FIX__ = true;

  const isTouch = matchMedia('(pointer: coarse)').matches || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const dispatchKey = key => window.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));

  const style = document.createElement('style');
  style.textContent = `
    .jarvis-game-pad{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(2,42px);gap:6px;justify-content:center;margin:10px auto 0}
    .jarvis-game-pad button{width:48px;height:42px;padding:0;font-size:18px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .jarvis-game-pad .wide{grid-column:1 / -1;width:100%;font-size:11px;letter-spacing:.08em}
    .jarvis-tetris-start{display:flex;justify-content:center;margin-top:10px}
    .jarvis-tetris-start button{min-width:150px}
    .jarvis-tetris-paused{opacity:.78}
  `;
  document.head.appendChild(style);

  let tetrisPrimed = false;
  let tetrisStarted = false;

  const add2048Pad = () => {
    const board = document.querySelector('#twoBoard');
    if (!board || document.querySelector('#jarvis2048Pad')) return;
    const pad = document.createElement('div');
    pad.id = 'jarvis2048Pad';
    pad.className = 'jarvis-game-pad';
    pad.setAttribute('aria-label', '2048 touch controls');
    pad.innerHTML = '<span></span><button type="button" data-dir="ArrowUp" aria-label="Move up">▲</button><span></span><button type="button" data-dir="ArrowLeft" aria-label="Move left">◀</button><button type="button" data-dir="ArrowDown" aria-label="Move down">▼</button><button type="button" data-dir="ArrowRight" aria-label="Move right">▶</button>';
    board.parentElement?.appendChild(pad);
    pad.querySelectorAll('button').forEach(button => {
      const run = event => { event.preventDefault(); dispatchKey(button.dataset.dir); };
      button.addEventListener('pointerdown', run, { passive: false });
      button.addEventListener('touchstart', run, { passive: false });
    });
  };

  const primeTetris = () => {
    const board = document.querySelector('#tetBoard');
    const reset = document.querySelector('#tetReset');
    if (!board || !reset || tetrisPrimed) return;
    tetrisPrimed = true;

    // Tetris currently starts its gravity timer as soon as the game is rendered.
    // Put it into its existing pause state immediately so the player starts it.
    window.setTimeout(() => {
      if (!tetrisStarted) dispatchKey('p');
    }, 0);

    const controls = document.createElement('div');
    controls.id = 'jarvisTetrisControls';
    controls.className = 'jarvis-game-pad jarvis-tetris-paused';
    controls.innerHTML = '<button type="button" data-key="ArrowLeft" aria-label="Move left">◀</button><button type="button" data-key="ArrowUp" aria-label="Rotate">↻</button><button type="button" data-key="ArrowRight" aria-label="Move right">▶</button><button type="button" data-key="ArrowDown" aria-label="Soft drop">▼</button><button type="button" class="wide" id="jarvisTetrisStart">START / PAUSE</button>';
    board.parentElement?.appendChild(controls);

    controls.querySelectorAll('[data-key]').forEach(button => {
      const run = event => { event.preventDefault(); dispatchKey(button.dataset.key); };
      button.addEventListener('pointerdown', run, { passive: false });
      button.addEventListener('touchstart', run, { passive: false });
    });

    const start = controls.querySelector('#jarvisTetrisStart');
    start?.addEventListener('pointerdown', event => {
      event.preventDefault();
      dispatchKey('p');
      tetrisStarted = !tetrisStarted;
      controls.classList.toggle('jarvis-tetris-paused', !tetrisStarted);
    }, { passive: false });

    reset.addEventListener('click', () => {
      tetrisStarted = false;
      controls.classList.add('jarvis-tetris-paused');
      window.setTimeout(() => dispatchKey('p'), 0);
    });
  };

  const scan = () => {
    if (isTouch) add2048Pad();
    primeTetris();
  };

  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
