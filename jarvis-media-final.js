/** J.A.R.V.I.S. OS 2.0 - YouTube IFrame media authority */
(() => {
  'use strict';
  if (window.__JARVIS_FINAL_MEDIA_AUTHORITY__) return;
  window.__JARVIS_FINAL_MEDIA_AUTHORITY__ = true;

  const SEARCH_TIMEOUT = 12000;
  let mounted = false;
  let activeQuery = '';
  let internalMutation = false;
  let recoveryQueued = false;

  const $ = s => document.querySelector(s);
  const dom = () => ({ input: $('#videoQuery'), results: $('#videoResults'), player: $('#jarvisPlayer'), state: $('#mediaState') || $('#jvcStatus') });
  const mutate = fn => { internalMutation = true; try { fn(); } finally { queueMicrotask(() => { internalMutation = false; }); } };
  const clear = el => mutate(() => { while (el?.firstChild) el.removeChild(el.firstChild); });
  const status = text => { const el = dom().state; if (el) el.textContent = text; };

  function extractYouTubeId(value) {
    try {
      const url = new URL(value);
      if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(url.hostname)) return '';
      if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0];
      if (url.pathname === '/watch') return url.searchParams.get('v') || '';
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'v') return parts[1] || '';
    } catch {}
    return '';
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
    channel.textContent = video.channel || 'YouTube';
    meta.append(title, channel);
    const play = document.createElement('b');
    play.textContent = '▶';
    card.append(image, meta, play);
    return card;
  }

  function renderReady() {
    const d = dom();
    if (!d.results) return;
    mutate(() => {
      while (d.results.firstChild) d.results.removeChild(d.results.firstChild);
      const ready = document.createElement('div');
      ready.className = 'media-degraded-state';
      ready.textContent = 'READY · SEARCH FOR A VIDEO';
      d.results.appendChild(ready);
    });
    status('READY · NO FIXED VIDEOS');
  }

  async function search(query) {
    query = String(query || '').trim();
    const d = dom();
    if (!query || !d.results) return;
    activeQuery = query;
    const directId = extractYouTubeId(query);
    if (directId) { play(directId); return; }
    clear(d.results);
    status('SEARCHING YOUTUBE · ' + query.toUpperCase());
    const apiKey = String(window.JARVIS_YOUTUBE_API_KEY || '').trim();
    if (!apiKey) {
      mutate(() => {
        const box = document.createElement('div');
        box.className = 'media-degraded-state';
        box.textContent = 'YOUTUBE API KEY NOT CONFIGURED';
        d.results.appendChild(box);
      });
      status('CONFIGURATION REQUIRED');
      return;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('type', 'video');
      url.searchParams.set('maxResults', '8');
      url.searchParams.set('q', query);
      url.searchParams.set('key', apiKey);
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timer);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message || `YouTube API HTTP ${response.status}`);
      const videos = (payload.items || []).map(item => ({
        id: item.id?.videoId,
        title: item.snippet?.title || 'Untitled video',
        channel: item.snippet?.channelTitle || 'YouTube',
        thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || ''
      })).filter(item => /^[A-Za-z0-9_-]{11}$/.test(item.id || ''));
      if (!videos.length) throw new Error('No YouTube videos found');
      mutate(() => {
        while (d.results.firstChild) d.results.removeChild(d.results.firstChild);
        videos.forEach(video => d.results.appendChild(renderCard(video)));
      });
      status('READY · ' + videos.length + ' REAL YOUTUBE RESULTS');
    } catch (error) {
      mutate(() => {
        while (d.results.firstChild) d.results.removeChild(d.results.firstChild);
        const box = document.createElement('div');
        box.className = 'media-degraded-state';
        const message = document.createElement('strong');
        message.textContent = 'YOUTUBE SEARCH UNAVAILABLE';
        const detail = document.createElement('small');
        detail.textContent = error instanceof Error ? error.message : 'Search failed';
        box.append(message, detail);
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
    status('PLAYING · YOUTUBE');
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
      if (activeQuery) search(activeQuery);
      else renderReady();
    });
  }

  function mount() {
    if (mounted) return;
    const d = dom();
    if (!d.input || !d.results || !d.player) return;
    mounted = true;

    const button = $('#videoSearch');
    button?.addEventListener('click', event => {
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
  mount();
})();
