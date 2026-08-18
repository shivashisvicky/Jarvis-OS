/** J.A.R.V.I.S. OS 2.0 - FINAL MEDIA AUTHORITY */
(() => {
  'use strict';
  if (window.__JARVIS_FINAL_MEDIA_AUTHORITY__) return;
  window.__JARVIS_FINAL_MEDIA_AUTHORITY__ = true;

  const PEERTUBE = 'https://peertube.cpy.re';
  const INVIDIOUS = ['https://inv.nadeko.net','https://invidious.nerdvpn.de','https://yt.chocolatemoo53.com'];
  const PIPED = ['https://pipedapi.kavin.rocks','https://pipedapi.tokhmi.xyz','https://pipedapi.moomoo.me','https://pipedapi.syncpundit.io','https://api-piped.mha.fi','https://piped-api.garudalinux.org','https://pipedapi.rivo.lol','https://pipedapi.leptons.xyz'];
  const TIMEOUT = 7000;
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

  function youtubeId(raw) {
    const value = String(raw || '').trim();
    try {
      const u = new URL(value);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0];
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || '';
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(value) ? value : '';
  }

  function normalize(v, source) {
    const id = String(v?.uuid || v?.shortUUID || v?.videoId || v?.id || youtubeId(v?.url || '') || '').trim();
    if (!id) return null;
    const thumb = (v?.videoThumbnails || []).find(x => x.quality === 'medium')?.url || v?.thumbnailPath || v?.thumbnail || '';
    return {
      id,
      title: String(v?.name || v?.title || v?.displayName || 'Untitled video'),
      author: String(v?.videoChannel?.displayName || v?.channel?.displayName || v?.author || v?.uploader || v?.account?.displayName || source),
      duration: Number(v?.duration || v?.lengthSeconds) || 0,
      thumbnail: String(thumb || ''),
      source,
      direct: String(v?.url || v?.videoUrl || '')
    };
  }

  async function peerTubeSearch(q) {
    const d = await json(`${PEERTUBE}/api/v1/search/videos?search=${encodeURIComponent(q)}&count=12&sort=-publishedAt&hasWebVideoFiles=true&nsfw=false`);
    return (Array.isArray(d?.data) ? d.data : []).map(v => normalize(v, 'PeerTube')).filter(Boolean);
  }

  async function invidiousSearch(base, q) {
    const d = await json(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&sort_by=relevance&region=IN`);
    return (Array.isArray(d) ? d : []).filter(v => v.type === 'video').map(v => normalize(v, 'YouTube / Invidious')).filter(Boolean);
  }

  async function pipedSearch(base, q) {
    const d = await json(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`);
    return (Array.isArray(d?.items) ? d.items : []).map(v => normalize(v, 'YouTube / Piped')).filter(Boolean);
  }

  async function searchIndexes(q) {
    const tasks = [peerTubeSearch(q), ...INVIDIOUS.map(x => invidiousSearch(x, q)), ...PIPED.map(x => pipedSearch(x, q))];
    const settled = await Promise.allSettled(tasks);
    return settled.flatMap(x => x.status === 'fulfilled' ? x.value : []);
  }

  function unique(items) {
    return [...new Map(items.filter(Boolean).map(v => [v.id, v])).values()].slice(0, 12);
  }

  async function search(q) {
    const query = String(q || '').trim();
    if (!query) { setState('READY', 'ENTER A VIDEO SEARCH TERM'); return; }
    const run = ++generation;
    replaceResults('<div class="media-loading-indicator">SEARCHING LIVE VIDEO SOURCES…</div>');
    setState('SEARCHING', query.toUpperCase());
    try {
      const items = unique(await searchIndexes(query));
      if (run !== generation) return;
      if (!items.length) {
        replaceResults(`<div class="empty media-degraded-state"><strong>NO LIVE RESULTS</strong><small>No real indexed video matched “${esc(query)}”. Nothing fabricated or substituted.</small></div>`);
        setState('NO RESULTS', query);
        return;
      }
      replaceResults(items.map(v => `<button type="button" class="jvc-card" data-jvc-id="${attr(v.id)}" data-jvc-source="${attr(v.source)}"><img loading="lazy" src="${attr(v.thumbnail)}" alt=""><span class="video-meta"><strong>${esc(v.title)}</strong><small>${esc(v.author)} · ${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2,'0')} · ${esc(v.source)}</small></span><b>▶</b></button>`).join(''));
      setState('READY', `${items.length} LIVE RESULTS`);
    } catch (e) {
      if (run !== generation) return;
      replaceResults(`<div class="empty media-degraded-state"><strong>LIVE VIDEO SEARCH UNAVAILABLE</strong><small>${esc(e instanceof Error ? e.message : 'All live indexes failed')} · no fabricated fallback was used.</small></div>`);
      setState('DEGRADED', 'NO FABRICATED RESULTS');
    }
  }

  async function play(id, source) {
    if (!id) return;
    if (id.startsWith('http')) {
      replacePlayer(`<video controls autoplay playsinline preload="metadata" src="${attr(id)}"></video>`);
      setState('PLAYING', 'DIRECT MEDIA');
      return;
    }
    replacePlayer('<div class="player-empty"><span>◌</span><strong>LOADING JARVIS PLAYER</strong><small>Resolving a browser-playable source.</small></div>');
    if (source === 'PeerTube') {
      replacePlayer(`<iframe title="JARVIS video player" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen src="${PEERTUBE}/videos/embed/${encodeURIComponent(id)}?autoplay=1&peertubeLink=0"></iframe>`);
      setState('PLAYING', 'PEERTUBE');
      return;
    }
    // Invidious/Piped results are YouTube IDs. Playback stays inside JARVIS.
    replacePlayer(`<iframe title="JARVIS video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1"></iframe>`);
    setState('PLAYING', 'YOUTUBE EMBED');
  }

  function playInput() {
    const raw = String($('#videoUrl')?.value || '').trim();
    const id = youtubeId(raw);
    if (id) return play(id, 'YouTube');
    if (/^https?:\/\//i.test(raw) && /\.(mp4|webm|ogg)(?:\?|#|$)/i.test(raw)) return play(raw, 'direct');
    setState('INVALID INPUT', 'USE A YOUTUBE URL/ID OR DIRECT MEDIA URL');
  }

  function clearLegacy() {
    if (ownMutation) return;
    const x = dom().results;
    if (!x) return;
    if (x.querySelector('.video-result, .jyt-card:not([data-jvc-id])')) {
      replaceResults('<div class="empty media-degraded-state"><strong>READY</strong><small>Legacy video feed blocked. Search when you choose.</small></div>');
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
      const playButton = target.closest('#playVideo');
      if (searchButton) {
        event.preventDefault(); event.stopImmediatePropagation(); void search(d.input.value);
      } else if (provider) {
        event.preventDefault(); event.stopImmediatePropagation();
        // All provider buttons resolve through internal indexes. No external redirect.
        void search(d.input.value || 'cats');
      } else if (card) {
        event.preventDefault(); event.stopImmediatePropagation(); void play(card.getAttribute('data-jvc-id') || '', card.getAttribute('data-jvc-source') || '');
      } else if (legacy) {
        event.preventDefault(); event.stopImmediatePropagation();
      } else if (playButton) {
        event.preventDefault(); event.stopImmediatePropagation(); playInput();
      }
    }, true);

    d.input.addEventListener('keydown', event => {
      if (event.key !== 'Enter') return;
      event.preventDefault(); event.stopImmediatePropagation(); void search(d.input.value);
    }, true);

    replaceResults('<div class="empty media-degraded-state"><strong>READY</strong><small>Search first. No automatic feed, fixture or fake result is loaded.</small></div>');
    replacePlayer('<div class="player-empty"><span>▶</span><strong>JARVIS VIDEO CORE</strong><small>Search for a topic, select a real result, and play it here.</small></div>');
    setState('READY', 'NO AUTOMATIC FEED');

    const observer = new MutationObserver(clearLegacy);
    observer.observe(d.results, { childList: true, subtree: true });
  }

  const poll = setInterval(() => { mount(); if (mounted) clearInterval(poll); }, 100);
  mount();
})();
