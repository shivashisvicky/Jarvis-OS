(() => {
  'use strict';
  const RSS_PROXY = 'https://api.rss2json.com/v1/api.json';
  const queries = {
    WORLD: 'world news when:1d -sports -entertainment -celebrity',
    INDIA: 'India news when:1d -sports -entertainment',
    AI: 'artificial intelligence news when:1d -sports -celebrity',
    TECH: 'technology software news when:1d -sports -entertainment'
  };
  const clean = html => {
    const box = document.createElement('div');
    box.innerHTML = String(html || '');
    return (box.textContent || '').replace(/\s+/g, ' ').trim();
  };
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const summarize = text => {
    const s = clean(text).replace(/^\s*(read more|continue reading)\s*$/i, '');
    if (!s || s.length < 35) return '';
    return s.length > 180 ? `${s.slice(0, 177).replace(/\s+\S*$/, '')}…` : s;
  };
  let running = false;
  async function enrich() {
    const select = document.querySelector('#newsGenre');
    const cards = [...document.querySelectorAll('#newsCards .news-dense-item')];
    if (!select || !cards.length || running) return;
    const category = select.value || 'WORLD';
    const feed = `https://news.google.com/rss/search?q=${encodeURIComponent(queries[category] || queries.WORLD)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const url = new URL(RSS_PROXY);
    url.searchParams.set('rss_url', feed);
    running = true;
    try {
      const response = await fetch(url.toString(), {cache:'no-store', headers:{Accept:'application/json'}});
      const data = await response.json();
      if (!response.ok || data.status !== 'ok' || !Array.isArray(data.items)) return;
      const byTitle = new Map(data.items.map(item => [clean(item.title).toLowerCase(), summarize(item.description)]));
      cards.forEach(card => {
        if (card.querySelector('.news-brief')) return;
        const title = clean(card.querySelector('.news-title')?.textContent).toLowerCase();
        const brief = byTitle.get(title);
        if (!brief) return;
        const copy = card.querySelector('.news-copy');
        const meta = copy?.querySelector('.news-meta');
        if (!copy || !meta) return;
        const node = document.createElement('span');
        node.className = 'news-brief';
        node.textContent = brief;
        copy.insertBefore(node, meta);
      });
    } catch (error) {
      console.debug('[JARVIS NEWS BRIEF] unavailable', error);
    } finally {
      running = false;
    }
  }
  const schedule = () => window.setTimeout(enrich, 120);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#newsGenre')?.addEventListener('change', schedule);
    schedule();
  }, {once:true});
  window.addEventListener('jarvis:news-updated', schedule);
})();
