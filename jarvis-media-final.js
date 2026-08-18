/** J.A.R.V.I.S. OS 2.0 - FINAL MEDIA AUTHORITY */
(() => {
  'use strict';
  if (window.__JARVIS_FINAL_MEDIA_AUTHORITY__) return;
  window.__JARVIS_FINAL_MEDIA_AUTHORITY__ = true;

  const HOST = 'https://peertube.cpy.re';
  const TIMEOUT = 9000;
  let mounted = false;
  let generation = 0;
  let ownMutation = false;

  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));
  const attr = esc;
  const dom = () => ({ input: $('#videoQuery'), results: $('#videoResults'), player: $('#jarvisPlayer'), state: $('#mediaState') || $('#jvcStatus') });
  const setState = (label, detail = '') => { const x = dom().state; if (x) x.textContent = detail ? `${label} · ${detail}` : label; };
  const replaceResults = html => { const x = dom().results; if (!x) return; ownMutation = true; x.innerHTML = html; ownMutation = false; };
  const replacePlayer = html => { const x = dom().player; if (!x) return; ownMutation = true; x.innerHTML = html; ownMutation = false; };

  async function json(url) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), TIMEOUT);
    try {
      const r = await fetch(url, { signal: c.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  function normalize(v) {
    const id = String(v?.uuid || v?.shortUUID || v?.videoId || v?.id || '').trim();
    if (!id) return null;
    const thumbnail = typeof v?.thumbnailPath === 'string' ? (v.thumbnailPath.startsWith('http') ? v.thumbnailPath : `${HOST}${v.thumbnailPath}`) : String(v?.thumbnail || '');
    return { id, title: String(v?.name || v?.title || v?.displayName || 'Untitled video'), author: String(v?.videoChannel?.displayName || v?.channel?.displayName || v?.uploader || v?.account?.displayName || 'PeerTube'), duration: Number(v?.duration) || 0, thumbnail };
  }

  async function searchPeerTube(q) {
    const d = await json(`${HOST}/api/v1/search/videos?search=${encodeURIComponent(q)}&count=12&sort=-publishedAt&hasWebVideoFiles=true&nsfw=false`);
    return (Array.isArray(d?.data) ? d.data : []).map(normalize).filter(Boolean);
  }

  async function search(q) {
    const query = String(q || '').trim();
    if (!query) { setState('READY', 'ENTER A VIDEO SEARCH TERM'); return; }
    const run = ++generation;
    replaceResults('<div class="media-loading-indicator">SEARCHING LIVE VIDEO SOURCES…</div>');
    setState('SEARCHING', query.toUpperCase());
    try {
      const items = await searchPeerTube(query);
      if (run !== generation) return;
      if (!items.length) {
        replaceResults(`<div class="empty media-degraded-state"><strong>NO LIVE RESULTS</strong><small>No playable PeerTube result matched “${esc(query)}”. Use YouTube or Bing Video for the wider web.</small></div>`);
        setState('NO RESULTS', query);
        return;
      }
      replaceResults(items.slice(0, 12).map(v => `<button type="button" class="jvc-card" data-jvc-id="${attr(v.id)}"><img loading="lazy" src="${attr(v.thumbnail)}" alt=""><span class="video-meta"><strong>${esc(v.title)}</strong><small>PeerTube · ${esc(v.author)} · ${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2,'0')}</small></span><b>▶</b></button>`).join(''));
      setState('READY', `${items.length} LIVE RESULTS`);
    } catch (e) {
      if (run !== generation) return;
      replaceResults(`<div class="video-context"><strong>LIVE VIDEO INDEX UNAVAILABLE</strong><p>${esc(e instanceof Error ? e.message : 'Video service unavailable')}.</p><div class="provider-fallbacks"><button type="button" data-jvc-provider="youtube">OPEN YOUTUBE SEARCH</button><button type="button" data-jvc-provider="bing">OPEN BING VIDEO</button></div></div>`);
      setState('DEGRADED', 'NO FABRICATED RESULTS');
    }
  }

  function youtubeId(raw) {
    const value = String(raw || '').trim();
    try {
      const u = new URL(value);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || '';
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(value) ? value : '';
  }

  function playInput() {
    const raw = String($('#videoUrl')?.value || '').trim();
    const id = youtubeId(raw);
    if (id) {
      replacePlayer(`<iframe title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1"></iframe>`);
      setState('PLAYING', 'YOUTUBE');
      return;
    }
    if (/^https?:\/\//i.test(raw) && /\.(mp4|webm|ogg)(?:\?|#|$)/i.test(raw)) {
      replacePlayer(`<video controls autoplay playsinline preload="metadata" src="${attr(raw)}"></video>`);
      setState('PLAYING', 'DIRECT MEDIA');
      return;
    }
    setState('INVALID INPUT', 'USE YOUTUBE URL/ID OR DIRECT MP4/WEBM/OGG');
  }

  function playPeerTube(id, title) {
    if (!id) return;
    replacePlayer(`<iframe title="${attr(title || 'JARVIS video')}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" src="${HOST}/videos/embed/${encodeURIComponent(id)}?autoplay=1&peertubeLink=0"></iframe>`);
    setState('PLAYING', title || 'PEERTUBE');
  }

  function openProvider(kind) {
    const q = String(dom().input?.value || '').trim();
    if (!q) { setState('READY', `ENTER A QUERY FOR ${kind.toUpperCase()}`); dom().input?.focus(); return; }
    const url = kind === 'youtube'
      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
      : `https://www.bing.com/videos/search?q=${encodeURIComponent(q)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setState('OPENED', `${kind.toUpperCase()} SEARCH`);
  }

  function clearLegacy() {
    if (ownMutation) return;
    const x = dom().results;
    if (!x) return;
    if (x.querySelector('.video-result, .jyt-card:not([data-jvc-id]), .video-context:not([data-jvc-owned])')) {
      replaceResults('<div class="empty media-degraded-state"><strong>READY</strong><small>Legacy media feed blocked. Search when you choose.</small></div>');
      setState('READY', 'NO AUTOMATIC FEED');
    }
  }

  function mount() {
    if (mounted) return;
    const d = dom();
    if (!d.input || !d.results || !d.player) return;
    mounted = true;

    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const searchButton = target.closest('#videoSearch');
      const provider = target.closest('[data-video-provider]');
      const card = target.closest('#videoResults .jvc-card[data-jvc-id]');
      const legacy = target.closest('#videoResults .video-result');
      const play = target.closest('#playVideo');
      const providerFallback = target.closest('[data-jvc-provider]');
      if (searchButton) {
        event.preventDefault(); event.stopImmediatePropagation(); void search(d.input.value);
      } else if (provider) {
        event.preventDefault(); event.stopImmediatePropagation();
        const kind = provider.getAttribute('data-video-provider') || '';
        if (kind === 'trending') void search(d.input.value || 'technology India');
        else openProvider(kind);
      } else if (card) {
        event.preventDefault(); event.stopImmediatePropagation(); void playPeerTube(card.getAttribute('data-jvc-id') || '', card.querySelector('strong')?.textContent || 'JARVIS video');
      } else if (legacy) {
        event.preventDefault(); event.stopImmediatePropagation();
      } else if (play) {
        event.preventDefault(); event.stopImmediatePropagation(); playInput();
      } else if (providerFallback) {
        event.preventDefault(); event.stopImmediatePropagation(); openProvider(providerFallback.getAttribute('data-jvc-provider') || 'youtube');
      }
    }, true);

    d.input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault(); event.stopImmediatePropagation(); void search(d.input.value);
    }, true);

    replaceResults('<div class="empty media-degraded-state"><strong>READY</strong><small>Search first. No automatic video feed is loaded.</small></div>');
    replacePlayer('<div class="player-empty"><span>▶</span><strong>JARVIS VIDEO CORE</strong><small>Select a real result or paste a playable URL.</small></div>');
    setState('READY', 'NO AUTOMATIC FEED');

    const observer = new MutationObserver(() => clearLegacy());
    observer.observe(d.results, { childList: true, subtree: true });
  }

  const poll = setInterval(() => { mount(); if (mounted) clearInterval(poll); }, 100);
  mount();
})();
