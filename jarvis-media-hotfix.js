(() => {
  const extractYouTubeId = (value) => {
    try {
      const url = new URL(value.trim());
      const host = url.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'youtu.be') return url.pathname.slice(1).split('/')[0] || null;
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (url.pathname === '/watch') return url.searchParams.get('v');
        const parts = url.pathname.split('/').filter(Boolean);
        if (['shorts', 'embed', 'live'].includes(parts[0])) return parts[1] || null;
      }
    } catch {}
    return null;
  };

  const playDirectUrl = (button) => {
    const input = document.querySelector('#videoQuery');
    const player = document.querySelector('#jarvisPlayer');
    if (!input || !player) return false;
    const id = extractYouTubeId(input.value);
    if (!id) return false;
    const safeId = id.replace(/[^A-Za-z0-9_-]/g, '');
    if (!safeId) return false;
    const src = `https://www.youtube-nocookie.com/embed/${safeId}?autoplay=1&rel=0&modestbranding=1`;
    player.innerHTML = `<iframe src="${src}" title="JARVIS YouTube player" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="eager"></iframe>`;
    player.dataset.videoId = safeId;
    return true;
  };

  const bind = () => {
    const button = document.querySelector('#videoSearch');
    if (!button || button.dataset.jarvisDirectUrlHotfix === '1') return;
    button.dataset.jarvisDirectUrlHotfix = '1';
    button.addEventListener('click', (event) => {
      const input = document.querySelector('#videoQuery');
      if (!input || !extractYouTubeId(input.value)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      playDirectUrl(button);
    }, true);
  };

  const observer = new MutationObserver(bind);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
