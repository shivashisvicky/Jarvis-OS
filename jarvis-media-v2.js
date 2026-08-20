/* J.A.R.V.I.S. OS 2.0 - authoritative live video search v2 */
(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_AUTHORITY_V2__) return;
  window.__JARVIS_MEDIA_AUTHORITY_V2__ = true;

  const TIMEOUT = 12000;
  const JINA = 'https://r.jina.ai/';
  const PROXIES = [
    target => `${JINA}${target}`,
    target => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
  ];
  const traceLog = Array.isArray(window.__JARVIS_MEDIA_TRACE__) ? window.__JARVIS_MEDIA_TRACE__ : [];
  window.__JARVIS_MEDIA_TRACE__ = traceLog;
  const trace = (event, data = {}) => {
    traceLog.push({ ts: new Date().toISOString(), event, ...data });
    window.__JARVIS_MEDIA_TRACE__ = traceLog.slice(-160);
    console.debug('[JARVIS-MEDIA-V2]', traceLog[traceLog.length - 1]);
  };
  const $ = selector => document.querySelector(selector);
  const idRe = /^[A-Za-z0-9_-]{11}$/;

  function videoId(value) {
    const s = String(value || '').trim();
    if (idRe.test(s)) return s;
    try {
      const u = new URL(s);
      if (u.hostname === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || '';
      if (/(^|\.)youtube\.com$/.test(u.hostname)) {
        if (u.pathname === '/watch') return u.searchParams.get('v') || '';
        const parts = u.pathname.split('/').filter(Boolean);
        if (['shorts', 'embed', 'v'].includes(parts[0])) return parts[1] || '';
      }
    } catch {}
    return '';
  }

  function setState(text) {
    const state = $('#mediaState');
    const status = $('#jvcStatus');
    if (state) state.textContent = text;
    if (status) status.textContent = text;
  }

  async function fetchText(target, provider) {
    let lastError = null;
    for (const makeUrl of PROXIES) {
      const url = makeUrl(target);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT);
      const started = performance.now();
      try {
        trace('request:start', { provider, target, transport: url.startsWith(JINA) ? 'jina' : 'allorigins' });
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store', credentials: 'omit' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const body = await response.text();
        if (body.length < 20) throw new Error('empty response');
        trace('request:success', { provider, ms: Math.round(performance.now() - started), bytes: body.length });
        return body;
      } catch (error) {
        lastError = error;
        trace('request:failure', { provider, error: String(error) });
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError || new Error('all transports failed');
  }

  function addResult(results, seen, id, title, channel = 'YouTube', thumbnail = '') {
    if (!idRe.test(id) || seen.has(id)) return;
    seen.add(id);
    results.push({ id, title: String(title || 'YouTube video'), channel: String(channel || 'YouTube'), thumbnail: thumbnail || `https://i.ytimg.com/vi/${id}/mqdefault.jpg` });
  }

  function parseYouTube(body, query) {
    const results = [];
    const seen = new Set();
    const markdown = /\[([^\]\n]{2,240})\]\((?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|shorts\/)([A-Za-z0-9_-]{11})[^)]*\)/gi;
    let match;
    while ((match = markdown.exec(body)) && results.length < 12) addResult(results, seen, match[2], match[1], 'YouTube');
    const urls = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/gi;
    while ((match = urls.exec(body)) && results.length < 12) addResult(results, seen, match[1], `${query} · YouTube result ${results.length + 1}`, 'YouTube');
    trace('provider:parsed', { provider: 'youtube', query, count: results.length });
    return results;
  }

  function parseSearchEngine(body, query, provider) {
    const results = [];
    const seen = new Set();
    const urls = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/gi;
    let match;
    while ((match = urls.exec(body)) && results.length < 12) addResult(results, seen, match[1], `${query} · YouTube result ${results.length + 1}`, provider);
    trace('provider:parsed', { provider, query, count: results.length });
    return results;
  }

  async function youtube(query) {
    const url = new URL('https://www.youtube.com/results');
    url.searchParams.set('search_query', query);
    return parseYouTube(await fetchText(url.toString(), 'youtube'), query);
  }

  async function bing(query) {
    const url = new URL('https://www.bing.com/videos/search');
    url.searchParams.set('q', `${query} site:youtube.com/watch`);
    return parseSearchEngine(await fetchText(url.toString(), 'bing'), query, 'Bing/YouTube');
  }

  async function duck(query) {
    const url = new URL('https://html.duckduckgo.com/html/');
    url.searchParams.set('q', `${query} site:youtube.com/watch`);
    return parseSearchEngine(await fetchText(url.toString(), 'duckduckgo'), query, 'DuckDuckGo/YouTube');
  }

  function render(results) {
    const box = $('#videoResults');
    if (!box) return;
    const cards = results.slice(0, 8).map(video => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'jvc-card';
      card.dataset.jvcId = video.id;
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = '';
      img.src = video.thumbnail;
      const meta = document.createElement('span');
      meta.className = 'video-meta';
      const title = document.createElement('strong');
      title.textContent = video.title;
      const channel = document.createElement('small');
      channel.textContent = video.channel;
      const play = document.createElement('b');
      play.textContent = '▶';
      meta.append(title, channel);
      card.append(img, meta, play);
      return card;
    });
    box.replaceChildren(...cards);
    setState(`READY · ${cards.length} LIVE YOUTUBE RESULTS`);
    trace('search:render', { count: cards.length, ids: results.slice(0, 8).map(x => x.id) });
  }

  function play(id) {
    const normalized = videoId(id);
    const player = $('#jarvisPlayer');
    if (!player || !idRe.test(normalized)) return;
    const iframe = document.createElement('iframe');
    iframe.className = 'jarvis-video-frame';
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(normalized)}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
    iframe.title = 'JARVIS YouTube Player';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.style.cssText = 'width:100%;aspect-ratio:16/9;min-height:320px;border:0';
    player.replaceChildren(iframe);
    setState('PLAYING · OFFICIAL YOUTUBE PLAYER');
    trace('player:mounted', { id: normalized });
  }

  async function search(query) {
    const q = String(query || '').trim();
    const box = $('#videoResults');
    if (!box || !q) return;
    const direct = videoId(q);
    if (direct) return play(direct);
    box.replaceChildren();
    setState(`SEARCHING LIVE SOURCES · ${q.toUpperCase()}`);
    trace('search:start', { query: q });
    const jobs = [youtube(q), bing(q), duck(q)];
    const settled = await Promise.allSettled(jobs);
    const results = [];
    const seen = new Set();
    for (const item of settled) {
      if (item.status !== 'fulfilled') continue;
      for (const result of item.value) {
        addResult(results, seen, result.id, result.title, result.channel, result.thumbnail);
        if (results.length >= 12) break;
      }
    }
    trace('search:complete', { query: q, providers: settled.filter(x => x.status === 'fulfilled').length, results: results.length });
    if (!results.length) {
      const empty = document.createElement('div');
      empty.className = 'media-degraded-state';
      const strong = document.createElement('strong');
      strong.textContent = 'NO LIVE VIDEO RESULTS';
      const small = document.createElement('small');
      small.textContent = 'No fabricated or cached videos are shown.';
      const link = document.createElement('a');
      link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'OPEN OFFICIAL YOUTUBE SEARCH ↗';
      empty.append(strong, small, link);
      box.replaceChildren(empty);
      setState('DEGRADED · NO LIVE RESULTS');
      return;
    }
    render(results);
  }

  function bind() {
    const input = $('#videoQuery');
    const button = $('#videoSearch');
    const results = $('#videoResults');
    if (!input || !button || !results) return false;
    if (button.dataset.jarvisMediaV2Bound !== '1') {
      button.dataset.jarvisMediaV2Bound = '1';
      button.dataset.finalMedia = 'v2';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        void search(input.value);
      }, true);
    }
    if (input.dataset.jarvisMediaV2Bound !== '1') {
      input.dataset.jarvisMediaV2Bound = '1';
      input.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        void search(input.value);
      }, true);
    }
    if (results.dataset.jarvisMediaV2Bound !== '1') {
      results.dataset.jarvisMediaV2Bound = '1';
      results.addEventListener('click', event => {
        const card = event.target.closest('.jvc-card[data-jvc-id]');
        if (!card) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        play(card.dataset.jvcId || '');
      }, true);
    }
    trace('bind', { input: true, search: true, results: true });
    return true;
  }

  const observer = new MutationObserver(() => bind());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  const boot = () => {
    bind();
    window.jarvisVideoSearch = search;
    window.jarvisVideoPlay = play;
    trace('boot');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
