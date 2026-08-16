(() => {
  'use strict';

  // JARVIS Video Core
  //
  // The previous resilience layer rewrote Piped URLs globally. That made the
  // application dependent on a few stale aliases and caused the UI to report
  // "video index unavailable" even when another public frontend was healthy.
  // This layer owns the media surface and uses several current Piped and
  // Invidious frontends with short timeouts and browser-native YouTube fallback.

  const PIPED = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://api.piped.yt',
    'https://pipedapi.drgns.space',
    'https://pipedapi.owo.si',
    'https://pipedapi.reallyaweso.me'
  ];
  const INVIDIOUS = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yt.chocolatemoo53.com'
  ];
  const TIMEOUT = 6000;
  let installed = false;
  let generation = 0;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]));

  const request = async (url) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'no-store',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`${response.status}`);
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const firstWorking = async (urls) => {
    const attempts = urls.map(async url => ({ data: await request(url), url }));
    if (typeof Promise.any === 'function') return Promise.any(attempts);
    let last;
    for (const attempt of attempts) {
      try { return await attempt; } catch (e) { last = e; }
    }
    throw last || new Error('No video gateway responded');
  };

  const videoId = (raw) => {
    const value = String(raw || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
    try {
      const u = new URL(value);
      const host = u.hostname.toLowerCase();
      if (host === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || null;
      if (host.endsWith('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return v;
        const parts = u.pathname.split('/').filter(Boolean);
        const i = parts.findIndex(x => ['shorts','embed','live'].includes(x));
        if (i >= 0) return parts[i + 1] || null;
      }
    } catch {}
    return null;
  };

  const duration = seconds => {
    const n = Number(seconds) || 0;
    const h = Math.floor(n / 3600);
    const m = Math.floor((n % 3600) / 60);
    const s = Math.floor(n % 60);
    return h ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${m}:${String(s).padStart(2,'0')}`;
  };

  const thumb = item => {
    const thumbs = item.videoThumbnails || [];
    return thumbs.find(x => /maxres|high|medium/i.test(x.quality || ''))?.url
      || thumbs[0]?.url
      || item.thumbnail
      || item.thumbnailUrl
      || (item.videoId ? `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg` : '');
  };

  const normalize = (item, source, gateway = '') => {
    const id = item.videoId || videoId(item.url || '');
    if (!id) return null;
    return {
      id,
      title: item.title || 'Untitled video',
      author: item.author || item.uploader || item.uploaderName || 'YouTube',
      views: item.viewCountText || item.views || (item.viewCount ? `${Number(item.viewCount).toLocaleString()} views` : ''),
      duration: item.lengthSeconds ? duration(item.lengthSeconds) : (item.duration || ''),
      published: item.publishedText || item.uploadedDate || '',
      thumbnail: thumb(item),
      source,
      gateway
    };
  };

  const invidiousSearch = async q => {
    const urls = INVIDIOUS.map(base => `${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&region=IN&page=1`);
    const { data, url } = await firstWorking(urls);
    const items = (Array.isArray(data) ? data : []).map(x => normalize(x, 'Invidious', new URL(url).origin)).filter(Boolean);
    if (!items.length) throw new Error('No videos found');
    return items;
  };

  const pipedSearch = async q => {
    const urls = PIPED.map(base => `${base}/search?q=${encodeURIComponent(q)}&filter=videos&region=IN`);
    const { data, url } = await firstWorking(urls);
    const raw = Array.isArray(data) ? data : (data.items || []);
    const items = raw.map(x => normalize(x, 'Piped', new URL(url).origin)).filter(Boolean);
    if (!items.length) throw new Error('No videos found');
    return items;
  };

  const search = async q => {
    try { return await invidiousSearch(q); } catch {}
    return pipedSearch(q);
  };

  const trending = async () => {
    try {
      const { data, url } = await firstWorking(INVIDIOUS.map(base => `${base}/api/v1/trending?region=IN&type=default`));
      const items = (Array.isArray(data) ? data : []).map(x => normalize(x, 'Invidious', new URL(url).origin)).filter(Boolean);
      if (items.length) return items;
    } catch {}
    try {
      const { data, url } = await firstWorking(PIPED.map(base => `${base}/trending?region=IN`));
      const items = (Array.isArray(data) ? data : []).map(x => normalize(x, 'Piped', new URL(url).origin)).filter(Boolean);
      if (items.length) return items;
    } catch {}
    return [];
  };

  const streamFor = async item => {
    const gateways = [
      ...(item.gateway ? [item.gateway] : []),
      ...INVIDIOUS,
      ...PIPED
    ];
    const unique = [...new Set(gateways)];
    const attempts = unique.map(async base => {
      if (base.includes('piped')) {
        const data = await request(`${base}/streams/${encodeURIComponent(item.id)}`);
        const streams = (data.videoStreams || [])
          .filter(x => x.url && !x.videoOnly)
          .sort((a,b) => (b.height || 0) - (a.height || 0));
        const stream = streams.find(x => /video\/mp4/i.test(x.mimeType || '')) || streams[0];
        if (!stream?.url) throw new Error('No Piped stream');
        return {
          url: stream.url,
          mime: stream.mimeType || 'video/mp4',
          quality: stream.quality || `${stream.height || ''}p`,
          thumbnail: data.thumbnailUrl || item.thumbnail
        };
      }
      const data = await request(`${base}/api/v1/videos/${encodeURIComponent(item.id)}?region=IN`);
      const streams = (data.formatStreams || []).filter(x => x.url);
      streams.sort((a,b) => Number((b.qualityLabel || '').replace(/[^0-9]/g,'')) - Number((a.qualityLabel || '').replace(/[^0-9]/g,'')));
      const stream = streams[0];
      if (!stream?.url) throw new Error('No Invidious stream');
      return {
        url: stream.url,
        mime: stream.type?.split(';')[0] || 'video/mp4',
        quality: stream.qualityLabel || stream.quality || 'AUTO',
        thumbnail: data.videoThumbnails?.[0]?.url || item.thumbnail
      };
    });
    return Promise.any(attempts);
  };

  const addStyle = () => {
    if (document.querySelector('#jarvisVideoCoreStyle')) return;
    const style = document.createElement('style');
    style.id = 'jarvisVideoCoreStyle';
    style.textContent = `
      .jvc-results{display:grid;gap:10px;margin-top:12px}
      .jvc-status{padding:11px 12px;border:1px solid #173545;border-radius:12px;color:#8fb1bd;font-size:.82rem}
      .jvc-card{display:grid;grid-template-columns:150px 1fr 36px;gap:12px;align-items:center;width:100%;padding:0;overflow:hidden;text-align:left;border:1px solid #173545;border-radius:14px;background:rgba(3,11,17,.92);color:#d9f7ff;cursor:pointer}
      .jvc-card:hover{border-color:#49cfff}
      .jvc-thumb{width:150px;aspect-ratio:16/9;object-fit:cover;background:#020509}
      .jvc-info{min-width:0;padding:9px 0}.jvc-info strong{display:block;font-size:.88rem;line-height:1.25}.jvc-info small{display:block;color:#7896a3;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jvc-play{color:#5edcff;margin-right:10px}
      .jvc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.jvc-actions button{border:1px solid #244c60;background:#07131b;color:#bdeeff;border-radius:10px;padding:9px 12px;cursor:pointer}.jvc-actions .primary{background:#55d8ff;color:#031018;font-weight:800}
      #jarvisPlayer.jvc-player iframe,#jarvisPlayer.jvc-player video{display:block;width:100%;height:min(62vh,560px);border:0;background:#000}
      @media(max-width:700px){.jvc-card{grid-template-columns:108px 1fr 30px}.jvc-thumb{width:108px}.jvc-info{padding:7px 0}.jvc-info strong{font-size:.8rem}}
    `;
    document.head.appendChild(style);
  };

  const install = () => {
    const input = document.querySelector('#videoQuery');
    const oldResults = document.querySelector('#videoResults');
    const oldPlayer = document.querySelector('#jarvisPlayer');
    const state = document.querySelector('#mediaState');
    if (!input || !oldResults || !oldPlayer || !state) return false;
    if (installed && input.dataset.jarvisVideoCore === '1') return true;
    installed = true;
    input.dataset.jarvisVideoCore = '1';
    addStyle();

    // Replace the legacy nodes so its pending async calls cannot overwrite the
    // new UI after a slow public instance eventually responds.
    const results = oldResults.cloneNode(false);
    results.id = 'videoResults';
    results.classList.add('jvc-results');
    oldResults.replaceWith(results);
    const player = oldPlayer.cloneNode(true);
    player.id = 'jarvisPlayer';
    player.classList.add('jvc-player');
    oldPlayer.replaceWith(player);

    const side = results.parentElement;
    const status = document.createElement('div');
    status.id = 'jvcStatus';
    status.className = 'jvc-status';
    status.textContent = 'READY · SEARCH FOR A VIDEO';
    side.insertBefore(status, results);

    const setStatus = text => {
      const s = document.querySelector('#jvcStatus');
      if (s) s.textContent = text;
      state.textContent = String(text).split('·')[0].trim().toUpperCase();
    };

    const embed = (id, title) => {
      player.innerHTML = `<iframe title="${esc(title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1"></iframe>`;
      setStatus('PLAYING · YOUTUBE PLAYER');
    };

    const play = async item => {
      const token = ++generation;
      setStatus(`RESOLVING · ${item.title}`);
      player.innerHTML = `<div class="player-empty"><span>◌</span><strong>JARVIS VIDEO CORE</strong><small>Preparing ${esc(item.title)}</small></div>`;
      try {
        const stream = await streamFor(item);
        if (token !== generation) return;
        player.innerHTML = `<video controls autoplay playsinline preload="metadata" poster="${esc(stream.thumbnail || item.thumbnail)}"><source src="${esc(stream.url)}" type="${esc(stream.mime)}"></video>`;
        player.querySelector('video')?.addEventListener('error', () => embed(item.id, item.title), { once:true });
        setStatus(`PLAYING · ${stream.quality || 'AUTO'}`);
      } catch {
        if (token !== generation) return;
        embed(item.id, item.title);
      }
    };

    const render = (items, label) => {
      results.innerHTML = items.slice(0,12).map(item => `<button class="jvc-card" data-jvc-id="${esc(item.id)}"><img class="jvc-thumb" loading="lazy" src="${esc(item.thumbnail)}" alt=""><span class="jvc-info"><strong>${esc(item.title)}</strong><small>${esc(item.author)}${item.views ? ` · ${esc(item.views)}` : ''}</small><small>${esc(item.duration || '')}${item.published ? ` · ${esc(item.published)}` : ''}</small></span><b class="jvc-play">▶</b></button>`).join('');
      results.querySelectorAll('[data-jvc-id]').forEach(button => {
        const item = items.find(x => x.id === button.dataset.jvcId);
        button.addEventListener('click', () => item && play(item));
      });
      setStatus(`${items.length} RESULTS · ${label}`);
    };

    const doSearch = async queryValue => {
      const query = String(queryValue || '').trim();
      if (!query) {
        results.innerHTML = '<div class="jvc-status">READY · ENTER A VIDEO SEARCH TERM</div>';
        setStatus('READY · SEARCH FOR A VIDEO');
        return;
      }
      const token = ++generation;
      results.innerHTML = '<div class="jvc-status">SEARCHING YOUTUBE VIDEO INDEX…</div>';
      setStatus(`SEARCHING · ${query}`);
      try {
        const items = await search(query);
        if (token !== generation) return;
        render(items, items[0]?.source || 'VIDEO SEARCH');
      } catch {
        if (token !== generation) return;
        results.innerHTML = `<div class="jvc-status">SEARCH GATEWAYS ARE BUSY · OPEN THE SAME QUERY IN YOUTUBE</div><div class="jvc-actions"><button class="primary" id="jvcOpenYoutube">OPEN YOUTUBE RESULTS</button></div>`;
        setStatus('READY · EXTERNAL SEARCH AVAILABLE');
        document.querySelector('#jvcOpenYoutube')?.addEventListener('click', () => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer'));
      }
    };

    const loadTrending = async () => {
      setStatus('LOADING · INDIA TRENDING');
      const items = await trending();
      if (items.length) render(items, 'INDIA TRENDING');
      else {
        results.innerHTML = '<div class="jvc-status">READY · SEARCH ANY TOPIC TO FIND VIDEOS</div>';
        setStatus('READY · SEARCH FOR A VIDEO');
      }
    };

    const searchButton = document.querySelector('#videoSearch');
    if (searchButton) {
      const clone = searchButton.cloneNode(true);
      searchButton.replaceWith(clone);
      clone.addEventListener('click', () => doSearch(input.value));
    }
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(input.value); });

    document.querySelectorAll('[data-video-provider]').forEach(button => {
      const clone = button.cloneNode(true);
      button.replaceWith(clone);
      clone.addEventListener('click', () => {
        const kind = clone.dataset.videoProvider;
        if (kind === 'youtube' || kind === 'bing') {
          if (input.value.trim()) doSearch(input.value); else { input.focus(); setStatus('READY · ENTER A VIDEO SEARCH TERM'); }
        } else loadTrending();
      });
    });

    const playButton = document.querySelector('#playVideo');
    if (playButton) {
      const clone = playButton.cloneNode(true);
      playButton.replaceWith(clone);
      clone.addEventListener('click', () => {
        const raw = document.querySelector('#videoUrl')?.value?.trim() || '';
        const id = videoId(raw);
        if (id) return play({ id, title:'YouTube video', author:'YouTube', thumbnail:`https://i.ytimg.com/vi/${id}/hqdefault.jpg`, source:'direct' });
        if (/^https?:\/\//i.test(raw)) {
          player.innerHTML = `<video controls autoplay playsinline src="${esc(raw)}"></video>`;
          setStatus('PLAYING · DIRECT MEDIA URL');
        } else setStatus('READY · PASTE A YOUTUBE URL OR VIDEO ID');
      });
    }

    results.innerHTML = '<div class="jvc-status">READY · SEARCH ANY TOPIC TO FIND VIDEOS</div>';
    setStatus('READY · SEARCH FOR A VIDEO');
    return true;
  };

  const boot = () => {
    if (install()) return;
    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList:true, subtree:true });
    setTimeout(() => observer.disconnect(), 15000);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();
