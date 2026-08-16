(() => {
  'use strict';

  const PIPED = ['https://pipedapi.kavin.rocks','https://pipedapi.adminforge.de','https://api.piped.yt','https://pipedapi.drgns.space','https://pipedapi.owo.si','https://pipedapi.reallyaweso.me'];
  const INVIDIOUS = ['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com'];
  const TIMEOUT = 5000;
  let installedFor = null;
  let generation = 0;

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const idOf = raw => { const v=String(raw||'').trim(); if(/^[A-Za-z0-9_-]{11}$/.test(v))return v; try{const u=new URL(v);if(u.hostname==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||null;if(u.hostname.endsWith('youtube.com'))return u.searchParams.get('v')||(()=>{const p=u.pathname.split('/').filter(Boolean),i=p.findIndex(x=>['shorts','embed','live'].includes(x));return i>=0?p[i+1]:null;})();}catch{}return null; };
  const duration = n => {n=Number(n)||0;const h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=Math.floor(n%60);return h?`${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${m}:${String(s).padStart(2,'0')}`;};
  const fetchJson = async url => {const c=new AbortController(),t=setTimeout(()=>c.abort(),TIMEOUT);try{const r=await fetch(url,{signal:c.signal,cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw Error(String(r.status));return r.json();}finally{clearTimeout(t);}};
  const race = urls => Promise.any(urls.map(async url=>({data:await fetchJson(url),url})));
  const thumb = x => x.videoThumbnails?.find(t=>/maxres|high|medium/i.test(t.quality||''))?.url||x.videoThumbnails?.[0]?.url||x.thumbnail||(x.videoId?`https://i.ytimg.com/vi/${x.videoId}/hqdefault.jpg`:'');
  const normalize = (x,source,gateway) => {const id=x.videoId||idOf(x.url);if(!id)return null;return {id,title:x.title||'Untitled video',author:x.author||x.uploader||x.uploaderName||'YouTube',views:x.viewCountText||x.views||(x.viewCount?`${Number(x.viewCount).toLocaleString()} views`:''),duration:x.lengthSeconds?duration(x.lengthSeconds):(x.duration||''),published:x.publishedText||x.uploadedDate||'',thumbnail:thumb(x),source,gateway};};

  async function searchVideos(q){
    // Piped is the primary browser transport because its public API is intended
    // for frontend use. Invidious is a secondary fallback for instances that
    // permit browser-origin requests.
    try{const {data,url}=await race(PIPED.map(b=>`${b}/search?q=${encodeURIComponent(q)}&filter=videos&region=IN`));const raw=Array.isArray(data)?data:(data.items||[]);const items=raw.map(x=>normalize(x,'Piped',new URL(url).origin)).filter(Boolean);if(items.length)return items;}catch{}
    try{const {data,url}=await race(INVIDIOUS.map(b=>`${b}/api/v1/search?q=${encodeURIComponent(q)}&type=video&region=IN&page=1`));const items=(Array.isArray(data)?data:[]).map(x=>normalize(x,'Invidious',new URL(url).origin)).filter(Boolean);if(items.length)return items;}catch{}
    throw Error('No videos');
  }

  async function trending(){
    try{const {data,url}=await race(PIPED.map(b=>`${b}/trending?region=IN`));const a=(Array.isArray(data)?data:[]).map(x=>normalize(x,'Piped',new URL(url).origin)).filter(Boolean);if(a.length)return a;}catch{}
    try{const {data,url}=await race(INVIDIOUS.map(b=>`${b}/api/v1/trending?region=IN&type=default`));const a=(Array.isArray(data)?data:[]).map(x=>normalize(x,'Invidious',new URL(url).origin)).filter(Boolean);if(a.length)return a;}catch{}
    return [];
  }

  async function stream(item){
    const bases=[item.gateway,...PIPED,...INVIDIOUS].filter(Boolean);
    return Promise.any([...new Set(bases)].map(async b=>{if(b.includes('piped')){const d=await fetchJson(`${b}/streams/${encodeURIComponent(item.id)}`);const a=(d.videoStreams||[]).filter(x=>x.url&&!x.videoOnly).sort((x,y)=>(y.height||0)-(x.height||0));const s=a.find(x=>/video\/mp4/i.test(x.mimeType||''))||a[0];if(!s?.url)throw Error('no stream');return {url:s.url,mime:s.mimeType||'video/mp4',quality:s.quality||`${s.height||''}p`,thumb:d.thumbnailUrl||item.thumbnail};}const d=await fetchJson(`${b}/api/v1/videos/${encodeURIComponent(item.id)}?region=IN`);const a=(d.formatStreams||[]).filter(x=>x.url).sort((x,y)=>Number((y.qualityLabel||'').replace(/\D/g,''))-Number((x.qualityLabel||'').replace(/\D/g,'')));const s=a[0];if(!s?.url)throw Error('no stream');return {url:s.url,mime:s.type?.split(';')[0]||'video/mp4',quality:s.qualityLabel||'AUTO',thumb:d.videoThumbnails?.[0]?.url||item.thumbnail};}));
  }

  function css(){if(document.querySelector('#jvcStyle'))return;const s=document.createElement('style');s.id='jvcStyle';s.textContent=`.jvc-status{padding:11px 12px;border:1px solid #173545;border-radius:12px;color:#8fb1bd;font-size:.82rem}#videoResults.jvc-results{display:grid;gap:10px;margin-top:12px}.jvc-card{display:grid;grid-template-columns:150px 1fr 34px;gap:12px;align-items:center;width:100%;padding:0;overflow:hidden;text-align:left;border:1px solid #173545;border-radius:14px;background:rgba(3,11,17,.92);color:#d9f7ff;cursor:pointer}.jvc-card:hover{border-color:#49cfff}.jvc-thumb{width:150px;aspect-ratio:16/9;object-fit:cover;background:#020509}.jvc-info{min-width:0;padding:9px 0}.jvc-info strong{display:block;font-size:.88rem;line-height:1.25}.jvc-info small{display:block;color:#7896a3;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jvc-play{color:#5edcff;margin-right:10px}#jarvisPlayer.jvc-player iframe,#jarvisPlayer.jvc-player video{display:block;width:100%;height:min(62vh,560px);border:0;background:#000}.jvc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.jvc-actions button{border:1px solid #244c60;background:#07131b;color:#bdeeff;border-radius:10px;padding:9px 12px;cursor:pointer}.jvc-actions .primary{background:#55d8ff;color:#031018;font-weight:800}@media(max-width:700px){.jvc-card{grid-template-columns:108px 1fr 30px}.jvc-thumb{width:108px}.jvc-info strong{font-size:.8rem}}`;document.head.appendChild(s);}

  function install(){
    const input=document.querySelector('#videoQuery'),oldResults=document.querySelector('#videoResults'),oldPlayer=document.querySelector('#jarvisPlayer'),state=document.querySelector('#mediaState');
    if(!input||!oldResults||!oldPlayer||!state)return false;
    if(installedFor===input)return true;
    if(state.textContent==='CONNECTING')return false;
    installedFor=input;css();
    const results=oldResults.cloneNode(false);results.id='videoResults';results.classList.add('jvc-results');oldResults.replaceWith(results);
    const player=oldPlayer.cloneNode(true);player.id='jarvisPlayer';player.classList.add('jvc-player');oldPlayer.replaceWith(player);
    const side=results.parentElement,status=document.createElement('div');status.id='jvcStatus';status.className='jvc-status';side.insertBefore(status,results);
    const setStatus=t=>{status.textContent=t;state.textContent=String(t).split('·')[0].trim().toUpperCase();};
    const embed=(id,title)=>{player.innerHTML=`<iframe title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1"></iframe>`;setStatus('PLAYING · YOUTUBE PLAYER');};
    const play=async item=>{const token=++generation;setStatus(`RESOLVING · ${item.title}`);player.innerHTML='<div class="player-empty"><span>◌</span><strong>JARVIS VIDEO CORE</strong><small>Preparing the selected video.</small></div>';try{const s=await stream(item);if(token!==generation)return;player.innerHTML=`<video controls autoplay playsinline preload="metadata" poster="${esc(s.thumb||item.thumbnail)}"><source src="${esc(s.url)}" type="${esc(s.mime)}"></video>`;player.querySelector('video')?.addEventListener('error',()=>embed(item.id,item.title),{once:true});setStatus(`PLAYING · ${s.quality||'AUTO'}`);}catch{if(token===generation)embed(item.id,item.title);}};
    const render=(items,label)=>{results.innerHTML=items.slice(0,12).map(x=>`<button class="jvc-card" data-id="${esc(x.id)}"><img class="jvc-thumb" loading="lazy" src="${esc(x.thumbnail)}" alt=""><span class="jvc-info"><strong>${esc(x.title)}</strong><small>${esc(x.author)}${x.views?` · ${esc(x.views)}`:''}</small><small>${esc(x.duration||'')}${x.published?` · ${esc(x.published)}`:''}</small></span><b class="jvc-play">▶</b></button>`).join('');results.querySelectorAll('[data-id]').forEach(b=>{const x=items.find(i=>i.id===b.dataset.id);b.onclick=()=>x&&play(x);});setStatus(`${items.length} RESULTS · ${label}`);};
    const doSearch=async()=>{const q=input.value.trim();if(!q){setStatus('READY · ENTER A VIDEO SEARCH TERM');return;}const token=++generation;results.innerHTML='<div class="jvc-status">SEARCHING VIDEO INDEX…</div>';setStatus(`SEARCHING · ${q}`);try{const items=await searchVideos(q);if(token===generation)render(items,items[0]?.source||'VIDEO SEARCH');}catch{if(token!==generation)return;results.innerHTML='<div class="jvc-status">SEARCH GATEWAYS ARE BUSY · OPEN THE SAME QUERY IN YOUTUBE</div><div class="jvc-actions"><button class="primary" id="jvcYoutube">OPEN YOUTUBE RESULTS</button></div>';setStatus('READY · EXTERNAL SEARCH AVAILABLE');document.querySelector('#jvcYoutube')?.addEventListener('click',()=>window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,'_blank','noopener,noreferrer'));}};
    const searchButton=document.querySelector('#videoSearch');if(searchButton){const b=searchButton.cloneNode(true);searchButton.replaceWith(b);b.onclick=doSearch;}
    input.onkeydown=e=>{if(e.key==='Enter')doSearch();};
    document.querySelectorAll('[data-video-provider]').forEach(old=>{const b=old.cloneNode(true);old.replaceWith(b);b.onclick=()=>{if(b.dataset.videoProvider==='trending')trending().then(a=>a.length?render(a,'INDIA TRENDING'):setStatus('READY · SEARCH FOR A VIDEO'));else if(input.value.trim())doSearch();else{input.focus();setStatus('READY · ENTER A VIDEO SEARCH TERM');}};});
    const playButton=document.querySelector('#playVideo');if(playButton){const b=playButton.cloneNode(true);playButton.replaceWith(b);b.onclick=()=>{const raw=document.querySelector('#videoUrl')?.value?.trim()||'',id=idOf(raw);if(id)play({id,title:'YouTube video',author:'YouTube',thumbnail:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`,source:'direct'});else if(/^https?:\/\//i.test(raw)){player.innerHTML=`<video controls autoplay playsinline src="${esc(raw)}"></video>`;setStatus('PLAYING · DIRECT MEDIA URL');}else setStatus('READY · PASTE A YOUTUBE URL OR VIDEO ID');};}
    results.innerHTML='<div class="jvc-status">READY · SEARCH ANY TOPIC TO FIND VIDEOS</div>';setStatus('READY · SEARCH FOR A VIDEO');return true;
  }

  function boot(){let tries=0;const timer=setInterval(()=>{tries++;if(install()||tries>120)clearInterval(timer);},100);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
