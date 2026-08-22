(() => {
  'use strict';
  if (window.__JARVIS_GAMES_MOBILE_FIX__) return;
  window.__JARVIS_GAMES_MOBILE_FIX__ = true;
  const isTouch = matchMedia('(pointer: coarse)').matches || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const dispatchKey = key => window.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, bubbles: true, cancelable: true }));
  const style = document.createElement('style');
  style.textContent = `.jarvis-game-pad{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(2,42px);gap:6px;justify-content:center;margin:10px auto 0}.jarvis-game-pad button{width:48px;height:42px;padding:0;font-size:18px;touch-action:manipulation;-webkit-tap-highlight-color:transparent}.jarvis-game-pad .wide{grid-column:1 / -1;width:100%;font-size:11px;letter-spacing:.08em}.jarvis-tetris-paused{opacity:.78}`;
  document.head.appendChild(style);
  let tetrisPrimed = false, tetrisStarted = false;
  const add2048Pad = () => {
    const board = document.querySelector('#twoBoard');
    if (!board || document.querySelector('#jarvis2048Pad')) return;
    const pad = document.createElement('div'); pad.id='jarvis2048Pad'; pad.className='jarvis-game-pad';
    pad.innerHTML='<span></span><button type="button" data-dir="ArrowUp">▲</button><span></span><button type="button" data-dir="ArrowLeft">◀</button><button type="button" data-dir="ArrowDown">▼</button><button type="button" data-dir="ArrowRight">▶</button>';
    board.parentElement?.appendChild(pad);
    pad.querySelectorAll('button').forEach(button=>{const run=e=>{e.preventDefault();dispatchKey(button.dataset.dir)};button.addEventListener('pointerdown',run,{passive:false});});
  };
  const primeTetris = () => {
    const board=document.querySelector('#tetBoard'), reset=document.querySelector('#tetReset'); if(!board||!reset||tetrisPrimed)return; tetrisPrimed=true;
    window.setTimeout(()=>{if(!tetrisStarted)dispatchKey('p')},0);
    const controls=document.createElement('div'); controls.id='jarvisTetrisControls'; controls.className='jarvis-game-pad jarvis-tetris-paused';
    controls.innerHTML='<button type="button" data-key="ArrowLeft">◀</button><button type="button" data-key="ArrowUp">↻</button><button type="button" data-key="ArrowRight">▶</button><button type="button" data-key="ArrowDown">▼</button><button type="button" class="wide" id="jarvisTetrisStart">START / PAUSE</button>';
    board.parentElement?.appendChild(controls);
    controls.querySelectorAll('[data-key]').forEach(button=>{const run=e=>{e.preventDefault();dispatchKey(button.dataset.key)};button.addEventListener('pointerdown',run,{passive:false});});
    controls.querySelector('#jarvisTetrisStart')?.addEventListener('pointerdown',e=>{e.preventDefault();dispatchKey('p');tetrisStarted=!tetrisStarted;controls.classList.toggle('jarvis-tetris-paused',!tetrisStarted)},{passive:false});
    reset.addEventListener('click',()=>{tetrisStarted=false;controls.classList.add('jarvis-tetris-paused');window.setTimeout(()=>dispatchKey('p'),0)});
  };
  const scan=()=>{if(isTouch)add2048Pad();primeTetris()}; new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true}); scan();
})();
