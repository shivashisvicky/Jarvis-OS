(() => {
  'use strict';

  const ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';
  let loading = false;
  let cachedItems = [];
  let booted = false;

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[c]));

  const queryFor = value => {
    const q = String(value || '').toLowerCase();
    if (/business|market/.test(q)) return '(business OR markets OR finance)';
    if (/science|space/.test(q)) return '(science OR space OR NASA)';
    if (/india/.test(q)) return '(India OR Indian)';
    if (/world|geopolitic/.test(q)) return '(world OR geopolitics OR international)';
    return '(AI OR artificial intelligence OR technology)';
  };

  const normalise = article => ({
    title: article?.title || '',
    url: article?.url || article?.sourceurl || '',
    domain: article?.domain || article?.sourcecountry || 'NEWS',
    image: article?.socialimage || '',
    country: article?.sourcecountry || 'GLOBAL',
    date: article?.seendate || ''
  });

  const render = (items, message = '') => {
    const cards = document.querySelector('#newsCards');
    const ticker = document.querySelector('#newsTicker');
    if (!cards || !ticker) return;
    const safe = items.filter(x => x.title && x.url).slice(0, 8);
    cachedItems = safe;
    if (!safe.length) {
      cards.innerHTML = `<div class="empty">${esc(message || 'No live headlines available right now.')}</div>`;
      ticker.innerHTML = '<span>NEWS FEED DEGRADED · RETRY AVAILABLE</span>';
      return;
    }
    cards.innerHTML = safe.map(item => `
      <article class="jarvis-news-card">
        <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" class="jarvis-news-card-link">
          <div class="jarvis-news-thumb">${item.image ? `<img src="${esc(item.image)}" alt="" loading="lazy">` : '<span>NEWS</span>'}</div>
          <div class="jarvis-news-copy">
            <span class="jarvis-news-source">${esc(item.domain)}</span>
            <strong>${esc(item.title)}</strong>
            <small>${esc(item.country)}${item.date ? ` · ${esc(item.date)}` : ''}</small>
          </div>
        </a>
      </article>`).join('');
    ticker.innerHTML = safe.slice(0, 6).map(item => `<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">● ${esc(item.title)}</a>`).join('');
  };

  const load = async () => {
    if (loading) return;
    const cards = document.querySelector('#newsCards');
    if (!cards) return;
    loading = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const genre = document.querySelector('#newsGenre')?.value || 'AI OR technology';
      const params = new URLSearchParams({ query: queryFor(genre), mode: 'artlist', format: 'json', maxrecords: '10', timespan: '24h', sort: 'datedesc' });
      const response = await fetch(`${ENDPOINT}?${params}`, { cache:'no-store', signal:controller.signal, headers:{Accept:'application/json'} });
      if (!response.ok) throw new Error(`News service ${response.status}`);
      const data = await response.json();
      const items = [...new Map((data?.articles || []).map(normalise).filter(x => x.url).map(x => [x.url, x])).values()];
      if (!items.length) throw new Error('No current stories');
      render(items);
    } catch (error) {
      if (!cachedItems.length) render([], error instanceof Error ? error.message : 'Live news is temporarily unavailable.');
      else render(cachedItems);
    } finally {
      clearTimeout(timeout);
      loading = false;
    }
  };

  const wire = () => {
    const refresh = document.querySelector('#refreshNews');
    if (refresh && !refresh.dataset.v3NewsAuthority) {
      refresh.dataset.v3NewsAuthority = '1';
      refresh.addEventListener('click', event => { event.preventDefault(); void load(); });
    }
    const genre = document.querySelector('#newsGenre');
    if (genre && !genre.dataset.v3NewsAuthority) {
      genre.dataset.v3NewsAuthority = '1';
      genre.addEventListener('change', () => void load());
    }
  };

  const style = () => {
    if (document.querySelector('#jarvis-v3-news-authority-style')) return;
    const tag = document.createElement('style');
    tag.id = 'jarvis-v3-news-authority-style';
    tag.textContent = `
      #newsCards { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      #newsCards .jarvis-news-card { min-width:0; border:1px solid var(--line); border-radius:12px; overflow:hidden; background:rgba(5,13,18,.82); }
      #newsCards .jarvis-news-card-link { display:grid; grid-template-columns:112px minmax(0,1fr); min-height:112px; color:inherit; text-decoration:none; }
      #newsCards .jarvis-news-thumb { display:flex; align-items:center; justify-content:center; overflow:hidden; background:rgba(10,25,32,.9); color:var(--cyan); font:700 9px/1 ui-monospace,monospace; }
      #newsCards .jarvis-news-thumb img { width:100%; height:100%; object-fit:cover; }
      #newsCards .jarvis-news-copy { min-width:0; display:grid; align-content:start; gap:6px; padding:12px; }
      #newsCards .jarvis-news-source { font:600 8px/1 ui-monospace,monospace; color:var(--cyan); letter-spacing:.08em; text-transform:uppercase; }
      #newsCards .jarvis-news-copy strong { font-size:13px; line-height:1.3; font-weight:650; display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; }
      #newsCards .jarvis-news-copy small { font-size:8px; color:#66828c; }
      #newsTicker { overflow:hidden; white-space:nowrap; }
      #newsTicker a { color:inherit; text-decoration:none; margin-right:24px; }
      @media (max-width:760px) { #newsCards { grid-template-columns:1fr; } #newsCards .jarvis-news-card-link { grid-template-columns:96px minmax(0,1fr); } }
    `;
    document.head.appendChild(tag);
  };

  const boot = () => {
    if (booted) return;
    booted = true;
    style();
    const hydrate = () => {
      wire();
      const cards = document.querySelector('#newsCards');
      if (cards && !cards.dataset.v3NewsAuthority) {
        cards.dataset.v3NewsAuthority = '1';
        window.setTimeout(() => { void load(); }, 300);
      } else if (cards && !loading && !cachedItems.length && cards.innerHTML.includes('news-loading')) {
        window.setTimeout(() => { void load(); }, 300);
      }
    };
    hydrate();
    new MutationObserver(() => hydrate()).observe(document.body, { childList:true, subtree:true });
  };

  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', boot, { once:true });
  else window.setTimeout(boot, 0);
})();
