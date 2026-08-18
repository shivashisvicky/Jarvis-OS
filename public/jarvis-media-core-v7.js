(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_YOUTUBE_API_V1__) return;
  window.__JARVIS_MEDIA_YOUTUBE_API_V1__ = true;

  const KEY_NAME = 'jarvis.youtubeApiKey';
  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '\"':'&quot;', "'":'&#39;' }[c]));
  const getKey = () => localStorage.getItem(KEY_NAME) || '';
  const setKey = value => localStorage.setItem(KEY_NAME, String(value || '').trim());
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

  async function api(path, params) {
    const key = getKey();
    if (!key) throw new Error('YOUTUBE_API_KEY_MISSING');
    const q = new URLSearchParams({ ...params, key });
    const r = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${q}`, { cache:'no-store' });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || data.error) throw new Error(data?.error?.message || `YouTube API ${r.status}`);
    return data;
  }

  function style() {
    if (document.getElementById('jarvisYouTubeV1Style')) return;
    const s = document.createElement('style'); s.id = 'jarvisYouTubeV1Style';
    s.textContent = `
      .jyt-keybar{display:flex;gap:8px;align-items:center;margin:10px 0;padding:9px;border:1px solid #173545;border-radius:12px;background:rgba(3,11,17,.7)}
      .jyt-keybar input{flex:1;min-width:0;background:#02070b;color:#d9f7ff;border:1px solid #173545;border-radius:8px;padding:8px}
      .jyt-keybar button{padding:8px 12px}.jyt-card{display:grid;grid-template-columns:150px 1fr 32px;gap:12px;align-items:center;width:100%;padding:0;overflow:hidden;text-align:left;border:1px solid #173545;border-radius:14px;background:rgba(3,11,17,.92);color:#d9f7ff;cursor:pointer;margin-bottom:8px}
      .jyt-card:hover{border-color:#49cfff}.jyt-thumb{width:150px;aspect-ratio:16/9;object-fit:cover;background:#020509}.jyt-info{min-width:0;padding:10px 0}.jyt-info strong{display:block;font-size:.88rem;line-height:1.25}.jyt-info small{display:block;color:#7896a3;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jyt-play{color:#5edcff;margin-right:10px}
      #jarvisPlayer.jyt-player iframe{display:block;width:100%;height:min(62vh,560px);border:0;background:#000}.jyt-message{padding:14px;border:1px solid #173545;border-radius:12px;color:#9ab5bf}.jyt-message strong{display:block;color:#d9f7ff;margin-bottom:6px}.jyt-message button{margin-top:10px}
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
    input.dataset.jytMounted = '1';
    style();
    player.classList.add('jyt-player');

    const oldKeybar = document.querySelector('.jyt-keybar'); oldKeybar?.remove();
    const keybar = document.createElement('div'); keybar.className='jyt-keybar';
    keybar.innerHTML = `<input id="jytApiKey" type="password" autocomplete="off" placeholder="YouTube Data API key (stored locally)"><button type="button" class="secondary" id="jytSaveKey">SAVE KEY</button>`;
    searchButton.parentElement?.after(keybar);
    const keyInput = keybar.querySelector('#jytApiKey'); keyInput.value = getKey();
    keybar.querySelector('#jytSaveKey').addEventListener('click', () => { setKey(keyInput.value); state.textContent='API KEY SAVED'; });

    const setStatus = text => { state.textContent = text; };
    const embed = (id, title) => {
      player.innerHTML = `<iframe title="${esc(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&playsinline=1&rel=0"></iframe>`;
      setStatus('PLAYING · YOUTUBE EMBED');
    };
    const play = item => embed(item.id, item.title);

    const render = items => {
      results.innerHTML = items.map(item => `<button type="button" class="jyt-card" data-video-id="${esc(item.id)}"><img class="jyt-thumb" loading="lazy" src="${esc(item.thumb)}" alt=""><span class="jyt-info"><strong>${esc(item.title)}</strong><small>${esc(item.channel)}</small></span><b class="jyt-play">▶</b></button>`).join('');
      results.querySelectorAll('.jyt-card').forEach(card => card.addEventListener('click', () => { const item=items.find(x=>x.id===card.dataset.videoId); if(item) play(item); }));
      setStatus(`RESULTS · ${items.length} · YOUTUBE`);
    };

    const showKeyNeeded = () => {
      results.innerHTML = `<div class="jyt-message"><strong>YouTube search needs a Data API key.</strong><small>That is the same architecture used by the reference app: YouTube Data API for search, then the official YouTube embed for playback.</small><button type="button" class="secondary" id="jytFocusKey">FOCUS API KEY</button></div>`;
      results.querySelector('#jytFocusKey').onclick = () => keyInput.focus();
      setStatus('CONFIGURE · YOUTUBE API KEY');
    };

    const search = async () => {
      const q = input.value.trim(); if (!q) return;
      if (!getKey()) { showKeyNeeded(); return; }
      setStatus(`SEARCHING · ${q}`); results.innerHTML='<div class="jyt-message">SEARCHING YOUTUBE…</div>';
      try {
        const searchData = await api('search', { part:'snippet', q, type:'video', maxResults:'12', regionCode:'IN' });
        const ids = (searchData.items || []).map(x=>x.id?.videoId).filter(Boolean);
        if (!ids.length) throw new Error('No videos found');
        const detailData = await api('videos', { part:'snippet,status,contentDetails', id:ids.join(',') });
        const items = (detailData.items || []).filter(v => v.status?.embeddable !== false).map(v => ({ id:v.id, title:v.snippet?.title || 'Untitled video', channel:v.snippet?.channelTitle || 'YouTube', thumb:v.snippet?.thumbnails?.high?.url || v.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg` }));
        if (!items.length) throw new Error('No embeddable videos found');
        render(items);
      } catch (e) {
        results.innerHTML=`<div class="jyt-message"><strong>YOUTUBE SEARCH FAILED</strong><small>${esc(e instanceof Error ? e.message : 'Unknown YouTube error')}</small></div>`;
        setStatus('DEGRADED · YOUTUBE API');
      }
    };

    const fresh = searchButton.cloneNode(true); searchButton.replaceWith(fresh);
    fresh.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); void search(); }, true);
    input.addEventListener('keydown', e => { if(e.key==='Enter'){ e.preventDefault(); e.stopImmediatePropagation(); void search(); } }, true);

    const playButton = document.querySelector('#playVideo');
    if (playButton) {
      const freshPlay = playButton.cloneNode(true); playButton.replaceWith(freshPlay);
      freshPlay.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); const id=idFrom(document.querySelector('#videoUrl')?.value); if(id) embed(id,'YouTube video'); else setStatus('READY · PASTE A YOUTUBE URL OR VIDEO ID'); }, true);
    }
    input.value = input.value.trim();
    results.innerHTML='<div class="jyt-message"><strong>YOUTUBE VIDEO SEARCH</strong><small>Search YouTube, select a result, and play it here using the official embedded player.</small></div>';
    setStatus(getKey() ? 'READY · YOUTUBE' : 'CONFIGURE · API KEY');
    return true;
  }

  const boot = () => { let tries=0; const t=setInterval(()=>{ if(mount() || ++tries>200) clearInterval(t); },50); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
