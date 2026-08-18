(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_AUTHORITY_V10__) return;
  window.__JARVIS_MEDIA_AUTHORITY_V10__ = true;

  const PROVIDERS = [
    'https://peertube.cpy.re',
    'https://framatube.org',
    'https://peertube.uno',
  ];
  const TIMEOUT_MS = 7000;
  let generation = 0;

  const requestJson = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const normalize = (item, host) => {
    const id = String(item?.uuid || item?.shortUUID || item?.id || '').trim();
    if (!id) return null;
    return {
      id,
      title: String(item?.name || item?.displayName || 'Untitled video'),
      author: String(item?.videoChannel?.displayName || item?.channel?.displayName || item?.account?.displayName || 'PeerTube'),
      duration: Number.isFinite(Number(item?.duration)) ? Number(item.duration) : 0,
      thumbnail: typeof item?.thumbnailPath === 'string'
        ? (item.thumbnailPath.startsWith('http') ? item.thumbnailPath : `${host}${item.thumbnailPath}`)
        : '',
      embed: `${host}/videos/embed/${encodeURIComponent(id)}?autoplay=1&peertubeLink=0`,
    };
  };

  const searchProvider = async (host, query) => {
    const url = `${host}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12&sort=-publishedAt&hasWebVideoFiles=true&nsfw=false`;
    const data = await requestJson(url);
    return (Array.isArray(data?.data) ? data.data : [])
      .map(item => normalize(item, host))
      .filter(Boolean);
  };

  const search = async (query) => {
    const settled = await Promise.allSettled(PROVIDERS.map(host => searchProvider(host, query)));
    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value.length) return result.value.slice(0, 12);
    }
    throw new Error('VIDEO_SEARCH_UNAVAILABLE');
  };

  const durationText = seconds => {
    const n = Math.max(0, Math.floor(Number(seconds) || 0));
    return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  };

  const setStatus = (state, detail = '') => {
    const mediaState = document.querySelector('#mediaState');
    if (mediaState) mediaState.textContent = detail ? `${state} · ${detail}` : state;
    const status = document.querySelector('#jarvisMediaV10Status');
    if (status) status.textContent = detail ? `${state} · ${detail}` : state;
  };

  const clearResults = results => {
    while (results.firstChild) results.removeChild(results.firstChild);
  };

  const renderMessage = (results, title, detail) => {
    clearResults(results);
    const box = document.createElement('div');
    box.className = 'jyt-message';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const small = document.createElement('small');
    small.textContent = detail;
    box.append(strong, small);
    results.appendChild(box);
  };

  const play = item => {
    const player = document.querySelector('#jarvisPlayer');
    if (!player) return;
    const iframe = document.createElement('iframe');
    iframe.title = item.title;
    iframe.src = item.embed;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.style.width = '100%';
    iframe.style.height = 'min(62vh,560px)';
    iframe.style.border = '0';
    player.replaceChildren(iframe);
    setStatus('PLAYING', `PEERTUBE · ${item.title}`);
  };

  const render = (results, items) => {
    clearResults(results);
    for (const item of items) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'jyt-card';
      card.dataset.videoId = item.id;
      card.dataset.platform = 'PeerTube';

      const image = document.createElement('img');
      image.className = 'jyt-thumb';
      image.loading = 'lazy';
      image.alt = '';
      image.src = item.thumbnail;

      const info = document.createElement('span');
      info.className = 'jyt-info';
      const title = document.createElement('strong');
      title.textContent = item.title;
      const meta = document.createElement('small');
      meta.textContent = `PeerTube · ${item.author} · ${durationText(item.duration)}`;
      info.append(title, meta);

      const playGlyph = document.createElement('b');
      playGlyph.className = 'jyt-play';
      playGlyph.textContent = '▶';

      card.append(image, info, playGlyph);
      card.addEventListener('click', () => play(item));
      results.appendChild(card);
    }
    setStatus('READY', `${items.length} LIVE RESULTS`);
  };

  const install = () => {
    const input = document.querySelector('#videoQuery');
    const button = document.querySelector('#videoSearch');
    const results = document.querySelector('#videoResults');
    if (!input || !button || !results) return false;
    if (results.dataset.v10Owner === '1') return true;

    results.dataset.v10Owner = '1';
    const status = document.createElement('div');
    status.id = 'jarvisMediaV10Status';
    status.className = 'jyt-status';
    results.parentElement?.insertBefore(status, results);

    const doSearch = async () => {
      const query = input.value.trim();
      if (!query) {
        setStatus('READY', 'ENTER A VIDEO SEARCH TERM');
        return;
      }
      const run = ++generation;
      setStatus('SEARCHING', query.toUpperCase());
      renderMessage(results, 'JARVIS VIDEO CORE', 'Searching live PeerTube indexes…');
      try {
        const items = await search(query);
        if (run !== generation) return;
        render(results, items);
      } catch {
        if (run !== generation) return;
        renderMessage(results, 'VIDEO SEARCH DEGRADED', 'Live providers are unavailable. No fabricated result was inserted.');
        setStatus('DEGRADED', 'LIVE VIDEO SEARCH UNAVAILABLE');
      }
    };

    const replacementButton = button.cloneNode(true);
    button.replaceWith(replacementButton);
    replacementButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      void doSearch();
    }, true);

    const replacementInput = input.cloneNode(true);
    input.replaceWith(replacementInput);
    replacementInput.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      void doSearch();
    }, true);

    const playButton = document.querySelector('#playVideo');
    const urlInput = document.querySelector('#videoUrl');
    if (playButton && urlInput) {
      const replacementPlay = playButton.cloneNode(true);
      playButton.replaceWith(replacementPlay);
      replacementPlay.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const raw = urlInput.value.trim();
        const match = raw.match(/(?:v=|youtu\.be\/|shorts\/)([A-Za-z0-9_-]{11})/);
        if (!match) {
          setStatus('READY', 'ENTER A VALID YOUTUBE URL');
          return;
        }
        const player = document.querySelector('#jarvisPlayer');
        if (!player) return;
        const iframe = document.createElement('iframe');
        iframe.title = 'YouTube video';
        iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(match[1])}?rel=0&playsinline=1`;
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        player.replaceChildren(iframe);
        setStatus('PLAYING', 'YOUTUBE EMBED');
      }, true);
    }

    setStatus('READY', 'LIVE VIDEO SEARCH');
    return true;
  };

  const observer = new MutationObserver(() => install());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  install();
})();
