(() => {
  'use strict';

  const normalize = () => {
    const box = document.querySelector('#videoResults');
    if (!box || !window.jarvisV3Media) return;
    const legacy = [...box.querySelectorAll('.jvc-card[data-jvc-id]')];
    if (!legacy.length || box.querySelector('.jarvis-video-card')) return;
    const items = legacy.map(card => ({
      id: card.dataset.jvcId,
      title: card.querySelector('.video-result-copy strong')?.textContent?.trim() || 'YouTube video',
      channel: card.querySelector('.video-result-copy small')?.textContent?.replace(/^YouTube\s*·\s*/i, '').trim() || 'YouTube',
      thumb: card.querySelector('img')?.getAttribute('src') || ''
    })).filter(item => item.id);
    if (items.length) window.jarvisV3Media.render(box, items);
  };

  const current = () => document.querySelector('#jarvisPlayer')?.dataset.videoId || document.querySelector('#videoResults [data-jvc-id]')?.dataset.jvcId || null;

  const wire = () => {
    normalize();
    const play = document.querySelector('#mediaPlay');
    if (play && !play.dataset.v3MediaAuthority) {
      play.dataset.v3MediaAuthority = '1';
      play.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        const id = current();
        if (id) window.jarvisV3Media?.play(id);
      }, true);
    }
  };

  const boot = () => {
    wire();
    if (document.body) new MutationObserver(wire).observe(document.body, { childList:true, subtree:true });
    window.addEventListener('jarvis:media-play', event => {
      const id = event.detail?.id || event.detail?.url || current();
      if (id) window.jarvisV3Media?.play(id);
    });
  };

  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot, { once:true });
  else setTimeout(boot, 0);
})();
