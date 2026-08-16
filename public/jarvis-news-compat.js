(() => {
  'use strict';
  const apply = async () => {
    const desk = document.querySelector('#newsDesk');
    if (!desk || desk.dataset.newsCompat === '1') return;
    desk.dataset.newsCompat = '1';
    const mark = () => document.querySelectorAll('.jv3-news-card').forEach(x => x.classList.add('news-card'));
    mark();
    const grid = desk.querySelector('.jv3-news');
    if (!grid) return;
    const observer = new MutationObserver(mark);
    observer.observe(grid, { childList: true, subtree: true });
    try {
      const r = await fetch('https://api.gdeltproject.org/api/v2/context/context?query=technology&format=json', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      const summary = d?.articles?.[0]?.context;
      const first = grid.querySelector('.news-card p');
      if (summary && first) first.textContent = summary;
    } catch {}
  };
  const observer = new MutationObserver(() => void apply());
  observer.observe(document.body, { childList: true, subtree: true });
  void apply();
})();
