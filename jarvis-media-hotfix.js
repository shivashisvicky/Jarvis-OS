(() => {
  'use strict';

  const extractYouTubeId = (value) => {
    try {
      const url = new URL(String(value).trim());
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null;
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (url.pathname === '/watch') return url.searchParams.get('v');
        const parts = url.pathname.split('/').filter(Boolean);
        if (['shorts', 'embed', 'live'].includes(parts[0])) return parts[1] || null;
      }
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(String(value).trim()) ? String(value).trim() : null;
  };

  window.jarvisCinematicSpeak = window.jarvisCinematicSpeak || ((text, options = {}) => {
    if (!('speechSynthesis' in window) || !text) return false;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      u.rate = Number(options.rate ?? .84);
      u.pitch = Number(options.pitch ?? .54);
      u.volume = Number(options.volume ?? .96);
      const v = speechSynthesis.getVoices().find(x => x.name === options.voiceName);
      if (v) u.voice = v;
      speechSynthesis.speak(u);
      return true;
    } catch { return false; }
  });

  // De-duplicate live news requests without touching other fetch calls.
  const originalFetch = window.fetch.bind(window);
  const pending = new Map();
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url || '';
    if (init?.method && init.method !== 'GET') return originalFetch(input, init);
    if (!/api\.gdeltproject\.org/i.test(url)) return originalFetch(input, init);
    if (pending.has(url)) return pending.get(url).then(r => r.clone());
    const p = originalFetch(input, init).finally(() => setTimeout(() => pending.delete(url), 8000));
    pending.set(url, p);
    return p.then(r => r.clone());
  };

  const playId = (id) => {
    const player = document.querySelector('#jarvisPlayer');
    if (!player) return false;
    const safe = String(id).replace(/[^A-Za-z0-9_-]/g, '');
    if (!safe) return false;
    player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${safe}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="JARVIS YouTube player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="eager"></iframe>`;
    player.dataset.videoId = safe;
    return true;
  };

  // IMPORTANT: keyword search remains owned by the real Media application.
  // This bridge only handles direct YouTube URLs/IDs so it cannot hijack or
  // break the normal search pipeline.
  const bindMediaDirectPlayback = () => {
    const button = document.querySelector('#videoSearch');
    const input = document.querySelector('#videoQuery');
    if (!button || !input || button.dataset.jarvisDirectOnly === '1') return;
    button.dataset.jarvisDirectOnly = '1';
    button.addEventListener('click', event => {
      const id = extractYouTubeId(input.value.trim());
      if (!id) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      playId(id);
    }, true);
  };

  const bindWeb = () => {
    // Do not hijack the Search application here. Its current runtime owns the
    // in-shell search experience and this bridge must remain transparent.
  };

  const bindHome = () => {
    const form = document.querySelector('#commandForm');
    const input = document.querySelector('#commandInput');
    if (!form || !input || form.dataset.jarvisCommandHotfix === '1') return;
    form.dataset.jarvisCommandHotfix = '1';
    form.addEventListener('submit', async e => {
      const q = input.value.trim().toLowerCase();
      if (!q || !/(time|prime minister|weather)/i.test(q)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const reply = document.querySelector('#jarvisReply');
      if (!reply) return;
      let text = '';
      if (/\btime\b|\bclock\b/.test(q)) {
        text = `The local time is ${new Intl.DateTimeFormat([], {hour:'2-digit', minute:'2-digit', second:'2-digit'}).format(new Date())}.`;
      } else if (/prime minister.*india|india.*prime minister/.test(q)) {
        text = 'The Prime Minister of India is Narendra Modi.';
      } else if (/weather/.test(q)) {
        try {
          const pos = await new Promise((resolve, reject) => navigator.geolocation?.getCurrentPosition(resolve, reject, {timeout:5000}) || reject());
          const {latitude, longitude} = pos.coords;
          const r = await originalFetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`);
          const d = await r.json();
          text = `Current weather is ${Math.round(d.current.temperature_2m)}°C, feels like ${Math.round(d.current.apparent_temperature)}°C, wind ${Math.round(d.current.wind_speed_10m)} km/h.`;
        } catch {
          text = 'I need location permission to get weather around you.';
        }
      }
      reply.textContent = text;
      reply.classList.add('visible');
      window.jarvisCinematicSpeak?.(text);
    }, true);
  };

  const bind = () => { bindMediaDirectPlayback(); bindWeb(); bindHome(); };
  new MutationObserver(bind).observe(document.documentElement, {childList:true, subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
})();
