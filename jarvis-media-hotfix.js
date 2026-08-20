(() => {
  'use strict';

  const originalFetch = window.fetch.bind(window);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const ytId = value => {
    try {
      const u = new URL(String(value).trim());
      const host = u.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (u.pathname === '/watch') return u.searchParams.get('v');
        const p = u.pathname.split('/').filter(Boolean);
        if (['shorts','embed','live'].includes(p[0])) return p[1] || null;
      }
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(value).trim()) ? String(value).trim() : null;
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const speak = (text, o = {}) => {
    if (!('speechSynthesis' in window) || !text) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.rate = Number(o.rate ?? .84);
      u.pitch = Number(o.pitch ?? .54);
      u.volume = Number(o.volume ?? .96);
      speechSynthesis.speak(u);
      return true;
    } catch { return false; }
  };
  window.jarvisCinematicSpeak = window.jarvisCinematicSpeak || speak;

  const currentVideoId = () => {
    const player = document.querySelector('#jarvisPlayer');
    const stored = player?.dataset.videoId;
    if (stored && /^[A-Za-z0-9_-]{11}$/.test(stored)) return stored;
    const cards = [...document.querySelectorAll('#videoResults [data-jvc-id]')];
    return cards[0]?.getAttribute('data-jvc-id') || null;
  };

  const openYouTube = id => {
    const safe = ytId(id);
    if (!safe) return false;
    const url = `https://www.youtube.com/watch?v=${safe}`;
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) window.location.assign(url);
    return true;
  };

  const play = id => {
    const safe = ytId(id);
    const player = document.querySelector('#jarvisPlayer');
    if (!player || !safe) return false;

    player.dataset.videoId = safe;

    // iOS Safari/WebKit does not reliably allow scripted autoplay inside a newly
    // created cross-origin YouTube iframe. A real user-initiated PLAY action is
    // therefore routed to YouTube itself on iOS, where playback is reliable.
    if (isIOS && /^(play|open)$/i.test(String(window.__JARVIS_LAST_MEDIA_ACTION__ || ''))) {
      return openYouTube(safe);
    }

    const origin = /^https?:$/.test(location.protocol) ? `&origin=${encodeURIComponent(location.origin)}` : '';
    player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${safe}?autoplay=1&rel=0&playsinline=1&controls=1&enablejsapi=1${origin}" title="JARVIS YouTube player" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen loading="eager"></iframe>`;
    return true;
  };

  const renderCards = (box, items) => {
    box.innerHTML = items.map(x => `<button class="jvc-card video-result" data-jvc-id="${esc(x.id)}"><span class="video-thumb"><img src="${esc(x.thumb || `https://i.ytimg.com/vi/${x.id}/mqdefault.jpg`)}" alt="" loading="lazy"></span><span class="video-result-copy"><strong>${esc(x.title)}</strong><small>YouTube · ${esc(x.channel || '')}</small></span><span class="video-play">▶</span></button>`).join('');
    box.querySelectorAll('[data-jvc-id]').forEach(b => b.addEventListener('click', () => {
      window.__JARVIS_LAST_MEDIA_ACTION__ = 'card';
      play(b.dataset.jvcId);
    }));
  };

  const searchYouTube = async q => {
    const box = document.querySelector('#videoResults');
    const state = document.querySelector('#mediaState');
    if (!box) return;
    if (state) state.textContent = 'SEARCHING';
    box.innerHTML = '<div class="empty">SEARCHING YOUTUBE…</div>';
    let items = [];
    try {
      const key = window.JARVIS_YOUTUBE_API_KEY;
      if (!key) throw new Error('YouTube API key unavailable');
      const r = await originalFetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=12&q=${encodeURIComponent(q)}&key=${encodeURIComponent(key)}`);
      if (!r.ok) throw new Error(`YouTube API ${r.status}`);
      const d = await r.json();
      items = (d.items || []).filter(x => x?.id?.videoId).map(x => ({
        id: x.id.videoId,
        title: x.snippet?.title || 'YouTube video',
        channel: x.snippet?.channelTitle,
        thumb: x.snippet?.thumbnails?.medium?.url
      }));
    } catch {
      try {
        const r = await originalFetch(`https://r.jina.ai/http://www.youtube.com/results?search_query=${encodeURIComponent(q)}`);
        const t = await r.text(), seen = new Set(), re = /watch\\?v=([A-Za-z0-9_-]{11})/g;
        let m;
        while ((m = re.exec(t)) && items.length < 12) {
          if (seen.has(m[1])) continue;
          seen.add(m[1]);
          items.push({id:m[1], title:`YouTube result for ${q}`, channel:'YouTube'});
        }
      } catch {}
    }
    if (items.length) {
      renderCards(box, items);
      if (state) state.textContent = `${items.length} RESULTS`;
    } else {
      if (state) state.textContent = 'DEGRADED';
      box.innerHTML = '<div class="video-context"><strong>LIVE SEARCH UNAVAILABLE</strong><p>Try again in a moment.</p></div>';
    }
  };

  const ensureWeb = () => {
    const input = document.querySelector('#webQuery'), btn = document.querySelector('#webSearch');
    if (!input || !btn) return null;
    let s = document.querySelector('#jwsStatus'), r = document.querySelector('#jwsResults');
    if (!s) { s = document.createElement('div'); s.id = 'jwsStatus'; s.textContent = 'READY'; btn.parentElement?.after(s); }
    if (!r) { r = document.createElement('div'); r.id = 'jwsResults'; r.className = 'video-results'; s.after(r); }
    return {input, btn, s, r};
  };

  const webSearch = async q => {
    const x = ensureWeb();
    if (!x) return;
    x.s.textContent = 'SEARCHING';
    x.r.innerHTML = '<div class="empty">JARVIS IS SEARCHING THE WEB…</div>';
    try {
      const r = await originalFetch(`https://r.jina.ai/http://www.google.com/search?q=${encodeURIComponent(q)}`);
      if (!r.ok) throw 0;
      const md = await r.text(), links = [], seen = new Set(), re = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
      let m;
      while ((m = re.exec(md)) && links.length < 8) {
        if (seen.has(m[2]) || /google\.com\/search/i.test(m[2])) continue;
        seen.add(m[2]);
        links.push({title:m[1].replace(/\s+/g,' ').trim(), url:m[2]});
      }
      x.s.textContent = links.length ? 'RESULTS' : 'NO RESULTS';
      x.r.innerHTML = links.map(a => `<a class="jws-card" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(a.title)}</strong><small>${esc(a.url)}</small></a>`).join('') || '<div class="empty">No live results.</div>';
    } catch {
      x.s.textContent = 'DEGRADED';
      x.r.innerHTML = '<div class="empty">Web search temporarily unavailable.</div>';
    }
  };

  const newsQuery = () => document.querySelector('#newsGenre')?.value || 'AI OR technology';

  const parseGdelt = data => (data?.articles || []).map(x => ({
    title: x.title || 'Untitled headline',
    url: x.url || x.urlmobile || '#',
    source: x.domain || x.sourcecountry || 'GDELT',
    image: x.socialimage || ''
  })).filter(x => x.title && x.url !== '#');

  const parseRss = xml => {
    const items = [...String(xml).matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 12);
    return items.map(m => {
      const z = m[1];
      const get = k => (z.match(new RegExp(`<${k}>([\\s\\S]*?)<\\/${k}>`, 'i')) || [,''])[1];
      return {
        title: get('title').replace(/<!\[CDATA\[|\]\]>/g, ''),
        url: get('link').replace(/<!\[CDATA\[|\]\]>/g, ''),
        source: get('source').replace(/<!\[CDATA\[|\]\]>/g, ''),
        image: ''
      };
    }).filter(x => x.title && x.url);
  };

  const renderNews = (cards, items) => {
    const safe = items.slice(0, 8);
    cards.innerHTML = safe.map(x => `<a class="news-card" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(x.title)}</strong><small>${esc(x.source)}</small></a>`).join('') || '<div class="empty">No live headlines for this category.</div>';
    const ticker = document.querySelector('#newsTicker');
    if (ticker && safe.length) ticker.innerHTML = safe.slice(0, 5).map(x => `<span>${esc(x.title)}</span>`).join('<b>•</b>');
  };

  const news = async () => {
    const cards = document.querySelector('#newsCards');
    if (!cards) return;
    const q = newsQuery();
    cards.dataset.jnews = '1';
    cards.innerHTML = '<div class="news-loading"><span></span><span></span><span></span></div>';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`(${q})`)}&mode=artlist&format=json&maxrecords=12&timespan=24h&sort=datedesc`;
      const r = await originalFetch(url, {signal: controller.signal, cache: 'no-store'});
      if (!r.ok) throw new Error(`GDELT ${r.status}`);
      const data = await r.json();
      const items = parseGdelt(data);
      if (!items.length) throw new Error('GDELT returned no articles');
      renderNews(cards, items);
      return;
    } catch {}
    finally { clearTimeout(timer); }

    // Secondary public RSS path. It is intentionally independent of the Jina
    // proxy, so a proxy outage cannot take the live news desk down.
    try {
      const r = await originalFetch(`https://r.jina.ai/http://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-IN&gl=IN&ceid=IN:en`, {cache:'no-store'});
      if (!r.ok) throw 0;
      const items = parseRss(await r.text());
      renderNews(cards, items);
    } catch {
      cards.innerHTML = '<div class="empty">Live news is temporarily unavailable. Refresh to retry.</div>';
    }
  };

  const home = () => {
    const f = document.querySelector('#commandForm'), i = document.querySelector('#commandInput');
    if (!f || !i || f.dataset.jh) return;
    f.dataset.jh = '1';
    f.addEventListener('submit', async e => {
      const q = i.value.trim().toLowerCase();
      if (!q || !/(time|prime minister|weather)/i.test(q)) return;
      e.preventDefault(); e.stopImmediatePropagation();
      const o = document.querySelector('#jarvisReply'); if (!o) return;
      let t = '';
      if (/\btime\b|\bclock\b/.test(q)) t = `The local time is ${new Intl.DateTimeFormat([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())}.`;
      else if (/prime minister.*india|india.*prime minister/.test(q)) t = 'The Prime Minister of India is Narendra Modi.';
      else try {
        const p = await new Promise((res,rej) => navigator.geolocation?.getCurrentPosition(res,rej,{timeout:5000}) || rej()), {latitude,longitude} = p.coords;
        const r = await originalFetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,wind_speed_10m&timezone=auto`);
        const d = await r.json();
        t = `Current weather is ${Math.round(d.current.temperature_2m)}°C, feels like ${Math.round(d.current.apparent_temperature)}°C, wind ${Math.round(d.current.wind_speed_10m)} km/h.`;
      } catch { t = 'I need location permission to get weather around you.'; }
      o.textContent = t; o.classList.add('visible'); speak(t);
    }, true);
  };

  const isMediaPlay = el => {
    if (!el) return false;
    if (el.id === 'mediaPlay') return true;
    if (el.tagName !== 'BUTTON') return false;
    const text = el.textContent?.trim().replace(/\s+/g, ' ').toUpperCase();
    return text === 'PLAY' && !!document.querySelector('#videoResults');
  };

  const bindNewsControls = () => {
    const cards = document.querySelector('#newsCards');
    if (cards && !cards.dataset.jnews) news();
  };

  if (!window.__jarvisGlobalBridgeV2) {
    window.__jarvisGlobalBridgeV2 = 1;

    document.addEventListener('click', e => {
      const el = e.target?.closest?.('#videoSearch,#webSearch,#refreshNews,#mediaPlay,button');
      if (!el) return;

      if (el.id === 'videoSearch') {
        const value = document.querySelector('#videoQuery')?.value.trim();
        if (!value) return;
        e.preventDefault(); e.stopImmediatePropagation();
        const id = ytId(value);
        if (id) { window.__JARVIS_LAST_MEDIA_ACTION__ = 'play'; play(id); }
        else { window.__JARVIS_LAST_MEDIA_ACTION__ = 'search'; searchYouTube(value); }
        return;
      }

      if (el.id === 'webSearch') {
        const x = ensureWeb();
        if (x) { e.preventDefault(); e.stopImmediatePropagation(); webSearch(x.input.value); }
        return;
      }

      if (el.id === 'refreshNews') {
        e.preventDefault(); e.stopImmediatePropagation(); news();
        return;
      }

      if (isMediaPlay(el)) {
        e.preventDefault(); e.stopImmediatePropagation();
        window.__JARVIS_LAST_MEDIA_ACTION__ = 'play';
        const id = currentVideoId();
        if (id) play(id);
        else {
          const value = document.querySelector('#videoQuery')?.value.trim();
          const parsed = ytId(value);
          if (parsed) play(parsed); else if (value) searchYouTube(value);
        }
      }
    }, true);

    document.addEventListener('change', e => {
      const el = e.target;
      if (el?.id === 'newsGenre') {
        e.preventDefault(); e.stopImmediatePropagation(); news();
      }
    }, true);
  }

  const bind = () => {
    home();
    bindNewsControls();
    ensureWeb();
  };

  new MutationObserver(bind).observe(document.documentElement, {childList:true, subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
})();
