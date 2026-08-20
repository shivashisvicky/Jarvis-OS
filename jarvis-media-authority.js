/** J.A.R.V.I.S. OS 2.0 - single live media authority */
(() => {
  'use strict';
  if (window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__) return;
  window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__ = true;

  const TRACE = window.__JARVIS_MEDIA_TRACE__ = window.__JARVIS_MEDIA_TRACE__ || [];
  const trace = (step, value = '') => TRACE.push({ step, value: String(value).slice(0, 600), at: new Date().toISOString() });
  const $ = s => document.querySelector(s);
  const TIMEOUT = 9000;
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
  let generation = 0;
  const seen = new Set();

  const timeoutFetch = async url => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json,text/plain,*/*' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } finally { clearTimeout(timer); }
  };

  const allOrigins = url => timeoutFetch(ALL_ORIGINS + encodeURIComponent(url)).then(r => r.text());

  const idFrom = value => {
    const s = String(value || '');
    const match = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (match) return match[1];
    return YT_ID.test(s.trim()) ? s.trim() : '';
  };

  const add = (items, id, title, channel = 'YouTube', thumbnail = '') => {
    if (!YT_ID.test(id) || seen.has(id)) return;
    seen.add(id);
    items.push({ id, title: String(title || `YouTube video ${id}`), channel: String(channel || 'YouTube'), thumbnail: String(thumbnail || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`) });
  };

  const parseYouTubeHtml = (html, items) => {
    const renderer = /"videoRenderer":\{[\s\S]*?"videoId":"([A-Za-z0-9_-]{11})"[\s\S]*?"title":\{"runs":\[\{"text":"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    let match;
    while ((match = renderer.exec(html))) {
      let title = match[2];
      try { title = JSON.parse(`"${title}"`); } catch {}
      add(items, match[1], title);
      if (items.length >= 12) return;
    }
    const ids = html.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_?=&%.-]+/g) || [];
    for (const hit of ids) {
      add(items, idFrom(hit), 'YouTube result');
      if (items.length >= 12) return;
    }
  };

  const searchYouTubeViaProxy = async query => {
    const html = await allOrigins(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
    const items = [];
    parseYouTubeHtml(html, items);
    if (!items.length) throw new Error('YouTube HTML returned no video renderers');
    return items;
  };

  const searchDuckDuckGoViaProxy = async query => {
    const html = await allOrigins(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${query} site:youtube.com/watch`)}`);
    const items = [];
    const links = html.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)[A-Za-z0-9_?=&%.-]+/g) || [];
    for (const link of links) add(items, idFrom(link), 'YouTube result');
    if (!items.length) throw new Error('DuckDuckGo returned no YouTube links');
    return items;
  };

  const parsePiped = payload => {
    const data = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    return data.map(item => ({ id: idFrom(item?.videoId || item?.url || ''), title: item?.title, channel: item?.uploaderName || item?.uploader, thumbnail: item?.thumbnail })).filter(item => YT_ID.test(item.id));
  };

  const searchPiped = async (base, query) => {
    const response = await timeoutFetch(`${base}/search?q=${encodeURIComponent(query)}&filter=videos`);
    const items = [];
    for (const item of parsePiped(await response.json())) add(items, item.id, item.title, item.channel, item.thumbnail);
    if (!items.length) throw new Error('Piped returned no videos');
    return items;
  };

  const discoverPiped = async () => {
    try {
      const text = await allOrigins('https://raw.githubusercontent.com/TeamPiped/documentation/main/content/docs/public-instances/index.md');
      const found = [...text.matchAll(/\|\s*[^|]+\s*\|\s*(https:\/\/[^\s|]+)\s*\|/g)].map(match => match[1].replace(/\/$/, ''));
      return [...new Set([...found, ...PIPED_SEEDS])];
    } catch (error) { trace('piped-registry-failed', error); return PIPED_SEEDS; }
  };

  const discoverInvidious = async () => {
    try {
      const text = await allOrigins('https://api.invidious.io/instances.json?sort_by=health');
      const data = JSON.parse(text);
      return data.filter(item => item?.[1]?.api && item?.[1]?.type === 'https').map(item => `https://${item[0]}`);
    } catch (error) { trace('invidious-registry-failed', error); return []; }
  };

  const searchInvidious = async (base, query) => {
    const response = await timeoutFetch(`${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&region=IN`);
    const data = await response.json();
    const items = [];
    for (const item of Array.isArray(data) ? data : []) add(items, item?.videoId, item?.title, item?.author, item?.videoThumbnails?.[0]?.url);
    if (!items.length) throw new Error('Invidious returned no videos');
    return items;
  };

  const setState = (text, detail = '') => {
    const state = $('#mediaState');
    if (state) state.textContent = detail ? `${text} · ${detail}` : text;
    const legacy = $('#jvcStatus');
    if (legacy) legacy.textContent = detail ? `${text} · ${detail}` : text;
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
    items.slice(0, 8).forEach(video => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'jvc-card';
      card.dataset.jvcId = video.id;
      const image = document.createElement('img'); image.loading = 'lazy'; image.alt = ''; image.src = video.thumbnail;
      const meta = document.createElement('span'); meta.className = 'video-meta';
      const title = document.createElement('strong'); title.textContent = video.title;
      const channel = document.createElement('small'); channel.textContent = video.channel;
      meta.append(title, channel);
      const playIcon = document.createElement('b'); playIcon.textContent = '▶';
      card.append(image, meta, playIcon); box.appendChild(card);
    });
    setState('READY', `${Math.min(items.length, 8)} LIVE YOUTUBE RESULTS`);
    trace('results-rendered', items.map(item => item.id).join(','));
  };

  const search = async query => {
    const q = String(query || '').trim();
    if (!q) { setState('READY', 'ENTER A VIDEO SEARCH TERM'); return; }
    const direct = idFrom(q);
    if (direct) { play(direct); return; }
    const box = $('#videoResults');
    if (!box) return;
    const run = ++generation;
    box.innerHTML = '<div class="media-loading-indicator">SEARCHING LIVE VIDEO SOURCES…</div>';
    setState('SEARCHING', q.toUpperCase());
    trace('search-start', q);
    seen.clear();

    const providers = [
      ['youtube-proxy', searchYouTubeViaProxy(q)],
      ['duckduckgo-proxy', searchDuckDuckGoViaProxy(q)],
      ...PIPED_SEEDS.slice(0, 6).map(base => [`piped:${base}`, searchPiped(base, q)]),
    ];
    const discoveredPiped = await discoverPiped();
    providers.push(...discoveredPiped.slice(0, 10).map(base => [`piped-dynamic:${base}`, searchPiped(base, q)]));
    const discoveredInvidious = await discoverInvidious();
    providers.push(...discoveredInvidious.slice(0, 8).map(base => [`invidious:${base}`, searchInvidious(base, q)]));

    const settled = await Promise.allSettled(providers.map(provider => provider[1]));
    if (run !== generation) return;
    const results = [];
    settled.forEach((result, index) => {
      const name = providers[index][0];
      if (result.status === 'fulfilled') {
        trace(`provider-ok:${name}`, result.value.length);
        for (const item of result.value) if (!seen.has(item.id)) { seen.add(item.id); results.push(item); }
      } else trace(`provider-failed:${name}`, result.reason?.message || result.reason || 'unknown');
    });
    if (!results.length) {
      box.innerHTML = `<div class="media-degraded-state"><strong>LIVE SEARCH TEMPORARILY UNAVAILABLE</strong><small>Every live provider was attempted. No fabricated results were inserted.</small><a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=${encodeURIComponent(q)}">OPEN OFFICIAL YOUTUBE SEARCH ↗</a></div>`;
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
    if (button.dataset.mediaAuthorityBound !== '1') {
      button.dataset.mediaAuthorityBound = '1';
      button.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); void search(input.value); }, true);
    }
    if (input.dataset.mediaAuthorityBound !== '1') {
      input.dataset.mediaAuthorityBound = '1';
      input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); event.stopImmediatePropagation(); void search(input.value); } }, true);
    }
    const results = $('#videoResults');
    if (results && results.dataset.mediaAuthorityBound !== '1') {
      results.dataset.mediaAuthorityBound = '1';
      results.addEventListener('click', event => { const card = event.target.closest('.jvc-card[data-jvc-id]'); if (!card) return; event.preventDefault(); event.stopImmediatePropagation(); play(card.dataset.jvcId || ''); }, true);
    }
    if (!window.__JARVIS_LIVE_MEDIA_READY__) { window.__JARVIS_LIVE_MEDIA_READY__ = true; setState('READY', 'LIVE YOUTUBE SEARCH'); trace('media-ready'); }
  };

  window.addEventListener('jarvis:media', event => {
    const query = String(event.detail?.query ?? '').trim();
    if (!query) return;
    const input = $('#videoQuery');
    if (input) input.value = query;
    void search(query);
  });

  const observer = new MutationObserver(bind);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  bind();
  window.jarvisVideoSearch = search;
  window.jarvisVideoPlay = play;
})();
