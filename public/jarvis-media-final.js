(() => {
  'use strict';

  const STATIC_INVIDIOUS = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://yt.chocolatemoo53.com',
    'https://invidious.tiekoetter.com',
  ];
  const STATIC_PIPED = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.leptons.xyz',
    'https://pipedapi.adminforge.de',
    'https://api.piped.yt',
    'https://pipedapi.tokhmi.xyz',
    'https://pipedapi.moomoo.me',
    'https://pipedapi.syncpundit.io',
    'https://api-piped.mha.fi',
  ];
  const INSTANCE_TTL = 15 * 60 * 1000;
  const REQUEST_TIMEOUT = 6500;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const findId = v => String(v?.videoId || String(v?.url || '').match(/[?&]v=([^&]+)/)?.[1] || '');
  const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
  const json = async url => {
    const r = await Promise.race([
      fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store', mode: 'cors' }),
      timeout(REQUEST_TIMEOUT),
    ]);
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
  };
  const normalize = items => (Array.isArray(items) ? items : []).map(v => ({
    id: findId(v),
    title: v.title || 'Untitled video',
    author: v.author || v.uploader || v.uploaderName || 'Unknown channel',
    views: Number(v.viewCount ?? v.views ?? 0),
    published: v.publishedText || v.uploadedDate || '',
    thumb: v.videoThumbnails?.find(x => x.quality === 'medium')?.url || v.videoThumbnails?.[0]?.url || v.thumbnail || '',
  })).filter(v => v.id);

  async function discoverInvidious() {
    try {
      const raw = await json('https://api.invidious.io/instances.json');
      const dynamic = Object.entries(raw || {})
        .filter(([, meta]) => meta && meta[1]?.api && meta[1]?.type === 'https')
        .map(([host]) => `https://${host}`);
      return [...new Set([...STATIC_INVIDIOUS, ...dynamic])].slice(0, 20);
    } catch {
      return STATIC_INVIDIOUS;
    }
  }

  async function searchInvidious(base, q) {
    const d = await json(`${base}/api/v1/search?q=${encodeURIComponent(q)}&type=video&page=1`);
    return normalize(d.filter?.(v => v.type === 'video' || v.videoId) || d);
  }

  async function searchPiped(base, q) {
    const d = await json(`${base}/search?q=${encodeURIComponent(q)}&filter=videos`);
    return normalize(Array.isArray(d) ? d : d.items);
  }

  async function firstSuccessful(tasks) {
    return new Promise(resolve => {
      let remaining = tasks.length;
      if (!remaining) return resolve([]);
      let settled = false;
      tasks.forEach(task => Promise.resolve().then(task).then(items => {
        if (!settled && items?.length) {
          settled = true;
          resolve(items);
        } else if (--remaining === 0 && !settled) resolve([]);
      }).catch(() => {
        if (--remaining === 0 && !settled) resolve([]);
      }));
    });
  }

  async function search(q) {
    const invidious = await discoverInvidious();
    const tasks = [
      ...invidious.map(base => () => searchInvidious(base, q)),
      ...STATIC_PIPED.map(base => () => searchPiped(base, q)),
    ];
    return firstSuccessful(tasks);
  }

  function youtubeUrl(q) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  }
  function bingUrl(q) {
    return `https://www.bing.com/videos/search?q=${encodeURIComponent(q)}`;
  }

  function install() {
    const input = document.querySelector('#videoQuery');
    const button = document.querySelector('#videoSearch');
    const results = document.querySelector('#videoResults');
    const player = document.querySelector('#jarvisPlayer');
    if (!input || !button || !results || !player || button.dataset.finalMedia === '2') return;
    button.dataset.finalMedia = '2';

    let status = document.querySelector('#jvcStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'jvcStatus';
      status.className = 'jvc-status';
      results.parentElement.insertBefore(status, results);
    }
    const set = s => {
      status.textContent = s;
      const ms = document.querySelector('#mediaState');
      if (ms) ms.textContent = s.split('·')[0].trim();
    };
    const play = id => {
      player.innerHTML = `<iframe title="JARVIS video player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1"></iframe>`;
      set('PLAYING · JARVIS PLAYER');
    };
    const render = items => {
      results.innerHTML = items.slice(0, 8).map(v => `<button class="jvc-card" data-id="${esc(v.id)}"><img src="${esc(v.thumb)}" alt=""><span class="video-meta"><strong>${esc(v.title)}</strong><small>${esc(v.author)}${v.views ? ' · ' + v.views.toLocaleString() + ' views' : ''}</small><small>${esc(v.published)}</small></span><b>▶</b></button>`).join('');
      results.querySelectorAll('.jvc-card').forEach(b => b.addEventListener('click', () => play(b.dataset.id)));
    };
    const liveFallback = q => {
      results.innerHTML = `<div class="video-context jvc-live-fallback"><strong>LIVE SEARCH READY · CHOOSE A SEARCH ENGINE</strong><p>Public video indexes are temporarily unavailable. JARVIS keeps the search inside this workspace and opens the selected provider in a new tab.</p><div class="jvc-provider-actions"><button id="jvcYoutube" type="button">YOUTUBE SEARCH</button><button id="jvcBing" type="button">BING VIDEO SEARCH</button></div></div>`;
      results.querySelector('#jvcYoutube').onclick = () => window.open(youtubeUrl(q), '_blank', 'noopener,noreferrer');
      results.querySelector('#jvcBing').onclick = () => window.open(bingUrl(q), '_blank', 'noopener,noreferrer');
      set('LIVE SEARCH READY · CHOOSE A SEARCH ENGINE');
    };
    const run = async () => {
      const q = input.value.trim();
      if (!q) { set('READY · ENTER A VIDEO SEARCH TERM'); return; }
      set('SEARCHING · JARVIS VIDEO SOURCES');
      results.innerHTML = '<div class="empty">JARVIS is searching multiple video sources…</div>';
      const items = await search(q);
      if (items.length) {
        render(items);
        set(`RESULTS · ${items.length} · JARVIS`);
      } else {
        liveFallback(q);
      }
    };

    const fresh = button.cloneNode(true);
    button.replaceWith(fresh);
    fresh.dataset.finalMedia = '2';
    fresh.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); void run(); }, true);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); void run(); }
    }, true);
    document.querySelectorAll('[data-video-provider]').forEach(x => {
      const b = x.cloneNode(true);
      x.replaceWith(b);
      b.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (b.dataset.videoProvider === 'trending') input.value = 'trending videos India';
        void run();
      }, true);
    });
    set('READY · MULTI-SOURCE VIDEO SEARCH');
  }

  const observer = new MutationObserver(() => install());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  install();
})();
