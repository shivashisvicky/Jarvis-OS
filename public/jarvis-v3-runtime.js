(() => {
  'use strict';

  const PIPED = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.moomoo.me',
    'https://pipedapi.syncpundit.io',
    'https://api-piped.mha.fi',
    'https://piped-api.garudalinux.org',
    'https://pipedapi.rivo.lol',
    'https://pipedapi.leptons.xyz'
  ];
  const INVIDIOUS = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yt.chocolatemoo53.com'
  ];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function css() {
    if ($('#jarvis-v3-css')) return;
    const s = document.createElement('style');
    s.id = 'jarvis-v3-css';
    s.textContent = `
      .jv3-console{margin:0 0 18px;padding:18px;border:1px solid rgba(126,205,255,.2);border-radius:18px;background:linear-gradient(135deg,rgba(8,24,35,.96),rgba(2,9,14,.98));box-shadow:0 18px 60px rgba(0,0,0,.22)}
      .jv3-console-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.jv3-console h2{margin:3px 0 4px}.jv3-console .sub{margin:0}.jv3-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:14px}.jv3-action{min-height:70px;text-align:left;padding:11px;border:1px solid rgba(126,205,255,.14);border-radius:12px;background:rgba(255,255,255,.025);color:inherit;cursor:pointer}.jv3-action:hover{border-color:#55d6ff;background:rgba(85,214,255,.06)}.jv3-action b{display:block;font-size:11px;letter-spacing:.06em}.jv3-action small{display:block;margin-top:5px;color:#7895a4;line-height:1.35}.jv3-index{color:#65d8ff;font:700 10px ui-monospace,monospace}
      .jv3-answer{margin-top:12px;padding:15px;border:1px solid rgba(126,205,255,.16);border-radius:14px;background:rgba(2,8,14,.8);line-height:1.55}.jv3-answer h3{margin:0 0 7px}.jv3-answer .meta{margin-top:9px;color:#7895a4;font-size:11px}.jv3-answer a{color:#70dcff}.jv3-results{display:grid;gap:8px;margin-top:12px}.jv3-result{display:block;width:100%;padding:12px;text-align:left;border:1px solid rgba(126,205,255,.12);border-radius:12px;background:rgba(3,11,17,.78);color:inherit;cursor:pointer}.jv3-result:hover{border-color:#55d6ff}.jv3-result strong{display:block;font-size:13px;line-height:1.35}.jv3-result p{margin:5px 0 0;color:#91aab4;font-size:11px;line-height:1.45}.jv3-result small{display:block;margin-top:5px;color:#5f7c87;font-size:10px}
      .jv3-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.jv3-status{padding:9px 11px;border:1px solid rgba(126,205,255,.13);border-radius:10px;color:#8fb2bf;font:600 10px ui-monospace,monospace;letter-spacing:.07em}.jv3-live{color:#67efad}.jv3-live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#67efad;box-shadow:0 0 10px #67efad;margin-right:6px}
      .jv3-video-results{display:grid;gap:9px;margin-top:10px}.jv3-video-card{display:grid;grid-template-columns:145px 1fr 30px;gap:10px;align-items:center;width:100%;padding:6px;text-align:left;border:1px solid rgba(126,205,255,.12);border-radius:13px;background:rgba(3,11,17,.9);color:inherit;cursor:pointer}.jv3-video-card:hover{border-color:#55d6ff}.jv3-video-thumb{width:145px;aspect-ratio:16/9;object-fit:cover;border-radius:8px;background:#02070a}.jv3-video-card strong{display:block;font-size:12px;line-height:1.35}.jv3-video-card small{display:block;color:#718e9b;margin-top:4px;font-size:10px}.jv3-video-play{color:#66dfff;font-size:15px}.jv3-player{min-height:280px;border:1px solid rgba(126,205,255,.2);border-radius:14px;overflow:hidden;background:#000}.jv3-player iframe,.jv3-player video{display:block;width:100%;height:min(62vh,560px);border:0;background:#000}.jv3-player-empty{min-height:280px;display:grid;place-items:center;text-align:center;color:#7895a4;padding:25px}.jv3-player-empty strong{display:block;color:#b9ecf8;margin-top:8px}.jv3-player-empty small{display:block;margin-top:5px}
      .jv3-map{height:520px;min-height:420px;overflow:hidden;border-radius:15px;background:#071017}.jv3-map-host{height:100%;width:100%}.jv3-map-results{display:grid;gap:7px;margin-top:10px}.jv3-place{padding:10px;text-align:left;border:1px solid rgba(126,205,255,.12);border-radius:10px;background:#07131b;color:#c9f5ff;cursor:pointer}.jv3-place:hover{border-color:#55d6ff}.jv3-place strong{display:block}.jv3-place small{display:block;color:#718e9b;margin-top:4px}
      .jv3-news{display:grid;gap:9px;padding:10px}.jv3-news-card{padding:12px;border:1px solid rgba(126,205,255,.1);border-radius:11px;background:rgba(3,11,17,.72)}.jv3-news-card h3{margin:0;font-size:13px;line-height:1.4}.jv3-news-card p{margin:7px 0 0;color:#9bb0ba;font-size:11px;line-height:1.5}.jv3-news-card a{display:inline-block;margin-top:7px;color:#69d9ff;font-size:10px}.jv3-news-ticker{padding:10px 12px;border-top:1px solid rgba(126,205,255,.1);border-bottom:1px solid rgba(126,205,255,.1);white-space:nowrap;overflow:hidden;color:#9fdceb;font-size:11px}
      .jv3-fallback{margin-top:10px;padding:12px;border:1px dashed rgba(126,205,255,.18);border-radius:11px;color:#8faab4}.jv3-fallback button{margin-top:8px}
      @media(max-width:800px){.jv3-actions{grid-template-columns:1fr 1fr}.jv3-video-card{grid-template-columns:96px 1fr 28px}.jv3-video-thumb{width:96px}.jv3-map{height:430px}}
      @media(max-width:520px){.jv3-console-head{display:block}.jv3-actions{grid-template-columns:1fr}.jv3-video-card{grid-template-columns:88px 1fr}.jv3-video-thumb{width:88px}.jv3-video-play{grid-column:2}.jv3-map{height:400px}}
    `;
    document.head.appendChild(s);
  }

  function clickApp(id) {
    const b = $(`button.nav[data-app="${id}"]`);
    if (b) { b.click(); return true; }
    return false;
  }

  function mountMission() {
    const home = $('.command-center');
    if (!home || $('.jarvis-mission-console', home)) return;
    const el = document.createElement('section');
    el.className = 'jarvis-mission-console jv3-console panel';
    el.setAttribute('aria-label','JARVIS intelligence core');
    el.innerHTML = `<div class="jv3-console-head"><div><p class="eyebrow">JARVIS / ORCHESTRATION</p><h2>JARVIS INTELLIGENCE CORE</h2><p class="sub">What should JARVIS work on?</p></div><span class="jv3-status"><span class="jv3-live-dot"></span>READY · LOCAL-FIRST</span></div><div class="jv3-actions"><button class="jv3-action jmc-action" data-jv3-intent="news" type="button"><span class="jv3-index">01</span><b>TODAY'S SIGNAL</b><small>Read a concise text-only live intelligence brief.</small></button><button class="jv3-action jmc-action" data-jv3-intent="media" type="button"><span class="jv3-index">02</span><b>FIND VIDEO</b><small>Search and play media without leaving JARVIS.</small></button><button class="jv3-action jmc-action" data-jv3-intent="research" type="button"><span class="jv3-index">03</span><b>RESEARCH</b><small>Search the central knowledge layer first.</small></button><button class="jv3-action jmc-action" data-jv3-intent="api" type="button"><span class="jv3-index">04</span><b>ENGINEERING</b><small>Open the API engineering workspace.</small></button></div>`;
    home.insertBefore(el, $('.command-surface', home) || home.firstChild);
    $$('.jmc-action', el).forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.jv3Intent;
      if (k === 'media') clickApp('media');
      else if (k === 'api') clickApp('api');
      else if (k === 'research') clickApp('web');
      else void centralSearch('latest AI and technology news');
    }));
  }

  async function json(url, timeout=5000) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), timeout);
    try {
      const r = await fetch(url, { signal:c.signal, cache:'no-store', headers:{Accept:'application/json'} });
      if (!r.ok) throw new Error(String(r.status));
      return await r.json();
    } finally { clearTimeout(t); }
  }

  async function knowledge(query) {
    const q = query.trim();
    let answer = '', source = '';
    try {
      const d = await json(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1&no_redirect=1`);
      answer = d.AbstractText || d.Answer || d.Definition || '';
      source = d.AbstractURL || '';
    } catch {}
    if (!answer) {
      try {
        const d = await json(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=8`);
        const hits = d?.query?.search || [];
        if (hits.length) return { answer:'', source:'', results:hits.map(x=>({title:x.title,snippet:String(x.snippet||'').replace(/<[^>]+>/g,' '),url:`https://en.wikipedia.org/wiki/${encodeURIComponent(String(x.title).replace(/ /g,'_'))}`,source:'Wikipedia'})) };
      } catch {}
    }
    return { answer, source, results:[] };
  }

  async function newsItems(query='AI OR technology') {
    try {
      const d = await json(`https://api.gdeltproject.org/api/v2/doc/doc?query=(${encodeURIComponent(query)})&mode=artlist&format=json&maxrecords=8&timespan=24h&sort=datedesc`, 6500);
      const items = (d.articles || []).slice(0,8).map(a=>({title:a.title||'Untitled story',url:a.url||'',domain:a.domain||a.sourcecountry||'GLOBAL',date:a.seendate||'Today'}));
      if (items.length) return items;
    } catch {}
    try {
      const rss = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
      const d = await json(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rss)}`, 6500);
      return (d.items || []).slice(0,8).map(a=>({title:a.title||'Untitled story',url:a.link||'',domain:a.author||'NEWS',date:a.pubDate||'Today'}));
    } catch { return []; }
  }

  async function renderNews(query='AI OR technology', host=null) {
    const desk = host || $('#newsDesk');
    if (!desk) return;
    desk.dataset.jv3='1';
    desk.innerHTML = `<div class="news-head"><div><p class="eyebrow">INTELLIGENCE / TEXT BRIEF</p><h2>World signal</h2><p class="sub">Current headlines, kept lightweight so images can never block the feed.</p></div><div class="jv3-bar"><span class="jv3-status" id="jv3NewsStatus"><span class="jv3-live-dot"></span>SCANNING</span><button class="ghost" id="jv3NewsRefresh" type="button">REFRESH</button></div></div><div class="jv3-news-ticker" id="jv3NewsTicker">JARVIS IS SCANNING THE GLOBAL NEWS STREAM…</div><div class="jv3-news" id="jv3NewsGrid"><div class="empty">Loading headlines…</div></div>`;
    const load = async () => {
      const items = await newsItems(query);
      const ticker = $('#jv3NewsTicker', desk), grid = $('#jv3NewsGrid', desk), status = $('#jv3NewsStatus', desk);
      if (!items.length) { status.textContent='NEWS FEED DEGRADED'; ticker.textContent='No live provider responded. JARVIS will retry when you press REFRESH.'; grid.innerHTML='<div class="jv3-fallback">The news engine is alive, but its public feeds are temporarily unavailable.</div>'; return; }
      status.textContent = `${items.length} CURRENT STORIES`;
      ticker.textContent = items.slice(0,4).map(x=>`● ${x.title}`).join('   ·   ');
      grid.innerHTML = items.map(x=>`<article class="jv3-news-card"><h3>${esc(x.title)}</h3><p>${esc(x.domain)} · ${esc(x.date)}</p>${x.url?`<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">READ SOURCE ↗</a>`:''}</article>`).join('');
    };
    $('#jv3NewsRefresh', desk)?.addEventListener('click', () => void load());
    await load();
  }

  async function searchCentral(query, target) {
    const q = String(query||'').trim().replace(/^(search|look up|find|ask jarvis|tell me about)\s+/i,'').trim();
    if (!q) return;
    const low = q.toLowerCase();
    if (/\b(video|videos|youtube|movie|movies)\b/.test(low)) {
      clickApp('media'); await sleep(250); const input=$('#videoQuery'); if(input){input.value=q; $('#videoSearch')?.click();} return;
    }
    if (/\b(map|maps|navigate|location|directions)\b/.test(low)) {
      clickApp('maps'); await sleep(250); const input=$('#mapQuery'); if(input){input.value=q.replace(/\b(show|open|find|maps?|navigate|location|directions)\b/gi,'').trim()||'Jagannath Nagar, Bhubaneswar'; $('#mapSearch')?.click();} return;
    }
    if (/\b(news|headlines|latest)\b/.test(low)) {
      if ($('.command-center')) await renderNews(q);
      else { clickApp('home'); await sleep(250); await renderNews(q); }
      return;
    }
    const box = target || $('#jv3-answer') || (()=>{const h=$('.command-surface')||$('.search-workspace');if(!h)return null;const b=document.createElement('section');b.id='jv3-answer';b.className='jv3-answer';h.insertAdjacentElement('afterend',b);return b})();
    if (!box) return;
    box.innerHTML='<strong>JARVIS is searching its knowledge layer…</strong><div class="meta">Local knowledge → indexed web knowledge → internet fallback</div>';
    const r = await knowledge(q);
    if (r.answer) { box.innerHTML=`<h3>${esc(q)}</h3><div>${esc(r.answer)}</div>${r.source?`<div class="meta">Source: <a href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">${esc(r.source)}</a></div>`:''}`; return; }
    if (r.results.length) { box.innerHTML=`<h3>JARVIS results for “${esc(q)}”</h3><div class="jv3-results">${r.results.map(x=>`<a class="jv3-result" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(x.title)}</strong><p>${esc(x.snippet)}</p><small>${esc(x.source)}</small></a>`).join('')}</div>`; return; }
    box.innerHTML=`<h3>No internal result yet</h3><div>JARVIS could not resolve this request from its accessible knowledge providers.</div><div class="jv3-fallback"><button class="primary" id="jv3ExternalSearch" type="button">SEARCH INTERNET</button><p class="meta">External search is a deliberate fallback only. JARVIS will not redirect automatically.</p></div>`;
    $('#jv3ExternalSearch', box)?.addEventListener('click',()=>window.open(`https://search.brave.com/search?q=${encodeURIComponent(q)}`,'_blank','noopener,noreferrer'));
  }

  function renderSearchWorkspace(w) {
    if (!w || w.dataset.jv3==='1') return;
    w.dataset.jv3='1';
    w.innerHTML=`<section class="panel search-workspace"><div class="search-bar"><input id="webQuery" placeholder="Ask JARVIS anything…"><button class="primary" id="webSearch" type="button">SEARCH</button></div><div class="jv3-bar" style="margin-top:10px"><button class="ghost" data-provider="knowledge">KNOWLEDGE</button><button class="ghost" data-provider="news">NEWS</button><button class="ghost" data-provider="video">VIDEO</button><span class="jv3-status">LOCAL-FIRST · NO AUTO REDIRECT</span></div><div id="jv3SearchAnswer" class="jv3-answer" style="display:none"></div></section><section class="panel search-suggestions"><div class="panel-head"><span>TRY ASKING JARVIS</span></div><div class="suggestion-grid">${['Latest AI news','SAP Cloud Integration OAuth 2.0','What is an API gateway?','Bhubaneswar weather tomorrow'].map(x=>`<button type="button" data-search="${esc(x)}">${esc(x)}</button>`).join('')}</div></section>`;
    const input=$('#webQuery',w), box=$('#jv3SearchAnswer',w);
    const run=()=>{const q=input.value.trim();if(!q)return;box.style.display='block';void searchCentral(q,box)};
    $('#webSearch',w)?.addEventListener('click',run);input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();run()}});
    $$('[data-search]',w).forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.search||'';run()}));
    $$('[data-provider]',w).forEach(b=>b.addEventListener('click',()=>{const k=b.dataset.provider;if(k==='news'){clickApp('home');setTimeout(()=>void renderNews('India OR technology'),250)}else if(k==='video'){clickApp('media')}else run()}));
  }

  async function loadLeaflet() {
    if (window.L) return true;
    if (!document.querySelector('#jv3-leaflet-css')) { const l=document.createElement('link');l.id='jv3-leaflet-css';l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(l); }
    if (!document.querySelector('#jv3-leaflet-js')) { const s=document.createElement('script');s.id='jv3-leaflet-js';s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';document.head.appendChild(s); }
    for(let i=0;i<40;i++){if(window.L)return true;await sleep(100)}
    return false;
  }

  const LOCAL_PLACES = [
    {keys:['maa enclave','home'],name:'Maa Enclave',detail:'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha',lat:20.2853,lon:85.8665},
    {keys:['jagannath nagar','jharpada'],name:'Jagannath Nagar',detail:'Jharapada, Bhubaneswar, Odisha 751010',lat:20.2853,lon:85.8665},
    {keys:['ggp colony'],name:'GGP Colony',detail:'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025',lat:20.2934,lon:85.8659}
  ];
  function localPlace(q){const l=q.toLowerCase();return LOCAL_PLACES.find(p=>p.keys.some(k=>l.includes(k)))}

  async function renderMaps(w) {
    if (!w || w.dataset.jv3==='1') return;
    w.dataset.jv3='1';
    w.innerHTML=`<section class="panel map-controls"><div class="search-bar"><input id="mapQuery" placeholder="Jagannath Nagar, GGP Colony, Maa Enclave…"><button class="primary" id="mapSearch" type="button">SEARCH</button><button class="secondary" id="locateMe" type="button">◎ LOCATE</button></div><div id="mapResults" class="jv3-map-results"><div class="empty">Map is ready. Try “Jagannath Nagar”, “GGP Colony” or “Maa Enclave”.</div></div></section><section class="panel jv3-map" id="mapFrame"><div id="jv3MapHost" class="jv3-map-host"></div></section>`;
    const q=$('#mapQuery',w),results=$('#mapResults',w),frame=$('#mapFrame',w);
    const ok=await loadLeaflet();
    let map=null, marker=null;
    if(ok){map=L.map($('#jv3MapHost',w),{zoomControl:true,scrollWheelZoom:true}).setView([20.2853,85.8665],14);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);marker=L.marker([20.2853,85.8665]).addTo(map).bindPopup('JARVIS map center').openPopup();}
    else frame.innerHTML='<div class="map-placeholder"><span>⌖</span><strong>MAP LIBRARY UNAVAILABLE</strong><small>JARVIS will use its geospatial search when the map provider is reachable.</small></div>';
    const show=(p,label)=>{if(map){map.setView([p.lat,p.lon],16);marker?.setLatLng([p.lat,p.lon]).bindPopup(`<strong>${esc(label)}</strong>`).openPopup();setTimeout(()=>map.invalidateSize(),50)}};
    const search=async()=>{
      const term=q.value.trim();if(!term)return;
      const local=localPlace(term);
      if(local){results.innerHTML=`<button class="jv3-place" type="button"><strong>${esc(local.name)}</strong><small>${esc(local.detail)}</small></button>`;show(local,local.name);return;}
      results.innerHTML='<div class="empty">SEARCHING BHUBANESWAR GEO INDEX…</div>';
      let places=[];
      const variants=[term,`${term}, Bhubaneswar, Odisha, India`,`${term}, Jharapada, Bhubaneswar, Odisha, India`];
      for(const v of variants){try{const d=await json(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&countrycodes=in&q=${encodeURIComponent(v)}`,5500);if(d.length){places=d;break}}catch{}}
      if(!places.length){results.innerHTML='<div class="empty">No match. Try “Jagannath Nagar, Jharapada, Bhubaneswar”, “GGP Colony” or “Maa Enclave”.</div>';return;}
      results.innerHTML=places.map((p,i)=>`<button class="jv3-place" data-place="${i}" type="button"><strong>${esc(p.display_name.split(',').slice(0,2).join(', '))}</strong><small>${esc(p.display_name)}</small></button>`).join('');
      $$('[data-place]',results).forEach(b=>b.addEventListener('click',()=>show(places[Number(b.dataset.place)],places[Number(b.dataset.place)].display_name.split(',')[0])));show(places[0],places[0].display_name.split(',')[0]);
    };
    $('#mapSearch',w)?.addEventListener('click',search);q?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search()}});
    $('#locateMe',w)?.addEventListener('click',()=>navigator.geolocation?.getCurrentPosition(p=>{q.value='Current location';show({lat:p.coords.latitude,lon:p.coords.longitude},'Current location')},()=>{results.innerHTML='<div class="empty">Location permission was not granted.</div>'}));
    setTimeout(()=>map?.invalidateSize(),150);
  }

  async function discoverInvidious() {
    try {
      const d = await json('https://api.invidious.io/instances.json',3500);
      return Object.entries(d||{}).map(([host,info])=>({host,info})).filter(x=>x.host.startsWith('https://') && x.info?.[0] === 'https').slice(0,8).map(x=>x.host);
    } catch { return []; }
  }

  function normalizeVideo(v, source) {
    const id=String(v.videoId||v.id||'').trim();if(!/^[A-Za-z0-9_-]{11}$/.test(id))return null;
    return {id,title:v.title||'Untitled video',author:v.author||v.uploader||v.uploaderName||'YouTube',views:v.viewCountText||v.views||(v.viewCount?`${Number(v.viewCount).toLocaleString()} views`:''),thumb:v.thumbnail||v.thumbnailUrl||v.videoThumbnails?.find(x=>/high|medium|maxres/i.test(x.quality||''))?.url||v.videoThumbnails?.[0]?.url||`https://i.ytimg.com/vi/${id}/hqdefault.jpg`,source};
  }

  async function videoSearch(q) {
    const tasks=[];
    PIPED.forEach(base=>tasks.push(json(`${base}/search?q=${encodeURIComponent(q)}&filter=videos&region=IN`,5000).then(d=>(Array.isArray(d)?d:d.items||[]).map(v=>normalizeVideo(v,'PIPED')).filter(Boolean))));
    INVIDIOUS.forEach(base=>tasks.push(json(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&region=IN&page=1`,5000).then(d=>(Array.isArray(d)?d:[]).map(v=>normalizeVideo(v,'INVIDIOUS')).filter(Boolean))));
    const discovered=await discoverInvidious();
    discovered.forEach(base=>tasks.push(json(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&region=IN&page=1`,5000).then(d=>(Array.isArray(d)?d:[]).map(v=>normalizeVideo(v,'INVIDIOUS')).filter(Boolean))));
    try { const first=await Promise.any(tasks); if(first.length)return first.slice(0,10); } catch {}
    return [];
  }

  function youtubeId(raw){try{const u=new URL(raw);if(u.hostname==='youtu.be')return u.pathname.split('/').filter(Boolean)[0]||null;if(u.hostname.includes('youtube.com'))return u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop()||null}catch{}return /^[A-Za-z0-9_-]{11}$/.test(String(raw).trim())?String(raw).trim():null}

  async function playVideo(item, player, status) {
    const id=item.id;
    status.textContent='RESOLVING · JARVIS PLAYER';
    player.innerHTML='<div class="jv3-player-empty"><div><strong>JARVIS VIDEO CORE</strong><small>Preparing the selected stream…</small></div></div>';
    const pipedTasks=PIPED.map(base=>json(`${base}/streams/${encodeURIComponent(id)}`,5000).then(d=>{const streams=(d.videoStreams||[]).filter(x=>x.url&&!x.videoOnly).sort((a,b)=>(b.height||0)-(a.height||0));const s=streams.find(x=>/video\/mp4/i.test(x.mimeType||''))||streams[0];if(!s?.url)throw new Error('no stream');return {url:s.url,mime:s.mimeType||'video/mp4',quality:s.quality||`${s.height||''}p`}}));
    try { const s=await Promise.any(pipedTasks); player.innerHTML=`<video controls playsinline preload="metadata"><source src="${esc(s.url)}" type="${esc(s.mime)}"></video>`;status.textContent=`PLAYING · ${esc(s.quality)}`;return; } catch {}
    const embed=`https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1&modestbranding=1`;
    player.innerHTML=`<iframe title="${esc(item.title||'JARVIS Video')}" src="${embed}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    status.textContent='PLAYING · JARVIS EMBED';
  }

  async function renderMedia(w) {
    if(!w||w.dataset.jv3==='1')return;
    w.dataset.jv3='1';
    w.innerHTML=`<section class="panel media-main"><div class="search-bar"><input id="videoQuery" placeholder="Search videos, channels or topics…"><button class="primary" id="videoSearch" type="button">SEARCH</button></div><div class="media-search-links"><button type="button" data-video-provider="trending">TRENDING</button><button type="button" data-video-provider="youtube">YOUTUBE TOPICS</button></div><div id="jarvisPlayer" class="jv3-player"><div class="jv3-player-empty"><div>▶<strong>JARVIS VIDEO CORE</strong><small>Search a topic. Results stay inside this console.</small></div></div></div><div class="request-line"><input id="videoUrl" placeholder="Optional: YouTube URL, video ID or direct MP4 URL"><button class="primary" id="playVideo" type="button">PLAY</button></div></section><aside class="panel media-side"><div class="panel-head"><span>VIDEO INTELLIGENCE</span><span class="live" id="jvcStatus">READY · IN-HOUSE VIDEO SEARCH</span></div><div id="videoResults" class="jv3-video-results"><div class="empty">Search to begin.</div></div></aside>`;
    const input=$('#videoQuery',w),results=$('#videoResults',w),player=$('#jarvisPlayer',w),status=$('#jvcStatus',w);
    const render=items=>{results.innerHTML=items.map(v=>`<button class="jv3-video-card" type="button" data-video-id="${esc(v.id)}"><img class="jv3-video-thumb" loading="lazy" src="${esc(v.thumb)}" alt=""><span><strong>${esc(v.title)}</strong><small>${esc(v.author)}${v.views?` · ${esc(v.views)}`:''}</small></span><b class="jv3-video-play">▶</b></button>`).join('')||'<div class="jv3-fallback">No video index responded. JARVIS will not redirect you. Try SEARCH again or paste a video URL.</div>';$$('.jv3-video-card',results).forEach(b=>b.addEventListener('click',()=>{const item=items.find(x=>x.id===b.dataset.videoId);if(item)void playVideo(item,player,status)}));};
    const search=async q=>{q=String(q||'').trim();if(!q){status.textContent='READY · ENTER A VIDEO SEARCH';return}status.textContent='SEARCHING · JARVIS VIDEO INDEX';results.innerHTML='<div class="jv3-status">Querying public video indexes…</div>';const items=await videoSearch(q);render(items);status.textContent=items.length?`${items.length} RESULTS · STAYING INSIDE JARVIS`:'VIDEO INDEX DEGRADED · NO REDIRECT';};
    $('#videoSearch',w)?.addEventListener('click',()=>void search(input.value));input?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void search(input.value)}});
    $$('[data-video-provider]',w).forEach(b=>b.addEventListener('click',()=>{input.value='trending videos India';void search(input.value)}));
    $('#playVideo',w)?.addEventListener('click',()=>{const raw=$('#videoUrl',w)?.value?.trim()||'',id=youtubeId(raw);if(id)void playVideo({id,title:'Pasted YouTube video'},player,status);else if(/^https?:\/\//i.test(raw)){player.innerHTML=`<video controls playsinline src="${esc(raw)}"></video>`;status.textContent='PLAYING · DIRECT MEDIA'}else status.textContent='PASTE A YOUTUBE URL, VIDEO ID OR DIRECT MP4'});
    status.textContent='READY · IN-HOUSE VIDEO SEARCH';
    void search('trending videos India');
  }

  function patchHome() {
    mountMission();
    const desk=$('#newsDesk');
    if(desk && desk.dataset.jv3!=='1') setTimeout(()=>void renderNews('AI OR technology',desk),250);
  }

  function patchApp() {
    css();
    const heading=$('h1')?.textContent?.trim()||'';
    if(heading==='Search Hub') { const w=$('.search-workspace'); if(w&&w.dataset.jv3!=='1')setTimeout(()=>renderSearchWorkspace(w),250); }
    if(heading==='Maps') { const w=$('.maps-workspace'); if(w&&w.dataset.jv3!=='1')setTimeout(()=>void renderMaps(w),250); }
    if(heading==='Media Center') { const w=$('.media-workspace'); if(w&&w.dataset.jv3!=='1')setTimeout(()=>void renderMedia(w),350); }
    if($('.command-center')) patchHome();
  }

  function commandHandler(e) {
    const form=e.target?.closest?.('#commandForm');
    if(!form)return;
    const input=$('#commandInput',form), q=input?.value?.trim()||'';
    if(!q)return;
    e.preventDefault();e.stopImmediatePropagation();
    void searchCentral(q);
  }

  function clickHandler(e) {
    const t=e.target instanceof Element?e.target.closest('button'):null;if(!t)return;
    if(t.id==='webSearch'||t.matches('[data-provider]')||t.matches('[data-search]')){const w=t.closest('.search-workspace')||t.closest('.search-suggestions');if(!w)return;e.preventDefault();e.stopImmediatePropagation();const input=$('#webQuery',w);if(t.matches('[data-search]'))input.value=t.dataset.search||'';if(t.dataset.provider==='news'){clickApp('home');setTimeout(()=>void renderNews('India OR technology'),300);return}if(t.dataset.provider==='video'){clickApp('media');return}if(input?.value)void searchCentral(input.value,$('#jv3SearchAnswer',w));return;}
    if(t.id==='videoSearch'||t.matches('[data-video-provider]')){if(t.closest('.media-workspace')?.dataset.jv3!=='1')return;e.preventDefault();e.stopImmediatePropagation();}
    if(t.id==='mapSearch'&&t.closest('.maps-workspace')?.dataset.jv3!=='1'){e.preventDefault();e.stopImmediatePropagation();}
  }

  document.addEventListener('submit',commandHandler,true);
  document.addEventListener('click',clickHandler,true);
  document.addEventListener('keydown',e=>{if(e.key!=='Enter')return;const t=e.target;if(t instanceof HTMLInputElement&&t.id==='commandInput'){e.preventDefault();const form=t.closest('#commandForm');if(form)form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}))}},true);

  let scheduled=0;
  const schedule=()=>{clearTimeout(scheduled);scheduled=setTimeout(patchApp,120)};
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patchApp,{once:true});else patchApp();
  window.addEventListener('pageshow',patchApp);
  window.JARVIS_V3={search:searchCentral,refreshNews:()=>renderNews('AI OR technology'),version:'3.0.0'};
})();
