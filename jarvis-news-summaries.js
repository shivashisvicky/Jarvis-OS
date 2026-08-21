(() => {
  'use strict';
  if (window.__JARVIS_NEWS_SUMMARIES__) return;
  window.__JARVIS_NEWS_SUMMARIES__ = true;

  // News must stay lightweight. Never call the intelligence API for every card.
  // Use the source-provided snippet when available. AI summaries are explicit actions only.
  const strip = value => String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  const enhance = () => {
    document.querySelectorAll('.news-card, .jarvis-news-card').forEach(card => {
      if (card.querySelector('.jarvis-news-summary')) return;
      const titleEl = card.querySelector('strong');
      if (!titleEl) return;
      const snippet = strip(card.querySelector('[data-news-snippet], .news-snippet')?.textContent || '');
      if (!snippet || snippet.length < 45) return;
      const node = document.createElement('p');
      node.className = 'jarvis-news-summary';
      node.textContent = snippet.slice(0, 260);
      titleEl.insertAdjacentElement('afterend', node);
    });
  };

  if (!document.querySelector('#jarvis-news-summary-style')) {
    const style = document.createElement('style');
    style.id = 'jarvis-news-summary-style';
    style.textContent = '.jarvis-news-summary{margin:0;color:#8aa1a9;font-size:10px;line-height:1.42;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.jarvis-news-summary:empty{display:none}@media(max-width:760px){.jarvis-news-summary{font-size:10px;-webkit-line-clamp:2}}';
    document.head.appendChild(style);
  }

  window.addEventListener('jarvis:news-updated', () => requestAnimationFrame(enhance));
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, { once: true });
  else requestAnimationFrame(enhance);
})();
