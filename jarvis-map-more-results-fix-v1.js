(()=>{
'use strict';
if(window.__JARVIS_MAP_MORE_RESULTS_FIX_V1__)return;
window.__JARVIS_MAP_MORE_RESULTS_FIX_V1__=true;

const PAGE=4, MAX=20, RADIUS=7000;
const PLACES={
 'jagannath nagar':{lat:20.2923,lon:85.8638,name:'Jagannath Nagar'},
 'saheed nagar':{lat:20.2895,lon:85.8486,name:'Saheed Nagar'},
 'bjb nagar':{lat:20.2545,lon:85.8440,name:'BJB Nagar'},
 'ggp colony':{lat:20.2934,lon:85.8659,name:'GGP Colony'},
 'jharapada':{lat:20.2910,lon:85.8680,name:'Jharapada'},
 'rasulgarh':{lat:20.3054,lon:85.8594,name:'Rasulgarh'},
 'khandagiri':{lat:20.2550,lon:85.7750,name:'Khandagiri'},
 'bhubaneswar':{lat:20.2961,lon:85.8245,name:'Bhubaneswar'}
};
const KIND={restaurant:['restaurant','fast_food','food_court'],cafe:['cafe'],hospital:['hospital'],pharmacy:['pharmacy'],hotel:['hotel'],school:['school'],bank:['bank'],atm:['atm'],fuel:['fuel'],gym:['fitness_centre'],supermarket:['supermarket'],temple:['place_of_worship']};
const clean=s=>String(s||'').replace(/^(?:please\s+)?(?:search|find|look up|show me|show|locate|open maps? for|take me to|take me|navigate me to|navigate to|directions? to|go to)\s+/i,'').replace(/\s+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const km=(a,b)=>{const R=6371,d1=(b.lat-a.lat)*Math.PI/180,d2=(b.lon-a.lon)*Math.PI/180,x1=a.lat*Math.PI/180,x2=b.lat*Math.PI/180,h=Math.sin(d1/2)**2+Math.cos(x1)*Math.cos(x2)*Math.sin(d2/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))};
const centerFor=q=>{const l=norm(q),hit=Object.entries(PLACES).find(([k])=>l.includes(k));return hit?hit[1]:PLACES.bhubaneswar||PLACES.bhubaneswar};
const kindFor=q=>{const l=norm(q);if(/\bresturants?\b/.test(l))return ['restaurant','restaurant','restaurants'];for(const [k,vals] of Object.entries(KIND)){const label=k==='fuel'?'petrol stations':k+'s';if(new RegExp(`\\b${k}s?\\b`).test(l)||vals.some(v=>l.includes(v.replace('_',' '))))return [k,vals,label]}return null};
const fetchJson=async(url,ms=5000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{window.__JARVIS_MAP_V21_INTERNAL_FETCH__=true;const r=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'},signal:c.signal});return r.ok?await r.json():null}catch{return null}finally{window.__JARVIS_MAP_V21_INTERNAL_FETCH__=false;clearTimeout(t)}};
const overpass=async(q,center)=>{const filters=q[1].map(v=>`nwr["amenity"="${v}"][name](around:${RADIUS},${center.lat},${center.lon});`).concat(q[0]==='hotel'?[`nwr["tourism"="hotel"][name](around:${RADIUS},${center.lat},${center.lon});`]:[]).join('');const query=`[out:json][timeout:5];(${filters});out center tags;`;const call=endpoint=>{const u=new URL(endpoint);u.searchParams.set('data',query);return fetchJson(u.toString())};let data;try{data=await Promise.any(['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'].map(call))}catch{return[]};const out=[];for(const e of Array.isArray(data?.elements)?data.elements:[]){const t=e.tags||{},lat=Number(e.lat??e.center?.lat),lon=Number(e.lon??e.center?.lon),name=String(t.name||'').trim();if(!name||!Number.isFinite(lat)||!Number.isFinite(lon))continue;const p={id:`${e.type||'osm'}/${e.id}`,name,display:[t['addr:housenumber'],t['addr:street'],t['addr:suburb'],t['addr:city']].filter(Boolean).join(' · '),lat,lon,distance:0};p.distance=km(p,center);if(p.distance<=RADIUS/1000)out.push(p)}return out.sort((a,b)=>a.distance-b.distance)};
const show=(p,frame)=>{if(!frame)return;const d=.016,b=`${p.lon-d},${p.lat-d},${p.lon+d},${p.lat+d}`;frame.innerHTML=`<iframe title="JARVIS map for ${esc(p.name)}" loading="lazy" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(b)}&layer=mapnik&marker=${encodeURIComponent(`${p.lat},${p.lon}`)}"></iframe>`};
const readCurrent=()=>{const el=document.querySelector('#mapResults');if(!el)return[];return [...el.querySelectorAll('[data-jarvis-map-v21]')].map(b=>norm(b.querySelector('strong')?.textContent||'')).filter(Boolean)};
const renderMore=async button=>{
 const el=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame'),input=document.querySelector('#mapQuery');
 if(!el||!frame||!(input instanceof HTMLInputElement))return;
 const q=clean(input.value),kind=kindFor(q);if(!kind)return;
 const center=centerFor(q),existing=readCurrent();
 button.disabled=true;button.textContent='LOADING MORE…';
 const all=await overpass(kind,center),fresh=all.filter(p=>!existing.includes(norm(p.name)));
 const take=fresh.slice(0,PAGE);
 if(!take.length){button.remove();return}
 const current=[...el.querySelectorAll('[data-jarvis-map-v21]')];
 let nextIndex=current.length;
 for(const p of take){const b=document.createElement('button');b.type='button';b.className='place-result';b.dataset.jarvisMapMoreV1=String(nextIndex++);b.innerHTML=`<strong>${nextIndex}. ${esc(p.name)}</strong><small>${p.distance<1?(p.distance*1000).toFixed(0)+' m':p.distance.toFixed(1)+' km'} away${p.display?' · '+esc(p.display):''}</small>`;b.addEventListener('click',()=>show(p,frame));el.insertBefore(b,button)}
 const remaining=all.filter(p=>!readCurrent().includes(norm(p.name)));
 if(nextIndex>=MAX||!remaining.length)button.remove();else{button.disabled=false;button.textContent=`MORE ${kind[2].toUpperCase()} →`}
 const label=kind[2].toUpperCase();const header=el.querySelector(':scope > div:first-child');if(header)header.textContent=`SHOWING ${nextIndex} NEAREST ${label}`;
};
const intercept=e=>{const b=e.target instanceof Element?e.target.closest('#mapMoreResultsV21'):null;if(!(b instanceof HTMLButtonElement))return;e.preventDefault();e.stopImmediatePropagation();void renderMore(b)};
document.addEventListener('click',intercept,true);
})();
