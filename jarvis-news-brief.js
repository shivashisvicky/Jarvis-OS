(() => {
  'use strict';
  const RSS_PROXY = 'https://api.rss2json.com/v1/api.json';
  const queries = {
    WORLD: 'world news when:1d -sports -entertainment -celebrity',
    INDIA: 'India news when:1d -sports -entertainment',
    AI: 'artificial intelligence news when:1d -sports -celebrity',
    TECH: 'technology software news when:1d -sports -entertainment'
  };
  const clean = value => {
    const box = document.createElement('div');
    box.innerHTML = String(value || '');
    return (box.textContent || '').replace(/\s+/g, ' ').trim();
  };
  const normalize = value => clean(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const summarize = text => {
    const s = clean(text).replace(/^\s*(read more|continue reading)\s*$/i, '');
    if (!s || s.length < 35) return '';
    return s.length > 180 ? `${s.slice(0, 177).replace(/\s+\S*$/, '')}…` : s;
  };
  let running = false;
  let retryTimer;
  async function enrich() {
    const select = document.querySelector('#newsGenre');
    const cards = [...document.querySelectorAll('#newsCards a.news-dense-item, #newsCards a.news-card')];
    if (!select || !cards.length || running) return false;
    const category = select.value || 'WORLD';
    const feed = `https://news.google.com/rss/search?q=${encodeURIComponent(queries[category] || queries.WORLD)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const url = new URL(RSS_PROXY);
    url.searchParams.set('rss_url', feed);
    running = true;
    try {
      const response = await fetch(url.toString(), {cache:'no-store', headers:{Accept:'application/json'}});
      const data = await response.json();
      if (!response.ok || data.status !== 'ok' || !Array.isArray(data.items)) return false;
      const feedItems = data.items.map(item => ({title: normalize(item.title), brief: summarize(item.description)})).filter(item => item.brief);
      let added = 0;
      cards.forEach(card => {
        if (card.querySelector('.news-brief')) return;
        const title = normalize(card.querySelector('.news-title, strong')?.textContent || card.textContent);
        const match = feedItems.find(item => item.title === title) || feedItems.find(item => item.title && (item.title.includes(title) || title.includes(item.title)));
        if (!match) return;
        const copy = card.querySelector('.news-copy') || card;
        const anchor = copy.querySelector('.news-meta, small');
        const node = document.createElement('span');
        node.className = 'news-brief';
        node.textContent = match.brief;
        if (anchor) copy.insertBefore(node, anchor); else copy.appendChild(node);
        added++;
      });
      return added > 0 || cards.every(card => card.querySelector('.news-brief'));
    } catch (error) {
      console.debug('[JARVIS NEWS BRIEF] unavailable', error);
      return false;
    } finally {
      running = false;
    }
  }
  function retryBriefs(attempts = 16) {
    window.clearTimeout(retryTimer);
    let left = attempts;
    const tick = async () => {
      const done = await enrich();
      if (done || --left <= 0) return;
      retryTimer = window.setTimeout(tick, 400);
    };
    retryTimer = window.setTimeout(tick, 150);
  }
  const schedule = () => retryBriefs();
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#newsGenre')?.addEventListener('change', schedule);
    schedule();
  }, {once:true});
  window.addEventListener('jarvis:news-updated', schedule);
})();
