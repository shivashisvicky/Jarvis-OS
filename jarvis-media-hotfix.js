(() => {
  'use strict';

  const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const extractYouTubeId = (value) => {
    try {
      const url = new URL(String(value).trim());
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null;
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (url.pathname === '/watch') return url.searchParams.get('v');
        const parts = url.pathname.split('/').filter(Boolean);
        if (['shorts','embed','live'].includes(parts[0])) return parts[1] || null;
      }
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(value).trim()) ? String(value).trim() : null;
  };

  window.jarvisCinematicSpeak = window.jarvisCinematicSpeak || ((text, options = {}) => {
    if (!('speechSynthesis' in window) || !text) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.rate = Number(options.rate ?? .84); u.pitch = Number(options.pitch ?? .54); u.volume = Number(options.volume ?? .96);
      const v = speechSynthesis.getVoices().find(x => x.name === options.voiceName); if (v) u.voice = v;
      speechSynthesis.speak(u); return true;
    } catch { return false; }
  });

  const originalFetch = window.fetch.bind(window);
  const pending = new Map();
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (init?.method && init.method !== 'GET') return originalFetch(input, init);
    if (!/api\.gdeltproject\.org/i.test(url)) return originalFetch(input, init);
    if (pending.has(url)) return pending.get(url).then(r => r.clone());
    const p = originalFetch(input, init).finally(() => setTimeout(() => pending.delete(url), 8000));
    pending.set(url, p); return p.then(r => r.clone());
  };

  const playId = (id) => {
    const player = document.querySelector('#jarvisPlayer'); if (!player) return;
    const safe = String(id).replace(/[^A-Za-z0-9_-]/g, ''); if (!safe) return;
    player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${safe}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="JARVIS YouTube player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="eager"></iframe>`;
    player.dataset.videoId = safe;
  };

  const youtubeSearch = async (query) => {
    const results = document.querySelector('#videoResults'); const state = document.querySelector('#mediaState');
    if (!results || !state) return;
    const key = window.JARVIS_YOUTUBE_API_KEY;
    state.textContent = 'SEARCHING'; results.innerHTML = '<div class="empty">SEARCHING YOUTUBE…</div>';
    try {
      if (!key) throw new Error('YouTube API key is not available');
      const u = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(query)}&key=${encodeURIComponent(key)}`;
      const r = await originalFetch(u); if (!r.ok) throw new Error(`YouTube API ${r.status}`);
      const d = await r.json(); const items = (d.items || []).filter(x => x?.id?.videoId);
      if (!items.length) throw new Error('No YouTube results');
      results.innerHTML = items.map(x => {
        const id = x.id.videoId, title = x.snippet?.title || 'YouTube video', thumb = x.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
        return `<button class="jvc-card video-result" data-jvc-id="${esc(id)}"><span class="video-thumb"><img src="${esc(thumb)}" alt=""></span><span class="video-result-copy"><strong>${esc(title)}</strong><small>YouTube · ${esc(x.snippet?.channelTitle || '')}</small></span><span class="video-play">▶</span></button>`;
      }).join('');
      results.querySelectorAll('[data-jvc-id]').forEach(b => b.addEventListener('click', () => playId(b.dataset.jvcId), { once: true }));
      state.textContent = `${items.length} RESULTS`;
    } catch (e) {
      state.textContent = 'DEGRADED';
      results.innerHTML = `<div class="video-context"><strong>${esc(query)}</strong><p>Live YouTube search is temporarily unavailable.</p><button class="secondary" id="videoExternalFallback">OPEN YOUTUBE SEARCH</button></div>`;
      document.querySelector('#videoExternalFallback')?.addEventListener('click', () => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer'));
    }
  };

  const bindMedia = () => {
    const button = document.querySelector('#videoSearch'); const input = document.querySelector('#videoQuery');
    if (!button || !input || button.dataset.jarvisHotfixBound === '1') return;
    button.dataset.jarvisHotfixBound = '1';
    button.addEventListener('click', event => {
      const value = input.value.trim(); const id = extractYouTubeId(value);
      if (id) { event.preventDefault(); event.stopImmediatePropagation(); playId(id); return; }
      if (value) { event.preventDefault(); event.stopImmediatePropagation(); void youtubeSearch(value); }
    }, true);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); button.click(); } });
  };

  const renderWebResults = (query, text, links = []) => {
    const box = document.querySelector('#jwsResults'); const status = document.querySelector('#jwsStatus');
    if (!box || !status) return;
    status.textContent = text;
    box.innerHTML = links.length ? links.map(x => `<a class="jws-card" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(x.title)}</strong><small>${esc(x.url)}</small></a>`).join('') : `<div class="empty">No live results returned for “${esc(query)}”.</div>`;
  };
  const doWebSearch = async (query) => {
    const q = query.trim(); if (!q) return;
    const box = document.querySelector('#jwsResults'); const status = document.querySelector('#jwsStatus'); if (!box || !status) return;
    status.textContent = 'SEARCHING'; box.innerHTML = '<div class="empty">JARVIS IS SEARCHING THE WEB…</div>';
    try {
      const proxy = `https://r.jina.ai/http://www.google.com/search?q=${encodeURIComponent(q)}`;
      const r = await originalFetch(proxy); if (!r.ok) throw new Error('Search proxy unavailable');
      const md = await r.text(); const links = []; const seen = new Set();
      const re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g; let m;
      while ((m = re.exec(md)) && links.length < 8) { if (!seen.has(m[2]) && !/google\.com\/search/i.test(m[2])) { seen.add(m[2]); links.push({title:m[1].replace(/\s+/g,' ').trim(), url:m[2]}); } }
      renderWebResults(q, links.length ? 'RESULTS' : 'NO RESULTS', links);
    } catch { renderWebResults(q, 'DEGRADED', []); }
  };
  const bindWeb = () => {
    const input = document.querySelector('#webQuery'); const button = document.querySelector('#webSearch');
    if (!input || !button || button.dataset.jarvisWebHotfix === '1') return;
    button.dataset.jarvisWebHotfix = '1';
    const wrap = document.querySelector('.search-workspace');
    if (wrap && !document.querySelector('#jwsStatus')) wrap.insertAdjacentHTML('beforeend', '<div id="jwsStatus" class="media-keyword-status">READY</div><div id="jwsResults" class="video-results"></div>');
    button.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); void doWebSearch(input.value); }, true);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); button.click(); } });
  };

  const bindHome = () => {
    const form = document.querySelector('#commandForm'); const input = document.querySelector('#commandInput');
    if (!form || !input || form.dataset.jarvisCommandHotfix === '1') return;
    form.dataset.jarvisCommandHotfix = '1';
    form.addEventListener('submit', async e => {
      const q = input.value.trim().toLowerCase(); if (!q) return;
      if (!/(time|prime minister|weather).*/i.test(q)) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const reply = document.querySelector('#jarvisReply'); if (!reply) return;
      let text = '';
      if (/\btime\b|\bclock\b/.test(q)) text = `The local time is ${new Intl.DateTimeFormat([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}).format(new Date())}.`;
      else if (/prime minister.*india|india.*prime minister/.test(q)) text = 'The Prime Minister of India is Narendra Modi.';
      else if (/weather/.test(q)) {
        try {
          const pos = await new Promise((resolve, reject) => navigator.geolocation?.getCurrentPosition(resolve, reject, {timeout:5000}) || reject());
          const {latitude, longitude} = pos.coords;
          const r = await originalFetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`);
          const d = await r.json(); text = `Current weather is ${Math.round(d.current.temperature_2m)}°C, feels like ${Math.round(d.current.apparent_temperature)}°C, wind ${Math.round(d.current.wind_speed_10m)} km/h.`;
        } catch { text = 'I need location permission to get weather around you.'; }
      }
      reply.textContent = text; reply.classList.add('visible'); window.jarvisCinematicSpeak?.(text);
    }, true);
  };

  const bind = () => { bindMedia(); bindWeb(); bindHome(); };
  new MutationObserver(bind).observe(document.documentElement, {childList:true, subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true}); else bind();
})();