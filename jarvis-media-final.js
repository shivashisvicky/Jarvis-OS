(() => {
  'use strict';

  // JARVIS-owned media layer. Search stays inside the shell; YouTube is used
  // only as the playback source inside an in-house iframe, never as navigation.
  const INVIDIOUS = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yt.chocolatemoo53.com',
    'https://invidious.tiekoetter.com',
    'https://invidious.f5.si',
    'https://inv.zoomerville.com'
  ];
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
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const attr = esc;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function videoId(raw) {
    try {
      const u = new URL(raw);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop() || null;
    } catch (_) {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(raw).trim()) ? String(raw).trim() : null;
  }

  async function fetchJson(url, ms = 6500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal, cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(timer); }
  }

  function install() {
    const input = document.querySelector('#videoQuery');
    const searchButton = document.querySelector('#videoSearch');
    const results = document.querySelector('#videoResults');
    const player = document.querySelector('#jarvisPlayer');
    const state = document.querySelector('#mediaState');
    if (!input || !searchButton || !results || !player || !state) return false;
    if (searchButton.dataset.jarvisMediaBound === '1') return true;
    searchButton.dataset.jarvisMediaBound = '1';

    const setState = text => { state.textContent = text; };
    const empty = text => { results.innerHTML = `<div class="empty">${esc(text)}</div>`; };

    const normalize = (items, source) => (items || []).map(v => ({
      id: String(v.videoId || v.id || videoId(v.url || '') || ''),
      title: v.title || 'Untitled video',
      author: v.author || v.uploader || v.channelName || 'Unknown channel',
      date: v.publishedText || v.uploadedDate || '',
      views: v.viewCount || v.views || 0,
      thumbnail: (v.videoThumbnails || []).find(x => x.quality === 'medium')?.url || v.thumbnail || (v.videoThumbnails || [])[0]?.url || '',
      source
    })).filter(v => v.id);

    const render = items => {
      const unique = [...new Map(items.map(v => [v.id, v])).values()].slice(0, 12);
      results.innerHTML = unique.length ? unique.map(v => `<button type="button" class="video-result jvc-card" data-jvc-id="${attr(v.id)}">
        ${v.thumbnail ? `<img loading="lazy" src="${attr(v.thumbnail)}" alt="">` : '<div class="video-thumb">▶</div>'}
        <span class="video-meta"><strong>${esc(v.title)}</strong><small>${esc(v.author)}${v.date ? ` · ${esc(v.date)}` : ''}</small><small>${v.views ? `${Number(v.views).toLocaleString()} views` : ''}</small></span><b>▶</b>
      </button>`).join('') : '<div class="empty">No videos matched that keyword.</div>';
      results.querySelectorAll('.jvc-card').forEach(card => card.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation(); play(String(card.dataset.jvcId || ''));
      }));
    };

    async function searchInvidious(q) {
      const jobs = INVIDIOUS.map(base => fetchJson(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&sort_by=relevance`, 5500)
        .then(data => normalize(Array.isArray(data) ? data : data.items, base)).catch(() => []));
      const settled = await Promise.all(jobs);
      return settled.flat().filter(Boolean);
    }

    async function searchPiped(q) {
      const jobs = PIPED.map(base => fetchJson(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`, 5500)
        .then(data => normalize(data?.items, base)).catch(() => []));
      const settled = await Promise.all(jobs);
      return settled.flat().filter(Boolean);
    }

    async function search(q) {
      if (!q) { empty('Enter a keyword to search videos.'); setState('READY'); return; }
      setState('SEARCHING');
      results.innerHTML = '<div class="empty">JARVIS is searching video indexes…</div>';
      const [inv, piped] = await Promise.allSettled([searchInvidious(q), searchPiped(q)]);
      const items = [
        ...(inv.status === 'fulfilled' ? inv.value : []),
        ...(piped.status === 'fulfilled' ? piped.value : [])
      ];
      if (!items.length) {
        empty('No public video index responded with results. JARVIS will not redirect you.');
        setState('NO REDIRECT');
        return;
      }
      render(items);
      setState(`${Math.min(12, new Set(items.map(v => v.id)).size)} RESULTS`);
    }

    async function play(id) {
      if (!id) return;
      setState('RESOLVING');
      player.innerHTML = '<div class="player-empty"><span>◌</span><strong>RESOLVING VIDEO</strong><small>JARVIS is preparing an in-house playback surface.</small></div>';

      // Ask every backend for a direct stream first. The first usable stream wins.
      const providers = [
        ...INVIDIOUS.map(base => async () => {
          const data = await fetchJson(`${base}/api/v1/videos/${encodeURIComponent(id)}`, 6500);
          const streams = [...(data.formatStreams || []), ...(data.adaptiveFormats || [])]
            .filter(x => x.url && (!x.type || /^video\/mp4/i.test(x.type) || /^video\/webm/i.test(x.type)))
            .sort((a,b) => (b.height || 0) - (a.height || 0));
          return streams[0] ? { stream: streams[0], data } : null;
        }),
        ...PIPED.map(base => async () => {
          const data = await fetchJson(`${base}/streams/${encodeURIComponent(id)}`, 6500);
          const streams = (data.videoStreams || []).filter(x => x.url).sort((a,b) => (b.height || 0) - (a.height || 0));
          return streams[0] ? { stream: streams[0], data } : null;
        })
      ];

      for (const provider of providers) {
        try {
          const resolved = await provider();
          if (!resolved?.stream?.url) continue;
          const s = resolved.stream;
          player.innerHTML = `<video controls autoplay playsinline preload="metadata" poster="${attr(resolved.data?.videoThumbnails?.[0]?.url || resolved.data?.thumbnailUrl || '')}"><source src="${attr(s.url)}" type="${attr(s.type || s.mimeType || 'video/mp4')}"></video>`;
          const video = player.querySelector('video');
          if (video) {
            video.addEventListener('error', () => embed(id), { once: true });
            try { await video.play(); } catch (_) { /* user can press play */ }
          }
          setState(`PLAYING · ${s.quality || `${s.height || ''}P`.trim() || 'AUTO'}`);
          return;
        } catch (_) {}
      }

      // Last resort is still entirely inside JARVIS. It is an embedded player,
      // never a redirect or new browser page.
      embed(id);
    }

    function embed(id) {
      player.innerHTML = `<iframe title="JARVIS video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen playsinline src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1&autoplay=1"></iframe>`;
      setState('PLAYING · JARVIS PLAYER');
    }

    // Capture phase prevents the legacy media handler from opening YouTube/Bing.
    document.addEventListener('click', e => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest('#videoSearch')) { e.preventDefault(); e.stopImmediatePropagation(); search(input.value.trim()); }
      else if (target.closest('#playVideo')) {
        e.preventDefault(); e.stopImmediatePropagation();
        const raw = document.querySelector('#videoUrl')?.value?.trim() || '';
        const id = videoId(raw);
        if (id) play(id);
        else if (/^https?:\/\//i.test(raw)) {
          player.innerHTML = `<video controls autoplay playsinline src="${attr(raw)}"></video>`;
          setState('PLAYING · DIRECT MEDIA');
        }
      }
    }, true);

    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); search(input.value.trim()); } });
    setState('READY');
    return true;
  }

  const observer = new MutationObserver(() => { if (install()) observer.disconnect(); });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState !== 'loading') install();
  else document.addEventListener('DOMContentLoaded', install, { once: true });
})();
