(() => {
  'use strict';

  // Single-owner media runtime. This deliberately lives after the main module
  // so it can take control of the fully rendered Media Center without racing
  // the legacy experience layer.
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
  const TIMEOUT = 2800;
  const DEFAULT_QUERY = 'trending videos India';
  let mountedInput = null;
  let generation = 0;

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
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
        const parts = u.pathname.split('/').filter(Boolean);
        const i = parts.findIndex(x => ['shorts','embed','live'].includes(x));
        return i >= 0 ? parts[i + 1] || null : null;
      }
    } catch {}
    return null;
  };

  const duration = n => {
    n = Number(n) || 0;
    const h = Math.floor(n / 3600), m = Math.floor(n % 3600 / 60), s = Math.floor(n % 60);
    return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };

  async function json(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(String(response.status));
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function normalize(x, source, gateway) {
    const id = x.videoId || videoId(x.url);
    if (!id) return null;
    const thumbnails = x.videoThumbnails || [];
    return {
      id,
      title: x.title || 'Untitled video',
      author: x.author || x.uploader || x.uploaderName || 'YouTube',
      views: x.viewCountText || x.views || (x.viewCount ? `${Number(x.viewCount).toLocaleString()} views` : ''),
      duration: x.lengthSeconds ? duration(x.lengthSeconds) : (x.duration || ''),
      published: x.publishedText || x.uploadedDate || '',
      thumbnail: thumbnails.find(t => /maxres|high|medium/i.test(t.quality || ''))?.url || thumbnails[0]?.url || x.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      source,
      gateway
    };
  }

  async function searchVideos(query) {
    const pipedTasks = PIPED.map(gateway => json(`${gateway}/search?q=${encodeURIComponent(query)}&filter=videos&region=IN`).then(data => {
      const raw = Array.isArray(data) ? data : (data.items || []);
      const items = raw.map(x => normalize(x, 'PIPED', gateway)).filter(Boolean);
      if (!items.length) throw new Error('empty');
      return items;
    }));
    const invidiousTasks = INVIDIOUS.map(gateway => json(`${gateway}/api/v1/search?q=${encodeURIComponent(query)}&type=video&region=IN&page=1`).then(data => {
      const items = (Array.isArray(data) ? data : []).map(x => normalize(x, 'INVIDIOUS', gateway)).filter(Boolean);
      if (!items.length) throw new Error('empty');
      return items;
    }));
    try {
      return await Promise.any([...pipedTasks, ...invidiousTasks]);
    } catch {
      return [];
    }
  }

  async function resolveStream(item) {
    const tasks = PIPED.map(gateway => json(`${gateway}/streams/${encodeURIComponent(item.id)}`).then(data => {
      const streams = (data.videoStreams || [])
        .filter(x => x.url && !x.videoOnly)
        .sort((a,b) => (b.height || 0) - (a.height || 0));
      const stream = streams.find(x => /video\/mp4/i.test(x.mimeType || '')) || streams[0];
      if (!stream?.url) throw new Error('no stream');
      return { url: stream.url, mime: stream.mimeType || 'video/mp4', quality: stream.quality || `${stream.height || ''}p`, thumb: data.thumbnailUrl || item.thumbnail };
    }));
    const invidiousTasks = INVIDIOUS.map(gateway => json(`${gateway}/api/v1/videos/${encodeURIComponent(item.id)}?region=IN`).then(data => {
      const streams = (data.formatStreams || []).filter(x => x.url).sort((a,b) => Number((b.qualityLabel || '').replace(/\D/g,'')) - Number((a.qualityLabel || '').replace(/\D/g,'')));
      const stream = streams[0];
      if (!stream?.url) throw new Error('no stream');
      return { url: stream.url, mime: (stream.type || 'video/mp4').split(';')[0], quality: stream.qualityLabel || 'AUTO', thumb: data.videoThumbnails?.[0]?.url || item.thumbnail };
    }));
    return Promise.any([...tasks, ...invidiousTasks]);
  }

  function css() {
    if (document.querySelector('#jvcControllerStyle')) return;
    const style = document.createElement('style');
    style.id = 'jvcControllerStyle';
    style.textContent = `
      .jvc-status{padding:11px 12px;border:1px solid #173545;border-radius:12px;color:#8fb1bd;font-size:.82rem}
      #videoResults.jvc-results{display:grid;gap:10px;margin-top:12px}
      .jvc-card{display:grid;grid-template-columns:150px 1fr 34px;gap:12px;align-items:center;width:100%;padding:0;overflow:hidden;text-align:left;border:1px solid #173545;border-radius:14px;background:rgba(3,11,17,.92);color:#d9f7ff;cursor:pointer}
      .jvc-card:hover{border-color:#49cfff}.jvc-thumb{width:150px;aspect-ratio:16/9;object-fit:cover;background:#020509}
      .jvc-info{min-width:0;padding:9px 0}.jvc-info strong{display:block;font-size:.88rem;line-height:1.25}.jvc-info small{display:block;color:#7896a3;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jvc-play{color:#5edcff;margin-right:10px}
      #jarvisPlayer.jvc-player iframe,#jarvisPlayer.jvc-player video{display:block;width:100%;height:min(62vh,560px);border:0;background:#000}
      .jvc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.jvc-actions button{border:1px solid #244c60;background:#07131b;color:#bdeeff;border-radius:10px;padding:9px 12px;cursor:pointer}.jvc-actions .primary{background:#55d8ff;color:#031018;font-weight:800}
      .jvc-live-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}.jvc-live-grid button{min-height:54px}
      @media(max-width:700px){.jvc-card{grid-template-columns:108px 1fr 30px}.jvc-thumb{width:108px}.jvc-info strong{font-size:.8rem}.jvc-live-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function mount() {
    const input = document.querySelector('#videoQuery');
    const resultsHost = document.querySelector('#videoResults');
    const oldPlayer = document.querySelector('#jarvisPlayer');
    const state = document.querySelector('#mediaState');
    if (!input || !resultsHost || !oldPlayer || !state) return false;
    if (mountedInput === input) return true;
    mountedInput = input;
    css();

    const results = resultsHost.cloneNode(false);
    results.id = 'videoResults';
    results.classList.add('jvc-results');
    resultsHost.replaceWith(results);

    const player = oldPlayer.cloneNode(true);
    player.id = 'jarvisPlayer';
    player.classList.add('jvc-player');
    oldPlayer.replaceWith(player);

    const side = results.parentElement;
    const status = document.createElement('div');
    status.id = 'jvcStatus';
    status.className = 'jvc-status';
    side.insertBefore(status, results);

    const setStatus = text => {
      status.textContent = text;
      state.textContent = String(text).split('·')[0].trim().toUpperCase();
    };
    const openSearch = (provider, q) => {
      const query = encodeURIComponent(q || input.value.trim() || 'videos');
      const url = provider === 'bing' ? `https://www.bing.com/videos/search?q=${query}` : `https://www.youtube.com/results?search_query=${query}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    };
    const embed = (id, title) => {
      player.innerHTML = `<iframe title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1"></iframe>`;
      setStatus('PLAYING · YOUTUBE PLAYER');
    };
    const play = async item => {
      const token = ++generation;
      setStatus(`RESOLVING · ${item.title}`);
      player.innerHTML = '<div class="player-empty"><span>◌</span><strong>JARVIS VIDEO CORE</strong><small>Preparing the selected video.</small></div>';
      try {
        const stream = await resolveStream(item);
        if (token !== generation) return;
        player.innerHTML = `<video controls autoplay playsinline preload="metadata" poster="${esc(stream.thumb || item.thumbnail)}"><source src="${esc(stream.url)}" type="${esc(stream.mime)}"></video>`;
        player.querySelector('video')?.addEventListener('error', () => embed(item.id, item.title), { once:true });
        setStatus(`PLAYING · ${stream.quality || 'AUTO'}`);
      } catch {
        if (token === generation) embed(item.id, item.title);
      }
    };
    const render = (items, label) => {
      results.innerHTML = items.slice(0,12).map(item => `<button class="jvc-card" data-video-id="${esc(item.id)}"><img class="jvc-thumb" loading="lazy" src="${esc(item.thumbnail)}" alt=""><span class="jvc-info"><strong>${esc(item.title)}</strong><small>${esc(item.author)}${item.views ? ` · ${esc(item.views)}` : ''}</small><small>${esc(item.duration || '')}${item.published ? ` · ${esc(item.published)}` : ''}</small></span><b class="jvc-play">▶</b></button>`).join('');
      results.querySelectorAll('[data-video-id]').forEach(button => {
        const item = items.find(x => x.id === button.dataset.videoId);
        button.onclick = () => item && play(item);
      });
      setStatus(`${items.length} RESULTS · ${label}`);
    };
    const showLive = query => {
      results.innerHTML = `<div class="jvc-status">LIVE SEARCH READY · CHOOSE A SEARCH ENGINE</div><div class="jvc-live-grid jvc-actions"><button class="primary" id="jvcYoutube">YOUTUBE SEARCH</button><button id="jvcBing">BING VIDEO SEARCH</button></div>`;
      setStatus('LIVE SEARCH READY');
      results.querySelector('#jvcYoutube').onclick = () => openSearch('youtube', query);
      results.querySelector('#jvcBing').onclick = () => openSearch('bing', query);
    };
    const search = async query => {
      const q = String(query || '').trim();
      if (!q) { setStatus('READY · ENTER A VIDEO SEARCH TERM'); return; }
      const token = ++generation;
      results.innerHTML = '<div class="jvc-status">SEARCHING LIVE VIDEO SOURCES…</div>';
      setStatus(`SEARCHING · ${q}`);
      const items = await searchVideos(q);
      if (token !== generation) return;
      if (items.length) render(items, items[0].source || 'VIDEO SEARCH'); else showLive(q);
    };

    // Remove legacy target listeners and make this controller the public API.
    const searchButton = document.querySelector('#videoSearch');
    if (searchButton) {
      const fresh = searchButton.cloneNode(true);
      searchButton.replaceWith(fresh);
      fresh.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); void search(input.value); }, true);
    }
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); event.stopImmediatePropagation(); void search(input.value); }
    }, true);
    document.querySelectorAll('[data-video-provider]').forEach(old => {
      const fresh = old.cloneNode(true);
      old.replaceWith(fresh);
      fresh.addEventListener('click', event => {
        event.preventDefault(); event.stopImmediatePropagation();
        const provider = fresh.dataset.videoProvider;
        if (provider === 'trending') void search(DEFAULT_QUERY);
        else openSearch(provider === 'bing' ? 'bing' : 'youtube', input.value.trim() || DEFAULT_QUERY);
      }, true);
    });
    const playButton = document.querySelector('#playVideo');
    if (playButton) {
      const fresh = playButton.cloneNode(true);
      playButton.replaceWith(fresh);
      fresh.addEventListener('click', event => {
        event.preventDefault(); event.stopImmediatePropagation();
        const raw = document.querySelector('#videoUrl')?.value?.trim() || '';
        const id = videoId(raw);
        if (id) play({ id, title:'YouTube video', author:'YouTube', thumbnail:`https://i.ytimg.com/vi/${id}/hqdefault.jpg` });
        else if (/^https?:\/\//i.test(raw)) { player.innerHTML = `<video controls autoplay playsinline src="${esc(raw)}"></video>`; setStatus('PLAYING · DIRECT MEDIA URL'); }
        else setStatus('READY · PASTE A YOUTUBE URL OR VIDEO ID');
      }, true);
    }

    window.jarvisVideoSearch = query => { input.value = query || ''; void search(input.value); };
    window.jarvisOpenVideoSearch = (provider, query) => openSearch(provider === 'bing' ? 'bing' : 'youtube', query || input.value || DEFAULT_QUERY);
    input.value = input.value.trim() || DEFAULT_QUERY;
    results.innerHTML = '<div class="jvc-status">READY · VIDEO SEARCH ONLINE</div>';
    setStatus('READY · VIDEO SEARCH ONLINE');

    // Dashboard Find Video lands here without a second controller. The initial
    // query is real and immediately searchable, while later user searches cancel
    // the initial request through the generation token.
    void search(DEFAULT_QUERY);
    return true;
  }

  function boot() {
    let attempts = 0;
    const timer = setInterval(() => {
      if (mount() || ++attempts > 150) clearInterval(timer);
    }, 50);
  }

  window.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('#videoSearch') : null;
    if (!target || typeof window.jarvisVideoSearch !== 'function') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void window.jarvisVideoSearch(document.querySelector('#videoQuery')?.value || '');
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
