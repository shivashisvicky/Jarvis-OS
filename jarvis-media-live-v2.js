(() => {
  'use strict';
  if (window.__JARVIS_LIVE_MEDIA_V2__) return;
  window.__JARVIS_LIVE_MEDIA_V2__ = true;

  const TRACE = window.__JARVIS_MEDIA_TRACE__ = window.__JARVIS_MEDIA_TRACE__ || [];
  const trace = (step, value = '') => TRACE.push({ step, value: String(value).slice(0, 600), at: new Date().toISOString() });
  const $ = s => document.querySelector(s);
  const TIMEOUT = 9000;
  const seen = new Set();

  const YT_ID = /^[A-Za-z0-9_-]{11}$/;
  const ALL_ORIGINS = 'https://api.allorigins.win/raw?url=';
  const PIPED_SEEDS = [
    'https://pipedapi.kavin.rocks', 'https://pipedapi.leptons.xyz',
    'https://pipedapi.nosebs.ru', 'https://pipedapi-libre.kavin.rocks',
    'https://piped-api.privacy.com.de', 'https://pipedapi.adminforge.de',
    'https://api.piped.yt', 'https://pipedapi.drgns.space',
    'https://pipedapi.owo.si', 'https://pipedapi.ducks.party',
    'https://piped-api.codespace.cz', 'https://pipedapi.reallyaweso.me',
    'https://api.piped.private.coffee', 'https://pipedapi.darkness.services'
  ];

  const timeoutFetch = async (url) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), TIMEOUT);
    try {
      const r = await fetch(url, { signal: c.signal, cache: 'no-store', headers: { Accept: 'application/json,text/plain,*/*' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r;
    } finally { clearTimeout(t); }
  };

  const allOrigins = async url => timeoutFetch(ALL_ORIGINS + encodeURIComponent(url)).then(r => r.text());

  const idFrom = value => {
    const s = String(value || '');
    const m = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    return YT_ID.test(s.trim()) ? s.trim() : '';
  };

  const add = (items, id, title, channel = 'YouTube', thumbnail = '') => {
    if (!YT_ID.test(id) || seen.has(id)) return;
    seen.add(id);
    items.push({ id, title: String(title || `YouTube video ${id}`), channel: String(channel || 'YouTube'), thumbnail: String(thumbnail || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`) });
  };

  const parseYouTubeHtml = (html, items) => {
    const renderer = /"videoRenderer":\{[\s\S]*?"videoId":"([A-Za-z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    let m;
    while ((m = renderer.exec(html))) {
      let title = m[2];
      try { title = JSON.parse('"' + title.replace(/\\/g, '\\\\') + '"'); } catch {}
      add(items, m[1], title);
      if (items.length >= 12) return;
    }
    const ids = html.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/g) || [];
    for (const hit of ids) {
      const id = idFrom(hit);
      add(items, id, 'YouTube result');
      if (items.length >= 12) return;
    }
  };

  const searchYouTubeViaProxy = async query => {
    const target = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const html = await allOrigins(target);
    const items = [];
    parseYouTubeHtml(html, items);
    if (!items.length) throw new Error('YouTube HTML returned no video renderers');
    return items;
  };

  const searchDuckDuckGoViaProxy = async query => {
    const target = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' site:youtube.com/watch')}`;
    const html = await allOrigins(target);
    const items = [];
    const links = html.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_?=&%.-]+/g) || [];
    for (const link of links) add(items, idFrom(link), 'YouTube result');
    if (!items.length) throw new Error('DuckDuckGo returned no YouTube links');
    return items;
  };

  const parsePiped = payload => {
    const data = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    return data.map(x => ({ id: idFrom(x?.videoId || x?.url || ''), title: x?.title, channel: x?.uploaderName || x?.uploader, thumbnail: x?.thumbnail })).filter(x => YT_ID.test(x.id));
  };

  const searchPiped = async (base, query) => {
    const r = await timeoutFetch(`${base}/search?q=${encodeURIComponent(query)}&filter=videos`);
    const data = await r.json();
    const items = [];
    for (const x of parsePiped(data)) add(items, x.id, x.title, x.channel, x.thumbnail);
    if (!items.length) throw new Error('Piped returned no videos');
    return items;
  };

  const discoverPiped = async () => {
    try {
      const text = await allOrigins('https://raw.githubusercontent.com/TeamPiped/documentation/main/content/docs/public-instances/index.md');
      const found = [...text.matchAll(/\|\s*[^|]+\s*\|\s*(https:\/\/[^\s|]+)\s*\|/g)].map(m => m[1].replace(/\/$/, ''));
      return [...new Set([...found, ...PIPED_SEEDS])];
    } catch (e) { trace('piped-registry-failed', e); return PIPED_SEEDS; }
  };

  const discoverInvidious = async () => {
    try {
      const text = await allOrigins('https://api.invidious.io/instances.json?sort_by=health');
      const data = JSON.parse(text);
      return data.filter(x => x?.[1]?.api && x?.[1]?.type === 'https').map(x => `https://${x[0]}`);
    } catch (e) { trace('invidious-registry-failed', e); return []; }
  };

  const searchInvidious = async (base, query) => {
    const r = await timeoutFetch(`${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&region=IN`);
    const data = await r.json();
    const items = [];
    for (const x of Array.isArray(data) ? data : []) add(items, x?.videoId, x?.title, x?.author, x?.videoThumbnails?.[0]?.url);
    if (!items.length) throw new Error('Invidious returned no videos');
    return items;
  };

  const setState = (text, detail = '') => {
    const el = $('#mediaState');
    if (el) el.textContent = detail ? `${text} · ${detail}` : text;
  };

  const play = id => {
    const player = $('#jarvisPlayer');
    if (!player || !YT_ID.test(id)) return;
    player.replaceChildren();
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
    iframe.title = 'JARVIS YouTube Player';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.style.cssText = 'width:100%;aspect-ratio:16/9;min-height:320px;border:0';
    player.appendChild(iframe);
    setState('PLAYING', 'OFFICIAL YOUTUBE PLAYER');
    trace('player-mounted', id);
  };

  const render = items => {
    const box = $('#videoResults');
    if (!box) return;
    box.replaceChildren();
    items.slice(0, 8).forEach(v => {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'jvc-card'; card.dataset.jvcId = v.id;
      const img = document.createElement('img'); img.loading = 'lazy'; img.alt = ''; img.src = v.thumbnail;
      const meta = document.createElement('span'); meta.className = 'video-meta';
      const title = document.createElement('strong'); title.textContent = v.title;
      const channel = document.createElement('small'); channel.textContent = v.channel;
      meta.append(title, channel);
      const playIcon = document.createElement('b'); playIcon.textContent = '▶';
      card.append(img, meta, playIcon); box.appendChild(card);
    });
    setState('READY', `${Math.min(items.length, 8)} LIVE YOUTUBE RESULTS`);
    trace('results-rendered', items.map(x => x.id).join(','));
  };

  let generation = 0;
  const search = async query => {
    const q = String(query || '').trim();
    if (!q) return;
    const run = ++generation;
    const direct = idFrom(q);
    if (direct) { play(direct); return; }
    const box = $('#videoResults');
    if (!box) return;
    box.innerHTML = '<div class="media-loading-indicator">SEARCHING LIVE VIDEO SOURCES…</div>';
    setState('SEARCHING', q.toUpperCase());
    trace('search-start', q);
    seen.clear();

    const jobs = [
      ['youtube-proxy', searchYouTubeViaProxy(q)],
      ['duckduckgo-proxy', searchDuckDuckGoViaProxy(q)],
      ...PIPED_SEEDS.slice(0, 6).map(base => [`piped:${base}`, searchPiped(base, q)]),
      ...(await discoverPiped()).slice(0, 10).map(base => [`piped-dynamic:${base}`, searchPiped(base, q)]),
      ...(await discoverInvidious()).slice(0, 8).map(base => [`invidious:${base}`, searchInvidious(base, q)])
    ];

    const settled = await Promise.allSettled(jobs.map(x => x[1]));
    if (run !== generation) return;
    const results = [];
    settled.forEach((result, i) => {
      const name = jobs[i][0];
      if (result.status === 'fulfilled') {
        trace(`provider-ok:${name}`, result.value.length);
        for (const item of result.value) { if (!seen.has(item.id)) { seen.add(item.id); results.push(item); } }
      } else trace(`provider-failed:${name}`, result.reason?.message || result.reason || 'unknown');
    });
    if (!results.length) {
      box.innerHTML = '<div class="media-degraded-state"><strong>LIVE SEARCH TEMPORARILY UNAVAILABLE</strong><small>Every live provider was attempted. No fabricated results were inserted.</small><a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=' + encodeURIComponent(q) + '">OPEN OFFICIAL YOUTUBE SEARCH ↗</a></div>';
      setState('DEGRADED', 'ALL LIVE PROVIDERS FAILED');
      trace('search-failed', q);
      return;
    }
    render(results);
  };

  const bind = () => {
    const input = $('#videoQuery');
    const button = $('#videoSearch');
    if (!input || !button) return;
    if (button.dataset.liveV2Bound !== '1') {
      button.dataset.liveV2Bound = '1';
      button.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); search(input.value); }, true);
    }
    if (input.dataset.liveV2Bound !== '1') {
      input.dataset.liveV2Bound = '1';
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); search(input.value); } }, true);
    }
    const results = $('#videoResults');
    if (results && results.dataset.liveV2Bound !== '1') {
      results.dataset.liveV2Bound = '1';
      results.addEventListener('click', e => { const card = e.target.closest('.jvc-card[data-jvc-id]'); if (card) { e.preventDefault(); e.stopImmediatePropagation(); play(card.dataset.jvcId || ''); } }, true);
    }
    const playButton = $('#playVideo');
    if (playButton && playButton.dataset.liveV2Bound !== '1') {
      playButton.dataset.liveV2Bound = '1';
      playButton.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); search($('#videoUrl')?.value || ''); }, true);
    }
    if (!window.__JARVIS_LIVE_MEDIA_READY__) { window.__JARVIS_LIVE_MEDIA_READY__ = true; setState('READY', 'LIVE YOUTUBE SEARCH'); trace('media-ready'); }
  };

  const observer = new MutationObserver(bind);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  bind();
  window.jarvisVideoSearch = search;
  window.jarvisVideoPlay = play;
})();
