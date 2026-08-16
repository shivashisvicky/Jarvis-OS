(() => {
  'use strict';
  let done = false;
  const run = async () => {
    const cards = [...document.querySelectorAll('.news-desk .jv3-news-card')];
    cards.forEach(c => c.classList.add('news-card'));
    if (done || cards.length === 0) return;
    try {
      const r = await fetch('https://api.gdeltproject.org/api/v2/context/context?query=technology&format=json', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json(); const summary = d?.articles?.[0]?.context;
      if (!summary) return;
      const first = cards[0]?.querySelector('p');
      if (first) { first.textContent = summary; done = true; }
    } catch {}
  };
  const o = new MutationObserver(() => void run());
  o.observe(document.body, { childList: true, subtree: true });
  void run();
})();
