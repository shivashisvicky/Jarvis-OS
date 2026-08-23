(()=>{
'use strict';
if(window.__JARVIS_MAP_LOADING_PREVIEW_V1__)return;
window.__JARVIS_MAP_LOADING_PREVIEW_V1__=true;
let pending='';
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const places={
 'jagannath nagar':{name:'Jagannath Nagar',lat:20.2923,lon:85.8638},
 'jharapada':{name:'Jharapada',lat:20.2910,lon:85.8680},
 'rasulgarh':{name:'Rasulgarh',lat:20.3054,lon:85.8594},
 'khandagiri':{name:'Khandagiri',lat:20.2550,lon:85.7750},
 'saheed nagar':{name:'Saheed Nagar',lat:20.2895,lon:85.8486},
 'bhubaneswar':{name:'Bhubaneswar',lat:20.2961,lon:85.8245}
};
function placeFor(q){const l=clean(q).toLowerCase();for(const [key,p] of Object.entries(places))if(l.includes(key))return p;return places.bhubaneswar}
function preview(){
 const frame=document.querySelector('#mapFrame'),results=document.querySelector('#mapResults');
 if(!frame||!results||!pending)return;
 const p=placeFor(pending),d=.018,b=`${p.lon-d},${p.lat-d},${p.lon+d},${p.lat+d}`;
 if(!frame.querySelector('iframe'))frame.innerHTML=`<div style="position:relative;width:100%;height:100%;min-height:230px"><iframe title="JARVIS map preview" loading="eager" style="border:0;width:100%;height:100%;min-height:230px;display:block" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(b)}&layer=mapnik&marker=${encodeURIComponent(`${p.lat},${p.lon}`)}"></iframe><div style="position:absolute;left:10px;bottom:10px;padding:6px 9px;border:1px solid rgba(100,220,255,.22);border-radius:7px;background:rgba(3,10,14,.86);color:#b8eaf4;font-size:10px;pointer-events:none">SEARCHING NEAR ${p.name.toUpperCase()}…</div></div>`;
}
window.addEventListener('jarvis:map-intent',e=>{pending=clean(e.detail?.place||e.detail?.query);setTimeout(preview,0);setTimeout(preview,120);setTimeout(preview,400)},true);
new MutationObserver(preview).observe(document.documentElement,{childList:true,subtree:true});
})();
