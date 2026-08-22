(()=>{
'use strict';
if(window.__JARVIS_MAP_HARD_OVERRIDE__)return;
window.__JARVIS_MAP_HARD_OVERRIDE__=true;
const A=[
 {k:/\bjagannath\s+nagar\b/i,n:'Jagannath Nagar',d:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
 {k:/\bggp\s+colony\b/i,n:'GGP Colony',d:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',lat:20.2934,lon:85.8659},
 {k:/\bmaa\s+enclave\b/i,n:'Maa Enclave',d:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',lat:20.2923,lon:85.8638},
 {k:/\bjharapada\b/i,n:'Jharapada',d:'Bhubaneswar, Odisha',lat:20.2910,lon:85.8680}
];
const norm=s=>String(s||'').replace(/^(?:please\s+)?(?:search|find|show me|show|locate|take me to|take me|navigate me to|navigate to|directions? to|go to)\s+/i,'').trim();
const hit=s=>{const q=norm(s);return A.find(a=>a.k.test(q))||null};
const render=()=>{
 const input=document.querySelector('#mapQuery'),results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');
 if(!(input instanceof HTMLInputElement)||!results||!frame)return;
 const a=hit(input.value);if(!a)return;
 if(input.dataset.jarvisCanonical===a.n && results.dataset.jarvisCanonical===a.n)return;
 input.dataset.jarvisCanonical=a.n;results.dataset.jarvisCanonical=a.n;
 results.innerHTML=`<div style="margin:7px 2px;color:var(--muted,#78939c);font-size:11px">1 LOCATION FOUND · JARVIS LOCAL AUTHORITY</div><button type="button" class="place-result" data-jarvis-canonical><strong>1. ${a.n}</strong><small>${a.d}</small></button>`;
 const d=.012,bbox=`${a.lon-d},${a.lat-d},${a.lon+d},${a.lat+d}`;
 frame.innerHTML=`<iframe title="JARVIS map for ${a.n}" loading="lazy" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${a.lat},${a.lon}`)}"></iframe>`;
};
const reset=()=>{const i=document.querySelector('#mapQuery');if(i instanceof HTMLInputElement){if(!hit(i.value))delete i.dataset.jarvisCanonical;} };
document.addEventListener('input',()=>{reset();requestAnimationFrame(render)},true);
document.addEventListener('change',()=>requestAnimationFrame(render),true);
document.addEventListener('click',e=>{const t=e.target instanceof Element?e.target.closest('#mapSearch'):null;if(t){e.preventDefault();e.stopImmediatePropagation();render()}},true);
new MutationObserver(()=>requestAnimationFrame(render)).observe(document.documentElement,{childList:true,subtree:true});
window.setInterval(render,300);
})();
