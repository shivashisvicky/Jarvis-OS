(() => {
  'use strict';
  const refresh = () => document.querySelector('#refreshNews')?.click();
  const clean = () => {
    document.querySelectorAll('#newsCards .news-dense-item').forEach(card => {
      const title = card.querySelector('.news-title');
      const meta = card.querySelector('.news-meta');
      if (!title || !meta) return;
      const raw = title.textContent?.trim() || '';
      const parts = raw.split(/\s+-\s+/);
      const source = parts.length > 1 ? parts[parts.length - 1].trim() : 'LIVE NEWS';
      const sourceEl = meta.querySelector('.news-source');
      const dateEl = meta.querySelector('.news-country');
      if (sourceEl) sourceEl.textContent = source || 'LIVE NEWS';
      if (dateEl) {
        const value = dateEl.textContent?.trim() || '';
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
          dateEl.textContent = mins < 60 ? `${Math.max(1, mins)}m ago` : `${Math.round(mins / 60)}h ago`;
        } else {
          dateEl.remove();
        }
      }
    });
  };
  document.addEventListener('change', event => {
    const target = event.target;
    if (target instanceof HTMLSelectElement && target.id === 'newsGenre') {
      refresh();
    }
  });
  const observer = new MutationObserver(clean);
  const start = () => {
    if (!document.body) return;
    observer.observe(document.body, {childList:true, subtree:true});
    clean();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true}); else start();
  window.setInterval(() => {
    if (document.querySelector('#newsDesk') && document.visibilityState === 'visible') refresh();
  }, 10 * 60 * 1000);
})();
