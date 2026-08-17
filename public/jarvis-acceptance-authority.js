(()=>{
'use strict';
if(window.__JARVIS_ACCEPTANCE_AUTHORITY__)return;
window.__JARVIS_ACCEPTANCE_AUTHORITY__=1;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const valid=id=>/^[A-Za-z0-9_-]{11}$/.test(String(id||''));
const json=async(url,ms=8000)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{cache:'no-store',signal:c.signal,headers:{Accept:'application/json'}});if(!r.ok)throw Error(String(r.status));return await r.json()}finally{clearTimeout(t)}};
const idFrom=u=>{try{const x=new URL(u);return x.searchParams.get('v')||x.pathname.split('/').filter(Boolean).pop()||''}catch{return /^[A-Za-z0-9_-]{11}$/.test(String(u||''))?String(u):''}};
const norm=v=>{const id=String(v?.videoId||v?.id||idFrom(v?.url||''));if(!valid(id))return null;return{id,title:String(v?.title||'Untitled video'),author:String(v?.author||v?.uploader||v?.channelName||'YouTube'),thumb:String(v?.thumbnail||v?.thumbnailUrl||`https://i.ytimg.com/vi/${id}/hqdefault.jpg`),source:String(v?.source||'LIVE INDEX')}};
const uniq=a=>{const m=new Map();for(const v of a||[]){const x=norm(v);if(x&&!m.has(x.id))m.set(x.id,x)}return[...m.values()]};
const videoSearchUrl=(q,mode='all')=>`https://www.youtube.com/results?search_query=${encodeURIComponent(String(q||''))}`;
window.jarvisVideoSearchUrl=videoSearchUrl;
function mediaState(s){const a=$('#mediaState'),b=$('#jvcStatus');if(a)a.textContent=s;if(b)b.textContent=s}
function play(id,title='JARVIS video'){if(!valid(id))return false;const p=$('#jarvisPlayer');if(!p)return false;p.innerHTML=`<iframe title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen playsinline src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1"></iframe>`;mediaState('PLAYING · JARVIS PLAYER');return true}
function playDirect(raw){const p=$('#jarvisPlayer');if(!p)return false;const url=String(raw||'').trim();if(!/^https?:\/\//i.test(url)||!(/\.(mp4|webm|ogg)(?:[?#].*)?$/i.test(url)))return false;p.innerHTML=`<video controls playsinline preload="metadata" src="${esc(url)}"></video>`;mediaState('PLAYING · DIRECT MEDIA');return true}
function renderVideos(items,label='LIVE MULTI-PROVIDER INDEX'){
 const r=$('#videoResults');if(!r)return;
 const xs=uniq(items);
 r.innerHTML=xs.length?xs.map(v=>`<button type="button" class="jvc-card jv4-video-card" data-jvc-id="${esc(v.id)}" data-jv4-video="${esc(v.id)}" data-jv4-title="${esc(v.title)}"><img loading="lazy" src="${esc(v.thumb)}" alt=""><span class="video-meta"><strong>${esc(v.title)}</strong><small>${esc(v.author)}</small><small>${esc(v.source)}</small></span><b>▶</b></button>`).join(''):'<div class="empty">LIVE VIDEO INDEX UNAVAILABLE · NO LIVE SOURCE RESPONDED</div>';
 mediaState(`${xs.length} RESULTS · ${label}`);
 return xs.length;
}
async function internalVideo(q,trending=false){
 const endpoint=trending?`/__jarvis/video/trending?q=${encodeURIComponent(q)}`:`/__jarvis/video/search?q=${encodeURIComponent(q)}`;
 try{const d=await json(endpoint,5000);const xs=uniq(d?.items||d?.results||[]);if(xs.length)return xs}catch{}
 return null;
}
const PIPED=['https://pipedapi.kavin.rocks','https://pipedapi.adminforge.de','https://pipedapi-libre.kavin.rocks','https://pipedapi.syncpundit.io','https://pipedapi.tokhmi.xyz','https://api-piped.mha.fi','https://pipedapi.smnz.de','https://pipedapi.qdi.fi','https://piped-api.hostux.net'];
const INVIDIOUS=['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com','https://invidious.tiekoetter.com','https://invidious.f5.si','https://inv.zoomerville.com'];
async function piped(q){for(const b of PIPED){try{const d=await json(`${b}/search?q=${encodeURIComponent(q)}&filter=videos&region=IN`,6500);const xs=uniq(Array.isArray(d)?d:d?.items||d?.videos||[]);if(xs.length)return xs}catch{}}return[]}
async function invidious(q,trending=false){for(const b of INVIDIOUS){try{const u=trending?`${b}/api/v1/trending?region=IN&type=default`:`${b}/api/v1/search?q=${encodeURIComponent(q)}&type=video&region=IN&page=1`;const d=await json(u,6500);const xs=uniq(Array.isArray(d)?d:[]);if(xs.length)return xs}catch{}}return[]}
async function youtubeProxy(q){
 try{
  const html=await fetch(`https://r.jina.ai/http://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,{cache:'no-store'}).then(r=>r.ok?r.text():Promise.reject(Error(String(r.status))));
  const out=[];const re=/\"videoId\":\"([A-Za-z0-9_-]{11})\"[\s\S]{0,3000}?\"title\":\{\"runs\":\[\{\"text\":\"([^\"]+)/g;let m;while((m=re.exec(html))&&out.length<12)out.push({videoId:m[1],title:m[2].replace(/\\u0026/g,'&'),author:'YouTube',source:'YOUTUBE LIVE SEARCH'});return uniq(out)
 }catch{return[]}
}
async function searchVideo(q){
 const query=String(q||$('#videoQuery')?.value||'').trim()||'trending videos India';const input=$('#videoQuery');if(input)input.value=query;mediaState(`SEARCHING · ${query.toUpperCase()}`);const r=$('#videoResults');if(r)r.innerHTML='<div class="empty">JARVIS LIVE VIDEO INDEX · QUERYING…</div>';
 const internal=await internalVideo(query,false);if(internal){renderVideos(internal,'IN-HOUSE LIVE INDEX');return internal}
 let xs=await piped(query);if(!xs.length)xs=await invidious(query,false);if(!xs.length)xs=await youtubeProxy(query);
 renderVideos(xs,'LIVE MULTI-PROVIDER INDEX');return xs;
}
async function trending(){const q='trending videos India';const input=$('#videoQuery');if(input)input.value=q;mediaState('SEARCHING · TRENDING');const internal=await internalVideo(q,true);if(internal){renderVideos(internal,'IN-HOUSE TRENDING');return internal}let xs=await invidious(q,true);if(!xs.length)xs=await youtubeProxy(q);renderVideos(xs,'LIVE TRENDING INDEX');return xs}
window.jarvisVideoSearch=searchVideo;window.jarvisVideoTrending=trending;window.jarvisVideoPlay=play;
async function mapProviders(q){
 try{const d=await json(`/__jarvis/geo?q=${encodeURIComponent(q)}`,5000);const xs=(d?.items||[]).filter(x=>Number.isFinite(+x.lat)&&Number.isFinite(+x.lon));if(xs.length)return xs.map(x=>({...x,provider:'JARVIS GEO CORE'}))}catch{}
 const photon=async()=>{const d=await json(`https://photon.komoot.io/api/?limit=8&q=${encodeURIComponent(q)}`,7000);return(d?.features||[]).map(f=>({lat:+f.geometry.coordinates[1],lon:+f.geometry.coordinates[0],name:String(f.properties?.name||f.properties?.street||f.properties?.city||'Place'),detail:[f.properties?.name,f.properties?.street,f.properties?.district,f.properties?.city,f.properties?.state,f.properties?.country].filter(Boolean).join(', '),provider:'PHOTON'}))};
 const arc=async()=>{const d=await json(`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=8&outFields=*&singleLine=${encodeURIComponent(q)}`,7000);return(d?.candidates||[]).map(x=>({lat:+x.location.y,lon:+x.location.x,name:String(x.address||'Place'),detail:String(x.address||''),provider:'ARCGIS'}))};
 const nom=async()=>{const d=await json(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&q=${encodeURIComponent(q)}`,7000);return(d||[]).map(x=>({lat:+x.lat,lon:+x.lon,name:String(x.display_name||'Place').split(',')[0],detail:String(x.display_name||''),provider:'NOMINATIM'}))};
 for(const fn of [photon,arc,nom]){try{const xs=(await fn()).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon));if(xs.length)return xs}catch{}}
 return [];
}
function renderMap(xs){const r=$('#mapResults'),f=$('#mapFrame');if(!r||!f)return;const places=xs||[];if(!places.length){r.innerHTML='<div class="empty">NO GEO RESULT · ALL PROVIDERS FAILED</div>';return}r.innerHTML=places.map((x,i)=>`<button class="place-result jv4-place" data-jv4-place="${i}"><strong>${esc(x.name)}</strong><small>${esc(x.detail)}</small></button>`).join('')+`<div class="jv4-provider">GEO PROVIDER · PHOTON → ARCGIS → NOMINATIM</div>`;const show=x=>{const dx=.035,dy=.025;f.innerHTML=`<iframe title="JARVIS OpenStreetMap" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${x.lon-dx},${x.lat-dy},${x.lon+dx},${x.lat+dy}&layer=mapnik&marker=${x.lat},${x.lon}"></iframe>`};$$('.jv4-place',r).forEach(b=>b.onclick=()=>show(places[+b.dataset.jv4Place]));show(places[0])}
async function searchMap(q){const query=String(q||$('#mapQuery')?.value||'').trim();if(!query)return;const i=$('#mapQuery');if(i)i.value=query;const r=$('#mapResults');if(r)r.innerHTML='<div class="empty">JARVIS GEO CORE · RESOLVING…</div>';renderMap(await mapProviders(query))}
window.jarvisMapSearch=searchMap;
function answerBox(){let b=$('#jv4SearchAnswer')||$('#jv3SearchAnswer');if(!b){const h=$('.search-workspace');if(h){b=document.createElement('section');b.id='jv4SearchAnswer';b.className='jv4-answer';h.appendChild(b)}}return b}
async function knowledge(q,b=answerBox()){
 const query=String(q||'').trim();if(!query||!b)return;b.style.display='block';b.innerHTML='<div class="jv4-searching">JARVIS INTELLIGENCE CORE · SEARCHING…</div>';let text='';let items=[];
 try{const d=await json(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1&no_redirect=1`,7000);text=String(d.AbstractText||d.Answer||d.Definition||'');items=(d.RelatedTopics||[]).flatMap(x=>x.Topics||[x]).filter(x=>x?.Text).slice(0,8).map(x=>({title:String(x.Text).split(' - ')[0],snippet:String(x.Text),url:x.FirstURL||''}))}catch{}
 if(!text&&!items.length)try{const d=await json(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=8`,7000);items=(d?.query?.search||[]).map(x=>({title:x.title,snippet:String(x.snippet||'').replace(/<[^>]+>/g,' '),url:`https://en.wikipedia.org/wiki/${encodeURIComponent(String(x.title).replace(/ /g,'_'))}`}))}catch{}
 b.innerHTML=`<div class="jv4-answer-head"><span>JARVIS ANSWER</span><strong>IN-HOUSE · ${esc(query)}</strong></div>${text?`<p class="jv4-answer-text">${esc(text)}</p>`:''}<div class="jv4-results">${items.map(x=>x.url?`<a class="jv4-result" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(x.title)}</strong><p>${esc(x.snippet)}</p></a>`:`<article class="jv4-result"><strong>${esc(x.title)}</strong><p>${esc(x.snippet)}</p></article>`).join('')}</div>${!text&&!items.length?'<p class="jv4-answer-text">No in-house result. Use SEARCH INTERNET for an explicit external fallback.</p>':''}`
}
async function dashboardAnswer(q){const r=$('#jarvisReply');if(!r)return;r.innerHTML='<span class="jv4-command-source">JARVIS knowledge layer · IN-HOUSE</span><br>Searching…';let text='';try{const d=await json(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`,7000);text=String(d.AbstractText||d.Answer||d.Definition||'')}catch{}r.innerHTML=`<span class="jv4-command-source">JARVIS knowledge layer · IN-HOUSE</span><br>${esc(text||'No in-house answer returned. Use SEARCH INTERNET for an explicit external fallback.')}`}
function routeCommand(q){const l=String(q).toLowerCase();if(/\b(video|videos|youtube|movie|movies)\b/.test(l)){document.querySelector('button.nav[data-app="media"]')?.click();setTimeout(()=>searchVideo(q),50);return true}if(/\b(map|maps|navigate|location|directions)\b/.test(l)){document.querySelector('button.nav[data-app="maps"]')?.click();setTimeout(()=>searchMap(q.replace(/\b(show|open|find|maps?|navigate|location|directions)\b/gi,'').trim()||q),50);return true}return false}
document.addEventListener('click',e=>{
 const t=e.target?.closest?.('#videoSearch,[data-video-provider],.jv4-video-card,.jvc-card,#playVideo,#mapSearch,#webSearch,.jmc-action');if(!t)return;
 if(t.matches('#videoSearch')){e.preventDefault();e.stopImmediatePropagation();void searchVideo($('#videoQuery')?.value);return}
 if(t.matches('[data-video-provider]')){e.preventDefault();e.stopImmediatePropagation();if(t.dataset.videoProvider==='trending')void trending();else void searchVideo($('#videoQuery')?.value);return}
 if(t.matches('.jv4-video-card,.jvc-card')){e.preventDefault();e.stopImmediatePropagation();void play(t.dataset.jv4Video||t.dataset.jvcId||'');return}
 if(t.matches('#playVideo')){e.preventDefault();e.stopImmediatePropagation();const raw=$('#videoUrl')?.value||'',id=idFrom(raw);if(id)play(id);else if(!playDirect(raw))mediaState('READY · PASTE A YOUTUBE URL OR VIDEO ID');return}
 if(t.matches('#mapSearch')){e.preventDefault();e.stopImmediatePropagation();void searchMap($('#mapQuery')?.value);return}
 if(t.matches('#webSearch')){e.preventDefault();e.stopImmediatePropagation();void knowledge($('#webQuery')?.value);return}
 if(t.matches('.jmc-action')&&t.dataset.jv3Intent==='research'){e.preventDefault();e.stopImmediatePropagation();document.querySelector('button.nav[data-app="web"]')?.click();setTimeout(()=>{const b=answerBox();if(b)b.innerHTML='<div class="jv4-searching">JARVIS RESEARCH · READY</div>'},80);return}
},true);
document.addEventListener('submit',e=>{if(e.target?.id!=='commandForm')return;e.preventDefault();e.stopImmediatePropagation();const q=$('#commandInput')?.value?.trim()||'';if(!q)return;if(!routeCommand(q))void dashboardAnswer(q)},true);
document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;if(e.target?.matches?.('#videoQuery')){e.preventDefault();e.stopImmediatePropagation();void searchVideo(e.target.value)}else if(e.target?.matches?.('#mapQuery')){e.preventDefault();e.stopImmediatePropagation();void searchMap(e.target.value)}else if(e.target?.matches?.('#webQuery')){e.preventDefault();e.stopImmediatePropagation();void knowledge(e.target.value)}},true);
// When the SPA replaces the workspace, keep the authority attached without timers that repaint the application.
const mo=new MutationObserver(()=>{const p=$('#jarvisPlayer');if(p&&!p.querySelector('iframe,video')){const u=$('#videoUrl')?.value||'';const id=idFrom(u);if(id)play(id)}});mo.observe(document.documentElement,{childList:true,subtree:true});
})();