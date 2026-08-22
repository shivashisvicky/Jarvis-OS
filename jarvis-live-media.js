(() => {
  const API_ENDPOINT = 'https://jarvis-media.shivashisvicky112.workers.dev/api/search';
  const CACHE_TTL_MS = 10 * 60 * 1000;
  const MAX_RESULTS = 12;
  const HISTORY_KEY = 'jarvis-media-history-v1';
  const PLAYER_ORIGIN = 'https://shivashisvicky.github.io';
  let pendingVoiceQuery = '';
  let activeSearch = null;
  let activeController = null;
  let ytFrame = null;
  let ytReady = false;
  let ytReadyQueue = [];
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#039;' }[ch]));
  const normalize = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  function videoId(raw) { try { const url=new URL(raw); const host=url.hostname.replace(/^www\./,'').toLowerCase(); if(host==='youtu.be')return url.pathname.split('/').filter(Boolean)[0]||null; if(host==='youtube.com'||host==='m.youtube.com'){if(url.pathname==='/watch')return url.searchParams.get('v');const parts=url.pathname.split('/').filter(Boolean);if(['shorts','live','embed'].includes(parts[0]))return parts[1]||null;}} catch {} return /^[A-Za-z0-9_-]{11}$/.test(String(raw).trim())?String(raw).trim():null; }
  function scrollPlayerIntoView(host){try{host.scrollIntoView({behavior:'smooth',block:'center'});}catch{}}

  // iOS Safari can block scripted playback with audio in a cross-origin iframe.
  // The reliable web-compatible path is to make the embedded YouTube player
  // autoplay muted. The user's tap selects the video, and the video itself then
  // starts without requiring a second tap on YouTube's center PLAY control.
  function ensureYTFrame(){
    const host=document.querySelector('#jarvisPlayer');
    if(!host)return null;
    if(ytFrame && ytFrame.isConnected)return ytFrame;
    ytReady=false;
    const frame=document.createElement('iframe');
    frame.title='JARVIS YouTube player';
    frame.referrerPolicy='strict-origin-when-cross-origin';
    frame.loading='eager';
    frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen=true;
    frame.src=`https://www.youtube-nocookie.com/embed/0?autoplay=1&mute=1&controls=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(PLAYER_ORIGIN)}`;
    frame.style.width='100%';
    frame.style.height='100%';
    frame.style.border='0';
    host.replaceChildren(frame);
    ytFrame=frame;
    const readyHandler=event=>{
      try{
        const data=JSON.parse(event.data);
        if(event.origin==='https://www.youtube-nocookie.com' && data.event==='onReady'){
          ytReady=true;
          const queue=ytReadyQueue.splice(0);
          queue.forEach(fn=>fn());
        }
      }catch{}
    };
    window.addEventListener('message',readyHandler);
    frame.addEventListener('load',()=>{
      window.setTimeout(()=>{if(!ytReady)ytReady=true;const queue=ytReadyQueue.splice(0);queue.forEach(fn=>fn())},800);
    },{once:true});
    return frame;
  }
  function ytCommand(func,args=[]){
    const send=()=>{try{ytFrame?.contentWindow?.postMessage(JSON.stringify({event:'command',func,args}), 'https://www.youtube-nocookie.com');}catch{}};
    if(ytReady)send();else ytReadyQueue.push(send);
  }
  function player(id){
    const host=document.querySelector('#jarvisPlayer');
    if(!host)return;
    host.dataset.videoId=id;
    const frame=ensureYTFrame();
    if(!frame)return;
    scrollPlayerIntoView(host);

    // Do not rely on loadVideoById/playVideo for the initial transition on iOS.
    // Re-navigate the already-present iframe to the selected video with muted
    // autoplay. Safari permits muted autoplay, so the first card tap is enough.
    frame.src=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&mute=1&controls=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(PLAYER_ORIGIN)}`;
    ytReady=false;
    frame.addEventListener('load',()=>{
      // Best-effort unmute. If Safari's autoplay policy refuses it, playback
      // still continues rather than falling back to the center PLAY button.
      ytReady=true;
      ytCommand('playVideo',[]);
      window.setTimeout(()=>ytCommand('unMute',[]),250);
    },{once:true});
  }
  function installCardStyles(){if(document.querySelector('#jarvis-live-media-style'))return;const style=document.createElement('style');style.id='jarvis-live-media-style';style.textContent=`#videoResults{display:grid;gap:10px;align-content:start}#videoResults .jvc-card{display:grid;grid-template-columns:132px 1fr;gap:12px;width:100%;padding:10px;border:1px solid #214454;border-radius:10px;background:rgba(5,18,26,.9);color:#d9f5ff;text-align:left;cursor:pointer}#videoResults .jvc-card:hover{border-color:#55d8ff;transform:translateY(-1px)}#videoResults .jvc-card img{width:132px;height:74px;object-fit:cover;border-radius:6px;background:#07141c}#videoResults .jvc-card strong{display:block;font-size:14px;line-height:1.35;margin-bottom:6px}#videoResults .jvc-card small{display:block;color:#7898a5;line-height:1.3}#videoResults .jvc-card .play{display:inline-block;margin-top:8px;padding:5px 10px;border:1px solid #55d8ff;border-radius:5px;background:#55d8ff;color:#031018;font-size:11px;font-weight:800;letter-spacing:.08em}.jvc-tools{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 12px}.jvc-chip{border:1px solid #214454;border-radius:999px;background:rgba(5,18,26,.8);color:#9fc0ca;padding:6px 10px;font-size:11px;cursor:pointer}.jvc-chip:hover{border-color:#55d8ff;color:#d9f5ff}.jvc-clear{margin-left:auto;border:0;background:transparent;color:#6f8b95;font-size:11px;cursor:pointer}.jvc-clear:hover{color:#55d8ff}`;document.head.appendChild(style)}
  function cacheKey(query){return `jarvis-youtube:${normalize(query)}`}
  function readCache(query){try{const raw=sessionStorage.getItem(cacheKey(query));if(!raw)return null;const entry=JSON.parse(raw);if(!entry?.timestamp||Date.now()-entry.timestamp>CACHE_TTL_MS||!Array.isArray(entry.results))return null;return entry.results}catch{return null}}
  function writeCache(query,results){try{sessionStorage.setItem(cacheKey(query),JSON.stringify({timestamp:Date.now(),results}))}catch{}}
  function readHistory(){try{const value=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(value)?value.filter(x=>typeof x==='string').slice(0,6):[]}catch{return []}}
  function writeHistory(query){const clean=String(query||'').trim().replace(/\s+/g,' ');if(!clean)return;try{const next=[clean,...readHistory().filter(x=>normalize(x)!==normalize(clean))].slice(0,6);localStorage.setItem(HISTORY_KEY,JSON.stringify(next));renderHistory(next)}catch{}}
  function renderHistory(items=readHistory()){const input=document.querySelector('#videoQuery'),host=input?.parentElement;if(!host)return;installCardStyles();let tools=document.querySelector('#jvc-media-tools');if(!tools){tools=document.createElement('div');tools.id='jvc-media-tools';tools.className='jvc-tools';host.insertAdjacentElement('afterend',tools)}tools.innerHTML='';if(items.length){const label=document.createElement('span');label.className='jvc-chip';label.textContent='RECENT';label.style.cursor='default';tools.appendChild(label);items.forEach(q=>{const chip=document.createElement('button');chip.type='button';chip.className='jvc-chip';chip.textContent=q.length>28?`${q.slice(0,28)}…`:q;chip.addEventListener('click',()=>{if(input){input.value=q;void search(q)}});tools.appendChild(chip)});const clear=document.createElement('button');clear.type='button';clear.className='jvc-clear';clear.textContent='CLEAR';clear.addEventListener('click',()=>{try{localStorage.removeItem(HISTORY_KEY)}catch{}renderHistory([])});tools.appendChild(clear)}}
  async function backendSearch(clean,signal){const response=await fetch(`${API_ENDPOINT}?q=${encodeURIComponent(clean)}`,{cache:'no-store',headers:{Accept:'application/json'},signal});const data=await response.json().catch(()=>({}));if(!response.ok){const e=new Error(data?.error||`Media search service ${response.status}`);e.status=response.status;e.code=data?.code;throw e}return Array.isArray(data.results)?data.results:[]}
  function renderResults(results){const host=document.querySelector('#videoResults');if(!host)return;if(!results.length)throw new Error('No live YouTube results');installCardStyles();host.innerHTML=results.slice(0,MAX_RESULTS).map(item=>`<button type="button" class="jvc-card" data-jvc-id="${esc(item.id)}"><img loading="lazy" src="${esc(item.thumbnail||'')}" alt=""><span><strong>${esc(item.title||'YouTube video')}</strong><small>${esc(item.channel||'YouTube')}</small><span class="play">PLAY</span></span></button>`).join('');ensureYTFrame()}
  async function search(query){const state=document.querySelector('#mediaState'),results=document.querySelector('#videoResults');if(!state||!results)return;const clean=String(query||'').trim(),key=normalize(clean);if(!key)return;if(activeSearch?.key===key)return activeSearch.promise;if(activeController)activeController.abort();const cached=readCache(clean);if(cached?.length){renderResults(cached);state.textContent=`${cached.length} CACHED RESULTS`;writeHistory(clean);return cached}state.textContent='LIVE SEARCH';results.innerHTML='<div class="empty">Searching YouTube…</div>';const controller=new AbortController();activeController=controller;const timeout=window.setTimeout(()=>controller.abort(),12000);const promise=backendSearch(clean,controller.signal).then(items=>{if(!items.length)throw new Error('No live YouTube results');renderResults(items);writeCache(clean,items);writeHistory(clean);state.textContent=`${Math.min(items.length,MAX_RESULTS)} LIVE RESULTS`;return items}).catch(error=>{if(error?.name==='AbortError')return [];state.textContent=error?.status===429?'QUOTA LIMITED':'DEGRADED';results.innerHTML=`<div class="empty">${esc(error?.message||'Live YouTube search unavailable. Try again.')}</div>`;return []}).finally(()=>{window.clearTimeout(timeout);if(activeSearch?.key===key)activeSearch=null;if(activeController===controller)activeController=null});activeSearch={key,promise};return promise}
  function isDirectUrl(value){return Boolean(videoId(value))}
  function install(){if(window.__JARVIS_LIVE_MEDIA__)return;window.__JARVIS_LIVE_MEDIA__=true;renderHistory();ensureYTFrame();window.addEventListener('jarvis:media',event=>{const query=String(event.detail?.query??'').trim();pendingVoiceQuery=query;const input=document.querySelector('#videoQuery');if(input&&query){input.value=query;void search(query)}});document.addEventListener('click',event=>{const button=event.target?.closest?.('#videoSearch');if(!button)return;const input=document.querySelector('#videoQuery'),query=input?.value?.trim()||'';if(!query||isDirectUrl(query))return;event.preventDefault();event.stopImmediatePropagation();void search(query)},true);document.addEventListener('keydown',event=>{if(event.key!=='Enter'||!event.target?.matches?.('#videoQuery'))return;const query=event.target.value.trim();if(!query||isDirectUrl(query))return;event.preventDefault();void search(query)},true);document.addEventListener('click',event=>{const card=event.target?.closest?.('[data-jvc-id]');if(card)player(card.getAttribute('data-jvc-id'))});const runPending=()=>{if(!pendingVoiceQuery)return;const input=document.querySelector('#videoQuery');if(input){input.value=pendingVoiceQuery;const q=pendingVoiceQuery;pendingVoiceQuery='';void search(q)}};runPending();new MutationObserver(runPending).observe(document.documentElement,{childList:true,subtree:true})}
  window.addEventListener('jarvis:media',event=>{pendingVoiceQuery=String(event.detail?.query??'').trim()});if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();