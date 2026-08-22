(()=>{
'use strict';
if(window.__JARVIS_MAP_FINAL_AUTHORITY__)return;
window.__JARVIS_MAP_FINAL_AUTHORITY__=true;
const aliases=[
 {keys:['jagannath','nagar'],name:'Jagannath Nagar',detail:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
 {keys:['ggp','colony'],name:'GGP Colony',detail:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',lat:20.2934,lon:85.8659},
 {keys:['maa','enclave'],name:'Maa Enclave',detail:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',lat:20.2923,lon:85.8638},
 {keys:['jharapada'],name:'Jharapada',detail:'Bhubaneswar, Odisha',lat:20.2910,lon:85.8680}
];
const tokens=s=>String(s||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
const clean=s=>String(s||'').replace(/^(?:please\s+)?(?:search|find|look up|show me|show|locate|open maps? for|take me to|navigate to|directions? to|go to)\s+/i,'').trim();
const alias=s=>{const t=tokens(s);return aliases.find(a=>a.keys.every(k=>t.includes(k)))||null};
const speak=text=>window.dispatchEvent(new CustomEvent('jarvis:intelligence-speak',{detail:{text}}));
let pendingDestination='';
const show=(p,frame)=>{const d=.018,bbox=`${p.lon-d},${p.lat-d},${p.lon+d},${p.lat+d}`;frame.innerHTML=`<iframe title="JARVIS map for ${String(p.name).replace(/"/g,'&quot;')}" loading="lazy" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${p.lat},${p.lon}`)}"></iframe>`};
const canonical=async q=>{
 const a=alias(q);if(a)return [a];
 const query=/bhubaneswar|odisha|india/i.test(q)?q:`${q}, Bhubaneswar, Odisha, India`;
 let data=[];
 try{const u=new URL('https://nominatim.openstreetmap.org/search');u.searchParams.set('format','jsonv2');u.searchParams.set('q',query);u.searchParams.set('limit','10');u.searchParams.set('addressdetails','1');u.searchParams.set('countrycodes','in');u.searchParams.set('accept-language','en');const r=await fetch(u,{cache:'no-store',headers:{Accept:'application/json'}});if(r.ok)data=await r.json()}catch{}
 const ts=tokens(q);const mapped=(Array.isArray(data)?data:[]).map(x=>({name:String(x.name||x.display_name||'Location').split(',')[0],display_name:String(x.display_name||''),lat:+x.lat,lon:+x.lon})).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon));
 return mapped.map(p=>{const text=(p.name+' '+p.display_name).toLowerCase();const hits=ts.filter(t=>text.includes(t)).length;return {...p,score:(text.includes(q.toLowerCase())?100:0)+hits*20}}).filter(p=>p.score>=ts.length*20).sort((a,b)=>b.score-a.score).map(({score,...p})=>p).slice(0,8);
};
const search=async q=>{
 const input=document.querySelector('#mapQuery'),results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');
 if(!(input instanceof HTMLInputElement)||!results||!frame)return false;
 const query=clean(q||input.value);if(!query)return false;input.value=query;results.innerHTML='<div class="empty">SEARCHING KEYWORD-MATCHED LOCATIONS…</div>';frame.innerHTML='<div class="empty">Searching map services…</div>';
 const places=await canonical(query);
 if(!places.length){results.innerHTML=`<div class="empty">No location matched all keywords in “${query}”.</div>`;frame.innerHTML='';return true;}
 results.innerHTML=`<div style="margin:7px 2px;color:var(--muted,#78939c);font-size:11px">${places.length} LOCATION${places.length===1?'':'S'} FOUND · KEYWORD MATCH</div>`+places.map((p,i)=>`<button type="button" class="place-result" data-final-map="${i}"><strong>${i+1}. ${p.name}</strong><small>${p.display_name||p.detail||''}</small></button>`).join('');
 results.querySelectorAll('[data-final-map]').forEach(b=>b.addEventListener('click',()=>show(places[Number(b.dataset.finalMap)],frame)));
 show(places[0],frame);return true;
};
const consumePending=()=>{if(!pendingDestination)return;const input=document.querySelector('#mapQuery');if(!(input instanceof HTMLInputElement))return;const q=pendingDestination;pendingDestination='';void search(q)};
const clickGuard=e=>{const t=e.target instanceof Element?e.target.closest('#mapSearch'):null;if(!t)return;e.preventDefault();e.stopImmediatePropagation();void search(document.querySelector('#mapQuery')?.value||'')};
const voiceGuard=e=>{
 const input=document.querySelector('#mapQuery');
 const raw=String(e.detail?.text||'').trim();
 if(!raw)return;
 const q=clean(raw);
 if(!q||/^(what|who|why|how|when|tell me|sing|play|calculate|weather|time|date|joke|settings|notes?)\b/i.test(q))return;
 if(!(input instanceof HTMLInputElement)){pendingDestination=q;return;}
 e.preventDefault();e.stopImmediatePropagation();
 speak(`Taking you to ${q}.`);
 void search(q);
};
const mapsCommand=e=>{const q=clean(String(e.detail?.place||e.detail?.query||''));if(!q)return;pendingDestination=q;consumePending()};
document.addEventListener('click',clickGuard,true);
window.addEventListener('jarvis:voice-command',voiceGuard,true);
window.addEventListener('jarvis:maps',mapsCommand,true);
new MutationObserver(()=>consumePending()).observe(document.documentElement,{childList:true,subtree:true});
consumePending();
})();
