(() => {
  'use strict';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const workspace = () => document.querySelector('.workspace');
  const newsButtonId = 'jarvisNewsNav';
  const PIPED = [
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://pipedapi.reallyaweso.me',
    'https://pipedapi.drgns.space'
  ];

  function youtubeId(raw) {
    const value = String(raw || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
    try {
      const u = new URL(value);
      const host = u.hostname.toLowerCase();
      if (host === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || null;
      if (host.endsWith('youtube.com')) {
        const v = u.searchParams.get('v');
        if (v) return v;
        const p = u.pathname.split('/').filter(Boolean);
        const i = p.findIndex(x => ['shorts','embed','live'].includes(x));
        return i >= 0 ? p[i + 1] || null : null;
      }
    } catch {}
    return null;
  }

  function ensureStyle() {
    if (document.querySelector('#jarvisMediaNewsStyle')) return;
    const s = document.createElement('style');
    s.id = 'jarvisMediaNewsStyle';
    s.textContent = `
      #${newsButtonId}{cursor:pointer}
      .jarvis-news-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
      .jarvis-news-tabs button,.jarvis-video-results button{border:1px solid #2a5268;background:#07131b;color:#bdeeff;border-radius:12px;padding:10px 14px;font-weight:700;cursor:pointer}
      .jarvis-news-tabs button.active{background:#39c9f5;color:#031018}
      .jarvis-news-grid,.jarvis-video-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;margin-top:14px}
      .jarvis-news-card,.jarvis-video-card{border:1px solid #173545;background:rgba(3,11,17,.86);border-radius:16px;padding:15px;box-shadow:0 8px 28px rgba(0,0,0,.18)}
      .jarvis-news-card h3,.jarvis-video-card h3{margin:0 0 8px;font-size:1rem;line-height:1.3}
      .jarvis-news-card h3 a{color:#d9f7ff;text-decoration:none}
      .jarvis-news-card p,.jarvis-video-card p{color:#8ca9b5;margin:6px 0;line-height:1.45}
      .jarvis-meta{font-size:.72rem;color:#5e8392;margin-top:10px}
      .jarvis-news-search{display:flex;gap:8px;margin:12px 0}.jarvis-news-search input{flex:1}
      .jarvis-status{padding:12px;border:1px solid #173545;border-radius:12px;color:#9ec3cf}
      .jarvis-video-card{padding:0;overflow:hidden}.jarvis-video-card img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#020509}
      .jarvis-video-card .video-info{padding:12px}.jarvis-video-card button{width:100%;text-align:left;border:0;border-radius:0;border-top:1px solid #173545}
      #jarvisInhousePlayer{margin-top:14px;border:1px solid #20495c;border-radius:18px;overflow:hidden;background:#000;min-height:220px}
      #jarvisInhousePlayer video{display:block;width:100%;max-height:62vh;background:#000}
      #jarvisInhousePlayer iframe{display:block;width:100%;height:min(62vh,520px);border:0;background:#000}
      .jarvis-player-title{padding:12px 14px;color:#d9f7ff;font-weight:700;background:#061018}
      @media(max-width:700px){.jarvis-news-grid,.jarvis-video-results{grid-template-columns:1fr}.jarvis-news-search{flex-direction:column}}
    `;
    document.head.appendChild(s);
  }

  function cleanWebProviders() {
    document.querySelectorAll('[data-provider="brave"],[data-provider="google"],[data-provider="duck"]').forEach(x => x.remove());
    const select = document.querySelector('#searchEngine');
    if (select) {
      [...select.options].forEach(o => { if (o.value !== 'bing') o.remove(); });
      select.value = 'bing';
    }
  }

  async function requestJson(path) {
    let last;
    for (const base of PIPED) {
      try {
        const r = await fetch(base + path, { cache: 'no-store' });
        if (!r.ok) throw new Error(`${r.status}`);
        const data = await r.json();
        return { data, base };
      } catch (e) { last = e; }
    }
    throw last || new Error('Video service unavailable');
  }

  function playerHtml(title = '') {
    const w = workspace();
    if (!w) return null;
    let p = document.querySelector('#jarvisInhousePlayer');
    if (!p) {
      p = document.createElement('div');
      p.id = 'jarvisInhousePlayer';
      const card = w.querySelector('.search-card') || w;
      card.appendChild(p);
    }
    if (title) p.innerHTML = `<div class="jarvis-player-title">${esc(title)}</div><div id="jarvisPlayerSurface"></div>`;
    return p.querySelector('#jarvisPlayerSurface') || p;
  }

  async function playYoutube(raw, title = 'JARVIS Player') {
    const id = youtubeId(raw);
    const surface = playerHtml(title);
    if (!surface) return;
    if (!id) {
      surface.innerHTML = '<div class="jarvis-status">That is not a recognised YouTube URL. Use youtube.com/watch, youtu.be, Shorts, Live, or an 11-character video ID.</div>';
      return;
    }

    surface.innerHTML = '<div class="jarvis-status">Connecting to the in-house video stream…</div>';
    try {
      const { data } = await requestJson(`/streams/${encodeURIComponent(id)}`);
      const streams = (data.videoStreams || []).filter(x => x.videoOnly === false || !x.videoOnly).sort((a,b) => (b.height || 0) - (a.height || 0));
      const stream = streams.find(x => /video\/mp4/i.test(x.mimeType || '')) || streams[0];
      if (!stream?.url) throw new Error('No playable stream returned');
      surface.innerHTML = `<video controls playsinline preload="metadata" poster="${esc(data.thumbnailUrl || '')}" src="${esc(stream.url)}"></video>`;
      const v = surface.querySelector('video');
      v.addEventListener('error', () => {
        surface.innerHTML = `<div class="jarvis-status">The video source rejected browser playback. JARVIS found the video, but this particular stream cannot be played in this browser. <button id="jarvisYoutubeFallback">Use YouTube embed</button></div>`;
        surface.querySelector('#jarvisYoutubeFallback').onclick = () => {
          surface.innerHTML = `<iframe title="${esc(title)}" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`;
        };
      }, {once:true});
    } catch (e) {
      surface.innerHTML = `<div class="jarvis-status">JARVIS could not obtain an in-house stream right now. The video ID was recognised. <button id="jarvisYoutubeFallback">Try YouTube player</button></div>`;
      surface.querySelector('#jarvisYoutubeFallback').onclick = () => {
        surface.innerHTML = `<iframe title="${esc(title)}" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`;
      };
    }
  }

  async function searchVideos(query) {
    const q = String(query || '').trim();
    const results = document.querySelector('#jarvisVideoResults');
    const status = document.querySelector('#jarvisVideoStatus');
    if (!results || !q) return;
    status.textContent = 'Searching video index…';
    results.innerHTML = '';
    try {
      const { data } = await requestJson(`/search?q=${encodeURIComponent(q)}&filter=videos&region=IN`);
      const items = Array.isArray(data) ? data : (data.items || []);
      if (!items.length) throw new Error('No videos found');
      status.textContent = `${Math.min(items.length,18)} videos found`;
      results.innerHTML = items.slice(0,18).map((x,i) => {
        const id = youtubeId(x.url || x.videoId || '');
        const thumb = x.thumbnail || x.thumbnailUrl || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '');
        return `<article class="jarvis-video-card"><img src="${esc(thumb)}" alt=""><div class="video-info"><h3>${esc(x.title || 'Untitled video')}</h3><p>${esc(x.uploaderName || x.uploader || '')}</p><div class="jarvis-meta">${esc(x.duration || x.views || '')}</div></div>${id ? `<button data-jarvis-video-id="${esc(id)}">▶ PLAY IN JARVIS</button>` : ''}</article>`;
      }).join('');
      results.querySelectorAll('[data-jarvis-video-id]').forEach(b => b.onclick = () => {
        const id = b.dataset.jarvisVideoId;
        const card = b.closest('.jarvis-video-card');
        playYoutube(id, card?.querySelector('h3')?.textContent || 'JARVIS Player');
      });
    } catch (e) {
      status.textContent = 'Video search service is unavailable right now. Direct YouTube links still work when a stream endpoint is reachable.';
    }
  }

  function renderMedia() {
    const w = workspace();
    if (!w || !document.querySelector('#videoUrl')) return;
    const card = w.querySelector('.search-card');
    if (!card) return;
    if (document.querySelector('#jarvisVideoSearchPanel')) return;
    const panel = document.createElement('section');
    panel.id = 'jarvisVideoSearchPanel';
    panel.innerHTML = `
      <div class="jarvis-news-search">
        <input id="jarvisVideoQuery" placeholder="Search YouTube videos inside JARVIS…">
        <button id="jarvisVideoSearch" class="primary">SEARCH & PLAY</button>
      </div>
      <div id="jarvisVideoStatus" class="jarvis-status">Search results stay inside JARVIS.</div>
      <div id="jarvisVideoResults" class="jarvis-video-results"></div>`;
    card.insertBefore(panel, card.querySelector('#videoUrl')?.closest('.request-row') || card.firstChild);

    const searchBtn = panel.querySelector('#jarvisVideoSearch');
    const input = panel.querySelector('#jarvisVideoQuery');
    searchBtn.onclick = () => searchVideos(input.value);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') searchVideos(input.value); });

    const legacy = document.querySelector('#playVideo');
    if (legacy && !legacy.dataset.jarvisFix2) {
      legacy.dataset.jarvisFix2 = '1';
      legacy.onclick = () => playYoutube(document.querySelector('#videoUrl')?.value, 'JARVIS Player');
    }
  }

  function renderNews(category = 'india', query = '') {
    const w = workspace();
    if (!w) return;
    const feeds = {
      india: 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en',
      odisha: 'https://news.google.com/rss/search?q=Bhubaneswar%20Odisha&hl=en-IN&gl=IN&ceid=IN:en',
      world: 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
      tech: 'https://news.google.com/rss/search?q=technology%20AI&hl=en-US&gl=US&ceid=US:en'
    };
    w.innerHTML = `<div class="apphead"><div><p class="eyebrow">INTELLIGENCE / LIVE NEWS</p><h2>JARVIS News</h2><p class="sub">Local, India, world and technology headlines, inside the command shell.</p></div></div>
      <div class="jarvis-news-tabs"><button data-news-cat="india">INDIA</button><button data-news-cat="odisha">ODISHA / LOCAL</button><button data-news-cat="world">WORLD</button><button data-news-cat="tech">TECH & AI</button><button id="jarvisNewsRefresh">↻ REFRESH</button></div>
      <div class="jarvis-news-search"><input id="jarvisNewsQuery" placeholder="Search news…" value="${esc(query)}"><button id="jarvisNewsSearch" class="primary">SEARCH NEWS</button></div>
      <div id="jarvisNewsStatus" class="jarvis-status">Loading headlines…</div><div id="jarvisNewsGrid" class="jarvis-news-grid"></div>`;
    document.querySelectorAll('[data-news-cat]').forEach(b => { b.classList.toggle('active', b.dataset.newsCat === category); b.onclick = () => renderNews(b.dataset.newsCat); });
    document.querySelector('#jarvisNewsRefresh').onclick = () => renderNews(category);
    document.querySelector('#jarvisNewsSearch').onclick = () => { const q = document.querySelector('#jarvisNewsQuery').value.trim(); renderNews(category, q); };

    const feedUrl = query ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en` : feeds[category];
    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`, {cache:'no-store'})
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        const items = data.items || [];
        const status = document.querySelector('#jarvisNewsStatus');
        if (status) status.textContent = `${items.length} stories available`;
        const grid = document.querySelector('#jarvisNewsGrid');
        if (grid) grid.innerHTML = items.slice(0,18).map(x => `<article class="jarvis-news-card"><h3><a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a></h3><p>${esc(String(x.description || '').replace(/<[^>]+>/g,'').slice(0,200))}</p><div class="jarvis-meta">${esc(x.author || 'News')} · ${esc(x.pubDate || '')}</div></article>`).join('') || '<div class="jarvis-status">No stories found.</div>';
      })
      .catch(() => { const s = document.querySelector('#jarvisNewsStatus'); if (s) s.textContent = 'News feed is temporarily unavailable. Try Refresh in a moment.'; });
  }

  function ensureNewsButton() {
    const aside = document.querySelector('aside');
    if (!aside || aside.querySelector(`#${newsButtonId}`)) return;
    const b = document.createElement('button');
    b.id = newsButtonId;
    b.className = 'nav';
    b.dataset.app = 'jarvis-news';
    b.title = 'News';
    b.innerHTML = '<b>▤</b><span>News</span>';
    b.onclick = e => { e.preventDefault(); e.stopPropagation(); renderNews(); };
    aside.appendChild(b);
  }

  function interceptTypedNews() {
    document.addEventListener('submit', e => {
      const form = e.target.closest?.('#commandForm');
      if (!form) return;
      const input = form.querySelector('#commandInput');
      const q = input?.value?.trim() || '';
      if (/\b(open|show|read|give me|latest)?\s*(the\s+)?news\b/i.test(q)) {
        e.preventDefault(); e.stopImmediatePropagation();
        renderNews('india', q.replace(/\b(open|show|read|give me|latest)?\s*(the\s+)?news\b/i,'').trim());
      }
    }, true);
  }

  window.addEventListener('jarvis:news', e => {
    const q = e.detail?.query || '';
    renderNews('india', q.replace(/\b(open|show|read|give me|latest)?\s*(the\s+)?news\b/i,'').trim());
  });

  function interceptMediaClicks() {
    document.addEventListener('click', e => {
      const videoBtn = e.target.closest?.('#playVideo');
      if (videoBtn) {
        e.preventDefault(); e.stopImmediatePropagation();
        playYoutube(document.querySelector('#videoUrl')?.value, 'JARVIS Player');
      }
    }, true);
  }

  function bootPatch() {
    ensureStyle();
    ensureNewsButton();
    cleanWebProviders();
    renderMedia();
  }

  const observer = new MutationObserver(bootPatch);
  observer.observe(document.documentElement, {childList:true, subtree:true});
  interceptTypedNews();
  interceptMediaClicks();
  bootPatch();
})();
