(() => {
  'use strict';

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const app = () => document.querySelector('.workspace');
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function styles() {
    if (document.querySelector('#jarvisFinalFixStyle')) return;
    const s = document.createElement('style'); s.id = 'jarvisFinalFixStyle';
    s.textContent = `
      .jff-console{margin:0 0 22px;padding:22px;border:1px solid rgba(126,205,255,.16);border-radius:18px;background:linear-gradient(135deg,rgba(12,25,38,.9),rgba(4,10,16,.96));box-shadow:0 18px 60px rgba(0,0,0,.18)}
      .jff-console h2{margin:2px 0 4px;letter-spacing:.08em}.jff-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:18px}.jff-action{min-height:76px;text-align:left;padding:13px;border:1px solid rgba(126,205,255,.12);border-radius:12px;background:rgba(255,255,255,.025);color:inherit;cursor:pointer}.jff-action:hover{border-color:#55d6ff;transform:translateY(-1px)}
      .jff-answer{margin-top:14px;padding:16px;border:1px solid rgba(126,205,255,.14);border-radius:14px;background:rgba(2,8,14,.7);line-height:1.55}.jff-answer h3{margin:0 0 8px}.jff-answer a{color:#79defa}.jff-meta{font-size:11px;color:#7896a4;margin-top:8px}
      .jff-video-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.jff-video{display:grid;grid-template-columns:140px 1fr;gap:10px;text-align:left;padding:0;border:1px solid #173545;border-radius:14px;overflow:hidden;background:rgba(3,11,17,.92);color:#d9f7ff;cursor:pointer}.jff-video img{width:140px;height:79px;object-fit:cover;background:#020509}.jff-video div{padding:10px 8px 8px 0;min-width:0}.jff-video strong{display:block;font-size:.84rem;line-height:1.3}.jff-video small{display:block;color:#7896a4;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jff-video:hover{border-color:#49cfff}
      .jff-video-status{padding:11px 12px;border:1px solid #173545;border-radius:12px;color:#8fb1bd;margin-top:12px}.jff-player{min-height:260px;border:1px solid #20495c;border-radius:16px;overflow:hidden;background:#000;margin-top:14px}.jff-player iframe,.jff-player video{display:block;width:100%;height:min(62vh,560px);border:0;background:#000}.jff-player-msg{min-height:260px;display:grid;place-items:center;text-align:center;padding:25px;color:#8fb1bd}.jff-player-msg strong{display:block;color:#d9f7ff;margin-bottom:5px}
      .jff-map{min-height:560px;border-radius:16px;overflow:hidden;position:relative}.jff-map-host{height:560px}.jff-map .leaflet-container{height:100%;background:#071018}.jff-map-attribution{position:absolute;right:7px;bottom:4px;z-index:500;font-size:10px;background:rgba(2,7,11,.75);padding:3px 6px;color:#b8cbd2}.jff-map-results{display:grid;gap:7px;margin-top:10px}.jff-place{padding:10px;text-align:left;border:1px solid #173545;border-radius:10px;background:#07131b;color:#c9f5ff;cursor:pointer}.jff-place:hover{border-color:#55d6ff}
      .jff-pad{display:grid;grid-template-columns:repeat(3,46px);gap:6px;justify-content:center;margin:12px 0}.jff-pad button{height:42px;border:1px solid #2b6178;background:#071923;color:#c9f5ff;border-radius:10px;font-size:18px;touch-action:manipulation}.jff-pad .blank{visibility:hidden}.jff-snake{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:start}.jff-snake canvas{max-width:100%;height:auto;border-radius:14px;border:1px solid #173b4d}.jff-snake-controls{display:grid;gap:8px;justify-items:center}.jff-snake-controls button{min-width:54px}.jff-game-help{color:#7896a4;font-size:11px;text-align:center}
      @media(max-width:760px){.jff-actions{grid-template-columns:1fr 1fr}.jff-video-results{grid-template-columns:1fr}.jff-video{grid-template-columns:112px 1fr}.jff-video img{width:112px;height:63px}.jff-map,.jff-map-host{min-height:430px;height:430px}.jff-snake{grid-template-columns:1fr}.jff-snake-controls{grid-template-columns:repeat(3,54px);display:grid}.jff-snake-controls .up{grid-column:2}.jff-snake-controls .left{grid-column:1}.jff-snake-controls .down{grid-column:2}.jff-snake-controls .right{grid-column:3}}
    `;
    document.head.appendChild(s);
  }

  function ensureMissionConsole() {
    if (document.querySelector('.jarvis-mission-console,.jff-console')) return;
    const home = document.querySelector('.command-center'); if (!home) return;
    const el = document.createElement('section'); el.className = 'jarvis-mission-console jff-console panel';
    el.innerHTML = `<div><p class="eyebrow">JARVIS / ORCHESTRATION</p><h2>JARVIS INTELLIGENCE CORE</h2><p class="sub">What should JARVIS work on?</p></div><div class="jff-actions"><button class="jff-action" data-jff="news"><b>01 · TODAY'S SIGNAL</b><small>Build a concise intelligence brief</small></button><button class="jff-action" data-jff="media"><b>02 · FIND VIDEO</b><small>Search and play media inside JARVIS</small></button><button class="jff-action" data-jff="research"><b>03 · RESEARCH</b><small>Search with the central intelligence layer</small></button><button class="jff-action" data-jff="api"><b>04 · ENGINEERING</b><small>Open the API engineering workspace</small></button></div>`;
    home.insertBefore(el, home.querySelector('.command-surface') || home.firstChild);
    el.querySelectorAll('[data-jff]').forEach(b => b.onclick = () => {
      const k = b.dataset.jff;
      if (k === 'media') clickApp('media');
      else if (k === 'api') clickApp('api');
      else if (k === 'research') clickApp('web');
      else { const input = document.querySelector('#commandInput'); if (input) { input.value = 'latest AI news'; document.querySelector('#commandForm')?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); } }
    });
  }

  function clickApp(id) {
    const b = document.querySelector(`button.nav[data-app="${id}"]`); if (b) { b.click(); return true; }
    return false;
  }

  function normalizeNewsNav() {
    const buttons = [...document.querySelectorAll('button.nav[data-app="news"]')];
    if (buttons.length > 1) buttons.slice(1).forEach(b => b.remove());
    const b = buttons[0]; if (!b) return;
    b.id = 'jarvisNewsNav'; b.title = 'News';
    b.onclick = e => { e.preventDefault(); e.stopImmediatePropagation(); renderNews(); };
  }

  async function centralSearch(q) {
    const query = String(q || '').trim(); if (!query) return;
    let answer = null, source = '';
    const local = [
      ['maps','open maps','maps'],['map','maps','maps'],['video','media','media'],['youtube','media','media'],['play','media','media'],
      ['api','api lab','api'],['rest','api lab','api'],['sftp','remote','remote'],['files','files','files'],['notes','notes','notes'],['calculator','calculator','calculator'],['calc','calculator','calculator'],['games','snake','snake'],['arcade','snake','snake']
    ];
    const low = query.toLowerCase();
    for (const [needle,label,id] of local) if (low.includes(needle)) { answer = `I can handle that locally. Opening ${label}.`; showAnswer(answer,'JARVIS LOCAL CORE'); clickApp(id); return; }
    const host = app(); if (!host) return;
    let box = document.querySelector('#jffCentralAnswer');
    if (!box) { box=document.createElement('div'); box.id='jffCentralAnswer'; box.className='jff-answer'; const surface=host.querySelector('.command-surface'); (surface||host).appendChild(box); }
    box.innerHTML='<strong>JARVIS is thinking…</strong><div class="jff-meta">Local index → knowledge services → internet fallback</div>';
    try {
      const r = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,{cache:'no-store'});
      if (r.ok) { const d=await r.json(); answer=d.AbstractText || d.Answer || d.Definition; source=d.AbstractSource || d.AbstractURL || ''; }
    } catch {}
    if (!answer) {
      try { const r=await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/\s+/g,'_'))}`,{cache:'no-store'}); if(r.ok){const d=await r.json(); if(d.extract) {answer=d.extract; source=d.content_urls?.desktop?.page||'';}} } catch {}
    }
    if (answer) { box.innerHTML=`<h3>${esc(query)}</h3><div>${esc(answer)}</div>${source?`<div class="jff-meta">Source: <a href="${esc(source)}" target="_blank" rel="noopener noreferrer">${esc(source)}</a></div>`:''}`; return; }
    box.innerHTML=`<h3>Internet search required</h3><div>JARVIS could not answer from its local/knowledge layer, so the query is being handed to the configured web search provider.</div><div class="jff-meta"><button id="jffWebFallback" class="primary">SEARCH THE WEB</button></div>`;
    document.querySelector('#jffWebFallback')?.addEventListener('click',()=>{ const url=`https://www.bing.com/search?q=${encodeURIComponent(query)}`; window.open(url,'_blank','noopener,noreferrer'); });
  }

  function showAnswer(text,title){let box=document.querySelector('#jffCentralAnswer');if(!box){const host=app();if(!host)return;box=document.createElement('div');box.id='jffCentralAnswer';box.className='jff-answer';host.querySelector('.command-surface')?.appendChild(box)}box.innerHTML=`<h3>${esc(title)}</h3><div>${esc(text)}</div>`}

  function interceptCentralCommand() {
    const form=document.querySelector('#commandForm'); if(!form || form.dataset.jffBound) return;
    form.dataset.jffBound='1';
    form.addEventListener('submit',e=>{ const input=form.querySelector('#commandInput'); const q=input?.value?.trim()||''; if(!q)return; if(/^(open|launch|go to)\s+(maps|media|api|sftp|files|notes|calculator|arcade|search)$/i.test(q))return; if(/^(search|look up|find|what is|who is|where is|how|why|latest|news|tell me|show me)\b/i.test(q)){e.preventDefault();e.stopImmediatePropagation();centralSearch(q.replace(/^search\s+/i,''));}},true);
  }

  function loadLeaflet(){
    if(window.L) return Promise.resolve();
    if(document.querySelector('#jffLeaflet')) return new Promise(r=>{const t=setInterval(()=>{if(window.L){clearInterval(t);r()}},50);setTimeout(()=>{clearInterval(t);r()},4000)});
    return new Promise(resolve=>{const css=document.createElement('link');css.rel='stylesheet';css.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(css);const s=document.createElement('script');s.id='jffLeaflet';s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.onload=()=>resolve();s.onerror=()=>resolve();document.head.appendChild(s);});
  }

  async function setupModernMaps(){
    const w=app(), q=w?.querySelector('#mapQuery'); if(!w||!q||w.dataset.jffMap==='1')return; w.dataset.jffMap='1';
    await loadLeaflet(); if(!window.L)return;
    const frame=w.querySelector('#mapFrame'); if(!frame)return;
    frame.classList.add('jff-map'); frame.innerHTML='<div id="jffMapHost" class="jff-map-host"></div><div class="jff-map-attribution">© OpenStreetMap contributors</div>';
    const map=L.map('jffMapHost',{zoomControl:true,preferCanvas:true}).setView([20.2961,85.8245],12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
    let marker=null;
    const search=async term=>{const raw=term.trim();if(!raw)return;const candidates=[raw,`${raw}, Bhubaneswar, Odisha, India`,`${raw}, Odisha, India`];let places=[];for(const c of candidates){try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(c)}`,{cache:'force-cache'});if(r.ok){places=await r.json();if(places.length)break}}catch{}}const host=w.querySelector('#mapResults');if(!places.length){if(host)host.innerHTML='<div class="empty">No place found. Try “Jagannath Nagar, Bhubaneswar”.</div>';return}if(host)host.innerHTML=places.map((p,i)=>`<button class="jff-place" data-i="${i}"><strong>${esc(p.display_name.split(',').slice(0,2).join(', '))}</strong><small>${esc(p.display_name)}</small></button>`).join('');const select=p=>{const lat=Number(p.lat),lon=Number(p.lon);map.setView([lat,lon],16,{animate:true});if(marker)marker.remove();marker=L.marker([lat,lon]).addTo(map).bindPopup(`<strong>${esc(p.display_name.split(',').slice(0,2).join(', '))}</strong>`).openPopup();setTimeout(()=>map.invalidateSize(),100)};host?.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>select(places[Number(b.dataset.i)]));select(places[0]);};
    const btn=w.querySelector('#mapSearch');btn?.addEventListener('click',()=>search(q.value));q.addEventListener('keydown',e=>{if(e.key==='Enter')search(q.value)});w.querySelector('#locateMe')?.addEventListener('click',()=>navigator.geolocation?.getCurrentPosition(p=>{q.value=`${p.coords.latitude},${p.coords.longitude}`;search(q.value)}));
    q.value='Jagannath Nagar, Bhubaneswar'; await search(q.value);
  }

  const PIPED=['https://pipedapi.kavin.rocks','https://pipedapi.tokhmi.xyz','https://pipedapi.moomoo.me','https://pipedapi.syncpundit.io','https://pipedapi.rivo.lol','https://pipedapi.leptons.xyz','https://api-piped.mha.fi','https://piped-api.garudalinux.org'];
  const INVIDIOUS=['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com','https://invidious.tiekoetter.com'];
  const withTimeout=async(url,ms=4500)=>{const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{signal:c.signal,cache:'no-store',headers:{Accept:'application/json'}});if(!r.ok)throw new Error(String(r.status));return await r.json()}finally{clearTimeout(t)}};
  async function videoSearch(q){
    const tasks=[];
    for(const base of PIPED)tasks.push(withTimeout(`${base}/search?q=${encodeURIComponent(q)}&filter=videos&region=IN`).then(d=>({items:Array.isArray(d)?d:(d.items||[]),base})).catch(()=>null));
    for(const base of INVIDIOUS)tasks.push(withTimeout(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1&region=IN`).then(d=>({items:Array.isArray(d)?d:[],base,invidious:true})).catch(()=>null));
    const seen=new Map();for(const p of await Promise.all(tasks)){if(!p)continue;for(const x of p.items||[]){const id=videoId(x.videoId||x.url||'');if(id&&!seen.has(id))seen.set(id,{id,title:x.title||'Untitled video',author:x.uploaderName||x.uploader||x.author||'YouTube',views:x.views||x.viewCountText||'',duration:x.duration||x.lengthSeconds||'',thumb:x.thumbnail||x.thumbnailUrl||`https://i.ytimg.com/vi/${id}/hqdefault.jpg`})}if(seen.size>=18)break}return [...seen.values()].slice(0,18);
  }
  function videoId(raw){const v=String(raw||'').trim();if(/^[A-Za-z0-9_-]{11}$/.test(v))return v;try{const u=new URL(v),h=u.hostname.toLowerCase();if(h==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||null;if(h.endsWith('youtube.com')){const q=u.searchParams.get('v');if(q)return q;const p=u.pathname.split('/').filter(Boolean),i=p.findIndex(x=>['shorts','embed','live'].includes(x));return i>=0?p[i+1]||null:null}}catch{}return null}
  function videoPlayer(id,title){const p=document.querySelector('#jarvisPlayer');if(!p)return;p.classList.add('jff-player');p.innerHTML=`<iframe title="${esc(title)}" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;const state=document.querySelector('#mediaState');if(state)state.textContent='PLAYING · IN-HOUSE PLAYER'}

  async function setupMedia(){
    const w=app(),input=w?.querySelector('#videoQuery'),results=w?.querySelector('#videoResults'),player=w?.querySelector('#jarvisPlayer');if(!w||!input||!results||!player||w.dataset.jffMedia==='1')return;w.dataset.jffMedia='1';
    [...w.querySelectorAll('[data-video-provider="youtube"],[data-video-provider="bing"]')].forEach(b=>b.remove());
    const status=document.createElement('div');status.id='jffVideoStatus';status.className='jff-video-status';results.before(status);status.textContent='READY · IN-HOUSE VIDEO SEARCH';
    const render=items=>{results.classList.add('jff-video-results');results.innerHTML=items.map(x=>`<button class="jff-video" data-id="${esc(x.id)}"><img loading="lazy" src="${esc(x.thumb)}" alt=""><div><strong>${esc(x.title)}</strong><small>${esc(x.author)}${x.views?` · ${esc(String(x.views))}`:''}</small></div></button>`).join('')||'<div class="empty">No videos found from the available video indexes.</div>';results.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>videoPlayer(b.dataset.id,b.querySelector('strong')?.textContent||'JARVIS Player'))};
    const search=async()=>{const q=input.value.trim();if(!q){status.textContent='READY · ENTER A VIDEO SEARCH';return}status.textContent='SEARCHING · JARVIS VIDEO INDEX';results.innerHTML='<div class="jff-video-status">Querying multiple in-house video indexes…</div>';const items=await videoSearch(q);if(items.length){render(items);status.textContent=`${items.length} RESULTS · STAYING INSIDE JARVIS`}else{results.innerHTML='<div class="jff-video-status">No index responded. JARVIS will keep the search surface in-house and retry when an index becomes available.</div>';status.textContent='VIDEO INDEX DEGRADED'}};
    const sb=w.querySelector('#videoSearch');if(sb){sb.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();search()}}input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();search()}};
    const play=w.querySelector('#playVideo');if(play)play.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();const raw=w.querySelector('#videoUrl')?.value?.trim()||'';const id=videoId(raw);if(id)videoPlayer(id,'JARVIS Player');else status.textContent='PASTE A YOUTUBE URL OR VIDEO ID'};
    const urlInput=w.querySelector('#videoUrl');if(urlInput)urlInput.placeholder='Paste YouTube URL or 11-character video ID · plays inside JARVIS';
    await searchTrendingIfUseful();
    async function searchTrendingIfUseful(){const items=await videoSearch('trending videos India');if(items.length){render(items);status.textContent=`${items.length} RESULTS · TRENDING`;}}
  }

  function gamePad(target, send){if(target.querySelector('.jff-pad'))return;const p=document.createElement('div');p.className='jff-pad';p.innerHTML='<button class="blank">·</button><button data-d="up">▲</button><button class="blank">·</button><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button>';target.appendChild(p);p.querySelectorAll('[data-d]').forEach(b=>{const act=e=>{e.preventDefault();send(b.dataset.d)};b.addEventListener('pointerdown',act,{passive:false});b.addEventListener('touchstart',act,{passive:false})})}
  function setupGames(){
    const g=document.querySelector('.jgames');if(g&&!g.dataset.jff){g.dataset.jff='1';const two=document.querySelector('#g2048')?.parentElement;if(two)gamePad(two,d=>document.dispatchEvent(new KeyboardEvent('keydown',{key:{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[d],bubbles:true})));const tet=document.querySelector('#tet')?.parentElement;if(tet)gamePad(tet,d=>document.dispatchEvent(new KeyboardEvent('keydown',{key:{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[d],bubbles:true})));}
    const arc=document.querySelector('.arcade');if(arc&&!arc.dataset.jff){arc.dataset.jff='1';const controls=document.createElement('div');controls.className='jff-snake-controls';controls.innerHTML='<button class="up">▲</button><button class="left">◀</button><button class="down">▼</button><button class="right">▶</button><div class="jff-game-help">Swipe or use the pad</div>';arc.appendChild(controls);const send=d=>document.dispatchEvent(new KeyboardEvent('keydown',{key:{up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'}[d],bubbles:true}));controls.querySelector('.up').onclick=()=>send('up');controls.querySelector('.down').onclick=()=>send('down');controls.querySelector('.left').onclick=()=>send('left');controls.querySelector('.right').onclick=()=>send('right');let sx=0,sy=0;arc.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});arc.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;send(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'))},{passive:true})}
  }

  function renderNews(){
    const w=app();if(!w)return;w.innerHTML=`<div class="jns"><div class="page-head"><div><p class="eyebrow">INTELLIGENCE / LIVE</p><h1>JARVIS News</h1><p class="sub">Current headlines stay inside the JARVIS shell.</p></div><button id="jffNewsRefresh" class="ghost">REFRESH</button></div><div class="jns-tabs"><button data-cat="india">INDIA</button><button data-cat="odisha">ODISHA</button><button data-cat="world">WORLD</button><button data-cat="tech">TECH / AI</button></div><div class="jns-search"><input id="jffNewsQuery" placeholder="Search news…"><button id="jffNewsSearch" class="primary">SEARCH NEWS</button></div><div id="jffNewsStatus" class="jff-video-status">Loading current headlines…</div><div id="jffNewsGrid" class="jff-video-results"></div></div>`;
    const feeds={india:'India OR Indian',odisha:'Bhubaneswar OR Odisha',world:'world',tech:'AI OR technology'};let cat='india';
    const load=async(q='')=>{const query=q||feeds[cat];const st=w.querySelector('#jffNewsStatus'),grid=w.querySelector('#jffNewsGrid');try{const url=`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;const r=await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,{cache:'no-store'});if(!r.ok)throw 0;const d=await r.json(),items=(d.items||[]).slice(0,18);st.textContent=`${items.length} CURRENT STORIES`;grid.innerHTML=items.map(x=>`<article class="jff-video"><div></div><div><strong>${esc(x.title)}</strong><small>${esc(x.author||'NEWS')} · ${esc(x.pubDate||'')}</small><small><a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">READ SOURCE ↗</a></small></div></article>`).join('')||'<div class="jff-video-status">No stories matched.</div>'}catch{st.textContent='NEWS FEED DEGRADED · RETRY AVAILABLE';grid.innerHTML='<div class="jff-video-status">The news source is temporarily unavailable. Use Refresh to retry.</div>'}};
    w.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{cat=b.dataset.cat;load()});w.querySelector('#jffNewsSearch').onclick=()=>load(w.querySelector('#jffNewsQuery').value.trim());w.querySelector('#jffNewsRefresh').onclick=()=>load(w.querySelector('#jffNewsQuery').value.trim());load();
  }

  function tick(){styles();normalizeNewsNav();ensureMissionConsole();interceptCentralCommand();const w=app();if(!w)return;const h=document.querySelector('h1')?.textContent||'';if(h==='Media Center')setupMedia();if(h==='Maps')setupModernMaps();setupGames();}
  const obs=new MutationObserver(()=>setTimeout(tick,0));obs.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick,{once:true});else tick();
})();
