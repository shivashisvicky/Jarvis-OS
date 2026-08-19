/* Temporary production media transaction watchdog. Remove after Media is stable. */
(() => {
  'use strict';
  if (window.__JARVIS_MEDIA_RUNTIME_WATCHDOG__) return;
  window.__JARVIS_MEDIA_RUNTIME_WATCHDOG__ = true;

  const trace = (stage, detail = {}) => {
    const entry = { ts: new Date().toISOString(), stage, ...detail };
    window.__JARVIS_MEDIA_TRACE__ = [...(window.__JARVIS_MEDIA_TRACE__ || []), entry].slice(-80);
    try { console.info('[JARVIS MEDIA WATCHDOG]', entry); } catch {}
  };

  const idFrom = value => {
    try {
      const u = new URL(value);
      if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0];
      if (u.hostname.endsWith('youtube.com')) {
        if (u.pathname === '/watch') return u.searchParams.get('v') || '';
        const p = u.pathname.split('/').filter(Boolean);
        if (['shorts', 'embed', 'v'].includes(p[0])) return p[1] || '';
      }
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(value).trim()) ? String(value).trim() : '';
  };

  const render = (videos) => {
    const results = document.querySelector('#videoResults');
    if (!results || !videos.length) return false;
    results.replaceChildren(...videos.slice(0, 8).map(video => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'jvc-card';
      card.dataset.jvcId = video.id;
      const img = document.createElement('img');
      img.src = video.thumbnail || `https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/mqdefault.jpg`;
      img.alt = '';
      img.loading = 'lazy';
      const meta = document.createElement('span');
      meta.className = 'video-meta';
      const title = document.createElement('strong');
      title.textContent = video.title || 'YouTube video';
      const channel = document.createElement('small');
      channel.textContent = video.channel || 'YouTube';
      meta.append(title, channel);
      const play = document.createElement('b');
      play.textContent = '▶';
      card.append(img, meta, play);
      return card;
    }));
    const state = document.querySelector('#mediaState');
    if (state) state.textContent = `READY · ${Math.min(videos.length, 8)} REAL YOUTUBE RESULTS · WATCHDOG FALLBACK`;
    trace('results-populated', { count: videos.length, ids: videos.slice(0, 8).map(v => v.id), titles: videos.slice(0, 8).map(v => v.title) });
    return true;
  };

  const pipedSearch = async query => {
    const instances = [
      'https://pipedapi.kavin.rocks',
      'https://pipedapi.adminforge.de',
      'https://pipedapi.tokhmi.xyz',
      'https://pipedapi.moomoo.me',
      'https://pipedapi.syncpundit.io',
      'https://api-piped.mha.fi',
      'https://piped-api.garudalinux.org',
      'https://pipedapi.rivo.lol',
      'https://pipedapi.leptons.xyz',
      'https://api.piped.yt'
    ];
    let last = 'no instance responded';
    for (const base of instances) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const url = new URL(base + '/search');
        url.searchParams.set('q', query);
        url.searchParams.set('filter', 'videos');
        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) { last = `HTTP ${response.status}`; continue; }
        const raw = Array.isArray(payload) ? payload : (payload.items || []);
        const videos = raw.map(item => ({
          id: item.videoId || idFrom(item.url || ''),
          title: item.title || 'YouTube video',
          channel: item.uploaderName || item.uploader || 'YouTube',
          thumbnail: item.thumbnail || ''
        })).filter(v => /^[A-Za-z0-9_-]{11}$/.test(v.id));
        if (videos.length) return videos;
        last = 'empty result set';
      } catch (e) {
        last = e instanceof Error ? e.message : 'request failed';
      } finally { clearTimeout(timer); }
    }
    throw new Error(last);
  };

  const youtubeApiSearch = async query => {
    const key = String(window.JARVIS_YOUTUBE_API_KEY || '').trim();
    if (!key) throw new Error('YouTube API key missing');
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '8');
    url.searchParams.set('videoEmbeddable', 'true');
    url.searchParams.set('q', query);
    url.searchParams.set('key', key);
    const response = await fetch(url, { cache: 'no-store' });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error?.message || `YouTube API HTTP ${response.status}`);
    return (payload.items || []).map(item => ({
      id: item.id?.videoId || '',
      title: item.snippet?.title || 'YouTube video',
      channel: item.snippet?.channelTitle || 'YouTube',
      thumbnail: item.snippet?.thumbnails?.medium?.url || ''
    })).filter(v => /^[A-Za-z0-9_-]{11}$/.test(v.id));
  };

  let lastQuery = '';
  let recoveryInFlight = false;
  const runFallback = async reason => {
    if (recoveryInFlight || !lastQuery) return;
    recoveryInFlight = true;
    trace('fallback-start', { reason, query: lastQuery });
    try {
      let videos;
      try { videos = await youtubeApiSearch(lastQuery); } catch (apiError) {
        trace('youtube-api-failed', { error: apiError instanceof Error ? apiError.message : String(apiError) });
        videos = await pipedSearch(lastQuery);
      }
      if (!videos.length) throw new Error('no videos returned');
      render(videos);
      trace('fallback-complete', { query: lastQuery, count: videos.length });
    } catch (error) {
      trace('fallback-failed', { query: lastQuery, error: error instanceof Error ? error.message : String(error) });
    } finally { recoveryInFlight = false; }
  };

  const mount = () => {
    const input = document.querySelector('#videoQuery');
    const button = document.querySelector('#videoSearch');
    if (!input || !button || button.__jarvisWatchdogBound) return;
    button.__jarvisWatchdogBound = true;
    button.addEventListener('click', () => {
      lastQuery = input.value.trim();
      trace('search-click', { query: lastQuery });
    }, true);
    input.addEventListener('input', () => { lastQuery = input.value.trim(); trace('query-populated', { query: lastQuery }); }, true);
    trace('media-mounted');
  };

  const observer = new MutationObserver(() => {
    mount();
    const results = document.querySelector('#videoResults');
    if (!results) return;
    const cards = results.querySelectorAll('.jvc-card[data-jvc-id]');
    const legacy = results.querySelector('.video-result');
    const empty = results.textContent?.includes('SEARCHING VIDEO INDEX') || results.textContent?.includes('Video index unavailable');
    if (cards.length) return;
    if (legacy || empty) runFallback(legacy ? 'legacy-result-mutation' : 'legacy-empty-state');
  });
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  mount();
  window.setTimeout(() => { mount(); trace('watchdog-ready'); }, 500);
})();
