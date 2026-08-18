(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_PROVIDER_AGNOSTIC_V2__) return;
  window.__JARVIS_MEDIA_PROVIDER_AGNOSTIC_V2__ = true;

  const PROVIDERS = [
    { name: 'Piped', url: 'https://pipedapi.kavin.rocks/search' },
    { name: 'Piped', url: 'https://pipedapi.tokhmi.xyz/search' },
    { name: 'Piped', url: 'https://pipedapi.adminforge.de/search' },
    { name: 'Piped', url: 'https://pipedapi.rivo.lol/search' },
    { name: 'Invidious', url: 'https://inv.nadeko.net/api/v1/search' },
    { name: 'Invidious', url: 'https://yewtu.be/api/v1/search' },
  ];
  const YOUTUBE_SEARCH = q => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const idFrom = raw => {
    const value = String(raw || '').trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
    try {
      const u = new URL(value);
      if (u.hostname === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || null;
      if (u.hostname.endsWith('youtube.com')) return u.searchParams.get('v') || null;
    } catch {}
    return null;
  };
  const timeoutFetch = async (url, ms = 6500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`${response.status}`);
      return await response.json();
    } finally { clearTimeout(timer); }
  };
  const normalize = (raw, provider) => {
    const id = idFrom(raw?.url || raw?.videoId || raw?.id);
    if (!id) return null;
    return {
      id,
      title: String(raw?.title || 'Untitled video'),
      channel: String(raw?.uploader || raw?.author || raw?.channelTitle || raw?.authorId || provider),
      thumb: String(raw?.thumbnail || raw?.thumbnailUrl || raw?.videoThumbnails?.at?.(-1)?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`),
      provider,
    };
  };
  const unique = items => [...new Map(items.map(item => [item.id, item])).values()];

  function style() {
    if (document.getElementById('jarvisYouTubeV2Style')) return;
    const s = document.createElement('style'); s.id = 'jarvisYouTubeV2Style';
    s.textContent = `
      .jyt-keybar{display:flex;gap:8px;align-items:center;margin:10px 0;padding:9px;border:1px solid #173545;border-radius:12px;background:rgba(3,11,17,.7)}
      .jyt-keybar input{flex:1;min-width:0;background:#02070b;color:#d9f7ff;border:1px solid #173545;border-radius:8px;padding:8px}
      .jyt-card{display:grid;grid-template-columns:150px 1fr 32px;gap:12px;align-items:center;width:100%;padding:0;overflow:hidden;text-align:left;border:1px solid #173545;border-radius:14px;background:rgba(3,11,17,.92);color:#d9f7ff;cursor:pointer;margin-bottom:8px}
      .jyt-card:hover{border-color:#49cfff}.jyt-thumb{width:150px;aspect-ratio:16/9;object-fit:cover;background:#020509}.jyt-info{min-width:0;padding:10px 0}.jyt-info strong{display:block;font-size:.88rem;line-height:1.25}.jyt-info small{display:block;color:#7896a3;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jyt-play{color:#5edcff;margin-right:10px}
      #jarvisPlayer.jyt-player iframe{display:block;width:100%;height:min(62vh,560px);border:0;background:#000}.jyt-message{padding:14px;border:1px solid #173545;border-radius:12px;color:#9ab5bf}.jyt-message strong{display:block;color:#d9f7ff;margin-bottom:6px}.jyt-message a,.jyt-message button{margin-top:10px}
      .jyt-live-link{display:inline-block;padding:9px 12px;border:1px solid #28586b;border-radius:8px;color:#d9f7ff;text-decoration:none}
      @media(max-width:700px){.jyt-card{grid-template-columns:108px 1fr 28px}.jyt-thumb{width:108px}}
    `; document.head.appendChild(s);
  }

  function mount() {
    const input = document.querySelector('#videoQuery');
    const results = document.querySelector('#videoResults');
    const player = document.querySelector('#jarvisPlayer');
    const state = document.querySelector('#mediaState');
    const searchButton = document.querySelector('#videoSearch');
    if (!input || !results || !player || !state || !searchButton) return false;
    if (input.dataset.jytMounted === '1') return true;
    input.dataset.jytMounted = '1'; style(); player.classList.add('jyt-player');

    const setStatus = text => { state.textContent = text; };
    const liveSearch = q => YOUTUBE_SEARCH(q);
    const embed = (id, title) => {
      player.innerHTML = `<iframe title="${esc(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0"></iframe>`;
      setStatus('PLAYING · YOUTUBE EMBED');
    };
    const render = items => {
      results.innerHTML = items.map(item => `<button type="button" class="jyt-card video-result" data-video-id="${esc(item.id)}"><img class="jyt-thumb" loading="lazy" src="${esc(item.thumb)}" alt=""><span class="jyt-info"><strong>${esc(item.title)}</strong><small>${esc(item.channel)} · ${esc(item.provider)}</small></span><b class="jyt-play">▶</b></button>`).join('');
      results.querySelectorAll('.jyt-card').forEach(card => card.addEventListener('click', () => { const item=items.find(x=>x.id===card.dataset.videoId); if(item) embed(item.id,item.title); }));
      setStatus(`RESULTS · ${items.length} · LIVE`);
    };
    const degraded = q => {
      const url = liveSearch(q);
      results.innerHTML = `<div class="jyt-message"><strong>VIDEO SEARCH DEGRADED</strong><small>Live video indexes are unavailable right now. JARVIS will not invent or recycle a result.</small><br><a class="jyt-live-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">OPEN LIVE YOUTUBE SEARCH ↗</a></div>`;
      setStatus('DEGRADED · LIVE VIDEO INDEX');
    };

    async function search() {
      const q = input.value.trim(); if (!q) return;
      setStatus(`SEARCHING · ${q}`); results.innerHTML='<div class="jyt-message">SEARCHING LIVE VIDEO SOURCES…</div>';
      const attempts = PROVIDERS.map(async provider => {
        const endpoint = `${provider.url}?q=${encodeURIComponent(q)}&filter=videos&region=IN&sort_by=relevance`;
        const data = await timeoutFetch(endpoint);
        const raw = Array.isArray(data) ? data : (data?.items || data?.videos || []);
        return raw.map(item => normalize(item, provider.name)).filter(Boolean);
      });
      const settled = await Promise.allSettled(attempts);
      const items = unique(settled.flatMap(x => x.status === 'fulfilled' ? x.value : []));
      if (items.length) render(items.slice(0, 12)); else degraded(q);
    }

    const fresh = searchButton.cloneNode(true); searchButton.replaceWith(fresh);
    fresh.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); void search(); }, true);
    input.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); e.stopImmediatePropagation(); void search(); } }, true);

    const playButton = document.querySelector('#playVideo');
    if (playButton) {
      const freshPlay = playButton.cloneNode(true); playButton.replaceWith(freshPlay);
      freshPlay.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); const id=idFrom(document.querySelector('#videoUrl')?.value); if(id) embed(id,'YouTube video'); else setStatus('READY · PASTE A YOUTUBE URL OR VIDEO ID'); }, true);
    }

    window.jarvisVideoSearch = search;
    window.jarvisVideoSearchUrl = liveSearch;
    window.jarvisVideoPlay = embed;
    results.innerHTML='<div class="jyt-message"><strong>LIVE VIDEO SEARCH</strong><small>Search across live indexes. If they are unavailable, JARVIS opens the authoritative YouTube search instead of fabricating results.</small></div>';
    setStatus('READY · LIVE VIDEO');
    return true;
  }
  const boot = () => { let tries=0; const t=setInterval(()=>{ if(mount() || ++tries>200) clearInterval(t); },50); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
