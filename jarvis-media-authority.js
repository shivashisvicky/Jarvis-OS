/** J.A.R.V.I.S. OS - canonical live media authority */
(() => {
  'use strict';
  if (window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__) return;
  window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__ = true;

  const $ = selector => document.querySelector(selector);
  const YT_ID = /^[A-Za-z0-9_-]{11}$/;
  const CACHE_TTL = 10 * 60 * 1000;
  const BACKEND = './api/youtube-search';
  let activeSearch = null;
  let generation = 0;

  const trace = (step, value = '') => {
    const list = window.__JARVIS_MEDIA_TRACE__ = window.__JARVIS_MEDIA_TRACE__ || [];
    list.push({ step, value: String(value).slice(0, 500), at: new Date().toISOString() });
  };

  const normalize = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const idFrom = value => {
    const s = String(value || '');
    const m = s.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    return YT_ID.test(s.trim()) ? s.trim() : '';
  };

  const cacheRead = query => {
    try {
      const raw = sessionStorage.getItem(`jarvis-media:${normalize(query)}`);
      const entry = raw ? JSON.parse(raw) : null;
      return entry && Date.now() - entry.timestamp < CACHE_TTL && Array.isArray(entry.results) ? entry.results : null;
    } catch { return null; }
  };
  const cacheWrite = (query, results) => {
    try { sessionStorage.setItem(`jarvis-media:${normalize(query)}`, JSON.stringify({ timestamp: Date.now(), results })); } catch {}
  };

  const setState = (label, detail = '') => {
    const state = $('#mediaState');
    if (state) state.textContent = detail ? `${label} · ${detail}` : label;
  };

  const play = id => {
    const player = $('#jarvisPlayer');
    if (!player || !YT_ID.test(id)) return;
    player.dataset.videoId = id;
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&controls=1&playsinline=1&rel=0&modestbranding=1`;
    iframe.title = 'JARVIS YouTube Player';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'width:100%;aspect-ratio:16/9;min-height:320px;border:0';
    player.replaceChildren(iframe);
    setState('PLAYING', 'OFFICIAL YOUTUBE PLAYER');
    trace('player-mounted', id);
  };

  const render = results => {
    const host = $('#videoResults');
    if (!host) return;
    if (!results.length) throw new Error('No live media results');
    host.replaceChildren();
    results.slice(0, 8).forEach(item => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'jvc-card';
      card.dataset.jvcId = item.id;
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = '';
      img.src = item.thumbnail || `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`;
      const meta = document.createElement('span');
      const title = document.createElement('strong');
      title.textContent = item.title || 'YouTube video';
      const channel = document.createElement('small');
      channel.textContent = item.channel || 'YouTube';
      const playLabel = document.createElement('b');
      playLabel.className = 'play';
      playLabel.textContent = 'PLAY';
      meta.append(title, channel, playLabel);
      card.append(img, meta);
      host.appendChild(card);
    });
    setState('READY', `${Math.min(results.length, 8)} LIVE RESULTS`);
    trace('results-rendered', results.length);
  };

  const backendSearch = async query => {
    const r = await fetch(`${BACKEND}?q=${encodeURIComponent(query)}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    let data = {};
    try { data = await r.json(); } catch {}
    if (!r.ok) {
      const error = new Error(data?.error || `Media service ${r.status}`);
      error.status = r.status;
      throw error;
    }
    return { results: Array.isArray(data.results) ? data.results : [], provider: data.provider || 'backend' };
  };

  const search = async query => {
    const clean = String(query || '').trim();
    if (!clean) return [];
    const direct = idFrom(clean);
    if (direct) { play(direct); return []; }
    const key = normalize(clean);
    if (activeSearch?.key === key) return activeSearch.promise;

    const cached = cacheRead(clean);
    if (cached) { render(cached); setState('READY', `${Math.min(cached.length, 8)} CACHED RESULTS`); return cached; }

    const run = ++generation;
    const promise = (async () => {
      setState('SEARCHING', clean.toUpperCase());
      const host = $('#videoResults');
      if (host) host.innerHTML = '<div class="empty">Searching live video sources…</div>';
      trace('search-start', clean);
      try {
        const response = await backendSearch(clean);
        if (run !== generation) return [];
        if (!response.results.length) throw Object.assign(new Error('No live results returned'), { status: 204 });
        render(response.results);
        cacheWrite(clean, response.results);
        trace('provider-ok', response.provider);
        return response.results;
      } catch (error) {
        if (run !== generation) return [];
        const host = $('#videoResults');
        if (error?.status === 429) {
          setState('DEGRADED', 'YOUTUBE QUOTA · FALLBACK EXHAUSTED');
          if (host) host.innerHTML = `<div class="media-degraded-state"><strong>YOUTUBE SEARCH QUOTA LIMITED</strong><small>JARVIS tried the backend and live fallback providers. Direct YouTube playback is still available.</small><a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}">OPEN OFFICIAL YOUTUBE SEARCH ↗</a></div>`;
          trace('quota-limited', clean);
        } else if (host) {
          setState('DEGRADED', 'LIVE SEARCH UNAVAILABLE');
          host.innerHTML = `<div class="media-degraded-state"><strong>LIVE SEARCH UNAVAILABLE</strong><small>${String(error?.message || 'Try again later.')}</small><a target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/results?search_query=${encodeURIComponent(clean)}">OPEN OFFICIAL YOUTUBE SEARCH ↗</a></div>`;
          trace('search-failed', error?.message || 'unknown');
        }
        return [];
      } finally {
        if (activeSearch?.key === key) activeSearch = null;
      }
    })();
    activeSearch = { key, promise };
    return promise;
  };

  const bind = () => {
    const input = $('#videoQuery');
    const button = $('#videoSearch');
    if (!input || !button) return;
    if (button.dataset.jaMediaBound !== '1') {
      button.dataset.jaMediaBound = '1';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        void search(input.value);
      }, true);
    }
    if (input.dataset.jaMediaBound !== '1') {
      input.dataset.jaMediaBound = '1';
      input.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
          event.preventDefault();
          event.stopImmediatePropagation();
          void search(input.value);
        }
      }, true);
    }
    const host = $('#videoResults');
    if (host && host.dataset.jaMediaBound !== '1') {
      host.dataset.jaMediaBound = '1';
      host.addEventListener('click', event => {
        const card = event.target.closest('.jvc-card[data-jvc-id]');
        if (!card) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        play(card.dataset.jvcId || '');
      }, true);
    }
  };

  window.addEventListener('jarvis:media', event => {
    const query = String(event.detail?.query || '').trim();
    const input = $('#videoQuery');
    if (input && query) input.value = query;
    if (query) void search(query);
  });

  new MutationObserver(bind).observe(document.documentElement, { childList: true, subtree: true });
  bind();
  window.jarvisVideoSearch = search;
  window.jarvisVideoPlay = play;
})();
