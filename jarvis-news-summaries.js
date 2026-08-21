(() => {
  'use strict';
  if (window.__JARVIS_NEWS_SUMMARIES__) return;
  window.__JARVIS_NEWS_SUMMARIES__ = true;

  const cache = new Map();
  const strip = value => String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  const summarize = async (title, source, existing) => {
    const key = `${title}|${source}`;
    if (cache.has(key)) return cache.get(key);
    if (existing && existing.length > 45) {
      const text = existing.replace(/\s+/g, ' ').trim();
      cache.set(key, text);
      return text;
    }
    const endpoint = document.querySelector('meta[name="jarvis-intelligence-endpoint"]')?.content;
    if (!endpoint) return '';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query: `In 2 concise sentences, summarize this news item for a busy reader. Do not invent details. Title: ${title}. Source: ${source}. ${existing ? `Snippet: ${strip(existing)}` : ''}` }),
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timer);
      if (!response.ok) return '';
      const data = await response.json();
      const text = String(data?.text || '').replace(/\s+/g, ' ').trim();
      if (text) cache.set(key, text);
      return text;
    } catch {
      return '';
    }
  };

  const enhance = async () => {
    const cards = [...document.querySelectorAll('.news-card, .jarvis-news-card')];
    if (!cards.length) return;
    await Promise.all(cards.map(async card => {
      if (card.querySelector('.jarvis-news-summary')) return;
      const titleEl = card.querySelector('strong');
      if (!titleEl) return;
      const title = strip(titleEl.textContent);
      const source = strip(card.querySelector('.news-source, .jarvis-news-source')?.textContent || 'News');
      const snippet = strip(card.querySelector('small')?.textContent || '');
      const summary = await summarize(title, source, snippet);
      if (!summary || !card.isConnected) return;
      const node = document.createElement('p');
      node.className = 'jarvis-news-summary';
      node.textContent = summary;
      titleEl.insertAdjacentElement('afterend', node);
    }));
  };

  const style = () => {
    if (document.querySelector('#jarvis-news-summary-style')) return;
    const style = document.createElement('style');
    style.id = 'jarvis-news-summary-style';
    style.textContent = `
      .jarvis-news-summary { margin:0; color:#8aa1a9; font-size:10px; line-height:1.42; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
      @media (max-width:760px) { .jarvis-news-summary { font-size:10px; -webkit-line-clamp:4; } }
    `;
    document.head.appendChild(style);
  };

  style();
  new MutationObserver(() => enhance()).observe(document.documentElement, { childList:true, subtree:true });
  window.addEventListener('jarvis:news-summary-refresh', enhance);
  setTimeout(enhance, 700);
})();
