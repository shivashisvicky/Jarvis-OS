/** J.A.R.V.I.S. OS 2.0 - YouTube IFrame media authority */
(() => {
  'use strict';
  if (window.__JARVIS_FINAL_MEDIA_AUTHORITY__) return;
  window.__JARVIS_FINAL_MEDIA_AUTHORITY__ = true;

  const YT_API = 'https://www.youtube.com/iframe_api';
  const SEARCH_TIMEOUT = 10000;
  let mounted = false;
  let ytReady = false;
  let ytLoadPromise;
  let player = null;

  const $ = s => document.querySelector(s);
  const dom = () => ({ input: $('#videoQuery'), results: $('#videoResults'), player: $('#jarvisPlayer'), state: $('#mediaState') || $('#jvcStatus') });
  const clear = el => { while (el?.firstChild) el.removeChild(el.firstChild); };
  const status = text => { const el = dom().state; if (el) el.textContent = text; };

  function loadYouTubeAPI() {
    if (ytReady && window.YT) return Promise.resolve();
    if (ytLoadPromise) return ytLoadPromise;
    ytLoadPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('YouTube player API timeout')), SEARCH_TIMEOUT);
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === 'function') previous();
        clearTimeout(timeout);
        ytReady = true;
        resolve();
      };
      if (document.querySelector('script[src="' + YT_API + '"]')) return;
      const script = document.createElement('script');
      script.src = YT_API;
      script.async = true;
      script.onerror = () => { clearTimeout(timeout); reject(new Error('Unable to load YouTube player API')); };
      document.head.appendChild(script);
    });
    return ytLoadPromise;
  }

  function renderCard(video) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'jvc-card';
    card.dataset.jvcId = video.id;
    const image = document.createElement('img');
    image.src = `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/mqdefault.jpg`;
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

  async function search(query) {
    query = String(query || '').trim();
    const d = dom();
    if (!query || !d.results) return;
    clear(d.results);
    status('SEARCHING YOUTUBE · ' + query.toUpperCase());

    // Browser-safe search through YouTube's public search page. We do not scrape it.
    // The result is handed to the official IFrame player via its search UI when needed.
    // For deterministic keyword-to-video resolution, use the configured server endpoint when available.
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT);
      const response = await fetch('/api/youtube-search?q=' + encodeURIComponent(query), { signal: controller.signal, cache: 'no-store' });
      clearTimeout(timer);
      const payload = await response.json();
      if (!response.ok || !Array.isArray(payload.results)) throw new Error(payload.error || 'YouTube search unavailable');
      if (!payload.results.length) throw new Error('No videos found');
      payload.results.forEach(video => d.results.append(renderCard(video)));
      status('READY · ' + payload.results.length + ' REAL YOUTUBE RESULTS');
    } catch (error) {
      clear(d.results);
      const box = document.createElement('div');
      box.className = 'media-degraded-state';
      const message = document.createElement('strong');
      message.textContent = 'YOUTUBE SEARCH UNAVAILABLE';
      const detail = document.createElement('small');
      detail.textContent = error instanceof Error ? error.message : 'Search failed';
      box.append(message, detail);
      d.results.append(box);
      status('DEGRADED · NO FABRICATED RESULTS');
    }
  }

  async function play(videoId) {
    const d = dom();
    if (!d.player || !videoId) return;
    clear(d.player);
    status('LOADING YOUTUBE PLAYER');
    try {
      await loadYouTubeAPI();
      const host = document.createElement('div');
      host.id = 'jarvis-youtube-player';
      d.player.appendChild(host);
      player = new window.YT.Player(host, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1 },
        events: {
          onReady: event => { event.target.playVideo(); status('PLAYING · YOUTUBE'); },
          onError: () => status('VIDEO UNAVAILABLE · TRY ANOTHER RESULT')
        }
      });
    } catch (error) {
      clear(d.player);
      const message = document.createElement('div');
      message.className = 'media-degraded-state';
      message.textContent = error instanceof Error ? error.message : 'YouTube player failed';
      d.player.appendChild(message);
      status('PLAYER ERROR');
    }
  }

  function mount() {
    if (mounted) return;
    const d = dom();
    if (!d.input || !d.results || !d.player) return;
    mounted = true;
    const button = $('#videoSearch');
    if (button) button.addEventListener('click', event => { event.preventDefault(); search(d.input.value); });
    d.input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); search(d.input.value); } });
    d.results.addEventListener('click', event => {
      const card = event.target.closest('.jvc-card[data-jvc-id]');
      if (card) play(card.dataset.jvcId);
    });
    clear(d.results);
    const ready = document.createElement('div');
    ready.className = 'media-degraded-state';
    ready.textContent = 'READY · SEARCH FOR A VIDEO';
    d.results.appendChild(ready);
    status('READY · NO FIXED VIDEOS');
  }

  const observer = new MutationObserver(mount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  mount();
})();
