(()=>{
'use strict';
if(window.__JARVIS_MAP_HARD_OVERRIDE__)return;
window.__JARVIS_MAP_HARD_OVERRIDE__=true;

// LAST-LINE MAP AUTHORITY: canonical Bhubaneswar aliases must win before any
// competing map handler and must be restored if a late async geocoder writes
// an incorrect result into the DOM.
const A=[
 {k:/^jagannath\s+nagar$/i,n:'Jagannath Nagar',d:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
 {k:/^jagannath\s+nagar\s+(?:bhubaneswar|bbsr)$/i,n:'Jagannath Nagar',d:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
 {k:/^ggp\s+colony$/i,n:'GGP Colony',d:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',lat:20.2934,lon:85.8659},
 {k:/^maa\s+enclave$/i,n:'Maa Enclave',d:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',lat:20.2923,lon:85.8638},
 {k:/^jharapada$/i,n:'Jharapada',d:'Bhubaneswar, Odisha',lat:20.2910,lon:85.8680}
];
const norm=s=>String(s||'').replace(/^(?:please\s+)?(?:search|find|look up|show me|show|locate|open maps? for|take me to|take me|navigate me to|navigate to|directions? to|go to)\s+/i,'').replace(/\s+/g,' ').trim();
const hit=s=>A.find(a=>a.k.test(norm(s)))||null;
const nodes=()=>({input:document.querySelector('#mapQuery'),results:document.querySelector('#mapResults'),frame:document.querySelector('#mapFrame')});
const render=()=>{
 const {input,results,frame}=nodes();
 if(!(input instanceof HTMLInputElement)||!results||!frame)return false;
 const a=hit(input.value);if(!a)return false;
 const signature=`${a.n}|${a.lat}|${a.lon}`;
 if(input.dataset.jarvisCanonical!==signature||results.dataset.jarvisCanonical!==signature){
   input.dataset.jarvisCanonical=signature;
   results.dataset.jarvisCanonical=signature;
   results.innerHTML=`<div style="margin:7px 2px;color:var(--muted,#78939c);font-size:11px">1 LOCATION FOUND · JARVIS LOCAL AUTHORITY</div><button type="button" class="place-result" data-jarvis-canonical><strong>1. ${a.n}</strong><small>${a.d}</small></button>`;
   const d=.012,bbox=`${a.lon-d},${a.lat-d},${a.lon+d},${a.lat+d}`;
   frame.innerHTML=`<iframe title="JARVIS map for ${a.n}" loading="lazy" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${a.lat},${a.lon}`)}"></iframe>`;
 }
 return true;
};
const stopForCanonical=e=>{
 const {input}=nodes();
 if(!(input instanceof HTMLInputElement)||!hit(input.value))return;
 e.preventDefault();
 e.stopImmediatePropagation();
 render();
};
const reset=()=>{const {input}=nodes();if(input instanceof HTMLInputElement&&!hit(input.value))delete input.dataset.jarvisCanonical;};

// Window capture runs before document capture, preventing legacy map handlers
// from starting a competing search for canonical aliases.
window.addEventListener('input',e=>{const t=e.target;if(t instanceof HTMLInputElement&&t.id==='mapQuery')stopForCanonical(e)},true);
window.addEventListener('change',e=>{const t=e.target;if(t instanceof HTMLInputElement&&t.id==='mapQuery')stopForCanonical(e)},true);
window.addEventListener('click',e=>{const t=e.target instanceof Element?t.closest('#mapSearch'):null;if(t)stopForCanonical(e)},true);

document.addEventListener('input',()=>{reset();requestAnimationFrame(render)},true);
document.addEventListener('change',()=>requestAnimationFrame(render),true);
document.addEventListener('click',e=>{const t=e.target instanceof Element?t.closest('#mapSearch'):null;if(t){const {input}=nodes();if(input instanceof HTMLInputElement&&hit(input.value))return;render()}},true);

// Late async/provider writes are corrected immediately.
const protect=()=>{
 const {input,results,frame}=nodes();
 if(!(input instanceof HTMLInputElement)||!results||!frame)return;
 const a=hit(input.value);if(!a)return;
 const badText=/Gunupur|Rayagada|GUNUPUR|RAYAGADA/i.test(results.textContent||'');
 if(badText||results.dataset.jarvisCanonical!==`${a.n}|${a.lat}|${a.lon}`)render();
};
new MutationObserver(()=>protect()).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
window.setInterval(protect,250);
window.addEventListener('pageshow',()=>requestAnimationFrame(render));
window.addEventListener('load',()=>requestAnimationFrame(render));
})();
