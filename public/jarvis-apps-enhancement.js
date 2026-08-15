(() => {
  'use strict';

  const RSS = 'https://api.rss2json.com/v1/api.json?rss_url=';
  const FEEDS = {
    india: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
    world: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    odisha: 'https://news.google.com/rss/search?q=Bhubaneswar%20Odisha&hl=en-IN&gl=IN&ceid=IN:en',
    technology: 'https://news.google.com/rss/search?q=technology%20AI&hl=en-US&gl=US&ceid=US:en'
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const workspace = () => document.querySelector('.workspace');
  const setSelected = (id) => document.querySelectorAll('.nav').forEach(b => b.classList.toggle('selected', b.dataset.app === id));
  const openExternal = (url) => window.open(url, '_blank', 'noopener,noreferrer');

  function installStyle() {
    if (document.getElementById('jarvisEnhancementStyle')) return;
    const s = document.createElement('style');
    s.id = 'jarvisEnhancementStyle';
    s.textContent = `
      .jarvis-news-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}
      .jarvis-news-card,.jarvis-video-card,.jarvis-dashboard-modal{border:1px solid rgba(120,220,255,.16);background:linear-gradient(145deg,rgba(20,28,38,.92),rgba(7,11,17,.92));border-radius:16px;padding:16px;box-shadow:0 10px 30px rgba(0,0,0,.18)}
      .jarvis-news-card{min-height:150px;display:flex;flex-direction:column;gap:9px}
      .jarvis-news-card h3{margin:0;font-size:1rem;line-height:1.35}.jarvis-news-card p{margin:0;opacity:.72;font-size:.82rem;line-height:1.4}.jarvis-news-card a{color:inherit;text-decoration:none}
      .jarvis-news-meta{font-size:.7rem;opacity:.55;margin-top:auto}.jarvis-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.jarvis-tabs button{min-height:40px}.jarvis-tabs button.active{outline:1px solid rgba(120,220,255,.55);background:rgba(80,180,220,.12)}
      .jarvis-news-status{padding:18px;text-align:center;opacity:.65}.jarvis-news-refresh{margin-left:auto}
      .jarvis-map-shell{display:grid;grid-template-columns:minmax(250px,.7fr) minmax(0,1.3fr);gap:14px;margin-top:14px}.jarvis-map-frame{min-height:480px;border-radius:16px;overflow:hidden;border:1px solid rgba(120,220,255,.18);background:#080d14}.jarvis-map-frame iframe{width:100%;height:100%;min-height:480px;border:0}.jarvis-map-results{display:flex;flex-direction:column;gap:8px}.jarvis-place{width:100%;text-align:left;padding:13px;border:1px solid rgba(120,220,255,.12);border-radius:12px;background:rgba(255,255,255,.025);color:inherit;cursor:pointer}.jarvis-place:hover{background:rgba(100,200,240,.08)}
      .jarvis-player-shell{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,.7fr);gap:14px;margin-top:14px}.jarvis-player{background:#05070a;border-radius:18px;overflow:hidden;border:1px solid rgba(120,220,255,.18);box-shadow:0 15px 40px rgba(0,0,0,.25)}.jarvis-player iframe{display:block;width:100%;aspect-ratio:16/9;border:0}.jarvis-player-empty{aspect-ratio:16/9;display:grid;place-items:center;padding:25px;text-align:center;opacity:.55}.jarvis-video-side{display:flex;flex-direction:column;gap:10px}.jarvis-video-card{padding:12px;cursor:pointer}.jarvis-video-card strong{display:block;font-size:.88rem}.jarvis-video-card small{display:block;opacity:.55;margin-top:5px}.jarvis-media-note{font-size:.76rem;opacity:.55;line-height:1.45}
      .jarvis-dashboard-modal{position:fixed;z-index:9999;left:50%;top:50%;transform:translate(-50%,-50%);width:min(620px,calc(100vw - 30px));max-height:80vh;overflow:auto}.jarvis-dashboard-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.62);backdrop-filter:blur(8px);z-index:9998}.jarvis-modal-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.jarvis-modal-head h3{margin:0}.jarvis-modal-close{min-width:40px}.jarvis-kv{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}.jarvis-kv div{padding:12px;border-radius:12px;background:rgba(255,255,255,.035)}.jarvis-kv span{display:block;font-size:.7rem;opacity:.55}.jarvis-kv strong{display:block;margin-top:5px}
      .telemetry{cursor:pointer;transition:transform .18s ease,border-color .18s ease}.telemetry:hover{transform:translateY(-2px)}
      .jarvis-news-search{display:flex;gap:8px;margin:10px 0}.jarvis-news-search input{flex:1}
      @media(max-width:850px){.jarvis-news-grid{grid-template-columns:1fr}.jarvis-map-shell,.jarvis-player-shell{grid-template-columns:1fr}.jarvis-map-frame,.jarvis-map-frame iframe{min-height:360px}.workspace{min-width:0;overflow:auto}.request-row{flex-wrap:wrap}.request-row>*{min-width:0}.command-center{min-width:0}.telemetry-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.module-strip{grid-template-columns:repeat(2,minmax(0,1fr))}.apphead{gap:10px}.workspace input,.workspace select,.workspace button,.workspace textarea{font-size:16px;min-height:42px}.workspace{padding-left:12px!important;padding-right:12px!important}}
      @media(max-width:560px){.telemetry-grid,.module-strip{grid-template-columns:1fr}.jarvis-kv{grid-template-columns:1fr}aside .nav span{display:none}aside .nav{min-height:50px}}
    `;
    document.head.appendChild(s);
  }

  function navButton(id, label, icon) {
    if (document.querySelector(`.nav[data-app="${id}"]`)) return;
    const aside = document.querySelector('aside');
    if (!aside) return;
    const b = document.createElement('button');
    b.className = 'nav'; b.dataset.app = id; b.title = label;
    b.innerHTML = `<b>${icon}</b><span>${label}</span>`;
    aside.appendChild(b);
  }

  async function fetchFeed(feed) {
    const r = await fetch(RSS + encodeURIComponent(feed), {cache:'no-store'});
    if (!r.ok) throw new Error(`News gateway returned ${r.status}`);
    const data = await r.json();
    if (data.status !== 'ok') throw new Error(data.message || 'Feed unavailable');
    return data.items || [];
  }

  async function showNews(category='india') {
    setSelected('news');
    const w = workspace(); if (!w) return;
    w.innerHTML = `<div class="apphead"><div><p class="eyebrow">INTELLIGENCE / LIVE NEWS</p><h2>JARVIS News</h2><p class="sub">A real news reader for India, Odisha, world and technology headlines.</p></div></div>
      <div class="jarvis-tabs"><button data-news-cat="india">INDIA</button><button data-news-cat="odisha">ODISHA / LOCAL</button><button data-news-cat="world">WORLD</button><button data-news-cat="technology">TECH & AI</button><button class="jarvis-news-refresh">↻ REFRESH</button></div>
      <div class="jarvis-news-search"><input id="jarvisNewsQuery" placeholder="Search news…"><button id="jarvisNewsSearch">SEARCH</button></div>
      <div id="jarvisNewsStatus" class="jarvis-news-status">Loading headlines…</div><div id="jarvisNewsGrid" class="jarvis-news-grid"></div>`;
    document.querySelectorAll('[data-news-cat]').forEach(b => b.classList.toggle('active', b.dataset.newsCat === category));
    document.querySelectorAll('[data-news-cat]').forEach(b => b.onclick = () => showNews(b.dataset.newsCat));
    document.querySelector('.jarvis-news-refresh')?.addEventListener('click', () => showNews(category));
    document.querySelector('#jarvisNewsSearch')?.addEventListener('click', async () => {
      const q = document.querySelector('#jarvisNewsQuery')?.value.trim(); if (!q) return showNews(category);
      await renderNewsItems(await fetchFeed(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`));
    });
    try { await renderNewsItems(await fetchFeed(FEEDS[category])); }
    catch (e) { document.querySelector('#jarvisNewsStatus').textContent = `News feed unavailable right now. ${e.message}`; }
  }

  async function renderNewsItems(items) {
    const grid = document.querySelector('#jarvisNewsGrid'); const status = document.querySelector('#jarvisNewsStatus'); if (!grid) return;
    grid.innerHTML = items.slice(0,18).map(item => {
      const d = new Date(item.pubDate); const source = item.author || new URL(item.link).hostname.replace(/^www\./,'');
      return `<article class="jarvis-news-card"><h3><a href="${esc(item.link)}" target="_blank" rel="noopener noreferrer">${esc(item.title)}</a></h3><p>${esc((item.description||'').replace(/<[^>]+>/g,'').slice(0,170))}</p><div class="jarvis-news-meta">${esc(source)} · ${isNaN(d.getTime())?'':d.toLocaleString()}</div></article>`;
    }).join('');
    if (status) status.textContent = `${items.length} stories available`;
  }

  async function nominatim(q) {
    const u = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(q)}`;
    const r = await fetch(u, {headers:{'Accept':'application/json'}}); if (!r.ok) throw new Error('Map search failed'); return r.json();
  }
  function mapEmbed(lat, lon, zoom=13) {
    const d = 0.06 / Math.pow(2, Math.max(0, zoom-10));
    const bbox = `${Number(lon)-d},${Number(lat)-d},${Number(lon)+d},${Number(lat)+d}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
  }
  async function showMaps() {
    setSelected('maps'); const w=workspace(); if(!w)return;
    w.innerHTML=`<div class="apphead"><div><p class="eyebrow">NAVIGATION / OPEN GEO</p><h2>JARVIS Maps</h2><p class="sub">Native map view using OpenStreetMap. No Google Maps redirect.</p></div></div>
      <div class="request-row"><input id="jarvisMapQuery" placeholder="Search Bhubaneswar, airport, restaurant…"><button id="jarvisMapSearch">SEARCH</button><button id="jarvisLocate">◎ MY LOCATION</button></div>
      <div class="jarvis-map-shell"><div><div id="jarvisMapResults" class="jarvis-map-results"><div class="empty">Search for a place to begin.</div></div></div><div id="jarvisMapFrame" class="jarvis-map-frame"><div class="jarvis-map-frame"><div class="jarvis-map-results"><div class="empty">OpenStreetMap will appear here.</div></div></div></div></div>`;
    document.querySelector('#jarvisMapSearch').onclick=async()=>{const q=document.querySelector('#jarvisMapQuery').value.trim();if(!q)return;try{const places=await nominatim(q);document.querySelector('#jarvisMapResults').innerHTML=places.map((p,i)=>`<button class="jarvis-place" data-place="${i}"><strong>${esc(p.display_name.split(',').slice(0,2).join(','))}</strong><small>${esc(p.display_name)}</small></button>`).join('')||'<div class="empty">No places found.</div>';document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>{const p=places[Number(b.dataset.place)];document.querySelector('#jarvisMapFrame').innerHTML=`<iframe title="OpenStreetMap" loading="lazy" src="${mapEmbed(p.lat,p.lon)}"></iframe>`});if(places[0])document.querySelector(`[data-place="0"]`).click();}catch(e){document.querySelector('#jarvisMapResults').innerHTML=`<div class="empty">${esc(e.message)}</div>`}};
    document.querySelector('#jarvisLocate').onclick=()=>navigator.geolocation?.getCurrentPosition(pos=>{const {latitude,longitude}=pos.coords;document.querySelector('#jarvisMapFrame').innerHTML=`<iframe title="OpenStreetMap" loading="lazy" src="${mapEmbed(latitude,longitude,15)}"></iframe>`},()=>alert('Location permission was not granted.'));
  }

  const VIDEO_INSTANCES=['https://inv.nadeko.net','https://yewtu.be','https://invidious.nerdvpn.de'];
  function videoId(raw){try{const u=new URL(raw);if(u.hostname.includes('youtu.be'))return u.pathname.slice(1).split('/')[0];if(u.hostname.includes('youtube.com'))return u.searchParams.get('v')||u.pathname.split('/').filter(Boolean).pop();}catch{}return /^[A-Za-z0-9_-]{11}$/.test(raw.trim())?raw.trim():null;}
  async function videoSearch(q){
    for(const base of VIDEO_INSTANCES){try{const r=await fetch(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video`,{signal:AbortSignal.timeout(5000)});if(!r.ok)continue;const a=await r.json();if(Array.isArray(a)&&a.length)return a.slice(0,8);}catch{}}
    return [];
  }
  function loadVideo(id,title='YouTube video'){const frame=document.querySelector('#jarvisPlayer');if(!frame)return;frame.innerHTML=`<iframe title="${esc(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" src="https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&modestbranding=1&playsinline=1"></iframe>`;}
  async function showMedia(){
    setSelected('media');const w=workspace();if(!w)return;
    w.innerHTML=`<div class="apphead"><div><p class="eyebrow">MEDIA / VIDEO</p><h2>JARVIS Player</h2><p class="sub">Search for YouTube videos or paste a YouTube URL. Playback remains inside JARVIS.</p></div></div>
      <div class="request-row"><input id="jarvisVideoQuery" placeholder="Search videos…"><button id="jarvisVideoSearch">SEARCH</button><input id="jarvisVideoUrl" placeholder="Paste YouTube URL or video ID"><button id="jarvisVideoLoad">PLAY</button></div>
      <div class="jarvis-player-shell"><div class="jarvis-player" id="jarvisPlayer"><div class="jarvis-player-empty">Choose a video or paste a YouTube URL. Playback will stay inside this player.</div></div><div class="jarvis-video-side" id="jarvisVideoResults"><div class="jarvis-media-note">Search uses public video-index instances when available. YouTube's own Data API requires an API key, while its official iframe player handles playback without user authorization.</div></div></div>`;
    document.querySelector('#jarvisVideoLoad').onclick=()=>{const id=videoId(document.querySelector('#jarvisVideoUrl').value);if(id)loadVideo(id);else document.querySelector('#jarvisPlayer').innerHTML='<div class="jarvis-player-empty">That does not look like a YouTube video URL or ID.</div>'};
    document.querySelector('#jarvisVideoSearch').onclick=async()=>{const q=document.querySelector('#jarvisVideoQuery').value.trim();if(!q)return;const box=document.querySelector('#jarvisVideoResults');box.innerHTML='<div class="jarvis-media-note">Searching video index…</div>';const results=await videoSearch(q);if(!results.length){box.innerHTML=`<div class="jarvis-media-note">No indexed results right now. Paste a YouTube URL and JARVIS will play it in-house.</div>`;return}box.innerHTML=results.map(v=>{const id=v.videoId||v.videoId;return `<button class="jarvis-video-card" data-video-id="${esc(id)}"><strong>${esc(v.title||'Untitled')}</strong><small>${esc(v.author||v.authorId||'YouTube')}</small></button>`}).join('');document.querySelectorAll('[data-video-id]').forEach(b=>b.onclick=()=>loadVideo(b.dataset.videoId,b.textContent.trim()))};
  }

  function dashboardModal(title, body) {
    document.querySelector('.jarvis-dashboard-backdrop')?.remove();document.querySelector('.jarvis-dashboard-modal')?.remove();
    const back=document.createElement('div');back.className='jarvis-dashboard-backdrop';const modal=document.createElement('div');modal.className='jarvis-dashboard-modal';modal.innerHTML=`<div class="jarvis-modal-head"><h3>${esc(title)}</h3><button class="jarvis-modal-close">×</button></div>${body}`;document.body.append(back,modal);back.onclick=()=>{back.remove();modal.remove()};modal.querySelector('.jarvis-modal-close').onclick=()=>{back.remove();modal.remove()};
  }
  function dashboardInteract(e){
    const card=e.target.closest('.telemetry'); if(!card)return;
    const name=card.querySelector('span')?.textContent?.trim()||'SYSTEM';
    if(name==='CORE STATUS')dashboardModal('Core diagnostics',`<div class="jarvis-kv"><div><span>Runtime</span><strong>LOCAL-FIRST</strong></div><div><span>Shell</span><strong>ONLINE</strong></div><div><span>Storage</span><strong>IndexedDB</strong></div><div><span>Apps</span><strong>11 modules</strong></div></div><p>Core status is an interactive diagnostic surface now. Use the module rail to jump into individual systems.</p>`);
    else if(name==='NETWORK')dashboardModal('Network telemetry',`<div class="jarvis-kv"><div><span>Browser online</span><strong>${navigator.onLine?'YES':'NO'}</strong></div><div><span>Connection</span><strong>${navigator.connection?.effectiveType||'unknown'}</strong></div><div><span>Latency</span><strong>Browser sandbox</strong></div><div><span>Mode</span><strong>${navigator.onLine?'ONLINE':'OFFLINE'}</strong></div></div>`);
    else if(name==='POWER')dashboardModal('Power telemetry',`<div class="jarvis-kv"><div><span>Battery</span><strong>${card.querySelector('strong')?.textContent||'N/A'}</strong></div><div><span>Charging</span><strong>${/⚡/.test(card.textContent||'')?'YES':'NO / UNKNOWN'}</strong></div></div>`);
    else dashboardModal('Processing telemetry',`<div class="jarvis-kv"><div><span>Logical cores</span><strong>${navigator.hardwareConcurrency||'Unknown'}</strong></div><div><span>Memory API</span><strong>${performance.memory?'Available':'Restricted'}</strong></div></div><p>Memory reporting is intentionally capability-based because browsers do not expose full device RAM to ordinary web apps.</p>`);
  }

  function intercept(e){
    const b=e.target.closest?.('.nav[data-app]'); if(!b)return;
    const id=b.dataset.app;
    if(!['news','maps','media'].includes(id))return;
    e.preventDefault();e.stopImmediatePropagation();
    if(id==='news')showNews(); else if(id==='maps')showMaps(); else showMedia();
  }

  function enhance(){
    installStyle();
    navButton('news','News','▤');
    document.removeEventListener('click',intercept,true);document.addEventListener('click',intercept,true);
    document.removeEventListener('click',dashboardInteract);document.addEventListener('click',dashboardInteract);
  }

  const observer=new MutationObserver(()=>enhance());
  observer.observe(document.body,{childList:true,subtree:true});
  enhance();
})();
