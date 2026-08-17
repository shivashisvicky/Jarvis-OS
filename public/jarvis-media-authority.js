(() => {
  'use strict';

  // FINAL MEDIA OWNER
  // This layer is deliberately last. Older media experiments may still exist,
  // but every user transaction is routed through this controller.
  if (window.__JARVIS_MEDIA_AUTHORITY__) return;
  window.__JARVIS_MEDIA_AUTHORITY__ = true;

  const INVIDIOUS = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yt.chocolatemoo53.com',
    'https://invidious.tiekoetter.com'
  ];
  const PIPED = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.leptons.xyz',
    'https://pipedapi.adminforge.de',
    'https://api.piped.yt'
  ];
  let requestSerial = 0;

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const idFrom = raw => {
    const value = String(raw || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
    try {
      const u = new URL(value);
      if (u.hostname === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || null;
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v') || null;
    } catch {}
    return null;
  };

  async function json(url, timeout = 5000) {
    const c = new AbortController();
    const timer = setTimeout(() => c.abort(), timeout);
    try {
      const r = await fetch(url, { signal:c.signal, cache:'no-store', headers:{Accept:'application/json'} });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } finally { clearTimeout(timer); }
  }

  function normalize(v, source) {
    const id = String(v?.videoId || v?.id || idFrom(v?.url || '') || '');
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return {
      id,
      title:String(v?.title || 'Untitled video'),
      author:String(v?.author || v?.uploader || v?.uploaderName || 'Unknown channel'),
      views:v?.viewCountText || v?.views || (v?.viewCount ? `${Number(v.viewCount).toLocaleString()} views` : ''),
      published:String(v?.publishedText || v?.uploadedDate || ''),
      thumbnail:String(v?.thumbnail || v?.thumbnailUrl || v?.videoThumbnails?.find(x => /high|medium|maxres/i.test(x?.quality || ''))?.url || v?.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`),
      source
    };
  }

  async function searchProvider(url, source, piped) {
    const data = await json(url, 5500);
    const raw = piped ? (Array.isArray(data) ? data : data?.items || data?.results || []) : (Array.isArray(data) ? data : []);
    return raw.map(v => normalize(v, source)).filter(Boolean);
  }

  async function search(q) {
    const tasks = [
      ...INVIDIOUS.map(base => searchProvider(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1&region=IN`, 'INVIDIOUS', false)),
      ...PIPED.map(base => searchProvider(`${base}/search?q=${encodeURIComponent(q)}&filter=videos&region=IN`, 'PIPED', true))
    ];
    const settled = await Promise.allSettled(tasks);
    const out = [], seen = new Set();
    for (const item of settled) {
      if (item.status !== 'fulfilled') continue;
      for (const v of item.value) if (!seen.has(v.id)) { seen.add(v.id); out.push(v); }
    }
    return out.slice(0, 12);
  }

  async function resolve(item) {
    const tasks = [
      ...PIPED.map(base => json(`${base}/streams/${encodeURIComponent(item.id)}`, 4500).then(d => {
        const streams = (d.videoStreams || []).filter(x => x?.url && !x.videoOnly).sort((a,b) => (b.height || 0) - (a.height || 0));
        const s = streams.find(x => /video\/mp4/i.test(x.mimeType || '')) || streams[0];
        if (!s) throw new Error('no stream');
        return {url:s.url, mime:s.mimeType || 'video/mp4', quality:s.quality || `${s.height || ''}P`, thumb:d.thumbnailUrl || item.thumbnail};
      })),
      ...INVIDIOUS.map(base => json(`${base}/api/v1/videos/${encodeURIComponent(item.id)}?region=IN`, 4500).then(d => {
        const streams = [...(d.formatStreams || []), ...(d.adaptiveFormats || [])].filter(x => x?.url && !x.videoOnly).sort((a,b) => Number((b.qualityLabel || '').replace(/\D/g,'')) - Number((a.qualityLabel || '').replace(/\D/g,'')));
        const s = streams[0];
        if (!s) throw new Error('no stream');
        return {url:s.url, mime:(s.type || s.mimeType || 'video/mp4').split(';')[0], quality:s.qualityLabel || 'AUTO', thumb:d.videoThumbnails?.[0]?.url || item.thumbnail};
      }))
    ];
    const settled = await Promise.allSettled(tasks);
    const hit = settled.find(x => x.status === 'fulfilled' && x.value?.url);
    return hit?.value || null;
  }

  function mount() {
    const input = $('#videoQuery'), button = $('#videoSearch'), results = $('#videoResults'), player = $('#jarvisPlayer'), state = $('#jvcStatus') || $('#mediaState');
    if (!input || !button || !results || !player || !state) return false;

    if (!results.classList.contains('jma-results')) results.classList.add('jma-results');
    if (!player.classList.contains('jma-player')) player.classList.add('jma-player');

    const setState = text => { state.textContent = text; };
    const renderResults = items => {
      results.innerHTML = items.map(v => `<button type="button" class="jvc-card jma-card" data-jma-id="${esc(v.id)}"><img class="jma-thumb" loading="lazy" src="${esc(v.thumbnail)}" alt=""><span class="jma-info"><strong>${esc(v.title)}</strong><small>${esc(v.author)}${v.views ? ` · ${esc(v.views)}` : ''}</small><small>${esc(v.published)}</small></span><b>▶</b></button>`).join('');
      results.querySelectorAll('.jma-card').forEach(card => card.addEventListener('click', e => {
        e.preventDefault(); e.stopImmediatePropagation();
        const item = items.find(x => x.id === card.dataset.jmaId);
        if (item) void play(item);
      }, true));
    };
    const play = async item => {
      const token = ++requestSerial;
      setState('RESOLVING · JARVIS PLAYER');
      player.innerHTML = '<div class="player-empty"><span>◌</span><strong>JARVIS VIDEO CORE</strong><small>Resolving a browser-playable source.</small></div>';
      const stream = await resolve(item).catch(() => null);
      if (token !== requestSerial) return;
      if (stream?.url) {
        player.innerHTML = `<video controls autoplay playsinline preload="metadata" poster="${esc(stream.thumb || item.thumbnail)}"><source src="${esc(stream.url)}" type="${esc(stream.mime)}"></video>`;
        setState(`PLAYING · ${esc(stream.quality || 'AUTO')}`);
        const video = player.querySelector('video');
        video?.addEventListener('error', () => embed(item), {once:true});
        video?.play().catch(() => {});
        return;
      }
      embed(item);
    };
    const embed = item => {
      player.innerHTML = `<iframe title="${esc(item.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(item.id)}?rel=0&playsinline=1&autoplay=1"></iframe>`;
      setState('PLAYING · JARVIS PLAYER');
    };
    const runSearch = async () => {
      const q = input.value.trim();
      if (!q) { setState('READY · ENTER A VIDEO SEARCH TERM'); return; }
      const token = ++requestSerial;
      setState('SEARCHING · JARVIS VIDEO INDEX');
      results.innerHTML = '<div class="empty">JARVIS is searching video indexes…</div>';
      const items = await search(q);
      if (token !== requestSerial) return;
      if (!items.length) {
        results.innerHTML = '<div class="video-context"><strong>No public video index responded with results</strong><p>JARVIS will not redirect you. Try SEARCH again or paste a video URL.</p></div>';
        setState('NO REDIRECT');
        player.innerHTML = '<div class="player-empty"><span>!</span><strong>VIDEO INDEX DEGRADED</strong><small>NO REDIRECT · JARVIS remains in the media console.</small></div>';
        return;
      }
      renderResults(items);
      setState(`RESULTS · ${items.length} · IN-HOUSE`);
    };

    // Capture phase plus stopImmediatePropagation prevents the legacy media
    // handlers from opening YouTube/Bing or replacing the JARVIS result surface.
    if (!button.dataset.jmaBound) {
      button.dataset.jmaBound = '1';
      button.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); void runSearch(); }, true);
    }
    if (!input.dataset.jmaBound) {
      input.dataset.jmaBound = '1';
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); void runSearch(); } }, true);
    }
    document.querySelectorAll('[data-video-provider]').forEach(b => {
      if (b.dataset.jmaBound) return;
      b.dataset.jmaBound = '1';
      b.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); input.value = b.dataset.videoProvider === 'trending' ? 'trending videos India' : input.value.trim(); if (input.value) void runSearch(); }, true);
    });
    window.JARVIS_MEDIA_SEARCH_AUTHORITY = runSearch;
    window.JARVIS_MEDIA_PLAY_AUTHORITY = play;
    return true;
  }

  function style() {
    if ($('#jma-style')) return;
    const s = document.createElement('style'); s.id = 'jma-style';
    s.textContent = `.jma-results{display:grid;gap:10px}.jma-card{grid-template-columns:150px 1fr 34px}.jma-thumb{width:150px;aspect-ratio:16/9;object-fit:cover;background:#020509}.jma-info{min-width:0;padding:9px 0}.jma-info strong{display:block;line-height:1.25}.jma-info small{display:block;margin-top:5px;color:#7896a3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jma-player iframe,.jma-player video{display:block;width:100%;height:min(62vh,560px);border:0;background:#000}@media(max-width:700px){.jma-card{grid-template-columns:108px 1fr 30px}.jma-thumb{width:108px}}`;
    document.head.appendChild(s);
  }

  style();
  const observer = new MutationObserver(() => { if (mount()) observer.disconnect(); });
  observer.observe(document.documentElement, {subtree:true, childList:true});
  if (mount()) observer.disconnect();
})();
