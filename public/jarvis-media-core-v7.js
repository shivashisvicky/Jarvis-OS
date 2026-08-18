(() => {
  'use strict';
  if (window.__JARVIS_OPEN_MEDIA_V2__) return;
  window.__JARVIS_OPEN_MEDIA_V2__ = true;

  const PEERTUBE = ['https://peertube.cpy.re', 'https://framatube.org', 'https://peertube.uno'];
  const INVIDIOUS = ['https://inv.nadeko.net', 'https://invidious.nerdvpn.de', 'https://yt.chocolatemoo53.com'];
  const TIMEOUT = 6000;
  let mounted = false;

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', "'": '&#39;'
  }[c]));

  const duration = value => {
    const n = Number(value) || 0;
    const m = Math.floor(n / 60);
    const s = Math.floor(n % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
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
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  const dedupe = items => {
    const seen = new Set();
    return items.filter(item => {
      if (!item) return false;
      const key = `${item.platform}:${item.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const peerTubeItem = item => {
    const id = item?.uuid || item?.shortUUID || item?.id;
    if (!id) return null;
    const host = item.__host;
    const thumb = item.thumbnailPath
      ? (item.thumbnailPath.startsWith('http') ? item.thumbnailPath : `${host}${item.thumbnailPath}`)
      : '';
    return {
      id: String(id),
      platform: 'PeerTube',
      title: item.name || 'Untitled video',
      author: item.channel?.displayName || item.account?.displayName || item.account?.name || 'PeerTube',
      views: item.views ? `${Number(item.views).toLocaleString()} views` : '',
      duration: duration(item.duration),
      published: item.publishedAt || '',
      thumb,
      embed: `${host}/videos/embed/${encodeURIComponent(id)}?autoplay=1&peertubeLink=0`
    };
  };

  const invidiousItem = (item, host) => item?.videoId ? ({
    id: String(item.videoId),
    platform: 'Invidious',
    title: item.title || 'Untitled video',
    author: item.author || 'Invidious',
    views: item.viewCount ? `${Number(item.viewCount).toLocaleString()} views` : '',
    duration: duration(item.lengthSeconds),
    published: item.publishedText || '',
    thumb: item.videoThumbnails?.find(t => /high|maxres/i.test(t.quality || ''))?.url
      || item.videoThumbnails?.[0]?.url
      || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
    embed: `${host}/embed/${encodeURIComponent(item.videoId)}?autoplay=1`
  }) : null;

  async function searchPeerTube(query) {
    return (await Promise.all(PEERTUBE.map(host =>
      json(`${host}/api/v1/search/videos?search=${encodeURIComponent(query)}&count=12&searchTarget=search-index&sort=-publishedAt`)
        .then(data => (data.data || []).map(item => peerTubeItem({ ...item, __host: host })).filter(Boolean))
        .catch(() => [])
    ))).flat();
  }

  async function searchInvidious(query) {
    return (await Promise.all(INVIDIOUS.map(host =>
      json(`${host}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=1`)
        .then(data => (Array.isArray(data) ? data : []).map(item => invidiousItem(item, host)).filter(Boolean))
        .catch(() => [])
    ))).flat();
  }

  function style() {
    if (document.getElementById('jarvisOpenMediaStyle')) return;
    const styleElement = document.createElement('style');
    styleElement.id = 'jarvisOpenMediaStyle';
    styleElement.textContent = `
      #videoResults.jom-results{display:grid;gap:10px;margin-top:12px}
      .jom-card{display:grid;grid-template-columns:150px 1fr 34px;gap:12px;align-items:center;width:100%;padding:0;overflow:hidden;text-align:left;border:1px solid #173545;border-radius:14px;background:rgba(3,11,17,.92);color:#d9f7ff;cursor:pointer}
      .jom-card:hover{border-color:#49cfff}
      .jom-thumb{width:150px;aspect-ratio:16/9;object-fit:cover;background:#020509}
      .jom-info{min-width:0;padding:10px 0}
      .jom-info strong{display:block;font-size:.88rem;line-height:1.25}
      .jom-info small{display:block;color:#7896a3;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .jom-play{color:#5edcff;margin-right:10px}
      .jom-status{padding:11px 12px;border:1px solid #173545;border-radius:12px;color:#8fb1bd;font-size:.78rem;letter-spacing:.04em}
      .jom-error{display:block;padding:16px;cursor:default}
      .jom-error strong{display:block;color:#d9f7ff;margin-bottom:5px}
      .jom-error small{color:#7896a3}
      #jarvisPlayer.jom-player iframe{display:block;width:100%;height:min(62vh,560px);border:0;background:#000}
      @media(max-width:700px){.jom-card{grid-template-columns:108px 1fr 30px}.jom-thumb{width:108px}.jom-info strong{font-size:.8rem}}
    `;
    document.head.appendChild(styleElement);
  }

  function mount() {
    const input = document.querySelector('#videoQuery');
    const results = document.querySelector('#videoResults');
    const player = document.querySelector('#jarvisPlayer');
    const state = document.querySelector('#mediaState');
    if (!input || !results || !player || !state || mounted) return !!input;

    mounted = true;
    style();
    results.classList.add('jom-results');
    player.classList.add('jom-player');

    let status = document.querySelector('#jmc7Status');
    if (!status) {
      status = document.createElement('div');
      status.id = 'jmc7Status';
      status.className = 'jom-status';
      results.parentElement?.insertBefore(status, results);
    }

    const setStatus = text => {
      status.textContent = text;
      state.textContent = String(text).split('·')[0].trim().toUpperCase();
    };

    const play = item => {
      player.innerHTML = `<iframe title="${esc(item.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" src="${esc(item.embed)}"></iframe>`;
      setStatus(`PLAYING · ${item.platform}`);
    };

    const playYouTubeUrl = raw => {
      const value = String(raw || '').trim();
      let id = null;
      if (/^[A-Za-z0-9_-]{11}$/.test(value)) id = value;
      else {
        try {
          const url = new URL(value);
          if (url.hostname === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || null;
          if (url.hostname.endsWith('youtube.com')) id = url.searchParams.get('v') || null;
        } catch {}
      }
      if (!id) {
        setStatus('READY · PASTE A YOUTUBE URL OR VIDEO ID');
        return;
      }
      play({
        id,
        platform: 'YouTube',
        title: 'YouTube video',
        embed: `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0`
      });
    };

    const render = items => {
      const list = dedupe(items).slice(0, 16);
      results.innerHTML = list.map(item => `
        <button type="button" class="jom-card" data-video-id="${esc(item.id)}" data-platform="${esc(item.platform)}">
          <img class="jom-thumb" loading="lazy" src="${esc(item.thumb)}" alt="">
          <span class="jom-info">
            <strong>${esc(item.title)}</strong>
            <small>${esc(item.platform)} · ${esc(item.author)}${item.views ? ` · ${esc(item.views)}` : ''}</small>
            <small>${esc(item.duration)}${item.published ? ` · ${esc(item.published)}` : ''}</small>
          </span>
          <b class="jom-play">▶</b>
        </button>`).join('');

      list.forEach(item => {
        results.querySelector(`.jom-card[data-video-id="${CSS.escape(item.id)}"][data-platform="${CSS.escape(item.platform)}"]`)
          ?.addEventListener('click', () => play(item));
      });
      setStatus(`RESULTS · ${list.length} · OPEN VIDEO`);
    };

    const fail = query => {
      results.innerHTML = `<div class="jom-card jom-error"><strong>VIDEO SEARCH TEMPORARILY UNAVAILABLE</strong><small>No PeerTube or Invidious instance answered “${esc(query)}”. No fixed results were substituted.</small></div>`;
      setStatus('DEGRADED · OPEN VIDEO NETWORK');
    };

    const search = async () => {
      const query = input.value.trim();
      if (!query) {
        setStatus('READY · ENTER A VIDEO SEARCH TERM');
        return;
      }
      results.innerHTML = '<div class="jom-status">SEARCHING PEERTUBE + INVIDIOUS…</div>';
      setStatus(`SEARCHING · ${query}`);
      const [peerTube, invidious] = await Promise.all([searchPeerTube(query), searchInvidious(query)]);
      const all = dedupe([...peerTube, ...invidious]);
      all.length ? render(all) : fail(query);
    };

    const searchButton = document.querySelector('#videoSearch');
    if (searchButton) {
      const fresh = searchButton.cloneNode(true);
      searchButton.replaceWith(fresh);
      fresh.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        void search();
      }, true);
    }

    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopImmediatePropagation();
        void search();
      }
    }, true);

    const playButton = document.querySelector('#playVideo');
    const urlInput = document.querySelector('#videoUrl');
    if (playButton && urlInput) {
      const freshPlayButton = playButton.cloneNode(true);
      playButton.replaceWith(freshPlayButton);
      freshPlayButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        playYouTubeUrl(urlInput.value);
      }, true);
    }

    results.innerHTML = '<div class="jom-status">OPEN VIDEO NETWORK · PEERTUBE + INVIDIOUS</div>';
    setStatus('READY · OPEN VIDEO');
    return true;
  }

  const boot = () => {
    let tries = 0;
    const timer = setInterval(() => {
      if (mount() || ++tries > 240) clearInterval(timer);
    }, 50);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
