(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_CORE_V7__) return;
  window.__JARVIS_MEDIA_CORE_V7__ = true;

  const PIPED = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.leptons.xyz',
    'https://pipedapi.nosebs.ru',
    'https://pipedapi-libre.kavin.rocks',
    'https://piped-api.privacy.com.de',
    'https://pipedapi.adminforge.de',
    'https://api.piped.yt',
    'https://pipedapi.drgns.space'
  ];
  const INVIDIOUS = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yt.chocolatemoo53.com'
  ];
  const TIMEOUT = 3500;
  const DEFAULT_QUERY = 'trending videos India';
  let generation = 0;
  let mountedInput = null;

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'
  }[c]));

  const videoId = raw => {
    const value = String(raw || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
    try {
      const u = new URL(value);
      if (u.hostname === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || null;
      if (u.hostname.endsWith('youtube.com')) {
        const q = u.searchParams.get('v');
        if (q) return q;
        const p = u.pathname.split('/').filter(Boolean);
        const i = p.findIndex(x => ['shorts','embed','live'].includes(x));
        return i >= 0 ? p[i + 1] || null : null;
      }
    } catch {}
    return null;
  };

  async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  }

  async function fetchText(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT + 1500);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'text/plain,text/markdown,*/*' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.text();
    } finally { clearTimeout(timer); }
  }

  const duration = seconds => {
    const n = Number(seconds) || 0;
    const h = Math.floor(n / 3600), m = Math.floor((n % 3600) / 60), s = Math.floor(n % 60);
    return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };

  function normalize(item, source, gateway) {
    const id = item?.videoId || videoId(item?.url);
    if (!id) return null;
    const thumbs = item.videoThumbnails || [];
    return {
      id,
      title: item.title || 'Untitled video',
      author: item.author || item.uploader || item.uploaderName || 'YouTube',
      views: item.viewCountText || item.views || (item.viewCount ? `${Number(item.viewCount).toLocaleString()} views` : ''),
      duration: item.lengthSeconds ? duration(item.lengthSeconds) : (item.duration || ''),
      published: item.publishedText || item.uploadedDate || '',
      thumbnail: thumbs.find(t => /maxres|high|medium/i.test(t.quality || ''))?.url || thumbs[0]?.url || item.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      source,
      gateway
    };
  }

  function dedupe(items) {
    const seen = new Set();
    return items.filter(item => item && !seen.has(item.id) && seen.add(item.id));
  }

  async function searchPiped(query) {
    const tasks = PIPED.map(gateway => fetchJson(`${gateway}/search?q=${encodeURIComponent(query)}&filter=videos&region=IN`)
      .then(data => dedupe((Array.isArray(data) ? data : data.items || []).map(x => normalize(x, 'PIPED', gateway)).filter(Boolean)))
      .catch(() => []));
    const batches = await Promise.all(tasks);
    return dedupe(batches.flat()).slice(0, 18);
  }

  async function searchInvidious(query) {
    const tasks = INVIDIOUS.map(gateway => fetchJson(`${gateway}/api/v1/search?q=${encodeURIComponent(query)}&type=video&region=IN&page=1`)
      .then(data => dedupe((Array.isArray(data) ? data : []).map(x => normalize(x, 'INVIDIOUS', gateway)).filter(Boolean)))
      .catch(() => []));
    const batches = await Promise.all(tasks);
    return dedupe(batches.flat()).slice(0, 18);
  }

  function parseJinaYouTube(text, query) {
    const results = [];
    const seen = new Set();
    const linkPattern = /(?:\[[^\]]+\]\()?https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})(?:[^\s)]*)?/gi;
    for (const match of text.matchAll(linkPattern)) {
      const id = match[1];
      if (seen.has(id)) continue;
      seen.add(id);
      const start = Math.max(0, match.index - 260);
      const context = text.slice(start, match.index + match[0].length + 220).replace(/\s+/g, ' ');
      const md = context.match(/\[([^\]]{3,180})\]\(https?:\/\/(?:www\.)?youtube\.com\/watch\?v=/i);
      const title = md?.[1]?.trim() || context.split('\n').map(s => s.replace(/^[-*#>\s]+/, '').trim()).find(s => s.length >= 3 && !/^https?:/i.test(s)) || `${query} · YouTube result`;
      results.push({ id, title, author: 'YouTube', views: '', duration: '', published: '', thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`, source: 'YOUTUBE-READER', gateway: 'r.jina.ai' });
      if (results.length >= 18) break;
    }
    return results;
  }

  async function searchYouTubeReader(query) {
    const targets = [
      `https://r.jina.ai/https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      `https://s.jina.ai/${encodeURIComponent(`site:youtube.com/watch ${query}`)}`
    ];
    for (const target of targets) {
      try {
        const text = await fetchText(target);
        const results = parseJinaYouTube(text, query);
        if (results.length) return results;
      } catch {}
    }
    return [];
  }

  async function searchVideos(query) {
    const [piped, invidious] = await Promise.all([searchPiped(query), searchInvidious(query)]);
    const primary = dedupe([...piped, ...invidious]);
    if (primary.length) return primary.slice(0, 12);
    return searchYouTubeReader(query);
  }

  async function resolveStream(item) {
    const pipedTasks = PIPED.map(gateway => fetchJson(`${gateway}/streams/${encodeURIComponent(item.id)}`).then(data => {
      const streams = (data.videoStreams || []).filter(x => x.url && !x.videoOnly).sort((a,b) => (b.height || 0) - (a.height || 0));
      const stream = streams.find(x => /video\/mp4/i.test(x.mimeType || '')) || streams[0];
      if (!stream?.url) throw new Error('No browser-compatible Piped stream');
      return { url: stream.url, mime: stream.mimeType || 'video/mp4', quality: stream.quality || `${stream.height || ''}p`, thumb: data.thumbnailUrl || item.thumbnail };
    }).catch(() => null));
    const invidiousTasks = INVIDIOUS.map(gateway => fetchJson(`${gateway}/api/v1/videos/${encodeURIComponent(item.id)}?region=IN`).then(data => {
      const streams = (data.formatStreams || []).filter(x => x.url).sort((a,b) => Number((b.qualityLabel || '').replace(/\D/g,'')) - Number((a.qualityLabel || '').replace(/\D/g,'')));
      const stream = streams[0];
      if (!stream?.url) throw new Error('No Invidious stream');
      return { url: stream.url, mime: (stream.type || 'video/mp4').split(';')[0], quality: stream.qualityLabel || 'AUTO', thumb: data.videoThumbnails?.[0]?.url || item.thumbnail };
    }).catch(() => null));
    const resolved = (await Promise.all([...pipedTasks, ...invidiousTasks])).filter(Boolean);
    if (!resolved.length) throw new Error('No direct stream available');
    return resolved[0];
  }

  function style() {
    if (document.getElementById('jarvisMediaCoreV7Style')) return;
    const s = document.createElement('style');
    s.id = 'jarvisMediaCoreV7Style';
    s.textContent = `
      #videoResults.jmc7-results{display:grid;gap:10px;margin-top:12px}
      .jmc7-card{display:grid;grid-template-columns:150px 1fr 34px;gap:12px;align-items:center;width:100%;padding:0;overflow:hidden;text-align:left;border:1px solid #173545;border-radius:14px;background:rgba(3,11,17,.92);color:#d9f7ff;cursor:pointer}
      .jmc7-card:hover{border-color:#49cfff;background:rgba(6,20,28,.98)}
      .jmc7-thumb{width:150px;aspect-ratio:16/9;object-fit:cover;background:#020509}
      .jmc7-info{min-width:0;padding:10px 0}.jmc7-info strong{display:block;font-size:.88rem;line-height:1.25}.jmc7-info small{display:block;color:#7896a3;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jmc7-play{color:#5edcff;margin-right:10px}
      .jmc7-status{padding:11px 12px;border:1px solid #173545;border-radius:12px;color:#8fb1bd;font-size:.78rem;letter-spacing:.05em}
      .jmc7-error{display:block;padding:16px;text-align:left;cursor:default}.jmc7-error strong{display:block;color:#bdeeff;margin-bottom:5px}.jmc7-error small{color:#7896a3}
      #jarvisPlayer.jmc7-player iframe,#jarvisPlayer.jmc7-player video{display:block;width:100%;height:min(62vh,560px);border:0;background:#000}
      @media(max-width:700px){.jmc7-card{grid-template-columns:108px 1fr 30px}.jmc7-thumb{width:108px}.jmc7-info strong{font-size:.8rem}}
    `;
    document.head.appendChild(s);
  }

  function mount() {
    const input = document.querySelector('#videoQuery');
    const results = document.querySelector('#videoResults');
    const player = document.querySelector('#jarvisPlayer');
    const state = document.querySelector('#mediaState');
    if (!input || !results || !player || !state) return false;
    if (mountedInput === input) return true;
    mountedInput = input;
    style();
    results.classList.add('jmc7-results');
    player.classList.add('jmc7-player');

    let status = document.querySelector('#jmc7Status');
    if (!status) { status = document.createElement('div'); status.id = 'jmc7Status'; status.className = 'jmc7-status'; results.parentElement?.insertBefore(status, results); }
    const setStatus = text => { status.textContent = text; state.textContent = String(text).split('·')[0].trim().toUpperCase(); };

    const embed = (id, title) => {
      player.innerHTML = `<iframe title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1"></iframe>`;
      setStatus('PLAYING · YOUTUBE EMBED');
    };

    const play = async item => {
      const token = ++generation;
      setStatus(`RESOLVING · ${item.title}`);
      player.innerHTML = '<div class="jmc7-status">PREPARING JARVIS PLAYER…</div>';
      try {
        const stream = await resolveStream(item);
        if (token !== generation) return;
        player.innerHTML = `<video controls autoplay playsinline preload="metadata" poster="${esc(stream.thumb || item.thumbnail)}"><source src="${esc(stream.url)}" type="${esc(stream.mime)}"></video>`;
        const video = player.querySelector('video');
        video?.addEventListener('error', () => embed(item.id, item.title), { once:true });
        setStatus(`PLAYING · ${stream.quality || 'AUTO'}`);
      } catch { if (token === generation) embed(item.id, item.title); }
    };

    const render = items => {
      const list = dedupe(items).slice(0, 12);
      results.innerHTML = list.map(item => `<button type="button" class="jmc7-card" data-video-id="${esc(item.id)}"><img class="jmc7-thumb" loading="lazy" src="${esc(item.thumbnail)}" alt=""><span class="jmc7-info"><strong>${esc(item.title)}</strong><small>${esc(item.author)}${item.views ? ` · ${esc(item.views)}` : ''}</small><small>${esc(item.duration || '')}${item.published ? ` · ${esc(item.published)}` : ''}</small></span><b class="jmc7-play">▶</b></button>`).join('');
      list.forEach(item => results.querySelector(`[data-video-id="${CSS.escape(item.id)}"]`)?.addEventListener('click', e => { e.preventDefault(); void play(item); }));
      setStatus(`RESULTS · ${list.length} · LIVE INDEX`);
    };

    const showFailure = query => {
      results.innerHTML = `<div class="jmc7-card jmc7-error"><strong>VIDEO SEARCH TEMPORARILY UNAVAILABLE</strong><small>No live video index responded for “${esc(query)}”. JARVIS did not substitute a fixed or fabricated result.</small></div>`;
      setStatus('DEGRADED · NO LIVE VIDEO INDEX');
    };

    const search = async query => {
      const q = String(query || '').trim();
      if (!q) { setStatus('READY · ENTER A VIDEO SEARCH TERM'); return; }
      const token = ++generation;
      results.innerHTML = '<div class="jmc7-status">SEARCHING LIVE VIDEO INDEXES…</div>';
      setStatus(`SEARCHING · ${q}`);
      const items = await searchVideos(q);
      if (token !== generation) return;
      if (items.length) render(items); else showFailure(q);
    };

    const replaceClickTarget = selector => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const fresh = node.cloneNode(true);
      node.replaceWith(fresh);
      return fresh;
    };

    const searchButton = replaceClickTarget('#videoSearch');
    searchButton?.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); void search(input.value); }, true);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); void search(input.value); } }, true);

    document.querySelectorAll('[data-video-provider]').forEach(node => {
      const fresh = node.cloneNode(true); node.replaceWith(fresh);
      fresh.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); const q = fresh.dataset.videoProvider === 'trending' ? DEFAULT_QUERY : (input.value.trim() || DEFAULT_QUERY); input.value = q; void search(q); }, true);
    });

    const playButton = replaceClickTarget('#playVideo');
    playButton?.addEventListener('click', e => {
      e.preventDefault(); e.stopImmediatePropagation();
      const raw = document.querySelector('#videoUrl')?.value?.trim() || '';
      const id = videoId(raw);
      if (id) void play({ id, title:'YouTube video', author:'YouTube', thumbnail:`https://i.ytimg.com/vi/${id}/hqdefault.jpg` });
      else if (/^https?:\/\//i.test(raw)) { player.innerHTML = `<video controls autoplay playsinline src="${esc(raw)}"></video>`; setStatus('PLAYING · DIRECT MEDIA'); }
      else setStatus('READY · PASTE A YOUTUBE URL OR VIDEO ID');
    }, true);

    window.jarvisVideoSearch = query => search(query || input.value || DEFAULT_QUERY);
    window.jarvisOpenVideoSearch = (provider, query) => {
      const q = encodeURIComponent(query || input.value || DEFAULT_QUERY);
      const url = provider === 'bing' ? `https://www.bing.com/videos/search?q=${q}` : `https://www.youtube.com/results?search_query=${q}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    input.value = input.value.trim() || DEFAULT_QUERY;
    void search(input.value);
    return true;
  }

  function boot() {
    let attempts = 0;
    const timer = setInterval(() => { if (mount() || ++attempts > 180) clearInterval(timer); }, 50);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
