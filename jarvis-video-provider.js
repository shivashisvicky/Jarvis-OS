/* J.A.R.V.I.S. Video Search - server-authoritative provider */
(() => {
  'use strict';
  if (window.__JARVIS_VIDEO_PROVIDER__) return;
  window.__JARVIS_VIDEO_PROVIDER__ = true;

  const TIMEOUT = 15000;
  const state = { lastQuery: '', cache: new Map() };
  const idRe = /^[A-Za-z0-9_-]{11}$/;

  const trace = (event, data = {}) => {
    console.debug('[JARVIS-VIDEO]', { ts: new Date().toISOString(), event, ...data });
  };
  const $ = sel => document.querySelector(sel);

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
    const mediaState = $('#mediaState');
    if (mediaState) mediaState.textContent = text;
    const status = $('#jvcStatus');
    if (status) status.textContent = text;
  }

  function playerUrl(id) {
    return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
  }

  function play(id) {
    const normalized = videoId(id);
    const player = $('#jarvisPlayer');
    if (!player || !idRe.test(normalized)) {
      setState('ERROR · INVALID VIDEO ID');
      trace('play:invalid', { id });
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.className = 'jarvis-video-frame';
    iframe.src = playerUrl(normalized);
    iframe.title = 'JARVIS YouTube Player';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.style.cssText = 'width:100%;aspect-ratio:16/9;min-height:320px;border:0';
    player.replaceChildren(iframe);
    setState('PLAYING · OFFICIAL YOUTUBE PLAYER');
    trace('play:mounted', { id: normalized });
  }

  function normalizeResults(payload, query) {
    const raw = Array.isArray(payload?.results) ? payload.results : payload?.result ? [payload.result] : [];
    const seen = new Set();
    return raw.map(item => {
      const id = videoId(item?.id || item?.videoId || item?.webpageUrl || '');
      if (!id || seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        title: String(item?.title || `${query} · YouTube result`),
        channel: String(item?.channel || item?.uploader || 'YouTube'),
        thumbnail: String(item?.thumbnail || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`),
      };
    }).filter(Boolean);
  }

  function apiCandidates() {
    const configured = String(window.JARVIS_VIDEO_API_URL || '').trim();
    const candidates = [];
    if (configured) candidates.push(configured);
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      candidates.push(new URL('/api/youtube-search', window.location.origin).toString());
    }
    return [...new Set(candidates)];
  }

  async function fetchJson(url, query) {
    const target = new URL(url, window.location.href);
    target.searchParams.set('q', query);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch(target, {
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'omit',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function searchServer(query) {
    const candidates = apiCandidates();
    if (!candidates.length) throw new Error('No video API configured');
    let lastError = null;
    for (const candidate of candidates) {
      try {
        trace('api:request', { url: candidate });
        const payload = await fetchJson(candidate, query);
        const results = normalizeResults(payload, query);
        if (results.length) {
          trace('api:success', { url: candidate, count: results.length });
          return results;
        }
        lastError = new Error('API returned no video results');
      } catch (error) {
        lastError = error;
        trace('api:failure', { url: candidate, error: String(error) });
      }
    }
    throw lastError || new Error('Video API failed');
  }

  function render(results) {
    const box = $('#videoResults');
    if (!box) return;
    if (!results.length) {
      const empty = document.createElement('div');
      empty.className = 'media-degraded-state';
      const strong = document.createElement('strong');
      strong.textContent = 'NO LIVE VIDEO RESULTS';
      const small = document.createElement('small');
      small.textContent = 'No fabricated or cached videos are shown.';
      const link = document.createElement('a');
      link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(state.lastQuery)}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'OPEN OFFICIAL YOUTUBE SEARCH ↗';
      empty.append(strong, small, link);
      box.replaceChildren(empty);
      setState('DEGRADED · NO LIVE RESULTS');
      return;
    }

    const cards = results.slice(0, 12).map(video => {
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
      title.textContent = video.title.slice(0, 180);
      const channel = document.createElement('small');
      channel.textContent = video.channel;
      const playGlyph = document.createElement('b');
      playGlyph.textContent = '▶';
      meta.append(title, channel);
      card.append(img, meta, playGlyph);
      return card;
    });
    box.replaceChildren(...cards);
    setState(`READY · ${cards.length} LIVE YOUTUBE RESULTS`);
    trace('render', { count: cards.length, ids: results.slice(0, 12).map(x => x.id) });
  }

  async function search(query) {
    const q = String(query || '').trim();
    const box = $('#videoResults');
    if (!box || !q) return;
    state.lastQuery = q;

    const direct = videoId(q);
    if (direct) return play(direct);

    if (state.cache.has(q)) {
      render(state.cache.get(q));
      setState('READY · LIVE RESULTS');
      return;
    }

    box.replaceChildren();
    setState(`SEARCHING LIVE VIDEO API · ${q.toUpperCase()}`);
    trace('search:start', { query: q });
    try {
      const results = await searchServer(q);
      state.cache.set(q, results);
      render(results);
      trace('search:complete', { query: q, count: results.length });
    } catch (error) {
      trace('search:failed', { query: q, error: String(error) });
      render([]);
    }
  }

  function bind() {
    const input = $('#videoQuery');
    const button = $('#videoSearch');
    const results = $('#videoResults');
    if (!input || !button || !results) return false;

    if (button.dataset.jarvisVideoProviderBound !== '1') {
      button.dataset.jarvisVideoProviderBound = '1';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        void search(input.value);
      }, true);
    }
    if (input.dataset.jarvisVideoProviderBound !== '1') {
      input.dataset.jarvisVideoProviderBound = '1';
      input.addEventListener('keydown', event => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        event.stopImmediatePropagation();
        void search(input.value);
      }, true);
    }
    if (results.dataset.jarvisVideoProviderBound !== '1') {
      results.dataset.jarvisVideoProviderBound = '1';
      results.addEventListener('click', event => {
        const card = event.target.closest('.jvc-card[data-jvc-id]');
        if (!card) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        play(card.dataset.jvcId || '');
      }, true);
    }
    return true;
  }

  const observer = new MutationObserver(bind);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  const boot = () => {
    bind();
    window.jarvisVideoSearch = search;
    window.jarvisVideoPlay = play;
    setState('READY · VIDEO SEARCH ACTIVE');
    trace('boot:complete');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
