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
    player.dataset.videoId = safe;
    player.innerHTML = `<div class="jarvis-player-frame"><iframe src="https://www.youtube-nocookie.com/embed/${safe}?autoplay=1&controls=1&playsinline=1&rel=0" title="JARVIS YouTube player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`;
    document.querySelectorAll('#videoResults [data-jvc-id]').forEach(card => card.classList.toggle('is-active', card.dataset.jvcId === safe));
    return true;
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('#videoSearch') : null;
    if (!target) return;
    const input = document.querySelector('#videoQuery');
    const id = input ? extractYouTubeId(input.value) : null;
    if (!id) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    playDirect(id);
    window.dispatchEvent(new CustomEvent('jarvis:media-direct-play', { detail:{ id } }));
  }, true);
})();
