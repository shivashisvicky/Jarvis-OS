(() => {
  'use strict';

  const VERSION = '20260816-livefix-1';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const LOG_KEY = 'jarvis-live-log-v1';
  const logs = (() => { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; } })();
  const log = (feature, message, data = {}) => {
    const row = { at: new Date().toISOString(), feature, message, data };
    logs.push(row); if (logs.length > 250) logs.splice(0, logs.length - 250);
    try { localStorage.setItem(LOG_KEY, JSON.stringify(logs)); } catch {}
    console.info(`[JARVIS:${feature}] ${message}`, data);
    window.dispatchEvent(new CustomEvent('jarvis:live-log', { detail: row }));
  };
  window.JARVIS_LIVE_LOGS = logs;
  window.jarvisLog = log;
  window.jarvisClearLogs = () => { logs.splice(0); try { localStorage.removeItem(LOG_KEY); } catch {} ; log('diagnostics', 'Log cleared'); };
  window.jarvisExportLogs = () => JSON.stringify(logs, null, 2);
  log('boot', `live fix ${VERSION} loaded`);

  window.addEventListener('error', e => log('runtime', e.message || 'window error', { source: e.filename, line: e.lineno }));
  window.addEventListener('unhandledrejection', e => log('runtime', 'Unhandled promise rejection', { reason: String(e.reason || '') }));

  function style() {
    if ($('#jarvis-live-fix-css')) return;
    const s = document.createElement('style'); s.id = 'jarvis-live-fix-css';
    s.textContent = `
      .jlf-panel{margin-top:14px;padding:14px;border:1px solid rgba(126,205,255,.16);border-radius:14px;background:rgba(2,9,14,.72)}
      .jlf-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.jlf-head strong{font:700 10px ui-monospace,monospace;letter-spacing:.12em;color:#aeeeff}.jlf-live{color:#68efae;font:700 9px ui-monospace,monospace}.jlf-log{max-height:240px;overflow:auto;margin-top:9px;display:grid;gap:5px}.jlf-row{padding:7px 8px;border:1px solid rgba(126,205,255,.08);border-radius:8px;font:10px/1.4 ui-monospace,monospace;color:#88aab5}.jlf-row b{color:#68dfff}.jlf-actions{display:flex;gap:7px;flex-wrap:wrap}.jlf-actions button{cursor:pointer}.jlf-map{height:430px;border-radius:14px;overflow:hidden;background:#071017}.jlf-map iframe{width:100%;height:100%;border:0}.jlf-results{display:grid;gap:8px;margin-top:10px}.jlf-result{display:block;padding:11px;border:1px solid rgba(126,205,255,.12);border-radius:11px;background:rgba(3,11,17,.78);color:inherit;text-decoration:none}.jlf-result strong{display:block;font-size:12px}.jlf-result p{margin:5px 0 0;color:#8daab4;font-size:10px;line-height:1.45}.jlf-result small{display:block;margin-top:5px;color:#5d7a84;font-size:9px}.jlf-pad{display:grid;grid-template-columns:repeat(3,52px);gap:6px;justify-content:center;margin:12px auto}.jlf-pad button{width:52px;height:46px;padding:0;font-size:19px;touch-action:manipulation}.jlf-pad .blank{visibility:hidden}
      @media(max-width:600px){.jlf-map{height:360px}}
    `; document.head.appendChild(s);
  }

  async function fetchJson(url, timeout = 5000) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), timeout);
    const started = performance.now();
    try {
      log('network', 'request', { url });
      const r = await fetch(url, { signal: c.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      const ms = Math.round(performance.now() - started);
      if (!r.ok) throw new Error(String(r.status));
      const data = await r.json(); log('network', 'response', { url, status: r.status, ms }); return data;
    } catch (e) { log('network', 'failed', { url, ms: Math.round(performance.now() - started), error: String(e) }); throw e; }
    finally { clearTimeout(t); }
  }

  function externalSearchUrl(q) { return `https://search.brave.com/search?q=${encodeURIComponent(q)}`; }

  async function centralSearch(query, target = null) {
    const q = String(query || '').trim().replace(/^(search|look up|find|ask jarvis|tell me about|search the web for)\s+/i, '').trim();
    if (!q) return;
    log('search', 'central search started', { query: q });
    const box = target || $('#jlfCentralResult') || $('#jv3SearchAnswer') || $('#jv3-answer') || (() => {
      const host = $('.command-surface') || $('.search-workspace'); if (!host) return null;
      const b = document.createElement('section'); b.id = 'jlfCentralResult'; b.className = 'jlf-panel'; host.after(b); return b;
    })();
    if (!box) { log('search', 'no result host available'); return; }
    box.style.display = 'block';
    box.innerHTML = '<div class="jlf-status">JARVIS CENTRAL SEARCH · LOCAL KNOWLEDGE → LIVE WEB → EXPLICIT FALLBACK</div>';
    const low = q.toLowerCase();
    if (/\b(video|videos|youtube|movie|movies)\b/.test(low)) {
      const b = $('button.nav[data-app="media"]'); b?.click(); await sleep(180); const input = $('#videoQuery'); if (input) { input.value = q; await mediaSearch(q); } return;
    }
    if (/\b(map|maps|navigate|directions|location)\b/.test(low)) {
      const b = $('button.nav[data-app="maps"]'); b?.click(); await sleep(180); const input = $('#mapQuery'); if (input) { input.value = q.replace(/\b(show|open|find|maps?|navigate|location|directions)\b/gi, '').trim() || 'Jagannath Nagar, Jharapada, Bhubaneswar'; await mapSearch(input.value); } return;
    }
    if (/\b(news|headlines|latest)\b/.test(low)) {
      await newsLoad(q, box); return;
    }
    try {
      const ddg = await fetchJson(`https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1&no_redirect=1`, 4500);
      if (ddg.AbstractText || ddg.Answer || ddg.Definition) {
        const text = ddg.AbstractText || ddg.Answer || ddg.Definition;
        box.innerHTML = `<h3>${esc(q)}</h3><p>${esc(text)}</p><small>JARVIS knowledge provider${ddg.AbstractURL ? ` · ${esc(ddg.AbstractURL)}` : ''}</small><div class="jlf-actions"><button class="secondary" id="jlfSearchInternet" type="button">SEARCH INTERNET</button></div>`;
        $('#jlfSearchInternet', box)?.addEventListener('click', () => { log('search', 'explicit external search requested', { query: q }); window.open(externalSearchUrl(q), '_blank', 'noopener,noreferrer'); });
        log('search', 'knowledge answer resolved'); return;
      }
      const wiki = await fetchJson(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&format=json&origin=*&srlimit=6`, 4500);
      const hits = wiki?.query?.search || [];
      if (hits.length) {
        box.innerHTML = `<h3>JARVIS results for “${esc(q)}”</h3><div class="jlf-results">${hits.map(x => { const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(String(x.title).replace(/ /g, '_'))}`; return `<a class="jlf-result" href="${esc(url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(x.title)}</strong><p>${esc(String(x.snippet || '').replace(/<[^>]+>/g, ' '))}</p><small>Wikipedia</small></a>`; }).join('')}</div><div class="jlf-actions"><button class="secondary" id="jlfSearchInternet" type="button">SEARCH INTERNET</button></div>`;
        $('#jlfSearchInternet', box)?.addEventListener('click', () => window.open(externalSearchUrl(q), '_blank', 'noopener,noreferrer'));
        log('search', 'indexed result set resolved', { count: hits.length }); return;
      }
    } catch (e) { log('search', 'knowledge providers failed', { error: String(e) }); }
    box.innerHTML = `<h3>JARVIS could not resolve “${esc(q)}” internally</h3><p>The central layer is still alive. No automatic redirect occurred.</p><div class="jlf-actions"><button class="primary" id="jlfSearchInternet" type="button">SEARCH INTERNET</button></div>`;
    $('#jlfSearchInternet', box)?.addEventListener('click', () => { log('search', 'explicit external search requested', { query: q }); window.open(externalSearchUrl(q), '_blank', 'noopener,noreferrer'); });
    log('search', 'central search exhausted providers');
  }
  window.jarvisCentralSearch = centralSearch;

  async function mediaSearch(query) {
    const input = $('#videoQuery'), results = $('#videoResults'), player = $('#jarvisPlayer'), status = $('#jvcStatus') || $('#mediaState');
    if (!results || !player || !status) return;
    const q = String(query || input?.value || '').trim(); if (!q) return;
    status.textContent = 'SEARCHING · JARVIS VIDEO INDEX'; results.innerHTML = '<div class="empty">Searching in-house video index…</div>'; log('media', 'search started', { query: q });
    const piped = ['https://pipedapi.kavin.rocks','https://pipedapi.tokhmi.xyz','https://pipedapi.moomoo.me','https://pipedapi.syncpundit.io','https://api-piped.mha.fi'];
    const inv = ['https://inv.nadeko.net','https://invidious.nerdvpn.de'];
    const normalize = (v, source) => { const id = String(v?.videoId || v?.id || v?.url || '').match(/(?:v=|\/watch\/|youtu\.be\/|^)([A-Za-z0-9_-]{11})/)?.[1] || String(v?.videoId || v?.id || ''); if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null; return { id, title: v?.title || 'Untitled video', author: v?.author || v?.uploader || v?.uploaderName || 'YouTube', views: v?.viewCountText || v?.views || '', thumb: v?.thumbnail || v?.thumbnailUrl || v?.videoThumbnails?.find(x => /high|medium|maxres/i.test(x?.quality || ''))?.url || v?.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, source }; };
    const tasks = [
      fetchJson(`/api/v1/search?q=${encodeURIComponent(q)}&filter=videos&region=IN`, 1800).then(d => (Array.isArray(d) ? d : d?.items || d?.results || []).map(v => normalize(v, 'JARVIS LOCAL')).filter(Boolean)),
      ...piped.map(base => fetchJson(`${base}/search?q=${encodeURIComponent(q)}&filter=videos&region=IN`, 3200).then(d => (Array.isArray(d) ? d : d?.items || []).map(v => normalize(v, 'PIPED')).filter(Boolean))),
      ...inv.map(base => fetchJson(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&region=IN&page=1`, 3200).then(d => (Array.isArray(d) ? d : []).map(v => normalize(v, 'INVIDIOUS')).filter(Boolean)))
    ];
    const settled = await Promise.allSettled(tasks); const merged = [], seen = new Set();
    for (const s of settled) if (s.status === 'fulfilled') for (const item of s.value || []) if (!seen.has(item.id)) { seen.add(item.id); merged.push(item); }
    const items = merged.slice(0, 10);
    if (!items.length) { results.innerHTML = '<div class="jlf-fallback">No public video index responded with results. JARVIS will not redirect you. Paste a YouTube URL or try again.</div>'; status.textContent = 'VIDEO INDEX DEGRADED · NO REDIRECT'; log('media', 'no providers returned results'); return; }
    results.innerHTML = items.map(v => `<button class="jv3-video-card jvc-card" type="button" data-jlf-video="${esc(v.id)}"><img class="jv3-video-thumb" loading="lazy" src="${esc(v.thumb)}" alt=""><span><strong>${esc(v.title)}</strong><small>${esc(v.author)}${v.views ? ` · ${esc(v.views)}` : ''}</small></span><b>▶</b></button>`).join('');
    status.textContent = `${items.length} RESULTS · STAYING INSIDE JARVIS`; log('media', 'results rendered', { count: items.length });
    $$('.jvc-card', results).forEach(card => card.addEventListener('click', () => playVideo({ id: card.dataset.jlfVideo, title: card.textContent?.trim() || 'JARVIS Video' })));
  }
  async function playVideo(item) {
    const player = $('#jarvisPlayer'), status = $('#jvcStatus') || $('#mediaState'); if (!player || !status || !item?.id) return;
    status.textContent = 'RESOLVING · JARVIS PLAYER'; log('media', 'play requested', { id: item.id });
    const streamBases = ['https://pipedapi.kavin.rocks','https://pipedapi.tokhmi.xyz','https://pipedapi.syncpundit.io'];
    const streams = await Promise.allSettled(streamBases.map(base => fetchJson(`${base}/streams/${encodeURIComponent(item.id)}`, 2500).then(d => (d.videoStreams || []).filter(x => x?.url && !x.videoOnly).sort((a,b) => (b.height || 0) - (a.height || 0))[0])));
    const stream = streams.find(x => x.status === 'fulfilled' && x.value?.url)?.value;
    if (stream?.url) { player.innerHTML = `<video controls playsinline preload="metadata"><source src="${esc(stream.url)}" type="${esc(stream.mimeType || 'video/mp4')}"></video>`; status.textContent = `PLAYING · ${esc(stream.quality || 'AUTO')}`; log('media', 'direct stream mounted'); return; }
    player.innerHTML = `<iframe title="${esc(item.title || 'JARVIS Video')}" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.id)}?rel=0&playsinline=1&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    status.textContent = 'PLAYING · JARVIS EMBED'; log('media', 'embed player mounted');
  }
  window.jarvisVideoSearch = mediaSearch;

  async function mapSearch(query) {
    const q = String(query || '').trim(), results = $('#mapResults'), frame = $('#mapFrame'); if (!q || !results || !frame) return;
    const aliases = [
      { re: /maa\s+enclave/i, name: 'Maa Enclave', detail: 'Jagannath Nagar, Jharapada, Bhubaneswar, Odisha', lat: 20.2923, lon: 85.8638 },
      { re: /jagannath\s+nagar/i, name: 'Jagannath Nagar', detail: 'Jharapada, Bhubaneswar, Odisha 751010', lat: 20.2923, lon: 85.8638 },
      { re: /ggp\s+colony/i, name: 'GGP Colony', detail: 'Jagannath Nagar, Rasulgarh, Bhubaneswar, Odisha 751025', lat: 20.2934, lon: 85.8659 },
      { re: /jharapada|jharpada/i, name: 'Jharapada', detail: 'Bhubaneswar, Odisha', lat: 20.2910, lon: 85.8680 }
    ];
    const local = aliases.find(x => x.re.test(q));
    if (local) { results.innerHTML = `<button class="jlf-result" type="button"><strong>${esc(local.name)}</strong><p>${esc(local.detail)}</p></button>`; frame.innerHTML = `<div class="jlf-map"><iframe title="${esc(local.name)} map" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${local.lon-.018},${local.lat-.014},${local.lon+.018},${local.lat+.014}&layer=mapnik&marker=${local.lat},${local.lon}"></iframe></div>`; log('maps', 'local alias resolved', { query: q, name: local.name, lat: local.lat, lon: local.lon }); return; }
    results.innerHTML = '<div class="empty">SEARCHING BHUBANESWAR GEO INDEX…</div>'; log('maps', 'geocode started', { query: q });
    try {
      const variants = [q, `${q}, Bhubaneswar, Odisha, India`, `${q}, Jharapada, Bhubaneswar, Odisha, India`]; let places = [];
      for (const v of variants) { try { const d = await fetchJson(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&addressdetails=1&countrycodes=in&q=${encodeURIComponent(v)}`, 4500); if (d?.length) { places = d; break; } } catch {} }
      if (!places.length) throw new Error('No matching place found');
      results.innerHTML = places.map((p,i) => `<button class="jlf-result" type="button" data-place="${i}"><strong>${esc(p.display_name.split(',').slice(0,2).join(', '))}</strong><p>${esc(p.display_name)}</p></button>`).join('');
      const choose = p => { const lat=Number(p.lat),lon=Number(p.lon); frame.innerHTML=`<div class="jlf-map"><iframe title="OpenStreetMap" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=${lon-.018},${lat-.014},${lon+.018},${lat+.014}&layer=mapnik&marker=${lat},${lon}"></iframe></div>`; };
      $$('[data-place]', results).forEach(b => b.addEventListener('click', () => choose(places[Number(b.dataset.place)]))); choose(places[0]); log('maps', 'geocode resolved', { query: q, count: places.length });
    } catch (e) { results.innerHTML = `<div class="empty">${esc(String(e?.message || 'Map search unavailable'))}</div>`; log('maps', 'geocode failed', { query: q, error: String(e) }); }
  }
  window.jarvisMapSearch = mapSearch;

  async function newsLoad(query = 'AI OR technology', host = null) {
    const desk = host || $('#newsDesk'); if (!desk) return; const gridId = `jlf-news-${Date.now()}`;
    desk.innerHTML = `<div class="news-head"><div><p class="eyebrow">INTELLIGENCE / LIVE BRIEF</p><h2>World signal</h2><p class="sub">Text-first news. Images are optional and never block the feed.</p></div><div><span class="news-live"><i></i> LIVE</span><button class="ghost" id="jlfNewsRefresh" type="button">REFRESH</button></div></div><div class="news-ticker"><div class="news-track" id="jlfNewsTicker">JARVIS IS SCANNING THE GLOBAL NEWS STREAM…</div></div><div class="jv3-news" id="${gridId}"><div class="empty">Fetching headlines…</div></div>`;
    const grid = $(`#${gridId}`, desk), ticker = $('#jlfNewsTicker', desk);
    const load = async () => {
      log('news', 'feed load started', { query }); let items = [];
      try { const d = await fetchJson(`https://api.gdeltproject.org/api/v2/doc/doc?query=(${encodeURIComponent(query)})&mode=artlist&format=json&maxrecords=8&timespan=24h&sort=datedesc`, 6000); items = (d?.articles || []).slice(0,8).map(a => ({ title:a.title, url:a.url, source:a.domain || a.sourcecountry || 'NEWS', date:a.seendate || 'Today' })); } catch (e) { log('news', 'GDELT failed', { error:String(e) }); }
      if (!items.length) { try { const rss = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`; const d = await fetchJson(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rss)}`, 6000); items = (d?.items || []).slice(0,8).map(a => ({ title:a.title, url:a.link, source:a.author || 'NEWS', date:a.pubDate || 'Today' })); } catch (e) { log('news', 'RSS fallback failed', { error:String(e) }); } }
      if (!items.length) { grid.innerHTML='<div class="jlf-fallback">No live news provider responded. Press REFRESH to retry. The UI remains usable.</div>'; ticker.textContent='NEWS FEED DEGRADED · JARVIS CORE STILL ONLINE'; return; }
      ticker.textContent = items.slice(0,4).map(x => `● ${x.title}`).join('   ·   '); grid.innerHTML = items.map(x => `<article class="jv3-news-card"><h3>${esc(x.title || 'Untitled story')}</h3><p>${esc(x.source || 'NEWS')} · ${esc(x.date || 'Today')}</p>${x.url ? `<a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">READ SOURCE ↗</a>` : ''}</article>`).join(''); log('news', 'headlines rendered', { count:items.length });
    };
    $('#jlfNewsRefresh', desk)?.addEventListener('click', () => void load()); await load();
  }
  window.jarvisNewsLoad = newsLoad;

  function addDiagnostics() {
    style(); const settings = $('.settings-grid'); if (!settings || $('#jlfDiagnostics')) return;
    const card = document.createElement('section'); card.id='jlfDiagnostics'; card.className='settings-card';
    card.innerHTML = `<div><p class="eyebrow">DIAGNOSTICS / LIVE</p><h3>JARVIS Live Transaction Log</h3><p>Every feature records provider attempts, failures and successful mounts locally on this device.</p></div><div class="jlf-actions"><button class="secondary" id="jlfCopyLog" type="button">COPY LOG</button><button class="secondary" id="jlfClearLog" type="button">CLEAR</button></div><div class="jlf-log" id="jlfLog"></div>`;
    settings.appendChild(card); const render=()=>{const out=$('#jlfLog',card);out.innerHTML=logs.slice(-30).reverse().map(x=>`<div class="jlf-row"><b>${esc(x.feature)}</b> · ${esc(new Date(x.at).toLocaleTimeString())} · ${esc(x.message)}</div>`).join('') || '<div class="empty">No events yet.</div>';};
    $('#jlfCopyLog',card).onclick=async()=>{try{await navigator.clipboard.writeText(window.jarvisExportLogs());}catch{};log('diagnostics','log copied');render()};
    $('#jlfClearLog',card).onclick=()=>{window.jarvisClearLogs();render()}; window.addEventListener('jarvis:live-log',render); render();
  }

  function commandCapture() {
    document.addEventListener('submit', e => {
      const form = e.target instanceof Element ? e.target.closest('#commandForm') : null; if (!form) return;
      e.preventDefault(); e.stopImmediatePropagation(); const input=$('#commandInput'); const q=input?.value?.trim(); if (!q) return;
      log('command','command submitted',{query:q}); const r = window.jarvisCentralSearch; if (typeof r === 'function') void r(q, $('#jarvisReply')); else log('command','central search unavailable');
    }, true);
    document.addEventListener('click', e => {
      const el = e.target instanceof Element ? e.target : null; if (!el) return;
      const webBtn = el.closest('#webSearch'); if (webBtn) { e.preventDefault(); e.stopImmediatePropagation(); const input=$('#webQuery'); if(input) void centralSearch(input.value, $('#jv3SearchAnswer') || $('#jlfCentralResult')); return; }
      const mapBtn = el.closest('#mapSearch'); if (mapBtn) { e.preventDefault(); e.stopImmediatePropagation(); const input=$('#mapQuery'); if(input) void mapSearch(input.value); return; }
      const mediaBtn = el.closest('#videoSearch'); if (mediaBtn) { e.preventDefault(); e.stopImmediatePropagation(); const input=$('#videoQuery'); if(input) void mediaSearch(input.value); return; }
      const provider = el.closest('[data-video-provider]'); if (provider) { e.preventDefault(); e.stopImmediatePropagation(); const input=$('#videoQuery'); if(input){input.value=provider.dataset.videoProvider==='trending'?'trending videos India':input.value;void mediaSearch(input.value)} return; }
      const playBtn = el.closest('#playVideo'); if (playBtn) { e.preventDefault(); e.stopImmediatePropagation(); const raw=$('#videoUrl')?.value?.trim(); if(!raw)return; const id=raw.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)?.[1] || (/^[A-Za-z0-9_-]{11}$/.test(raw)?raw:null); if(id)void playVideo({id,title:'JARVIS video'}); else if(/^https?:\/\/.*\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)){const p=$('#jarvisPlayer');if(p)p.innerHTML=`<video controls playsinline src="${esc(raw)}"></video>`;} else log('media','unsupported play input',{raw}); return; }
    }, true);
  }

  function searchWorkspaceCapture() {
    document.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return; const el=e.target; if (!(el instanceof HTMLInputElement)) return;
      if (el.id==='webQuery') { e.preventDefault(); e.stopImmediatePropagation(); void centralSearch(el.value, $('#jv3SearchAnswer') || $('#jlfCentralResult')); }
      if (el.id==='mapQuery') { e.preventDefault(); e.stopImmediatePropagation(); void mapSearch(el.value); }
      if (el.id==='videoQuery') { e.preventDefault(); e.stopImmediatePropagation(); void mediaSearch(el.value); }
    }, true);
  }

  function snakeControls() {
    const install = () => {
      const canvas = $('#snakeCanvas'); if (!canvas || canvas.dataset.jlf==='1') return; canvas.dataset.jlf='1'; const host=canvas.parentElement; if(!host)return;
      const pad=document.createElement('div');pad.className='jlf-pad';pad.innerHTML='<button class="blank">·</button><button data-d="up">▲</button><button class="blank">·</button><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button>';host.appendChild(pad);
      const key={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight'};pad.querySelectorAll('[data-d]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();window.dispatchEvent(new KeyboardEvent('keydown',{key:key[b.dataset.d]}));},{passive:false}));
      log('games','snake mobile D-pad installed');
    };
    new MutationObserver(install).observe(document.body,{subtree:true,childList:true}); install();
  }

  function newsHomeCapture() {
    const observer = new MutationObserver(() => { const desk=$('#newsDesk'); if (desk && !desk.dataset.jlf) { desk.dataset.jlf='1'; void newsLoad('AI OR technology', desk); } });
    observer.observe(document.body,{subtree:true,childList:true}); const desk=$('#newsDesk'); if(desk){desk.dataset.jlf='1';void newsLoad('AI OR technology',desk);}
  }

  style(); commandCapture(); searchWorkspaceCapture(); snakeControls(); newsHomeCapture();
  document.addEventListener('click', () => setTimeout(addDiagnostics, 50), true);
  setTimeout(addDiagnostics, 300);
  log('boot','live feature layer armed');
})();
