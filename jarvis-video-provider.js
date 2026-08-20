/* J.A.R.V.I.S. Video Search - Multi-Provider with Intelligent Fallback */
(() => {
  'use strict';
  if (window.__JARVIS_VIDEO_PROVIDER__) return;
  window.__JARVIS_VIDEO_PROVIDER__ = true;

  const TIMEOUT = 10000;
  const PROVIDERS_CONFIG = {
    youtube: {
      name: 'YouTube',
      search: async (q) => searchYouTube(q),
      priority: 1,
      icon: '▶'
    },
    piped: {
      name: 'Piped (YouTube Mirror)',
      search: async (q) => searchPiped(q),
      priority: 2,
      icon: '▶'
    }
  };

  const state = {
    lastQuery: '',
    cache: new Map(),
    failedProviders: new Set(),
    providerStats: {}
  };

  const trace = (event, data = {}) => {
    console.debug('[JARVIS-VIDEO]', { ts: new Date().toISOString(), event, ...data });
  };

  const $ = (sel) => document.querySelector(sel);
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
    if (state) state.textContent = text;
  }

  // YouTube search using multiple proxy strategies
  async function searchYouTube(query) {
    const results = [];
    const proxies = [
      // Proxy 1: Jina AI (most reliable)
      async () => {
        const url = `https://r.jina.ai/https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const r = await fetchWithTimeout(url, TIMEOUT);
        return parseYouTubeHTML(await r.text(), query);
      },
      // Proxy 2: allorigins.win (fallback)
      async () => {
        const ytUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(ytUrl)}`;
        const r = await fetchWithTimeout(url, TIMEOUT);
        return parseYouTubeHTML(await r.text(), query);
      }
    ];

    for (let i = 0; i < proxies.length; i++) {
      try {
        trace('youtube:proxy_attempt', { attempt: i + 1, proxy: i === 0 ? 'jina' : 'allorigins' });
        const proxyResults = await proxies[i]();
        if (proxyResults.length > 0) {
          trace('youtube:success', { count: proxyResults.length });
          return proxyResults;
        }
      } catch (e) {
        trace('youtube:proxy_failed', { attempt: i + 1, error: String(e) });
      }
    }

    trace('youtube:all_proxies_failed');
    return results;
  }

  function parseYouTubeHTML(html, query) {
    const results = [];
    const seen = new Set();

    // Pattern 1: Markdown links [title](url)
    const mdRe = /\[([^\]\n]{2,240})\]\((?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:watch\?v=|shorts\/)([A-Za-z0-9_-]{11})[^)]*\)/gi;
    let match;
    while ((match = mdRe.exec(html)) && results.length < 12) {
      if (!seen.has(match[2])) {
        seen.add(match[2]);
        results.push({
          id: match[2],
          title: match[1],
          channel: 'YouTube',
          thumbnail: `https://i.ytimg.com/vi/${match[2]}/mqdefault.jpg`
        });
      }
    }

    // Pattern 2: Direct URLs
    const urlRe = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/gi;
    while ((match = urlRe.exec(html)) && results.length < 12) {
      if (!seen.has(match[1])) {
        seen.add(match[1]);
        results.push({
          id: match[1],
          title: `${query} · Result ${results.length + 1}`,
          channel: 'YouTube',
          thumbnail: `https://i.ytimg.com/vi/${match[1]}/mqdefault.jpg`
        });
      }
    }

    return results;
  }

  // Piped API search (YouTube mirror, no proxying needed)
  async function searchPiped(query) {
    const pipedInstances = [
      'https://piped.kavin.rocks',
      'https://piped.adminforge.de',
      'https://piped-libre.kavin.rocks',
      'https://piped.mha.fi'
    ];

    for (const instance of pipedInstances) {
      try {
        trace('piped:attempt', { instance });
        const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&filter=videos`;
        const r = await fetchWithTimeout(url, TIMEOUT);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();

        if (data.items && Array.isArray(data.items)) {
          const results = data.items
            .filter(v => v.type === 'video' && v.videoId)
            .slice(0, 12)
            .map(v => ({
              id: v.videoId,
              title: v.title || 'Video',
              channel: v.uploader || 'Piped',
              thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`
            }));

          if (results.length > 0) {
            trace('piped:success', { instance, count: results.length });
            return results;
          }
        }
      } catch (e) {
        trace('piped:failed', { instance, error: String(e) });
      }
    }

    return [];
  }

  function fetchWithTimeout(url, ms) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal, cache: 'no-store', credentials: 'omit' })
      .finally(() => clearTimeout(timer));
  }

  function render(results) {
    const box = $('#videoResults');
    if (!box) return;

    if (!results || results.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'media-degraded-state';
      empty.innerHTML = `
        <strong>NO VIDEO RESULTS</strong>
        <small>Try different search terms or check your connection</small>
      `;
      box.replaceChildren(empty);
      setState('DEGRADED · NO RESULTS');
      return;
    }

    const cards = results.map(video => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'video-result';
      card.dataset.videoId = video.id;

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.alt = '';
      img.src = video.thumbnail;
      img.onerror = () => { img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 68"%3E%3Crect fill="%23222"%3E%3C/rect%3E%3Ctext x="60" y="34" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3EImage Error%3C/text%3E%3C/svg%3E'; };

      const meta = document.createElement('span');
      meta.className = 'video-meta';

      const title = document.createElement('strong');
      title.textContent = video.title.substring(0, 100);

      const channel = document.createElement('small');
      channel.textContent = video.channel;

      const play = document.createElement('b');
      play.textContent = '▶';

      meta.append(title, channel);
      card.append(img, meta, play);

      card.addEventListener('click', () => play(video.id));
      return card;
    });

    box.replaceChildren(...cards);
    setState(`READY · ${cards.length} RESULTS`);
    trace('render', { count: cards.length });
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
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(normalized)}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
    iframe.title = 'JARVIS Video Player';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.style.cssText = 'width:100%;aspect-ratio:16/9;min-height:320px;border:0';

    player.replaceChildren(iframe);
    setState('PLAYING · VIDEO STREAM');
    trace('play:mounted', { id: normalized });
  }

  async function search(query) {
    const q = String(query || '').trim();
    if (!q) {
      setState('READY · ENTER SEARCH QUERY');
      return;
    }

    // Check cache
    if (state.cache.has(q)) {
      trace('search:cache_hit', { query: q });
      render(state.cache.get(q));
      setState('READY · CACHED RESULTS');
      return;
    }

    const box = $('#videoResults');
    if (!box) return;

    // Direct video ID detection
    const direct = videoId(q);
    if (direct) {
      trace('search:direct_id', { id: direct });
      return play(direct);
    }

    box.replaceChildren();
    setState(`SEARCHING · ${q.toUpperCase()}`);
    trace('search:start', { query: q });

    const allResults = [];
    const seen = new Set();

    // Try all providers in priority order
    for (const [providerKey, provider] of Object.entries(PROVIDERS_CONFIG)) {
      if (state.failedProviders.has(providerKey)) {
        trace('search:skipping_failed', { provider: providerKey });
        continue;
      }

      try {
        trace('search:trying', { provider: providerKey });
        const results = await provider.search(q);

        for (const result of results) {
          if (!seen.has(result.id)) {
            seen.add(result.id);
            allResults.push(result);
            if (allResults.length >= 12) break;
          }
        }

        if (allResults.length > 0) {
          trace('search:provider_success', { provider: providerKey, count: allResults.length });
          break; // Stop if we got results
        }
      } catch (e) {
        trace('search:provider_error', { provider: providerKey, error: String(e) });
        state.failedProviders.add(providerKey);
      }

      if (allResults.length >= 12) break;
    }

    if (allResults.length > 0) {
      state.cache.set(q, allResults);
      render(allResults);
      trace('search:complete', { query: q, results: allResults.length });
    } else {
      render(null);
      trace('search:no_results', { query: q });
    }
  }

  function bind() {
    const input = $('#videoQuery');
    const button = $('#videoSearch');
    const results = $('#videoResults');

    if (!input || !button || !results) {
      trace('bind:elements_missing');
      return false;
    }

    // Bind search button
    if (!button.dataset.jarvisVideoProviderBound) {
      button.dataset.jarvisVideoProviderBound = '1';
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopImmediatePropagation();
        search(input.value);
      }, true);
    }

    // Bind search input (Enter key)
    if (!input.dataset.jarvisVideoProviderBound) {
      input.dataset.jarvisVideoProviderBound = '1';
      input.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        e.stopImmediatePropagation();
        search(input.value);
      }, true);
    }

    trace('bind:success');
    return true;
  }

  const observer = new MutationObserver(() => bind());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  const boot = () => {
    bind();
    window.jarvisVideoSearch = search;
    window.jarvisVideoPlay = play;
    setState('READY · VIDEO SEARCH ACTIVE');
    trace('boot:complete');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
