(()=>{
'use strict';
if(window.__JARVIS_MOBILE_CONTROLS_V1__)return;window.__JARVIS_MOBILE_CONTROLS_V1__=1;
const install=()=>{const c=document.querySelector('#snakeCanvas');if(!c||c.dataset.jarvisMobilePad==='1')return;const host=c.parentElement;if(!host)return;c.dataset.jarvisMobilePad='1';const p=document.createElement('div');p.className='snake-pad';p.innerHTML='<button class="blank">·</button><button data-d="up">▲</button><button class="blank">·</button><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button>';host.appendChild(p);const keys={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};p.querySelectorAll('[data-d]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();window.dispatchEvent(new KeyboardEvent('keydown',{key:keys[b.dataset.d]}))},{passive:false}))};new MutationObserver(install).observe(document.body,{childList:true,subtree:true});install();
})();
