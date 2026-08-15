(() => {
  'use strict';

  const ensure = () => {
    const news = document.querySelector('#jarvisNewsNav');
    if (news) {
      news.dataset.app = 'news';
      news.title = 'News';
    }

    // The media app must expose a stable player surface immediately, not only
    // after a video has been searched/played. This keeps the UI and E2E contract
    // deterministic while the richer player is populated by the media fix.
    if (document.querySelector('h2')?.textContent?.trim() === 'JARVIS Player') {
      const card = document.querySelector('.search-card');
      if (card && !document.querySelector('#jarvisPlayer')) {
        const player = document.createElement('div');
        player.id = 'jarvisPlayer';
        player.setAttribute('aria-label', 'JARVIS in-house video player');
        player.style.display = 'block';
        player.style.width = '100%';
        player.style.minHeight = '220px';
        player.style.borderRadius = '18px';
        player.style.background = '#000';
        player.style.marginTop = '14px';
        player.innerHTML = '<div style="padding:24px;color:#8ca9b5;text-align:center">Search for a video or paste a YouTube URL to play it inside JARVIS.</div>';
        card.appendChild(player);
      }
    }
  };

  new MutationObserver(ensure).observe(document.documentElement, { childList: true, subtree: true });
  ensure();
})();
