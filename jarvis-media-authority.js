/** J.A.R.V.I.S. OS 2.0 - Live Media Authority */
(() => {
  'use strict';
  if (window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__) return;
  window.__JARVIS_ACTIVE_MEDIA_AUTHORITY__ = true;
  window.__JARVIS_MEDIA_LEGACY_KILL_SWITCH__ = true;

  const HOST = 'https://peertube.cpy.re';
  const TIMEOUT_MS = 8000;
  let generation = 0;

  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const input = () => $('#videoQuery');
  const results = () => $('#videoResults');
  const setStatus = (text, detail = '') => {
    const state = $('#mediaState');
    if (state) state.textContent = text;
    const status = $('#jvcStatus');
    if (status) status.textContent = detail ? `${text} · ${detail}` : text;
  };

  const requestJson = async url => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  };

  const normalize = item => {
    const id = String(item?.uuid || item?.shortUUID || item?.id || '').trim();
    if (!id) return null;
    const thumbnail = typeof item?.thumbnailPath === 'string' ? (item.thumbnailPath.startsWith('http') ? item.thumbnailPath : `${HOST}${item.thumbnailPath}`) : '';
    return { id, title: String(item?.name || item?.displayName || 'Untitled video'), author: String(item?.videoChannel?.displayName || item?.channel?.displayName || item?.account?.displayName || 'PeerTube'), duration: Number(item?.duration) || 0, thumbnail, embed: `${HOST}/videos/embed/${encodeURIComponent(id)}?autoplay=1&peertubeLink=0` };
  };

  const searchLive = async query => {
    const data = await requestJson(`${HOST}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12&sort=-publishedAt&hasWebVideoFiles=true&nsfw=false`);
    return (Array.isArray(data?.data) ? data.data : []).map(normalize).filter(Boolean);
  };

  const render = (items, query) => {
    const box = results();
    if (!box) return;
    box.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'empty media-degraded-state';
      empty.textContent = `NO LIVE VIDEO RESULTS FOR: ${query}`;
      box.appendChild(empty);
      setStatus('NO RESULTS', query);
      return;
    }
    for (const item of items.slice(0, 12)) {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'jyt-card'; card.dataset.videoId = item.id;
      const image = document.createElement('img'); image.loading = 'lazy'; image.alt = ''; image.src = item.thumbnail;
      const meta = document.createElement('span'); meta.className = 'video-meta';
      const title = document.createElement('strong'); title.textContent = item.title;
      const author = document.createElement('small'); author.textContent = `PeerTube · ${item.author} · ${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}`;
      meta.append(title, author);
      const play = document.createElement('b'); play.textContent = '▶';
      card.append(image, meta, play); box.appendChild(card);
    }
    setStatus('READY', `${items.length} LIVE RESULTS`);
  };

  const playEmbed = (id, title = 'JARVIS video') => {
    if (!id) return;
    const player = $('#jarvisPlayer');
    if (!player) return;
    const iframe = document.createElement('iframe');
    iframe.title = title;
    iframe.src = `${HOST}/videos/embed/${encodeURIComponent(id)}?autoplay=1&peertubeLink=0`;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.style.width = '100%'; iframe.style.height = 'min(62vh,560px)'; iframe.style.border = '0';
    player.replaceChildren(iframe);
    setStatus('PLAYING', title);
  };

  const youtubeId = raw => {
    try {
      const url = new URL(raw);
      if (url.hostname.includes('youtu.be')) return url.pathname.slice(1).split('/')[0];
      if (url.hostname.includes('youtube.com')) return url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).pop() || '';
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(raw).trim()) ? String(raw).trim() : '';
  };

  const playYoutube = () => {
    const raw = String($('#videoUrl')?.value || '').trim();
    const id = youtubeId(raw);
    const player = $('#jarvisPlayer');
    if (!player) return;
    if (!id) { setStatus('READY', 'ENTER A VALID YOUTUBE URL OR ID'); return; }
    const iframe = document.createElement('iframe');
    iframe.title = 'YouTube video';
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1`;
    iframe.allow = 'autoplay; fullscreen; picture-in-picture'; iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.style.width = '100%'; iframe.style.height = 'min(62vh,560px)'; iframe.style.border = '0';
    player.replaceChildren(iframe); setStatus('PLAYING', 'YOUTUBE EMBED');
  };

  const search = async query => {
    const q = String(query ?? input()?.value ?? '').trim();
    if (!q) { setStatus('READY', 'ENTER A VIDEO SEARCH TERM'); return; }
    const box = results();
    if (!box) return;
    input().value = q;
    const run = ++generation;
    box.innerHTML = '<div class="media-loading-indicator">SEARCHING LIVE VIDEO SOURCES…</div>';
    setStatus('SEARCHING', q.toUpperCase());
    try {
      const items = await searchLive(q);
      if (run !== generation) return;
      render(items, q);
    } catch (error) {
      if (run !== generation) return;
      box.innerHTML = '<div class="empty media-degraded-state"><strong>LIVE VIDEO SEARCH UNAVAILABLE</strong><small>NO FABRICATED RESULTS WERE INSERTED.</small></div>';
      setStatus('DEGRADED', error instanceof Error ? error.message : 'LIVE SEARCH FAILED');
    }
  };

  const bind = () => {
    const searchButton = $('#videoSearch');
    if (searchButton && !searchButton.dataset.liveMediaBound) {
      searchButton.dataset.liveMediaBound = '1';
      searchButton.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); void search(); }, true);
    }
    const queryInput = input();
    if (queryInput && !queryInput.dataset.liveMediaBound) {
      queryInput.dataset.liveMediaBound = '1';
      queryInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); event.stopImmediatePropagation(); void search(); } }, true);
    }
    document.querySelectorAll('[data-video-provider]').forEach(button => {
      if (button.dataset.liveMediaBound) return;
      button.dataset.liveMediaBound = '1';
      button.addEventListener('click', event => {
        event.preventDefault(); event.stopImmediatePropagation();
        void search(button.dataset.videoProvider === 'trending' ? 'trending videos India' : queryInput?.value || '');
      }, true);
    });
    document.querySelectorAll('#videoResults .jyt-card').forEach(card => {
      if (card.dataset.livePlayBound) return;
      card.dataset.livePlayBound = '1';
      card.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); playEmbed(card.dataset.videoId || '', card.querySelector('strong')?.textContent || 'JARVIS video'); }, true);
    });
    $('#playVideo')?.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); playYoutube(); }, true);
  };

  const observer = new MutationObserver(bind);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  bind();
  window.jarvisVideoSearch = search;
  window.jarvisVideoPlay = playEmbed;
})();