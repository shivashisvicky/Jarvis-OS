/** J.A.R.V.I.S. OS 2.0 - keyless live media authority */
(() => {
  'use strict';
  if (window.__JARVIS_FINAL_MEDIA_AUTHORITY__) return;
  window.__JARVIS_FINAL_MEDIA_AUTHORITY__ = true;

  const SEARCH_TIMEOUT = 7000;
  let mounted = false;
  let activeQuery = '';
  let internalMutation = false;
  let recoveryQueued = false;

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
    'https://yt.chocolatemoo53.com',
    'https://invidious.tiekoetter.com'
  ];

  const $ = s => document.querySelector(s);
  const dom = () => ({ input: $('#videoQuery'), search: $('#videoSearch'), results: $('#videoResults'), player: $('#jarvisPlayer'), state: $('#mediaState') || $('#jvcStatus') });
  const mutate = fn => { internalMutation = true; try { fn(); } finally { queueMicrotask(() => { internalMutation = false; }); } };
  const status = text => { const el = dom().state; if (el) el.textContent = text; };

  function extractYouTubeId(value) {
    try {
      const url = new URL(value);
      if (!/(^|\\.)youtube\\.com$|(^|\\.)youtu\\.be$/.test(url.hostname)) return '';
      if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0];
      if (url.pathname === '/watch') return url.searchParams.get('v') || '';
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'v') return parts[1] || '';
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(value).trim()) ? String(value).trim() : '';
  }

  function normalizePiped(item) {
    const id = String(item?.url || '').match(/[?&]v=([A-Za-z0-9_-]{11})/)?.[1] || item?.videoId || '';
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || item?.type === 'channel' || item?.type === 'playlist') return null;
    return { id, title: String(item.title || 'Untitled video'), channel: String(item.uploaderName || item.uploader || 'YouTube'), thumbnail: String(item.thumbnail || '') };
  }

  function normalizeInvidious(item) {
    const id = String(item?.videoId || '');
    if (!/^[A-Za-z0-9_-]{11}$/.test(id) || item?.type && item.type !== 'video') return null;
    return { id, title: String(item.title || 'Untitled video'), channel: String(item.author || 'YouTube'), thumbnail: String(item.videoThumbnails?.find(x => x?.quality === 'medium')?.url || item.videoThumbnails?.[0]?.url || '') };
  }

  async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  async function queryPiped(base, query) {
    const url = new URL('/search', base);
    url.searchParams.set('q', query);
    url.searchParams.set('filter', 'videos');
    const payload = await fetchJson(url.toString());
    const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    return items.map(normalizePiped).filter(Boolean);
  }

  async function queryInvidious(base, query) {
    const url = new URL('/api/v1/search', base);
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'video');
    url.searchParams.set('region', 'IN');
    const payload = await fetchJson(url.toString());
    return (Array.isArray(payload) ? payload : []).map(normalizeInvidious).filter(Boolean);
  }

  function renderCard(video) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'jvc-card';
    card.dataset.jvcId = video.id;
    const image = document.createElement('img');
    image.src = video.thumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/mqdefault.jpg`;
    image.alt = '';
    image.loading = 'lazy';
    const meta = document.createElement('span');
    meta.className = 'video-meta';
    const title = document.createElement('strong');
    title.textContent = video.title;
    const channel = document.createElement('small');
    channel.textContent = video.channel;
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
      box.textContent = 'READY · SEARCH YOUTUBE VIDEOS';
      d.results.appendChild(box);
    });
    status('READY · LIVE SEARCH');
  }

  async function search(query) {
    query = String(query || '').trim();
    const d = dom();
    if (!query || !d.results) return;
    activeQuery = query;
    const directId = extractYouTubeId(query);
    if (directId) { play(directId); return; }

    clearResults();
    status('SEARCHING LIVE SOURCES · ' + query.toUpperCase());

    const jobs = [
      ...PIPED.map(base => queryPiped(base, query)),
      ...INVIDIOUS.map(base => queryInvidious(base, query))
    ];

    try {
      const settled = await Promise.allSettled(jobs);
      const results = [];
      const seen = new Set();
      for (const item of settled) {
        if (item.status !== 'fulfilled') continue;
        for (const video of item.value) {
          if (!seen.has(video.id)) { seen.add(video.id); results.push(video); }
          if (results.length >= 12) break;
        }
        if (results.length >= 12) break;
      }
      if (!results.length) throw new Error('No live video provider returned results');
      mutate(() => {
        while (d.results.firstChild) d.results.removeChild(d.results.firstChild);
        results.slice(0, 8).forEach(video => d.results.appendChild(renderCard(video)));
      });
      status('READY · ' + Math.min(results.length, 8) + ' LIVE YOUTUBE RESULTS');
    } catch (error) {
      mutate(() => {
        while (d.results.firstChild) d.results.removeChild(d.results.firstChild);
        const box = document.createElement('div');
        box.className = 'media-degraded-state';
        const strong = document.createElement('strong');
        strong.textContent = 'LIVE SEARCH TEMPORARILY UNAVAILABLE';
        const small = document.createElement('small');
        small.textContent = error instanceof Error ? error.message : 'All public video indexes failed';
        const link = document.createElement('a');
        link.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'OPEN OFFICIAL YOUTUBE SEARCH ↗';
        box.append(strong, small, link);
        d.results.appendChild(box);
      });
      status('DEGRADED · NO FABRICATED RESULTS');
    }
  }

  function play(videoId) {
    const d = dom();
    if (!d.player || !/^[A-Za-z0-9_-]{11}$/.test(videoId || '')) return;
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
      const hasAuthorityCards = !!d.results.querySelector('.jvc-card[data-jvc-id]');
      const hasAuthorityState = !!d.results.querySelector('.media-degraded-state');
      if (hasAuthorityCards || hasAuthorityState) return;
      if (activeQuery) search(activeQuery); else renderReady();
    });
  }

  function mount() {
    const d = dom();
    if (!d.input || !d.results || !d.player) return;
    if (mounted && d.input.dataset.jarvisMediaBound === '1') return;
    mounted = true;
    d.input.dataset.jarvisMediaBound = '1';

    d.search?.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      search(d.input.value);
    }, true);
    d.input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopImmediatePropagation();
        search(d.input.value);
      }
    }, true);
    d.results.addEventListener('click', event => {
      const card = event.target.closest('.jvc-card[data-jvc-id]');
      if (card) {
        event.preventDefault();
        event.stopImmediatePropagation();
        play(card.dataset.jvcId || '');
      }
    }, true);
    renderReady();
  }

  const observer = new MutationObserver(() => { mount(); recoverLegacyMutation(); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  mount();
})();
