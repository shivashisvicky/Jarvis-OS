(() => {
  'use strict';

  // JARVIS media never redirects for search. The search pipeline is local-first:
  // a same-origin provider can supply results immediately, then public indexes
  // are queried in parallel. Every provider is optional and failures are isolated.
  const LOCAL = '/api/v1/search';
  const PIPED = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.moomoo.me',
    'https://pipedapi.syncpundit.io',
    'https://api-piped.mha.fi',
    'https://piped-api.garudalinux.org',
    'https://pipedapi.rivo.lol',
    'https://pipedapi.leptons.xyz'
  ];
  const INVIDIOUS = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yt.chocolatemoo53.com'
  ];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;'
  }[c]));

  const json = async (url, timeout = 2500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(String(response.status));
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const normalize = (v, source) => {
    const id = String(v?.videoId || v?.id || v?.videoIdText || '');
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    const thumbs = Array.isArray(v?.videoThumbnails) ? v.videoThumbnails : [];
    return {
      id,
      title: v?.title || 'Untitled video',
      author: v?.author || v?.uploader || v?.uploaderName || 'YouTube',
      views: v?.viewCountText || v?.views || (v?.viewCount ? `${Number(v.viewCount).toLocaleString()} views` : ''),
      thumb: v?.thumbnail || v?.thumbnailUrl ||
        thumbs.find(x => /high|medium|maxres/i.test(x?.quality || ''))?.url ||
        thumbs[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      source
    };
  };

  async function search(query) {
    const q = encodeURIComponent(query);
    const providers = [
      // Same-origin is deliberately first. A production deployment can implement
      // this endpoint as the JARVIS intelligence gateway, while static hosting
      // simply falls through to public indexes. It also gives deterministic CI.
      json(`${LOCAL}?q=${q}&filter=videos&region=IN`).then(data =>
        (Array.isArray(data) ? data : data?.items || data?.results || [])
          .map(v => normalize(v, 'JARVIS LOCAL')).filter(Boolean)),
      ...PIPED.map(base => json(`${base}/search?q=${q}&filter=videos&region=IN`)
        .then(data => (Array.isArray(data) ? data : data?.items || [])
          .map(v => normalize(v, 'PIPED')).filter(Boolean))),
      ...INVIDIOUS.map(base => json(`${base}/api/v1/search?q=${q}&type=video&region=IN&page=1`)
        .then(data => (Array.isArray(data) ? data : [])
          .map(v => normalize(v, 'INVIDIOUS')).filter(Boolean)))
    ];

    const settled = await Promise.allSettled(providers);
    const merged = [];
    const seen = new Set();
    for (const result of settled) {
      if (result.status !== 'fulfilled') continue;
      for (const item of result.value || []) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
    }
    return merged.slice(0, 10);
  }

  const idOf = raw => {
    try {
      const url = new URL(raw);
      if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
      if (url.hostname.includes('youtube.com')) {
        return url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop() || null;
      }
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(raw).trim()) ? String(raw).trim() : null;
  };

  function mount(workspace) {
    if (!workspace || workspace.dataset.jv3media === '1') return;
    workspace.dataset.jv3media = '1';
    workspace.innerHTML = `
      <section class="panel media-main">
        <div class="search-bar">
          <input id="videoQuery" placeholder="Search videos, channels or topics…" autocomplete="off">
          <button class="primary" id="videoSearch" type="button">SEARCH</button>
        </div>
        <div class="media-search-links">
          <button type="button" data-video-provider="trending">TRENDING</button>
        </div>
        <div id="jarvisPlayer" class="jv3-player">
          <div class="jv3-player-empty"><div>▶<strong>JARVIS VIDEO CORE</strong><small>Search results and playback stay inside this console.</small></div></div>
        </div>
        <div class="request-line">
          <input id="videoUrl" placeholder="Optional: YouTube URL, video ID or direct MP4 URL" autocomplete="off">
          <button class="primary" id="playVideo" type="button">PLAY</button>
        </div>
      </section>
      <aside class="panel media-side">
        <div class="panel-head"><span>VIDEO INTELLIGENCE</span><span class="live" id="jvcStatus">READY · IN-HOUSE VIDEO SEARCH</span></div>
        <div id="videoResults" class="jv3-video-results"><div class="empty">Enter a topic to search.</div></div>
      </aside>`;

    const input = $('#videoQuery', workspace);
    const results = $('#videoResults', workspace);
    const player = $('#jarvisPlayer', workspace);
    const status = $('#jvcStatus', workspace);

    const play = item => {
      player.innerHTML = `<iframe title="${esc(item.title)}" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.id)}?rel=0&playsinline=1&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
      status.textContent = 'PLAYING · JARVIS EMBED PLAYER';
    };

    const draw = items => {
      if (!items.length) {
        results.innerHTML = '<div class="jv3-fallback">No public video index responded with results. JARVIS will not redirect you. Try again or paste a YouTube URL above.</div>';
        return;
      }
      results.innerHTML = items.map(v => `
        <button class="jv3-video-card jvc-card" type="button" data-video-id="${esc(v.id)}">
          <img class="jv3-video-thumb" loading="lazy" src="${esc(v.thumb)}" alt="">
          <span><strong>${esc(v.title)}</strong><small>${esc(v.author)}${v.views ? ` · ${esc(v.views)}` : ''}</small></span>
          <b class="jv3-video-play">▶</b>
        </button>`).join('');
      $$('.jv3-video-card', results).forEach(card => card.addEventListener('click', () => {
        const item = items.find(x => x.id === card.dataset.videoId);
        if (item) play(item);
      }));
    };

    const run = async query => {
      const q = String(query || '').trim();
      if (!q) {
        status.textContent = 'READY · ENTER A VIDEO SEARCH';
        return;
      }
      status.textContent = 'SEARCHING · JARVIS VIDEO INDEX';
      results.innerHTML = '<div class="jv3-status">Searching JARVIS local intelligence and public video indexes…</div>';
      try {
        const items = await search(q);
        draw(items);
        status.textContent = items.length
          ? `${items.length} RESULTS · STAYING INSIDE JARVIS`
          : 'VIDEO INDEX DEGRADED · NO REDIRECT';
      } catch {
        draw([]);
        status.textContent = 'VIDEO INDEX DEGRADED · NO REDIRECT';
      }
    };

    window.jarvisVideoSearch = run;
    $('#videoSearch', workspace).onclick = () => void run(input.value);
    input.onkeydown = event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void run(input.value);
      }
    };
    $$('[data-video-provider]', workspace).forEach(button => button.onclick = () => {
      input.value = 'trending videos India';
      void run(input.value);
    });

    $('#playVideo', workspace).onclick = () => {
      const raw = $('#videoUrl', workspace).value.trim();
      const id = idOf(raw);
      if (id) {
        play({ id, title: 'Pasted YouTube video' });
      } else if (/^https?:\/\//i.test(raw) && /\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)) {
        player.innerHTML = `<video controls playsinline src="${esc(raw)}"></video>`;
        status.textContent = 'PLAYING · DIRECT MEDIA';
      } else {
        status.textContent = 'PASTE A YOUTUBE URL, VIDEO ID OR DIRECT MEDIA URL';
      }
    };
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('.jmc-action') : null;
    if (!target) return;
    const intent = target.getAttribute('data-jv3-intent');
    const index = target.getAttribute('data-jmc-index');
    if (intent !== 'media' && index !== '1') return;
    setTimeout(() => {
      const input = $('#videoQuery');
      if (!input) return;
      input.value = 'trending videos India';
      if (typeof window.jarvisVideoSearch === 'function') void window.jarvisVideoSearch(input.value);
      else $('#videoSearch')?.click();
    }, 180);
  }, true);

  const tick = () => {
    const workspace = $('.media-workspace');
    if (workspace && workspace.dataset.jv3 === '1' && workspace.dataset.jv3media !== '1') mount(workspace);
  };

  const observer = new MutationObserver(tick);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tick, { once: true });
  else tick();
})();
