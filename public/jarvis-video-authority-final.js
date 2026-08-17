(() => {
  'use strict';

  // JARVIS Video Authority v8
  // Live search only. No canned catalog, demo video, or synthetic result is ever returned.
  const INVIDIOUS = [
    'https://inv.nadeko.net', 'https://invidious.nerdvpn.de',
    'https://yt.chocolatemoo53.com', 'https://invidious.tiekoetter.com',
    'https://invidious.f5.si', 'https://inv.zoomerville.com',
  ];
  const PIPED = [
    'https://pipedapi.tokhmi.xyz', 'https://pipedapi.moomoo.me',
    'https://piped-api.garudalinux.org', 'https://api.piped.privacydev.net',
    'https://pipedapi.smnz.de', 'https://pipedapi.adminforge.de',
    'https://pipedapi.qdi.fi', 'https://piped-api.hostux.net',
  ];
  const CORS_PROXIES = [
    target => `https://corsproxy.io/?url=${encodeURIComponent(target)}`,
    target => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
  ];
  const TIMEOUT = 4500;
  let mode = 'all';
  let lastQuery = '';
  let boundInput = null;
  let boundButton = null;

  const $ = s => document.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
  const validId = id => /^[A-Za-z0-9_-]{11}$/.test(String(id || ''));

  // Contract: this is the real YouTube search endpoint. Filters are applied
  // inside JARVIS and must never mutate this canonical URL shape.
  const youtubeUrl = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(String(q || '').trim())}`;

  async function request(url, ms = TIMEOUT) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' }, mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  function normalizeVideo(v, source) {
    const id = String(v?.videoId || v?.id || '');
    if (!validId(id)) return null;
    const thumbs = Array.isArray(v?.videoThumbnails) ? v.videoThumbnails : [];
    return {
      id,
      title: String(v?.title || 'Untitled video'),
      author: String(v?.author || v?.uploader || v?.uploaderName || v?.channelName || 'YouTube'),
      views: Number(v?.viewCount ?? v?.views ?? 0) || 0,
      date: String(v?.publishedText || v?.uploadedDate || v?.published || ''),
      thumb: String(v?.thumbnailUrl || v?.thumbnail || thumbs.at(-1)?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`),
      source,
      kind: /short/i.test(String(v?.type || '')) ? 'short' : 'video',
    };
  }

  function unique(items) {
    const map = new Map();
    for (const item of items || []) if (item?.id && !map.has(item.id)) map.set(item.id, item);
    return [...map.values()];
  }

  function rank(items, query) {
    const terms = String(query).toLowerCase().split(/\s+/).filter(x => x.length > 1);
    return unique(items).map(item => ({ item, score: terms.reduce((n, term) => n + (String(`${item.title} ${item.author}`).toLowerCase().includes(term) ? 1 : 0), 0) }))
      .sort((a, b) => b.score - a.score).map(x => x.item);
  }

  async function searchInvidious(base, q) {
    const data = await request(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1`);
    return (Array.isArray(data) ? data : []).map(v => normalizeVideo(v, 'INVIDIOUS')).filter(Boolean);
  }

  async function searchPiped(base, q) {
    const data = await request(`${base}/search?q=${encodeURIComponent(q)}&filter=videos&region=IN&sort_by=relevance`);
    const items = Array.isArray(data) ? data : (data?.items || data?.videos || []);
    return items.map(v => normalizeVideo(v, 'PIPED')).filter(Boolean);
  }

  function parseYouTubeSearch(html) {
    return unique([...String(html).matchAll(/"videoId":"([A-Za-z0-9_-]{11})"/g)]
      .map(m => normalizeVideo({ videoId:m[1], title:'YouTube result', author:'YouTube', thumbnailUrl:`https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` }, 'YOUTUBE'))
      .filter(Boolean));
  }

  async function searchYouTube(q) {
    const target = youtubeUrl(q);
    for (const makeProxy of CORS_PROXIES) {
      try {
        const response = await fetch(makeProxy(target), { cache:'no-store' });
        if (!response.ok) continue;
        const results = parseYouTubeSearch(await response.text());
        if (results.length) return results;
      } catch (_) {}
    }
    return [];
  }

  async function firstLiveResults(query) {
    const tasks = [
      ...INVIDIOUS.map(base => () => searchInvidious(base, query)),
      ...PIPED.map(base => () => searchPiped(base, query)),
    ];
    return new Promise(resolve => {
      let remaining = tasks.length;
      let settled = false;
      const finish = items => { if (!settled && items?.length) { settled = true; resolve(rank(items, query)); } };
      for (const task of tasks) {
        task().then(finish).catch(() => {}).finally(() => {
          remaining -= 1;
          if (remaining === 0 && !settled) resolve([]);
        });
      }
    });
  }

  async function liveSearch(query) {
    const indexed = await firstLiveResults(query);
    return indexed.length ? indexed : rank(await searchYouTube(query), query);
  }

  function status(text) {
    $('#mediaState')?.replaceChildren(document.createTextNode(text));
    $('#jvcStatus')?.replaceChildren(document.createTextNode(text));
  }

  function ensureFilters() {
    const results = $('#videoResults');
    if (!results) return;
    let bar = $('#jvsFilters');
    if (!bar) {
      bar = document.createElement('div'); bar.id = 'jvsFilters'; bar.className = 'jvs-filters';
      bar.innerHTML = '<button type="button" data-jvs-mode="all">ALL</button><button type="button" data-jvs-mode="videos">VIDEOS</button><button type="button" data-jvs-mode="shorts">SHORTS</button>';
      results.parentElement?.insertBefore(bar, results);
    }
    $$('[data-jvs-mode]').forEach(button => {
      button.classList.toggle('active', button.dataset.jvsMode === mode);
      if (button.dataset.jvsBound) return;
      button.dataset.jvsBound = '1';
      button.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); mode = button.dataset.jvsMode || 'all'; void search(lastQuery); }, true);
    });
  }

  function render(items, query) {
    const results = $('#videoResults'); if (!results) return;
    let shown = unique(items);
    if (mode === 'shorts') shown = shown.filter(v => v.kind === 'short');
    if (mode === 'videos') shown = shown.filter(v => v.kind !== 'short');
    shown = shown.slice(0, 12);
    results.innerHTML = shown.length ? shown.map(v => `<button type="button" class="jvc-card jv4-video-card jvs-card" data-jvs-id="${esc(v.id)}"><img loading="lazy" src="${esc(v.thumb)}" alt=""><span class="video-meta"><strong>${esc(v.title)}</strong><small>${esc(v.author)}${v.views ? ` · ${v.views.toLocaleString()} views` : ''}</small><small>${esc(v.date)} · ${esc(v.source)}</small></span><b>▶</b></button>`).join('') : `<div class="empty"><strong>NO LIVE RESULTS</strong><br>JARVIS could not obtain a verified video index for “${esc(query)}”.<br><a class="secondary" href="${esc(youtubeUrl(query))}" target="_blank" rel="noopener noreferrer">OPEN LIVE YOUTUBE RESULTS ↗</a></div>`;
    status(shown.length ? `RESULTS · ${shown.length} · LIVE` : 'LIVE VIDEO SEARCH UNAVAILABLE');
    $$('.jvs-card', results).forEach(card => card.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); play(card.dataset.jvsId || ''); }, true));
  }

  function play(id) {
    if (!validId(id)) return false;
    const player = $('#jarvisPlayer'); if (!player) return false;
    player.innerHTML = `<iframe title="JARVIS video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen playsinline src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1&modestbranding=1"></iframe>`;
    status('PLAYING · JARVIS PLAYER');
    return true;
  }

  async function search(q) {
    const query = String(q || '').trim() || 'trending videos India';
    lastQuery = query;
    const input = $('#videoQuery'); if (input) input.value = query;
    ensureFilters(); status(`SEARCHING · LIVE VIDEO SOURCES · ${query}`);
    const results = $('#videoResults'); if (results) results.innerHTML = '<div class="empty">JARVIS is racing live video indexes…</div>';
    try { render(await liveSearch(query), query); } catch (_) { render([], query); }
  }

  function install() {
    const input = $('#videoQuery'), button = $('#videoSearch');
    if (input && input !== boundInput) {
      boundInput = input;
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); void search(input.value); } }, true);
    }
    if (button && button !== boundButton) {
      const replacement = button.cloneNode(true); button.replaceWith(replacement); boundButton = replacement;
      replacement.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); void search(input?.value || ''); }, true);
    }
    if (input) {
      window.jarvisVideoSearch = search;
      window.jarvisVideoSearchUrl = youtubeUrl;
      window.jarvisVideoPlay = play;
      window.__JARVIS_VIDEO_AUTHORITY_FINAL__ = true;
      ensureFilters();
    }
  }

  install();
  new MutationObserver(install).observe(document.documentElement, { childList:true, subtree:true });
})();
