(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_AUTHORITY_V11__) return;
  window.__JARVIS_MEDIA_AUTHORITY_V11__ = true;

  const HOST = 'https://peertube.cpy.re';
  const TIMEOUT_MS = 7000;
  let generation = 0;
  const mediaTarget = '#videoSearch,#videoQuery,#playVideo,.jyt-card,.jv4-video-card,.jvc-card,[data-video-provider]';

  const requestJson = async url => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  };

  const setStatus = (text, detail = '') => {
    const state = document.querySelector('#mediaState');
    const status = document.querySelector('#jarvisMediaV11Status');
    if (state) state.textContent = text;
    if (status) status.textContent = detail ? `${text} · ${detail}` : text;
  };
  const clear = el => { while (el.firstChild) el.removeChild(el.firstChild); };
  const message = (results, title, detail) => {
    clear(results);
    const box = document.createElement('div');
    box.className = 'jyt-message';
    const strong = document.createElement('strong'); strong.textContent = title;
    const small = document.createElement('small'); small.textContent = detail;
    box.append(strong, small); results.appendChild(box);
  };
  const normalize = item => {
    const id = String(item?.uuid || item?.shortUUID || item?.id || '').trim();
    if (!id) return null;
    const thumbnail = typeof item?.thumbnailPath === 'string' ? (item.thumbnailPath.startsWith('http') ? item.thumbnailPath : `${HOST}${item.thumbnailPath}`) : '';
    return { id, title: String(item?.name || item?.displayName || 'Untitled video'), author: String(item?.videoChannel?.displayName || item?.channel?.displayName || item?.account?.displayName || 'PeerTube'), duration: Number(item?.duration) || 0, thumbnail, embed: `${HOST}/videos/embed/${encodeURIComponent(id)}?autoplay=1&peertubeLink=0` };
  };
  const search = async query => {
    const data = await requestJson(`${HOST}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12&sort=-publishedAt&hasWebVideoFiles=true&nsfw=false`);
    const items = (Array.isArray(data?.data) ? data.data : []).map(normalize).filter(Boolean);
    if (!items.length) throw new Error('VIDEO_SEARCH_EMPTY');
    return items;
  };
  const play = item => {
    const player = document.querySelector('#jarvisPlayer'); if (!player) return;
    const iframe = document.createElement('iframe');
    iframe.title = item.title; iframe.src = item.embed; iframe.allow = 'autoplay; fullscreen; picture-in-picture'; iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.style.width = '100%'; iframe.style.height = 'min(62vh,560px)'; iframe.style.border = '0';
    player.replaceChildren(iframe); setStatus('PLAYING', `PEERTUBE · ${item.title}`);
  };
  const render = (results, items) => {
    clear(results);
    for (const item of items) {
      const card = document.createElement('button'); card.type = 'button'; card.className = 'jyt-card'; card.dataset.videoId = item.id; card.dataset.platform = 'PeerTube';
      const image = document.createElement('img'); image.className = 'jyt-thumb'; image.loading = 'lazy'; image.alt = ''; image.src = item.thumbnail;
      const info = document.createElement('span'); info.className = 'jyt-info';
      const title = document.createElement('strong'); title.textContent = item.title;
      const meta = document.createElement('small'); meta.textContent = `PeerTube · ${item.author} · ${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}`;
      info.append(title, meta); const glyph = document.createElement('b'); glyph.className = 'jyt-play'; glyph.textContent = '▶'; card.append(image, info, glyph); results.appendChild(card);
    }
    setStatus('READY', `${items.length} LIVE RESULTS`);
  };
  const runSearch = async query => {
    const input = document.querySelector('#videoQuery'); const results = document.querySelector('#videoResults');
    if (!input || !results) return;
    const q = String(query ?? input.value ?? '').trim(); if (!q) { setStatus('READY', 'ENTER A VIDEO SEARCH TERM'); return; }
    input.value = q; const run = ++generation; setStatus('SEARCHING', q.toUpperCase()); message(results, 'JARVIS VIDEO CORE', 'Searching live PeerTube…');
    try { const items = await search(q); if (run === generation) render(results, items); }
    catch (error) { if (run !== generation) return; message(results, 'VIDEO SEARCH DEGRADED', 'Live PeerTube is unavailable. No fabricated result was inserted.'); setStatus('DEGRADED', String(error?.message || 'LIVE VIDEO SEARCH UNAVAILABLE')); }
  };
  const playYouTube = () => {
    const raw = document.querySelector('#videoUrl')?.value?.trim() || '';
    const match = raw.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
    if (!match) { setStatus('READY', 'ENTER A VALID YOUTUBE URL'); return; }
    const player = document.querySelector('#jarvisPlayer'); if (!player) return;
    const iframe = document.createElement('iframe'); iframe.title = 'YouTube video'; iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(match[1])}?rel=0&playsinline=1`; iframe.allow = 'autoplay; fullscreen; picture-in-picture'; iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin'; player.replaceChildren(iframe); setStatus('PLAYING', 'YOUTUBE EMBED');
  };

  // Capture phase is intentional: jarvis-core-authority registers a document-level
  // capture listener later in index.html. v11 must own media events before it can
  // reach the legacy handler. This is the actual single-owner boundary.
  document.addEventListener('click', event => {
    const target = event.target?.closest?.(mediaTarget);
    if (!target) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (target.matches('#videoSearch')) void runSearch();
    else if (target.matches('#playVideo')) playYouTube();
    else if (target.matches('[data-video-provider]')) void runSearch(target.dataset.videoProvider === 'trending' ? 'trending videos India' : undefined);
    else if (target.matches('.jyt-card')) {
      const id = target.dataset.videoId; const title = target.querySelector('strong')?.textContent || 'PeerTube video';
      if (id) play({ id, title, author: 'PeerTube', duration: 0, thumbnail: '', embed: `${HOST}/videos/embed/${encodeURIComponent(id)}?autoplay=1&peertubeLink=0` });
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || !event.target?.matches?.('#videoQuery')) return;
    event.preventDefault(); event.stopImmediatePropagation(); void runSearch();
  }, true);

  const install = () => {
    const results = document.querySelector('#videoResults');
    if (!results) return false;
    if (!document.querySelector('#jarvisMediaV11Status')) {
      const status = document.createElement('div'); status.id = 'jarvisMediaV11Status'; status.className = 'jyt-status'; results.parentElement?.insertBefore(status, results);
    }
    setStatus('READY', 'LIVE VIDEO SEARCH');
    return true;
  };
  const observer = new MutationObserver(install); observer.observe(document.documentElement, { childList: true, subtree: true }); install();
  window.jarvisVideoSearch = runSearch;
  window.jarvisVideoPlay = play;
})();