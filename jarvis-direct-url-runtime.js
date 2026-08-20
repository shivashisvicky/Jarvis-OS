(() => {
  'use strict';

  const extractYouTubeId = value => {
    const text = String(value || '').trim();
    try {
      const url = new URL(text);
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (url.pathname === '/watch') return url.searchParams.get('v');
        const parts = url.pathname.split('/').filter(Boolean);
        if (['shorts', 'embed', 'live'].includes(parts[0])) return parts[1] || null;
      }
    } catch {}
    return /^[A-Za-z0-9_-]{11}$/.test(text) ? text : null;
  };

  const frameUrl = id => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&controls=1&playsinline=1&rel=0`;

  const renderFrame = id => {
    const player = document.querySelector('#jarvisPlayer');
    if (!player || !id) return false;
    const safe = String(id).replace(/[^A-Za-z0-9_-]/g, '');
    if (!safe) return false;
    player.dataset.videoId = safe;
    const current = player.querySelector('iframe[data-direct-youtube="1"]');
    if (current && current.src.includes(`/embed/${safe}`)) return true;
    player.replaceChildren();
    const frame = document.createElement('iframe');
    frame.src = frameUrl(safe);
    frame.title = 'JARVIS YouTube player';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.loading = 'eager';
    frame.dataset.directYouTube = '1';
    player.appendChild(frame);
    return true;
  };

  const attempt = () => {
    const input = document.querySelector('#videoQuery');
    const id = input ? extractYouTubeId(input.value) : null;
    if (!id) return false;
    return renderFrame(id);
  };

  const handle = event => {
    const target = event.target instanceof Element ? event.target.closest('#videoSearch') : null;
    if (!target) return;
    const input = document.querySelector('#videoQuery');
    const id = input ? extractYouTubeId(input.value) : null;
    if (!id) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    attempt();
    requestAnimationFrame(attempt);
    setTimeout(attempt, 50);
  };

  document.addEventListener('click', handle, true);
  window.addEventListener('jarvis:media-direct-play', attempt);
  window.jarvisDirectYouTube = { extractYouTubeId, playDirect: renderFrame, attempt };
})();
