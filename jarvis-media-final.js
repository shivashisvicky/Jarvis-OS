/** J.A.R.V.I.S. OS 2.0 - keyless live media authority */
(() => {
  'use strict';
  if (window.__JARVIS_FINAL_MEDIA_AUTHORITY__) return;
  window.__JARVIS_FINAL_MEDIA_AUTHORITY__ = true;

  const SEARCH_TIMEOUT = 9000;
  const CORS_PROXIES = [
    target => `https://corsproxy.io/?url=${encodeURIComponent(target)}`,
    target => `https://bypass.cors.rest/proxy?url=${encodeURIComponent(target)}`,
  ];
  const JINA = 'https://r.jina.ai/';
  const PIPED = [
    'https://pipedapi.kavin.rocks', 'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.moomoo.me', 'https://pipedapi.syncpundit.io',
    'https://api-piped.mha.fi', 'https://piped-api.garudalinux.org',
    'https://pipedapi.rivo.lol', 'https://pipedapi.leptons.xyz'
  ];
  const INVIDIOUS = [
    'https://inv.nadeko.net', 'https://invidious.nerdvpn.de',
    'https://yt.chocolatemoo53.com', 'https://invidious.tiekoetter.com'
  ];
  let mounted = false;
  let activeQuery = '';
  let internalMutation = false;
  let recoveryQueued = false;

  const $ = s => document.querySelector(s);
  const dom = () => ({ input: $('#videoQuery'), search: $('#videoSearch'), results: $('#videoResults'), player: $('#jarvisPlayer'), state: $('#mediaState') || $('#jvcStatus') });
  const mutate = fn => { internalMutation = true; try { fn(); } finally { queueMicrotask(() => { internalMutation = false; }); } };
  const status = text => { const el = dom().state; if (el) el.textContent = text; };
  const trace = (event, data = {}) => {
    const entry = { ts: new Date().toISOString(), event, ...data };
    const log = Array.isArray(window.__JARVIS_MEDIA_TRACE__) ? window.__JARVIS_MEDIA_TRACE__ : [];
    log.push(entry);
    window.__JARVIS_MEDIA_TRACE__ = log.slice(-120);
    console.debug('[JARVIS-MEDIA]', entry);
  };

  function extractYouTubeId(value) {
    try {
      const url = new URL(value);
      if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(url.hostname)) return '';
      if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0];
      if (url.pathname === '/watch') return url.searchParams.get('v') || '';
      const parts = url.pathname.split('/').filter(Boolean);
      if (['shorts', 'embed', 'v'].includes(parts[0])) return parts[1] || '';
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(value).trim()) ? String(value).trim() : '';
  }

  function video(id, title, channel = 'YouTube', thumbnail = '') {
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return { id, title: String(title || 'YouTube video'), channel: String(channel || 'YouTube'), thumbnail: String(thumbnail || '') };
  }

  function normalizePiped(item) {
    const id = String(item?.url || '').match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1] || item?.videoId || '';
    if (item?.type === 'channel' || item?.type === 'playlist') return null;
    return video(id, item?.title, item?.uploaderName || item?.uploader, item?.thumbnail);
  }

  function normalizeInvidious(item) {
    const id = String(item?.videoId || '');
    if (item?.type && item.type !== 'video') return null;
    const thumb = item?.videoThumbnails?.find(x => x?.quality === 'medium')?.url || item?.videoThumbnails?.[0]?.url || '';
    return video(id, item?.title, item?.author, thumb);
  }

  async function fetchText(url) {
    const candidates = [url, `${JINA}${url}`, ...CORS_PROXIES.map(proxy => proxy(url))];
    let lastError = null;
    for (const candidate of candidates) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);
      const started = performance.now();
      try {
        const transport = candidate === url ? 'direct' : candidate.startsWith(JINA) ? 'jina' : 'cors-proxy';
        trace('request:start', { target: url, transport });
        const response = await fetch(candidate, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'text/plain,text/html,application/json;q=0.9,*/*;q=0.8' } });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = await response.text();
        if (!text || text.length < 20) throw new Error('Empty provider response');
        trace('request:success', { target: url, transport, ms: Math.round(performance.now() - started), bytes: text.length });
        return text;
      } catch (error) {
        lastError = error;
        trace('request:failure', { target: url, error: String(error) });
      } finally { clearTimeout(timer); }
    }
    throw lastError || new Error('Search request failed');
  }

  async function fetchJson(url) {
    const text = await fetchText(url);
    try { return JSON.parse(text); } catch { throw new Error('Provider returned non-JSON data'); }
  }

  async function queryPiped(base, query) {
    const url = new URL('/search', base);
    url.searchParams.set('q', query);
    url.searchParams.set('filter', 'videos');
    const payload = await fetchJson(url.toString());
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    trace('provider:results', { provider: 'piped', base, query, count: items.length });
    return items.map(normalizePiped).filter(Boolean);
  }

  async function queryInvidious(base, query) {
    const url = new URL('/api/v1/search', base);
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('region', 'IN');
    const payload = await fetchJson(url.toString());
    const items = Array.isArray(payload) ? payload : [];
    trace('provider:results', { provider: 'invidious', base, query, count: items.length });
    return items.map(normalizeInvidious).filter(Boolean);
  }

  function parseYouTubeSearchText(text, query) {
    const out = [];
    const seen = new Set();
    const markdown = /\[([^\]\n]{2,240})\]\((?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})[^)]*\)/gi;
    let match;
    while ((match = markdown.exec(text)) && out.length < 12) {
      const id = match[2];
      if (!seen.has(id)) { seen.add(id); out.push(video(id, match[1].replace(/\s+/g, ' ').trim(), 'YouTube')); }
    }
    const idRe = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/gi;
    while ((match = idRe.exec(text)) && out.length < 12) {
      const id = match[1];
      if (!seen.has(id)) { seen.add(id); out.push(video(id, `${query} · YouTube result ${out.length + 1}`, 'YouTube')); }
    }
    trace('provider:results', { provider: 'youtube-search-reader', query, count: out.length });
    return out.filter(Boolean);
  }

  async function queryYouTubeReader(query) {
    const url = new URL('https://www.youtube.com/results');
    url.searchParams.set('search_query', query);
    const text = await fetchText(url.toString());
    return parseYouTubeSearchText(text, query);
  }

  async function queryDuckDuckGoReader(query) {
    const url = new URL('https://html.duckduckgo.com/html/');
    url.searchParams.set('q', `${query} site:youtube.com/watch`);
    const text = await fetchText(url.toString());
    return parseYouTubeSearchText(text, query);
  }

  async function queryDecApi(query) {
    const url = new URL('https://decapi.me/youtube/videoid');
    url.searchParams.set('search', query);
    const text = (await fetchText(url.toString())).trim();
    const id = extractYouTubeId(text) || (/^[A-Za-z0-9_-]{11}$/.test(text) ? text : '');
    trace('provider:results', { provider: 'decapi', query, count: id ? 1 : 0 });
    return id ? [video(id, `${query} · YouTube`, 'YouTube')] : [];
  }

  function renderCard(v) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'jvc-card';
    card.dataset.jvcId = v.id;
    const image = document.createElement('img');
    image.src = v.thumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/mqdefault.jpg`;
    image.alt = '';
    image.loading = 'lazy';
    const meta = document.createElement('span');
    meta.className = 'video-meta';
    const title = document.createElement('strong');
    title.textContent = v.title;
    const channel = document.createElement('small');
    channel.textContent = v.channel;
    meta.append(title, channel);
    const play = document.createElement('b');
    play.textContent = '▶';
    card.append(image, meta, play);
    return card;
  }

  function clearResults() { const d = dom(); mutate(() => { while (d.results?.firstChild) d.results.removeChild(d.results.firstChild); }); }

  function renderReady() {
    const d = dom();
    if (!d.results) return;
    mutate(() => {
      while (d.results.firstChild) d.results.removeChild(d.results.firstChild);
      const box = document.createElement('div');
      box.className = 'media-degraded-state';
      box.textContent = 'READY · LIVE VIDEO SEARCH';
      d.results.appendChild(box);
    });
    status('READY · LIVE SEARCH');
  }

  async function search(query) {
    query = String(query || '').trim();
    const d = dom();
    if (!query || !d.results) return;
    activeQuery = query;
    trace('search:start', { query, length: query.length });
    const directId = extractYouTubeId(query);
    if (directId) { trace('search:direct-id', { query, id: directId }); play(directId); return; }
    clearResults();
    status('SEARCHING LIVE SOURCES · ' + query.toUpperCase());

    const jobs = [
      queryYouTubeReader(query),
      queryDuckDuckGoReader(query),
      queryDecApi(query),
      ...PIPED.map(base => queryPiped(base, query)),
      ...INVIDIOUS.map(base => queryInvidious(base, query))
    ];
    const settled = await Promise.allSettled(jobs);
    const results = [];
    const seen = new Set();
    const providers = [];
    settled.forEach((item, index) => {
      if (item.status !== 'fulfilled') return;
      providers.push(index);
      for (const v of item.value) {
        if (!seen.has(v.id)) { seen.add(v.id); results.push(v); }
        if (results.length >= 12) break;
      }
    });
    trace('search:complete', { query, providers: providers.length, results: results.length, ids: results.slice(0, 12).map(v => v.id) });

    if (!results.length) {
      trace('search:failure', { query, error: 'No live video provider returned results' });
      mutate(() => {
        while (d.results.firstChild) d.results.removeChild(d.results.firstChild);
        const box = document.createElement('div');
        box.className = 'media-degraded-state';
        const strong = document.createElement('strong');
        strong.textContent = 'NO LIVE VIDEO RESULTS';
        const small = document.createElement('small');
        small.textContent = 'No fabricated, cached or hardcoded videos are shown.';
        const link = document.createElement('a');
        link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'OPEN OFFICIAL YOUTUBE SEARCH ↗';
        box.append(strong, small, link);
        d.results.appendChild(box);
      });
      status('DEGRADED · NO FABRICATED RESULTS');
      return;
    }

    mutate(() => {
      while (d.results.firstChild) d.results.removeChild(d.results.firstChild);
      results.slice(0, 8).forEach(v => d.results.appendChild(renderCard(v)));
    });
    status('READY · ' + Math.min(results.length, 8) + ' LIVE YOUTUBE RESULTS');
  }

  function play(videoId) {
    const d = dom();
    if (!d.player || !/^[A-Za-z0-9_-]{11}$/.test(videoId || '')) return;
    trace('player:start', { id: videoId });
    mutate(() => {
      while (d.player.firstChild) d.player.removeChild(d.player.firstChild);
      const iframe = document.createElement('iframe');
      iframe.className = 'jarvis-video-frame';
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
      iframe.title = 'JARVIS YouTube Player';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.style.width = '100%';
      iframe.style.aspectRatio = '16 / 9';
      iframe.style.minHeight = '320px';
      iframe.style.border = '0';
      d.player.appendChild(iframe);
    });
    status('PLAYING · OFFICIAL YOUTUBE PLAYER');
  }

  function recoverLegacyMutation() {
    if (recoveryQueued || internalMutation || !mounted) return;
    recoveryQueued = true;
    queueMicrotask(() => {
      recoveryQueued = false;
      if (internalMutation) return;
      const d = dom();
      if (!d.results) return;
      if (d.results.querySelector('.jvc-card[data-jvc-id], .media-degraded-state')) return;
      if (activeQuery) search(activeQuery); else renderReady();
    });
  }

  function mount() {
    const d = dom();
    if (!d.input || !d.results || !d.player) return;
    if (mounted && d.input.dataset.jarvisMediaBound === '1') return;
    mounted = true;
    d.input.dataset.jarvisMediaBound = '1';
    trace('mount', { input: !!d.input, search: !!d.search, results: !!d.results, player: !!d.player });
    d.search?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); search(d.input.value); }, true);
    d.input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); event.stopImmediatePropagation(); search(d.input.value); } }, true);
    d.results.addEventListener('click', event => {
      const card = event.target.closest('.jvc-card[data-jvc-id]');
      if (card) { event.preventDefault(); event.stopImmediatePropagation(); play(card.dataset.jvcId || ''); }
    }, true);
    renderReady();
  }

  const observer = new MutationObserver(() => { mount(); recoverLegacyMutation(); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  mount();
})();
