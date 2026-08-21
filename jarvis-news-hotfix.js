(() => {
  'use strict';

  const refresh = () => document.querySelector('#refreshNews')?.click();

  const cleanNewsMeta = () => {
    document.querySelectorAll('#newsCards .news-dense-item').forEach(card => {
      const title = card.querySelector('.news-title');
      const sourceEl = card.querySelector('.news-source');
      const dateEl = card.querySelector('.news-country');
      if (!title || !sourceEl) return;

      const rawTitle = title.textContent?.trim() || '';
      if (/^undefined/i.test(sourceEl.textContent?.trim() || '') || /when:\d+d/i.test(sourceEl.textContent || '')) {
        const parts = rawTitle.split(/\s+-\s+/);
        const derived = parts.length > 1 ? parts[parts.length - 1].trim() : 'GOOGLE NEWS';
        sourceEl.textContent = derived || 'GOOGLE NEWS';
      }

      if (dateEl) {
        const value = dateEl.textContent?.trim() || '';
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
          const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
          dateEl.textContent = mins < 60 ? `${Math.max(1, mins)}m ago` : `${Math.round(mins / 60)}h ago`;
        } else if (/^undefined/i.test(value)) {
          dateEl.remove();
        }
      }
    });
  };

  const bind = () => {
    document.addEventListener('change', event => {
      const target = event.target;
      if (target instanceof HTMLSelectElement && target.id === 'newsGenre') {
        refresh();
      }
    });

    document.addEventListener('click', event => {
      const target = event.target;
      if (target instanceof Element && target.id === 'refreshNews') {
        window.setTimeout(cleanNewsMeta, 50);
      }
    });

    const newsCards = document.querySelector('#newsCards');
    if (newsCards) {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        cleanNewsMeta();
        observer.observe(newsCards, { childList: true, subtree: true });
      });
      observer.observe(newsCards, { childList: true, subtree: true });
    }

    window.setInterval(() => {
      if (document.querySelector('#newsDesk') && document.visibilityState === 'visible') refresh();
    }, 10 * 60 * 1000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
