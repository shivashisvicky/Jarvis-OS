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
    const id = String(value).trim();
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  };

  const playDirect = (id) => {
    const player = document.querySelector('#jarvisPlayer');
    if (!player || !id) return false;
    const safe = id.replace(/[^A-Za-z0-9_-]/g, '');
    if (!safe) return false;
    player.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${safe}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="JARVIS YouTube player" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="eager"></iframe>`;
    player.dataset.videoId = safe;
    return true;
  };

  // Delegate at document capture level. The Media app is rendered dynamically,
  // so binding directly to #videoSearch is inherently race-prone.
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('#videoSearch') : null;
    if (!target) return;
    const input = document.querySelector('#videoQuery');
    const id = input ? extractYouTubeId(input.value) : null;
    if (!id) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    playDirect(id);
  }, true);
})();
