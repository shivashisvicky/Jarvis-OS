(()=>{
'use strict';
if(window.__JARVIS_AUTHORITY_V8__)return;window.__JARVIS_AUTHORITY_V8__=1;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const VID=/^[A-Za-z0-9_-]{11}$/;
const json=async(url,ms=6000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{Accept:'application/json'}});if(!r.ok)throw Error(String(r.status));return await r.json()}finally{clearTimeout(t)}};
const escId=x=>String(x||'').match(/^[A-Za-z0-9_-]{11}$/)?.[0]||'';
function play(id,title='JARVIS video'){id=escId(id);if(!id)return false;const p=$('#jarvisPlayer');if(!p)return false;p.innerHTML=`<iframe title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen playsinline src="https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1&modestbranding=1"></iframe>`;const s=$('#mediaState')||$('#jvcStatus');if(s)s.textContent='PLAYING · JARVIS PLAYER';return true}
function markVideoStatus(){const s=$('#mediaState')||$('#jvcStatus');if(s&&!/PLAYING/i.test(s.textContent||''))s.textContent=`${s.textContent||'RESULTS'} · IN-HOUSE`}
function addSearchCompatibility(){const answer=$('#jv4SearchAnswer')||$('#jv3SearchAnswer');if(answer){$$('.jv4-result',answer).forEach(x=>x.classList.add('jlf-result'));if(!$('#jlfSearchInternet',answer)){const b=document.createElement('button');b.id='jlfSearchInternet';b.className='secondary';b.type='button';b.textContent='SEARCH INTERNET';b.addEventListener('click',()=>{const q=$('#webQuery')?.value?.trim();if(q)window.open(`https://search.brave.com/search?q=${encodeURIComponent(q)}`,'_blank','noopener,noreferrer')});answer.appendChild(b)}}}
async function central(q,target){const fn=window.jarvisCentralSearch;if(typeof fn!=='function')return;await fn(q,target);if(target){if(!/IN-HOUSE/i.test(target.textContent||'')){const b=document.createElement('small');b.className='jv4-authority-badge';b.textContent='IN-HOUSE · JARVIS KNOWLEDGE AUTHORITY';target.appendChild(b)}}else addSearchCompatibility()}
const aliases=[
 {re:/^ggp\s+colony$/i,name:'GGP Colony',detail:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',lat:20.2934,lon:85.8659},
 {re:/^maa\s+enclave$/i,name:'Maa Enclave',detail:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',lat:20.2923,lon:85.8638},
 {re:/^jagannath\s+nagar$/i,name:'Jagannath Nagar',detail:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2923,lon:85.8638},
 {re:/^jharapada$/i,name:'Jharapada',detail:'Bhubaneswar, Odisha, India',lat:20.2910,lon:85.8680}
];
function mapUrl(p){const dx=.035,dy=.025;return`https://www.openstreetmap.org/export/embed.html?bbox=${p.lon-dx},${p.lat-dy},${p.lon+dx},${p.lat+dy}&layer=mapnik&marker=${p.lat},${p.lon}`}
async function mapSearch(q){const query=String(q||'').trim(),r=$('#mapResults'),f=$('#mapFrame');if(!query||!r||!f)return;r.innerHTML='<div class="empty">JARVIS GEO CORE · PROVIDER FAILOVER…</div>';const a=aliases.find(x=>x.re.test(query));if(a){r.innerHTML=`<button type="button" class="place-result jv4-place jlf-result"><strong>${esc(a.name)}</strong><small>${esc(a.detail)}</small></button><div class="jv4-provider">GEO PROVIDER · Photon → ArcGIS → Nominatim · OpenStreetMap renderer</div>`;f.innerHTML=`<iframe title="${esc(a.name)} map" loading="lazy" src="${esc(mapUrl(a))}"></iframe>`;return}
 const providers=[
  async()=>{const d=await json(`https://photon.komoot.io/api/?limit=8&q=${encodeURIComponent(query)}`);return(d?.features||[]).map(x=>({lat:+x.geometry.coordinates[1],lon:+x.geometry.coordinates[0],name:String(x.properties?.name||x.properties?.street||x.properties?.city||'Place'),detail:[x.properties?.name,x.properties?.street,x.properties?.district,x.properties?.city,x.properties?.state,x.properties?.country].filter(Boolean).join(', ')}))},
  async()=>{const d=await json(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=8&outFields=*&singleLine=${encodeURIComponent(query)}`);return(d?.candidates||[]).map(x=>({lat:+x.location.y,lon:+x.location.x,name:String(x.address||'Place'),detail:String(x.address||'')}))},
  async()=>{const d=await json(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&q=${encodeURIComponent(query)}`);return(d||[]).map(x=>({lat:+x.lat,lon:+x.lon,name:String(x.display_name||'Place').split(',')[0],detail:String(x.display_name||'')}))}
 ];
 let p=[];for(const fn of providers){try{const x=(await fn()).filter(v=>Number.isFinite(v.lat)&&Number.isFinite(v.lon));if(x.length){p=x;break}}catch{}}
 if(!p.length){r.innerHTML='<div class="empty">NO GEO PROVIDER RESPONDED · TRY AGAIN</div>';return}
 r.innerHTML=p.map((x,n)=>`<button type="button" class="place-result jv4-place jlf-result" data-jv8-place="${n}"><strong>${esc(x.name)}</strong><small>${esc(x.detail)}</small></button>`).join('')+'<div class="jv4-provider">GEO PROVIDER · Photon → ArcGIS → Nominatim · OpenStreetMap renderer</div>';
 const show=x=>{f.innerHTML=`<iframe title="JARVIS OpenStreetMap" loading="lazy" src="${esc(mapUrl(x))}"></iframe>`};$$('[data-jv8-place]',r).forEach(b=>b.addEventListener('click',()=>show(p[+b.dataset.jv8Place])));show(p[0]);
}
function video(q){const fn=window.jarvisVideoSearch;if(typeof fn!=='function')return;return Promise.resolve(fn(q)).then(()=>markVideoStatus())}
function installSnakePad(){const install=()=>{const c=$('#snakeCanvas');if(!c||c.dataset.jv8Pad==='1')return;c.dataset.jv8Pad='1';const host=c.parentElement;if(!host)return;const p=document.createElement('div');p.className='jlf-pad';p.innerHTML='<button class="blank">·</button><button data-d="up">▲</button><button class="blank">·</button><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button>';host.appendChild(p);const keys={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};p.querySelectorAll('[data-d]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();window.dispatchEvent(new KeyboardEvent('keydown',{key:keys[b.dataset.d]}))},{passive:false}))};new MutationObserver(install).observe(document.body,{childList:true,subtree:true});install()}
function nav(app){document.querySelector(`button.nav[data-app="${app}"]`)?.click()}
function install(){
 document.addEventListener('submit',e=>{const form=e.target instanceof Element?e.target.closest('#commandForm'):null;if(!form)return;e.preventDefault();e.stopImmediatePropagation();const q=$('#commandInput')?.value?.trim();if(q)void central(q,$('#jarvisReply'))},true);
 document.addEventListener('click',e=>{const el=e.target instanceof Element?e.target:null;if(!el)return;
  const media=el.closest('#videoSearch');if(media){e.preventDefault();e.stopImmediatePropagation();void video($('#videoQuery')?.value||'');return}
  const vp=el.closest('[data-video-provider]');if(vp){e.preventDefault();e.stopImmediatePropagation();const q=vp.dataset.videoProvider==='trending'?'trending videos India':($('#videoQuery')?.value||'');const i=$('#videoQuery');if(i)i.value=q;void video(q);return}
  const vc=el.closest('.jv4-video-card,.jvc-card');if(vc){e.preventDefault();e.stopImmediatePropagation();void play(vc.dataset.jv4Video||vc.dataset.jvcId||vc.dataset.jlfVideo||'');return}
  const pp=el.closest('#playVideo');if(pp){e.preventDefault();e.stopImmediatePropagation();const raw=$('#videoUrl')?.value?.trim()||'';const id=raw.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)?.[1]||escId(raw);if(id)void play(id);return}
  const mp=el.closest('#mapSearch');if(mp){e.preventDefault();e.stopImmediatePropagation();void mapSearch($('#mapQuery')?.value||'');return}
  const wb=el.closest('#webSearch');if(wb){e.preventDefault();e.stopImmediatePropagation();void central($('#webQuery')?.value||'',null).then(addSearchCompatibility);return}
  const wp=el.closest('[data-provider]');if(wp){e.preventDefault();e.stopImmediatePropagation();const p=wp.dataset.provider||'',q=$('#webQuery')?.value||'';if(p==='youtube'){void video(q);return}if(p==='news'){void central(`latest news ${q}`,null);return}void central(q,null);return}
  const ra=el.closest('[data-search]');if(ra){e.preventDefault();e.stopImmediatePropagation();const q=ra.dataset.search||'';const i=$('#webQuery');if(i)i.value=q;void central(q,null);return}
 },true);
 document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const el=e.target;if(!(el instanceof HTMLInputElement))return;if(el.id==='videoQuery'){e.preventDefault();e.stopImmediatePropagation();void video(el.value)}else if(el.id==='mapQuery'){e.preventDefault();e.stopImmediatePropagation();void mapSearch(el.value)}else if(el.id==='webQuery'){e.preventDefault();e.stopImmediatePropagation();void central(el.value,null).then(addSearchCompatibility)}},true);
 installSnakePad();
}
install();
})();
