(()=>{
'use strict';
if(window.__JARVIS_MAP_KEYWORD_AUTHORITY__) return;
window.__JARVIS_MAP_KEYWORD_AUTHORITY__=true;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tokens=q=>String(q||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(x=>x.length>1);
const aliases=[
 {keys:['jagannath','nagar'],name:'Jagannath Nagar',detail:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
 {keys:['maa','enclave'],name:'Maa Enclave',detail:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',lat:20.2923,lon:85.8638},
 {keys:['ggp','colony'],name:'GGP Colony',detail:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',lat:20.2934,lon:85.8659},
 {keys:['jharapada'],name:'Jharapada',detail:'Bhubaneswar, Odisha',lat:20.2910,lon:85.8680}
];
const json=async(url)=>{const r=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw Error(String(r.status));return r.json()};
const aliasFor=q=>{const t=tokens(q);return aliases.find(a=>a.keys.every(k=>t.includes(k)))||null};
const searchable=p=>[p.name,p.display_name,p.detail,p.address,p.street,p.district,p.city,p.state,p.country].filter(Boolean).join(' ').toLowerCase();
const rank=(items,q)=>{const ts=tokens(q);return items.map(p=>{const text=searchable(p);const exact=text.includes(q.toLowerCase());const hits=ts.filter(t=>text.includes(t)).length;return {...p,_score:(exact?100:0)+(hits*20)+(String(p.name||'').toLowerCase().includes(q.toLowerCase())?50:0)}}).filter(p=>p._score>=ts.length*20).sort((a,b)=>b._score-a._score).map(({_score,...p})=>p)};
const geocode=async q=>{
 const alias=aliasFor(q);if(alias)return [alias];
 const query=/bhubaneswar|odisha|india/i.test(q)?q:`${q}, Bhubaneswar, Odisha, India`;
 const out=[];
 try{const d=await json(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=10&addressdetails=1&countrycodes=in&q=${encodeURIComponent(query)}`);out.push(...(Array.isArray(d)?d:[]).map(x=>({lat:+x.lat,lon:+x.lon,name:String(x.name||x.display_name||'Location').split(',')[0],display_name:String(x.display_name||'')})))}catch{}
 if(!out.length)try{const d=await json(`https://photon.komoot.io/api/?limit=10&q=${encodeURIComponent(query)}`);out.push(...(d?.features||[]).map(f=>({lat:+f.geometry.coordinates[1],lon:+f.geometry.coordinates[0],name:String(f.properties?.name||f.properties?.city||'Location'),display_name:[f.properties?.name,f.properties?.street,f.properties?.district,f.properties?.city,f.properties?.state,f.properties?.country].filter(Boolean).join(', ')})))}catch{}
 return rank(out,q).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)).slice(0,8);
};
const bind=()=>{
 const button=document.querySelector('#mapSearch'),input=document.querySelector('#mapQuery');
 if(!(button instanceof HTMLButtonElement)||!(input instanceof HTMLInputElement)||button.dataset.keywordAuthority==='1')return;
 const fresh=button.cloneNode(true);fresh.dataset.keywordAuthority='1';button.replaceWith(fresh);
 const results=document.querySelector('#mapResults'),frame=document.querySelector('#mapFrame');if(!results||!frame)return;
 const show=p=>{const d=.018,bbox=`${p.lon-d},${p.lat-d},${p.lon+d},${p.lat+d}`;frame.innerHTML=`<iframe title="JARVIS map for ${esc(p.name)}" loading="lazy" style="border:0;width:100%;height:100%;min-height:280px" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${p.lat},${p.lon}`)}"></iframe>`};
 const search=async()=>{const q=input.value.trim();if(!q)return;results.innerHTML='<div class="empty">SEARCHING KEYWORD-MATCHED LOCATIONS…</div>';frame.innerHTML='<div class="empty">Searching map services…</div>';const places=await geocode(q);if(!places.length){results.innerHTML=`<div class="empty">No location matched all keywords in “${esc(q)}”.</div>`;frame.innerHTML='';return}results.innerHTML=`<div style="margin:7px 2px;color:var(--muted,#78939c);font-size:11px">${places.length} LOCATION${places.length===1?'':'S'} FOUND · KEYWORD MATCH</div>`+places.map((p,i)=>`<button type="button" class="place-result" data-jk-place="${i}"><strong>${i+1}. ${esc(p.name)}</strong><small>${esc(p.display_name||p.detail||'')}</small></button>`).join('');results.querySelectorAll('[data-jk-place]').forEach(b=>b.addEventListener('click',()=>show(places[+b.dataset.jkPlace])));show(places[0]);};
 fresh.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();void search()},true);
 input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();void search()}});
 window.jarvisMapSearch=search;
};
bind();new MutationObserver(()=>bind()).observe(document.documentElement,{childList:true,subtree:true});
})();
