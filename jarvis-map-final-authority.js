(()=>{
'use strict';
if(window.__JARVIS_MAP_FINAL_AUTHORITY_V5__)return;
window.__JARVIS_MAP_FINAL_AUTHORITY_V5__=true;

const aliases=[
 {keys:['jagannath','nagar'],name:'Jagannath Nagar',display_name:'Jharapada, Bhubaneswar, Odisha 751010',detail:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
 {keys:['ggp','colony'],name:'GGP Colony',display_name:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',detail:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',lat:20.2934,lon:85.8659},
 {keys:['maa','enclave'],name:'Maa Enclave',display_name:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',detail:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',lat:20.2923,lon:85.8638},
 {keys:['jharapada'],name:'Jharapada',display_name:'Jharapada, Bhubaneswar, Odisha',detail:'Jharapada, Bhubaneswar, Odisha',lat:20.2910,lon:85.8680},
 {keys:['rasulgarh'],name:'Rasulgarh',display_name:'Rasulgarh, Bhubaneswar, Odisha',detail:'Rasulgarh, Bhubaneswar, Odisha',lat:20.3054,lon:85.8594},
 {keys:['bhubaneswar'],name:'Bhubaneswar',display_name:'Khordha, Odisha, India',detail:'Khordha, Odisha, India',lat:20.2961,lon:85.8245}
];
const tokens=s=>String(s||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
const clean=s=>String(s||'').replace(/^(?:please\s+)?(?:search|find|look up|show me|show|locate|open maps? for|take me to|take me|navigate me to|navigate to|directions? to|go to)\s+/i,'').replace(/\s+/g,' ').trim();
const alias=s=>{const t=tokens(clean(s));return aliases.find(a=>a.keys.every(k=>t.includes(k)))||null};
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const cacheKey=q=>`jarvis-map-v5:${clean(q).toLowerCase()}`;
const readCache=q=>{try{const v=JSON.parse(localStorage.getItem(cacheKey(q))||'null');return v&&Array.isArray(v.data)&&Date.now()-v.ts<15*60*1000?v.data:null}catch{return null}};
const writeCache=(q,data)=>{try{localStorage.setItem(cacheKey(q),JSON.stringify({ts:Date.now(),data}))}catch{}};
const show=(p,frame)=>{const d=.016,bbox=`${p.lon-d},${p.lat-d},${p.lon+d},${p.lat+d}`;frame.innerHTML=`<iframe title="JARVIS map for ${esc(p.name)}" loading="lazy" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${p.lat},${p.lon}`)}"></iframe>`};
const wordHits=(q,text)=>{const qt=tokens(q),tt=tokens(text);return qt.filter(t=>tt.includes(t)).length};
const useful=(q,p)=>{const qt=tokens(q);if(!qt.length)return false;return wordHits(q,`${p.name||''} ${p.display_name||''}`)>=qt.length};
const mapResult=x=>({name:String(x.name||x.display_name||'Location').split(',')[0].trim()||'Location',display_name:String(x.display_name||''),lat:+x.lat,lon:+x.lon,type:String(x.type||''),category:String(x.category||x.class||'')});
let lastGeocodeAt=0;
const waitForRateLimit=async()=>{const wait=Math.max(0,1000-(Date.now()-lastGeocodeAt));if(wait)await new Promise(r=>setTimeout(r,wait));lastGeocodeAt=Date.now()};
const nominatim=async(query,contextual=false)=>{
 const key=(contextual?'context:':'exact:')+query;const cached=readCache(key);if(cached)return cached;
 await waitForRateLimit();
 try{
  const u=new URL('https://nominatim.openstreetmap.org/search');u.searchParams.set('format','jsonv2');u.searchParams.set('q',contextual?`${query}, Bhubaneswar, Odisha, India`:query);u.searchParams.set('limit','12');u.searchParams.set('addressdetails','1');u.searchParams.set('namedetails','1');u.searchParams.set('countrycodes','in');u.searchParams.set('accept-language','en');u.searchParams.set('dedupe','1');
  const r=await fetch(u.toString(),{cache:'default',headers:{Accept:'application/json'}});if(!r.ok)return[];
  const data=await r.json();const out=(Array.isArray(data)?data:[]).map(mapResult).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon));writeCache(key,out);return out;
 }catch{return[]}
};
const rank=(q,places)=>{const lower=clean(q).toLowerCase();return places.map(p=>{const text=`${p.name} ${p.display_name}`.toLowerCase();return{...p,__score:(text.includes(lower)?100:0)+(p.name.toLowerCase()===lower?80:0)+wordHits(q,text)*20+(['amenity','shop','tourism','leisure'].includes(p.category)?10:0)}}).sort((a,b)=>b.__score-a.__score).slice(0,8).map(({__score,...p})=>p)};
const canonical=async q=>{const a=alias(q);if(a)return[a];const exact=await nominatim(q,false),exactUseful=exact.filter(p=>useful(q,p));if(exactUseful.length)return rank(q,exactUseful);const contextual=await nominatim(q,true);return rank(q,contextual.filter(p=>useful(q,p)))};
const renderResults=(places,results,frame,query)=>{if(!places.length){results.innerHTML=`<div class="empty">No location matched all keywords in “${esc(query)}”. Try adding a city or state.</div>`;frame.innerHTML='';return;}results.innerHTML=`<div style="margin:7px 2px;color:var(--muted,#78939c);font-size:11px">${places.length} LOCATION${places.length===1?'':'S'} FOUND · KEYWORD MATCH</div>`+places.map((p,i)=>`<button type="button" class="place-result" data-final-map="${i}"><strong>${i+1}. ${esc(p.name)}</strong><small>${esc(p.display_name||p.detail||'')}</small></button>`).join('');results.querySelectorAll('[data-final-map]').forEach(b=>b.addEventListener('click',()=>show(places[Number(b.dataset.finalMap)],frame)));show(places[0],frame)};
const search=async q=>{const input=document.querySelector('#mapQuery'),results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');if(!(input instanceof HTMLInputElement)||!results||!frame)return false;const query=clean(q||input.value);if(!query)return false;input.value=query;input.dataset.jarvisMapQuery=query;results.innerHTML='<div class="empty">SEARCHING EXACT LOCATION…</div>';frame.innerHTML='<div class="empty">Searching map services…</div>';renderResults(await canonical(query),results,frame,query);return true};
let pending='';let busy=false;const consume=()=>{if(busy||!pending)return;const input=document.querySelector('#mapQuery');if(!(input instanceof HTMLInputElement))return;const q=pending;pending='';busy=true;void search(q).finally(()=>{busy=false})};
const mapIntent=q=>/\b(map|maps|directions|navigate|location|take me to|go to)\b/i.test(String(q||''));
const voiceGuard=e=>{const raw=String(e.detail?.text||'').trim();if(!raw||!mapIntent(raw))return;const input=document.querySelector('#mapQuery');if(!(input instanceof HTMLInputElement))return;const q=clean(raw);if(!q)return;e.preventDefault();e.stopImmediatePropagation();pending=q;consume()};
const mapsCommand=e=>{const q=clean(String(e.detail?.place||e.detail?.query||''));if(!q)return;pending=q;consume()};
const clickGuard=e=>{const t=e.target instanceof Element?e.target.closest('#mapSearch'):null;if(!t)return;e.preventDefault();e.stopImmediatePropagation();const input=document.querySelector('#mapQuery');if(input instanceof HTMLInputElement){pending=clean(input.value);consume()}};
const inputGuard=e=>{const t=e.target;if(!(t instanceof HTMLInputElement)||t.id!=='mapQuery')return;const q=clean(t.value),a=alias(q);if(!a)return;e.preventDefault();e.stopImmediatePropagation();const results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');if(results&&frame)renderResults([a],results,frame,q)};
window.addEventListener('click',clickGuard,true);window.addEventListener('input',inputGuard,true);window.addEventListener('jarvis:voice-command',voiceGuard,true);window.addEventListener('jarvis:maps',mapsCommand,true);new MutationObserver(()=>consume()).observe(document.documentElement,{childList:true,subtree:true});consume();
})();
