(()=>{
'use strict';
if(window.__JARVIS_MAP_FINAL_AUTHORITY_V8__)return;
window.__JARVIS_MAP_FINAL_AUTHORITY_V8__=true;

const aliases=[
 {keys:['jagannath','nagar'],name:'Jagannath Nagar',display_name:'Jharapada, Bhubaneswar, Odisha 751010',detail:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
 {keys:['ggp','colony'],name:'GGP Colony',display_name:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',detail:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',lat:20.2934,lon:85.8659},
 {keys:['maa','enclave'],name:'Maa Enclave',display_name:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',detail:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',lat:20.2923,lon:85.8638},
 {keys:['jharapada'],name:'Jharapada',display_name:'Jharapada, Bhubaneswar, Odisha',detail:'Jharapada, Bhubaneswar, Odisha',lat:20.2910,lon:85.8680},
 {keys:['rasulgarh'],name:'Rasulgarh',display_name:'Rasulgarh, Bhubaneswar, Odisha',detail:'Rasulgarh, Bhubaneswar, Odisha',lat:20.3054,lon:85.8594},
 {keys:['bhubaneswar'],name:'Bhubaneswar',display_name:'Khordha, Odisha, India',detail:'Khordha, Odisha, India',lat:20.2961,lon:85.8245}
];
const poiKinds={
 restaurant:{tag:'amenity',value:'restaurant',label:'restaurants'},
 cafe:{tag:'amenity',value:'cafe',label:'cafes'},
 hospital:{tag:'amenity',value:'hospital',label:'hospitals'},
 pharmacy:{tag:'amenity',value:'pharmacy',label:'pharmacies'},
 hotel:{tag:'tourism',value:'hotel',label:'hotels'},
 school:{tag:'amenity',value:'school',label:'schools'},
 bank:{tag:'amenity',value:'bank',label:'banks'},
 atm:{tag:'amenity',value:'atm',label:'ATMs'},
 fuel:{tag:'amenity',value:'fuel',label:'petrol stations'},
 gym:{tag:'leisure',value:'fitness_centre',label:'gyms'},
 supermarket:{tag:'shop',value:'supermarket',label:'supermarkets'},
 temple:{tag:'amenity',value:'place_of_worship',label:'temples'}
};
const tokens=s=>String(s||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
const clean=s=>String(s||'').replace(/^(?:please\s+)?(?:search|find|look up|show me|show|locate|open maps? for|take me to|take me|navigate me to|navigate to|directions? to|go to)\s+/i,'').replace(/\s+/g,' ').trim();
const alias=s=>{const t=tokens(clean(s));return aliases.find(a=>a.keys.every(k=>t.includes(k)))||null};
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const cacheKey=q=>`jarvis-map-v8:${clean(q).toLowerCase()}`;
const readCache=q=>{try{const v=JSON.parse(localStorage.getItem(cacheKey(q))||'null');return v&&Array.isArray(v.data)&&Date.now()-v.ts<10*60*1000?v.data:null}catch{return null}};
const writeCache=(q,data)=>{try{localStorage.setItem(cacheKey(q),JSON.stringify({ts:Date.now(),data}))}catch{}};
const show=(p,frame)=>{const d=.016,bbox=`${p.lon-d},${p.lat-d},${p.lon+d},${p.lat+d}`;frame.innerHTML=`<iframe title="JARVIS map for ${esc(p.name)}" loading="lazy" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${p.lat},${p.lon}`)}"></iframe>`};
const mapResult=x=>({name:String(x.name||x.display_name||'Location').split(',')[0].trim()||'Location',display_name:String(x.display_name||''),lat:+x.lat,lon:+x.lon,type:String(x.type||''),category:String(x.category||x.class||''),tags:x.tags||{}});
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
const categoryFrom=q=>{const l=clean(q).toLowerCase();for(const [key,k] of Object.entries(poiKinds)){if(new RegExp(`\\b${key.replace('_','\\s?')}s?\\b`).test(l)||new RegExp(`\\b${k.label.replace(/s$/,'')}s?\\b`).test(l))return[key,k]}return null};
const locationText=q=>{const m=clean(q).match(/\b(?:in|near|around|at)\s+(.+)$/i);return m?.[1]?.trim()||''};
const poiQuery=async(q)=>{
 const kind=categoryFrom(q);if(!kind)return null;
 const location=locationText(q)||'Bhubaneswar';
 const a=alias(location);
 let center=a;
 if(!center){const geocoded=await nominatim(location,true);center=geocoded[0]||null}
 if(!center)return null;
 const cached=readCache(`poi:${kind[0]}:${location}`);if(cached)return{places:cached,kind:kind[1],location,center};
 const {tag,value}=kind[1];
 const query=`[out:json][timeout:20];(nwr["${tag}"="${value}"](around:3000,${center.lat},${center.lon}););out center tags;`;
 try{
  const r=await fetch('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8',Accept:'application/json'},body:`data=${encodeURIComponent(query)}`,cache:'no-store'});
  if(!r.ok)throw new Error(`Overpass HTTP ${r.status}`);
  const data=await r.json();
  const places=(Array.isArray(data?.elements)?data.elements:[]).map(e=>{const lat=Number(e.lat??e.center?.lat),lon=Number(e.lon??e.center?.lon),tags=e.tags||{};return{name:String(tags.name||kind[1].label),display_name:String(tags['addr:street']||tags['addr:suburb']||tags['addr:city']||location),lat,lon,type:value,category:tag,tags}}).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon));
  places.sort((a,b)=>Math.hypot(a.lat-center.lat,a.lon-center.lon)-Math.hypot(b.lat-center.lat,b.lon-center.lon));
  const out=places.slice(0,12);writeCache(`poi:${kind[0]}:${location}`,out);return{places:out,kind:kind[1],location,center};
 }catch{return null}
};
const renderResults=(places,results,frame,query,heading='LOCATION')=>{if(!places.length){results.innerHTML=`<div class="empty">No ${heading.toLowerCase()} matched “${esc(query)}”. Try another keyword or add a city.</div>`;frame.innerHTML='';return;}results.innerHTML=`<div style="margin:7px 2px;color:var(--muted,#78939c);font-size:11px">${places.length} ${heading}${places.length===1?'':'S'} FOUND · KEYWORD MATCH</div>`+places.map((p,i)=>`<button type="button" class="place-result" data-final-map="${i}"><strong>${i+1}. ${esc(p.name)}</strong><small>${esc(p.display_name||p.detail||'')}</small></button>`).join('');results.querySelectorAll('[data-final-map]').forEach(b=>b.addEventListener('click',()=>show(places[Number(b.dataset.finalMap)],frame)));show(places[0],frame)};
const search=async q=>{const input=document.querySelector('#mapQuery'),results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');if(!(input instanceof HTMLInputElement)||!results||!frame)return false;const query=clean(q||input.value);if(!query)return false;input.value=query;input.dataset.jarvisMapQuery=query;results.innerHTML='<div class="empty">SEARCHING EXACT LOCATION…</div>';frame.innerHTML='<div class="empty">Searching map services…</div>';const poi=await poiQuery(query);if(poi){renderResults(poi.places,results,frame,query,poi.kind.label.toUpperCase());return true}const a=alias(query);if(a){renderResults([a],results,frame,query);return true}const exact=await nominatim(query,false);const contextual=exact.length?exact:await nominatim(query,true);renderResults(contextual.slice(0,8),results,frame,query);return true};
let pending='';let busy=false;let readyTimer=0;
const consume=()=>{if(busy||!pending)return;const input=document.querySelector('#mapQuery');if(!(input instanceof HTMLInputElement))return;const q=pending;pending='';busy=true;void search(q).finally(()=>{busy=false})};
const routeWhenReady=q=>{pending=clean(q);if(readyTimer)window.clearInterval(readyTimer);let tries=0;readyTimer=window.setInterval(()=>{const input=document.querySelector('#mapQuery');if(input instanceof HTMLInputElement){window.clearInterval(readyTimer);readyTimer=0;input.value=pending;consume()}else if(++tries>=60){window.clearInterval(readyTimer);readyTimer=0;pending=''}},50)};
const mapIntent=q=>/\b(map|maps|directions|navigate|location|take me to|go to)\b/i.test(String(q||''));
const voiceGuard=e=>{const raw=String(e.detail?.text||'').trim();if(!raw||!mapIntent(raw))return;const q=clean(raw);if(!q)return;e.preventDefault();e.stopImmediatePropagation();routeWhenReady(q)};
const mapIntentEvent=e=>{const q=clean(String(e.detail?.place||e.detail?.query||''));if(!q)return;e.preventDefault();e.stopImmediatePropagation();routeWhenReady(q)};
const legacyMapsGuard=e=>{e.preventDefault();e.stopImmediatePropagation()};
const clickGuard=e=>{const t=e.target instanceof Element?e.target.closest('#mapSearch'):null;if(!t)return;e.preventDefault();e.stopImmediatePropagation();const input=document.querySelector('#mapQuery');if(input instanceof HTMLInputElement)routeWhenReady(input.value)};
const inputGuard=e=>{const t=e.target;if(!(t instanceof HTMLInputElement)||t.id!=='mapQuery')return;const q=clean(t.value),a=alias(q);if(!a)return;const results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');if(results&&frame)renderResults([a],results,frame,q)};
window.addEventListener('click',clickGuard,true);window.addEventListener('input',inputGuard,true);window.addEventListener('jarvis:voice-command',voiceGuard,true);window.addEventListener('jarvis:map-intent',mapIntentEvent,true);window.addEventListener('jarvis:maps',legacyMapsGuard,true);new MutationObserver(()=>consume()).observe(document.documentElement,{childList:true,subtree:true});consume();
})();
