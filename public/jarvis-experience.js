(() => {
  'use strict';

  const PIPED = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi-libre.kavin.rocks',
    'https://api.piped.yt'
  ];
  const RSS = 'https://api.rss2json.com/v1/api.json?rss_url=';
  let pipedIndex = 0;
  let enhanced = new WeakSet();

  const esc = (s) => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => [...root.querySelectorAll(sel)];

  function style() {
    if (q('#jarvisExperienceStyle')) return;
    const s = document.createElement('style');
    s.id = 'jarvisExperienceStyle';
    s.textContent = `
      .jx-panel{margin-top:16px;border:1px solid rgba(120,210,255,.16);border-radius:18px;background:rgba(8,13,20,.72);box-shadow:0 18px 50px rgba(0,0,0,.22);overflow:hidden}
      .jx-toolbar{display:flex;gap:10px;align-items:center;padding:12px;border-bottom:1px solid rgba(120,210,255,.1);flex-wrap:wrap}
      .jx-toolbar input,.jx-toolbar select{flex:1;min-width:180px;padding:12px 14px;border-radius:12px;border:1px solid rgba(120,210,255,.18);background:rgba(0,0,0,.22);color:inherit}
      .jx-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:14px}
      .jx-card{border:1px solid rgba(120,210,255,.12);border-radius:15px;overflow:hidden;background:rgba(255,255,255,.025);cursor:pointer;transition:transform .18s ease,border-color .18s ease}
      .jx-card:hover{transform:translateY(-2px);border-color:rgba(120,210,255,.4)}
      .jx-thumb{width:100%;aspect-ratio:16/9;object-fit:cover;background:#080c12;display:block}
      .jx-card-body{padding:10px 12px}.jx-card-title{font-weight:700;line-height:1.3}.jx-meta{opacity:.62;font-size:.78rem;margin-top:5px}
      .jx-player{position:relative;aspect-ratio:16/9;background:#020407;min-height:220px}.jx-player iframe,.jx-player video{width:100%;height:100%;min-height:220px;border:0;display:block}.jx-player video{object-fit:contain}
      .jx-empty{padding:24px;text-align:center;opacity:.68}.jx-status{padding:10px 14px;font-size:.82rem;opacity:.7}
      .jx-news{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;padding:14px}.jx-news article{padding:15px;border:1px solid rgba(120,210,255,.11);border-radius:15px;background:rgba(255,255,255,.025)}.jx-news h3{margin:0 0 8px;font-size:1rem}.jx-news p{opacity:.72;line-height:1.45;font-size:.86rem}.jx-news a{color:inherit;text-decoration:none}.jx-news small{opacity:.5}
      .jx-map{height:430px;background:#071017;position:relative}.jx-map iframe{width:100%;height:100%;border:0}.jx-place-list{display:flex;gap:8px;overflow:auto;padding:10px 14px}.jx-place{min-width:220px;text-align:left;padding:10px 12px;border-radius:12px;border:1px solid rgba(120,210,255,.13);background:rgba(255,255,255,.025);color:inherit}.jx-place strong,.jx-place small{display:block}.jx-place small{opacity:.58;margin-top:4px}
      .jx-dpad{display:grid;grid-template-columns:repeat(3,58px);gap:7px;justify-content:center;margin:12px auto}.jx-dpad button{height:52px;border-radius:14px;border:1px solid rgba(120,210,255,.2);background:rgba(255,255,255,.06);color:inherit;font-size:1.25rem;touch-action:manipulation}.jx-dpad .up{grid-column:2}.jx-dpad .left{grid-column:1}.jx-dpad .down{grid-column:2}.jx-dpad .right{grid-column:3}
      @media(max-width:700px){.jx-map{height:340px}.jx-grid{grid-template-columns:1fr}.jx-toolbar input,.jx-toolbar select{min-width:100%}}
    `;
    document.head.appendChild(s);
  }

  function enhanceMedia(root) {
    if (!root || enhanced.has(root)) return;
    const player = q('#player', root);
    const search = q('#videoSearch', root);
    const query = q('#videoQuery', root);
    if (!player || !search || !query) return;
    enhanced.add(root);

    const panel = document.createElement('section');
    panel.className = 'jx-panel';
    panel.innerHTML = `<div class="jx-toolbar"><input id="jxVideoQuery" placeholder="Search YouTube videos inside JARVIS…"><button class="primary" id="jxVideoGo">SEARCH</button><select id="jxVideoInstance"><option>Privacy video engine</option></select></div><div class="jx-player" id="jxVideoPlayer"><div class="jx-empty">Search for a video, then play it here without leaving JARVIS.</div></div><div class="jx-status" id="jxVideoStatus">Powered by an open, API-key-free video search bridge.</div><div class="jx-grid" id="jxVideoResults"></div>`;
    player.replaceWith(panel);
    q('#jxVideoQuery', panel).value = query.value || '';

    async function searchVideos() {
      const term = q('#jxVideoQuery', panel).value.trim();
      const results = q('#jxVideoResults', panel);
      const status = q('#jxVideoStatus', panel);
      if (!term) return;
      results.innerHTML = '<div class="jx-empty">Searching…</div>';
      let data = null;
      for (let i = 0; i < PIPED.length && !data; i++) {
        pipedIndex = (pipedIndex + i) % PIPED.length;
        try {
          const r = await fetch(`${PIPED[pipedIndex]}/search?q=${encodeURIComponent(term)}&filter=videos`, {headers:{Accept:'application/json'}});
          if (r.ok) data = await r.json();
        } catch {}
      }
      const items = (data?.items || []).filter(x => x.type === 'stream' && x.url).slice(0, 12);
      if (!items.length) {
        results.innerHTML = '<div class="jx-empty">The video search bridge is unavailable right now. You can still paste a YouTube URL below.</div>';
        status.textContent = 'Search bridge unavailable. Playback remains available.';
        return;
      }
      status.textContent = `${items.length} results • tap a card to play in JARVIS`;
      results.innerHTML = items.map((v, i) => `<button class="jx-card" data-jx-video="${i}" style="color:inherit;text-align:left"><img class="jx-thumb" loading="lazy" src="${esc(v.thumbnail)}" alt=""><div class="jx-card-body"><div class="jx-card-title">${esc(v.title)}</div><div class="jx-meta">${esc(v.uploaderName || 'YouTube')} · ${esc(v.duration ? Math.round(v.duration/60)+' min' : '')}</div></div></button>`).join('');
      qa('[data-jx-video]', results).forEach((b, i) => b.addEventListener('click', () => play(items[i])));
      function play(v) {
        const id = String(v.url).split('/').pop();
        q('#jxVideoPlayer', panel).innerHTML = `<iframe title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0"></iframe>`;
        q('#jxVideoStatus', panel).textContent = v.title;
      }
    }
    q('#jxVideoGo', panel).addEventListener('click', searchVideos);
    q('#jxVideoQuery', panel).addEventListener('keydown', e => { if (e.key === 'Enter') searchVideos(); });
    search.addEventListener('click', () => { q('#jxVideoQuery', panel).value = query.value; searchVideos(); });
  }

  function enhanceNews(root) {
    if (!root || enhanced.has(root)) return;
    if (!q('#webQuery', root)) return;
    enhanced.add(root);
    const panel = document.createElement('section');
    panel.className = 'jx-panel';
    panel.innerHTML = `<div class="jx-toolbar"><input id="jxNewsQuery" value="technology" placeholder="Search news…"><button class="primary" id="jxNewsGo">LOAD NEWS</button><select id="jxNewsRegion"><option value="IN">India</option><option value="US">World</option><option value="GB">UK</option></select></div><div class="jx-status" id="jxNewsStatus">Live headlines, rendered inside JARVIS.</div><div class="jx-news" id="jxNewsResults"><div class="jx-empty">Loading headlines…</div></div>`;
    root.appendChild(panel);
    async function load() {
      const term = q('#jxNewsQuery', panel).value.trim() || 'technology';
      const region = q('#jxNewsRegion', panel).value;
      const out = q('#jxNewsResults', panel);
      out.innerHTML = '<div class="jx-empty">Fetching headlines…</div>';
      try {
        const feed = `https://news.google.com/rss/search?q=${encodeURIComponent(term)}&hl=en-${region}&gl=${region}&ceid=${region}:en`;
        const r = await fetch(RSS + encodeURIComponent(feed));
        if (!r.ok) throw new Error('news bridge unavailable');
        const data = await r.json();
        const items = (data.items || []).slice(0, 12);
        out.innerHTML = items.length ? items.map(x => `<article><h3><a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a></h3><p>${esc((x.description || '').replace(/<[^>]*>/g,'').slice(0,180))}</p><small>${esc(x.author || x.pubDate || '')}</small></article>`).join('') : '<div class="jx-empty">No headlines found.</div>';
        q('#jxNewsStatus', panel).textContent = `${items.length} headlines • refreshed ${new Date().toLocaleTimeString()}`;
      } catch {
        out.innerHTML = '<div class="jx-empty">News bridge unavailable. Try again in a moment.</div>';
        q('#jxNewsStatus', panel).textContent = 'Could not reach the news feed.';
      }
    }
    q('#jxNewsGo', panel).addEventListener('click', load);
    q('#jxNewsQuery', panel).addEventListener('keydown', e => { if (e.key === 'Enter') load(); });
    load();
  }

  function enhanceMaps(root) {
    if (!root || enhanced.has(root)) return;
    if (!q('#mapQuery', root) || !q('#mapFrame', root)) return;
    enhanced.add(root);
    const frame = q('#mapFrame', root);
    const oldButtons = qa('[data-map]', root);
    oldButtons.forEach(b => b.style.display = 'none');
    const note = document.createElement('div');
    note.className = 'jx-status';
    note.textContent = 'JARVIS Maps uses OpenStreetMap directly. No Google Maps redirect.';
    frame.parentElement.insertBefore(note, frame);
    const list = document.createElement('div'); list.className = 'jx-place-list'; frame.parentElement.insertBefore(list, frame);
    async function locate(term) {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&q=${encodeURIComponent(term)}`, {headers:{Accept:'application/json'}});
      if (!r.ok) throw new Error('map search unavailable');
      return r.json();
    }
    async function show(term) {
      if (!term) return;
      frame.innerHTML = '<div class="jx-empty">Searching OpenStreetMap…</div>';
      try {
        const places = await locate(term);
        if (!places.length) { frame.innerHTML = '<div class="jx-empty">No places found.</div>'; list.innerHTML=''; return; }
        list.innerHTML = places.map((p, i) => `<button class="jx-place" data-jx-place="${i}"><strong>${esc(p.display_name.split(',')[0])}</strong><small>${esc(p.display_name)}</small></button>`).join('');
        const select = p => {
          const lat = Number(p.lat), lon = Number(p.lon), d = .015;
          const bbox = `${lon-d},${lat-d},${lon+d},${lat+d}`;
          frame.innerHTML = `<div class="jx-map"><iframe title="OpenStreetMap" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lon}"></iframe></div>`;
        };
        qa('[data-jx-place]', list).forEach((b,i)=>b.addEventListener('click',()=>select(places[i])));
        select(places[0]);
      } catch { frame.innerHTML = '<div class="jx-empty">Map search unavailable. Check your network connection.</div>'; }
    }
    const input = q('#mapQuery', root);
    const button = q('#mapSearch', root);
    button?.addEventListener('click', () => show(input.value.trim()));
    input?.addEventListener('keydown', e => { if (e.key === 'Enter') show(input.value.trim()); });
    q('#locateMe', root)?.addEventListener('click', () => navigator.geolocation?.getCurrentPosition(p => { input.value = `${p.coords.latitude},${p.coords.longitude}`; show(input.value); }));
  }

  function enhanceSnake(root) {
    if (!root || enhanced.has(root)) return;
    const canvas = q('#snakeCanvas', root);
    if (!canvas) return;
    enhanced.add(root);
    const dpad = document.createElement('div');
    dpad.className = 'jx-dpad';
    dpad.innerHTML = `<button class="up" aria-label="Up">▲</button><button class="left" aria-label="Left">◀</button><button class="down" aria-label="Down">▼</button><button class="right" aria-label="Right">▶</button>`;
    canvas.insertAdjacentElement('afterend', dpad);
    const fire = key => document.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true}));
    q('.up',dpad).onclick=()=>fire('ArrowUp'); q('.left',dpad).onclick=()=>fire('ArrowLeft'); q('.down',dpad).onclick=()=>fire('ArrowDown'); q('.right',dpad).onclick=()=>fire('ArrowRight');
    let sx=0,sy=0;
    canvas.addEventListener('touchstart',e=>{const t=e.changedTouches[0];sx=t.clientX;sy=t.clientY},{passive:true});
    canvas.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;if(Math.abs(dx)>Math.abs(dy))fire(dx>0?'ArrowRight':'ArrowLeft');else fire(dy>0?'ArrowDown':'ArrowUp')},{passive:true});
  }

  function enhanceBrowserShell() {
    const address = q('#browserAddress');
    if (!address || address.dataset.jxBound) return;
    address.dataset.jxBound = '1';
    address.addEventListener('keydown', e => { if (e.key === 'Enter') setTimeout(() => { address.value = address.value.trim().replace(/\/$/,'') || address.value; }, 0); });
  }

  function scan() {
    style();
    const workspace = q('.workspace');
    if (!workspace) return;
    if (q('#player')) enhanceMedia(workspace);
    if (q('#webQuery')) enhanceNews(workspace);
    if (q('#mapFrame')) enhanceMaps(workspace);
    if (q('#snakeCanvas')) enhanceSnake(workspace);
    enhanceBrowserShell();
  }

  new MutationObserver(() => requestAnimationFrame(scan)).observe(document.documentElement, {subtree:true, childList:true});
  window.addEventListener('load', scan);
  setTimeout(scan, 50);
})();
