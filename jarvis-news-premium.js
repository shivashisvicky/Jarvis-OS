(() => {
  'use strict';
  if (window.__JARVIS_NEWS_PREMIUM__) return;
  window.__JARVIS_NEWS_PREMIUM__ = true;

  // Lightweight news presentation only. No MutationObserver, no polling,
  // no per-card work. The core renderer owns the news data.
  const enhance = () => {
    const host = document.querySelector('#newsCards');
    if (!host) return;
    host.classList.add('jarvis-news-grid');
    host.querySelectorAll('.news-card').forEach((card, index) => {
      card.classList.toggle('jarvis-news-lead', index === 0);
      const meta = card.querySelector('small');
      if (meta && meta.dataset.premiumDone !== '1') {
        meta.dataset.premiumDone = '1';
        meta.classList.add('jarvis-news-meta');
      }
    });
  };

  window.addEventListener('jarvis:news-updated', () => requestAnimationFrame(enhance), { passive: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, { once: true });
  else requestAnimationFrame(enhance);
})();
