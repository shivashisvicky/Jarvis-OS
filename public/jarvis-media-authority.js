(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_AUTHORITY_V13__) return;
  window.__JARVIS_MEDIA_AUTHORITY_V13__ = true;

  const HOST = 'https://peertube.cpy.re';
  const TIMEOUT = 8000;
  let userAction = false;
  let generation = 0;
  let installedResults = null;

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const validYouTube = id => /^[A-Za-z0-9_-]{11}$/.test(String(id || ''));

  const status = (main, detail = '') => {
    const a = $('#mediaState');
    const b = $('#jvcStatus');
    if (a) a.textContent = main;
    if (b) b.textContent = detail ? `${main} · ${detail}` : main;
  };

  const clearResults = results => {
    if (results) results.replaceChildren();
  };

  const message = (title, detail) => {
    const results = $('#videoResults');
    if (!results) return;
    clearResults(results);
    const box = document.createElement('div');
    box.className = 'jyt-message';
    const strong = document.createElement('strong'); strong.textContent = title;
    const small = document.createElement('small'); small.textContent = detail;
    box.append(strong, small);
    results.appendChild(box);
  };

  async function request(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const r = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(timer); }
  }

  function youtubeId(raw) {
    try {
      const u = new URL(raw);
      if (u.hostname.includes('youtu.be')) return u.pathname.split('/').filter(Boolean)[0] || '';
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || '';
    } catch {}
    return validYouTube(raw.trim()) ? raw.trim() : '';
  }

  function playYouTube(id) {
    if (!validYouTube(id)) return;
    const player = $('#jarvisPlayer');
    if (!player) return;
    const frame = document.createElement('iframe');
    frame.title = 'JARVIS video player';
    frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1`;
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    player.replaceChildren(frame);
    status('PLAYING', 'YOUTUBE');
  }

  function playPeerTube(item) {
    const player = $('#jarvisPlayer');
    if (!player || !item?.id) return;
    const frame = document.createElement('iframe');
    frame.title = item.title || 'JARVIS video player';
    frame.src = `${HOST}/videos/embed/${encodeURIComponent(item.id)}?autoplay=1&peertubeLink=0`;
    frame.allow = 'autoplay; fullscreen; picture-in-picture';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    player.replaceChildren(frame);
    status('PLAYING', `PEERTUBE · ${item.title || 'VIDEO'}`);
  }

  function normalize(item) {
    const id = String(item?.uuid || item?.shortUUID || item?.id || '').trim();
    if (!id) return null;
    const thumb = typeof item?.thumbnailPath === 'string'
      ? (item.thumbnailPath.startsWith('http') ? item.thumbnailPath : `${HOST}${item.thumbnailPath}`)
      : '';
    return {
      id,
      title: String(item?.name || item?.displayName || 'Untitled video'),
      author: String(item?.videoChannel?.displayName || item?.channel?.displayName || item?.account?.displayName || 'PeerTube'),
      duration: Number(item?.duration) || 0,
      thumb
    };
  }

  function render(items) {
    const results = $('#videoResults');
    if (!results) return;
    clearResults(results);
    for (const item of items) {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'jyt-card';
      card.dataset.videoId = item.id;
      const img = document.createElement('img');
      img.className = 'jyt-thumb'; img.loading = 'lazy'; img.alt = ''; img.src = item.thumb;
      const info = document.createElement('span'); info.className = 'jyt-info';
      const title = document.createElement('strong'); title.textContent = item.title;
      const meta = document.createElement('small'); meta.textContent = `PeerTube · ${item.author} · ${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}`;
      const play = document.createElement('b'); play.className = 'jyt-play'; play.textContent = '▶';
      info.append(title, meta); card.append(img, info, play); results.appendChild(card);
      card.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); playPeerTube(item); });
    }
    status('READY', `${items.length} LIVE RESULTS`);
  }

  async function search(query) {
    const q = String(query || '').trim();
    const input = $('#videoQuery');
    if (!q) {
      message('VIDEO SEARCH', 'Enter a topic, channel or video name. Nothing is loaded automatically.');
      status('READY', 'SEARCH REQUIRED');
      return;
    }
    if (input) input.value = q;
    userAction = true;
    const run = ++generation;
    message('JARVIS VIDEO CORE', `Searching live sources for “${q}”…`);
    status('SEARCHING', q.toUpperCase());
    try {
      const data = await request(`${HOST}/api/v1/search/videos?search=${encodeURIComponent(q)}&count=16&sort=-publishedAt&hasWebVideoFiles=true&nsfw=false`);
      if (run !== generation) return;
      const items = (Array.isArray(data?.data) ? data.data : []).map(normalize).filter(Boolean);
      if (!items.length) throw new Error('NO_RESULTS');
      render(items);
    } catch (e) {
      if (run !== generation) return;
      message('NO LIVE VIDEO RESULTS', 'No fabricated, cached or hardcoded videos are shown. Try another search or use YouTube.');
      const results = $('#videoResults');
      const fallback = document.createElement('button');
      fallback.className = 'secondary'; fallback.type = 'button'; fallback.textContent = 'OPEN YOUTUBE SEARCH';
      fallback.addEventListener('click', () => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer'));
      results?.appendChild(fallback);
      status('DEGRADED', String(e?.message || 'LIVE SEARCH UNAVAILABLE'));
    }
  }

  function install() {
    const results = $('#videoResults');
    if (!results || installedResults === results) return;
    installedResults = results;
    const statusNode = document.createElement('div');
    statusNode.id = 'jvcStatus'; statusNode.className = 'jyt-status';
    results.parentElement?.insertBefore(statusNode, results);
    // The old main.ts boot sequence requests trending videos automatically.
    // Keep that legacy request from ever becoming visible. Results appear only after user search.
    clearResults(results);
    message('JARVIS VIDEO CORE', 'Ready. Search for a video to begin.');
    status('READY', 'SEARCH REQUIRED · NO DEFAULT FEED');
  }

  const isMediaTarget = target => target?.closest?.('#videoSearch,#playVideo,[data-video-provider],#videoQuery');

  window.addEventListener('click', event => {
    const target = isMediaTarget(event.target);
    if (!target) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (target.matches('#videoSearch')) { void search($('#videoQuery')?.value || ''); return; }
    if (target.matches('[data-video-provider]')) {
      const provider = target.dataset.videoProvider || '';
      if (provider === 'youtube' || provider === 'bing') {
        const q = $('#videoQuery')?.value?.trim() || '';
        if (q) window.open(provider === 'youtube' ? `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}` : `https://www.bing.com/videos/search?q=${encodeURIComponent(q)}`, '_blank', 'noopener,noreferrer');
        else status('READY', 'ENTER A SEARCH TERM');
      } else void search($('#videoQuery')?.value || '');
      return;
    }
    if (target.matches('#playVideo')) {
      const raw = $('#videoUrl')?.value?.trim() || '';
      const id = youtubeId(raw);
      if (id) playYouTube(id);
      else if (/^https?:\/\//i.test(raw) && /\.(mp4|webm|ogg)(\?.*)?$/i.test(raw)) {
        const player = $('#jarvisPlayer');
        if (player) { const video = document.createElement('video'); video.controls = true; video.autoplay = true; video.playsInline = true; video.src = raw; player.replaceChildren(video); status('PLAYING', 'DIRECT MEDIA'); }
      } else status('READY', 'ENTER A YOUTUBE URL, VIDEO ID OR DIRECT MEDIA URL');
    }
  }, true);

  window.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target?.matches?.('#videoQuery')) {
      event.preventDefault(); event.stopImmediatePropagation(); void search(event.target.value);
    }
  }, true);

  const observer = new MutationObserver(() => {
    install();
    if (!userAction) {
      const results = $('#videoResults');
      if (results) {
        // Only remove legacy result cards. Never remove our own empty/search messages.
        results.querySelectorAll('.video-result,.jvc-card,.jv4-video-card,.jyt-card').forEach(n => n.remove());
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  install();
  window.jarvisVideoSearch = search;
  window.jarvisVideoPlay = playYouTube;
})();
