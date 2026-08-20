/* J.A.R.V.I.S. OS 3.0 - home/news/map authority */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const state = { newsRun: 0 };

  const newsQuery = () => document.querySelector('#newsGenre')?.value || 'technology OR AI';
  const feedFor = q => {
    const text = String(q).toLowerCase();
    if (text.includes('india')) return 'India';
    if (text.includes('business') || text.includes('market') || text.includes('finance')) return 'business OR markets';
    if (text.includes('science') || text.includes('space')) return 'science OR space';
    if (text.includes('world') || text.includes('geopolit')) return 'world OR geopolitics';
    return q;
  };

  const renderNews = items => {
    const box = document.querySelector('#newsCards');
    if (!box) return;
    const unique = [...new Map(items.filter(x => x.title && x.url).map(x => [x.url, x])).values()].slice(0, 12);
    box.innerHTML = unique.length ? unique.map(x => `<article class="jarvis-news-card"><a class="jarvis-news-card-link" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><div class="jarvis-news-thumb">NEWS</div><div class="jarvis-news-copy"><span class="jarvis-news-source">${esc(x.source || 'LIVE NEWS')}</span><strong>${esc(x.title)}</strong><small>${esc(x.date || '')}</small></div></a></article>`).join('') : '<div class="empty">No live headlines available right now.</div>';
    const status = document.querySelector('#newsStatus');
    if (status) status.textContent = unique.length ? `${unique.length} LIVE HEADLINES` : 'NO HEADLINES';
    const ticker = document.querySelector('#newsTicker');
    if (ticker && unique.length) ticker.innerHTML = unique.slice(0, 5).map(x => `<span>${esc(x.title)}</span>`).join('<b>•</b>');
  };

  const loadNews = async () => {
    const box = document.querySelector('#newsCards');
    if (!box) return;
    const run = ++state.newsRun;
    const status = document.querySelector('#newsStatus');
    if (status) status.textContent = 'CONNECTING';
    box.innerHTML = '<div class="news-loading"><span></span><span></span><span></span></div>';
    const q = encodeURIComponent(feedFor(newsQuery()));
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const r = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&format=json&maxrecords=12&timespan=24h&sort=datedesc`, { cache:'no-store', signal:controller.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error('GDELT');
      const d = await r.json();
      const items = (d.articles || []).map(x => ({ title:x.title, url:x.url, source:x.domain || 'GDELT', date:x.seendate || '' }));
      if (run === state.newsRun && items.length) { renderNews(items); return; }
      throw new Error('empty');
    } catch {
      try {
        const r = await fetch(`https://r.jina.ai/http://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`, { cache:'no-store' });
        if (!r.ok) throw new Error('RSS');
        const text = await r.text();
        const items = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0,12).map(m => {
          const z=m[1], get=k=>(z.match(new RegExp(`<${k}>([\\s\\S]*?)<\\/${k}>`,'i'))||[,''])[1].replace(/<!\[CDATA\[|\]\]>/g,'');
          return {title:get('title'),url:get('link'),source:get('source') || 'Google News'};
        });
        if (run === state.newsRun) renderNews(items);
      } catch {
        if (run === state.newsRun) { box.innerHTML='<div class="empty">Live news is temporarily unavailable. Try refresh again.</div>'; if(status) status.textContent='DEGRADED'; }
      }
    }
  };

  const ensureHome = () => {
    const desk = document.querySelector('.news-desk');
    if (!desk) return;
    desk.id = 'newsDesk';
    const head = desk.querySelector('.news-head');
    if (head && !head.querySelector('#newsGenre')) {
      const controls = head.querySelector('.news-controls');
      const select = document.createElement('select');
      select.id='newsGenre';
      select.innerHTML='<option>TECHNOLOGY</option><option>INDIA</option><option>WORLD</option><option>BUSINESS</option><option>SCIENCE</option>';
      controls?.prepend(select);
    }
    if (!desk.querySelector('#newsStatus')) {
      const status=document.createElement('div'); status.id='newsStatus'; status.textContent='LIVE NEWS'; head?.after(status);
    }
    const refresh=document.querySelector('#refreshNews');
    if (refresh && !refresh.dataset.homeAuthority) { refresh.dataset.homeAuthority='1'; refresh.addEventListener('click', e=>{e.preventDefault();e.stopImmediatePropagation();void loadNews();}, true); }
    const genre=document.querySelector('#newsGenre');
    if (genre && !genre.dataset.homeAuthority) { genre.dataset.homeAuthority='1'; genre.addEventListener('change', ()=>void loadNews(), true); }
    if (desk.dataset.homeAuthority !== '1') { desk.dataset.homeAuthority='1'; void loadNews(); }
  };

  const wireMapCommand = () => {
    const form=document.querySelector('#commandForm');
    if (!form || form.dataset.mapAuthority==='1') return;
    form.dataset.mapAuthority='1';
    form.addEventListener('submit', e => {
      const input=document.querySelector('#commandInput');
      const text=String(input?.value || '').trim();
      const match=text.match(/(?:directions?|navigate|route|take me|go)\s+(?:to|towards)\s+(.+)/i);
      if (!match) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const destination=match[1].trim();
      const nav=document.querySelector('.nav[data-app="maps"]');
      if (nav) nav.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
      setTimeout(()=>{
        const mapInput=document.querySelector('#mapQuery');
        if (mapInput) { mapInput.value=destination; mapInput.dispatchEvent(new Event('input',{bubbles:true})); document.querySelector('#mapSearch')?.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); }
      },20);
    }, true);
  };

  const style = () => {
    if(document.querySelector('#jarvis-home-authority-style')) return;
    const s=document.createElement('style'); s.id='jarvis-home-authority-style'; s.textContent='#newsDesk{display:block}#newsStatus{font:600 9px/1 ui-monospace,monospace;color:var(--cyan);letter-spacing:.08em;margin:8px 0}.news-controls select{margin-right:8px}'; document.head.appendChild(s);
  };

  const boot=()=>{style();ensureHome();wireMapCommand();};
  boot();
  new MutationObserver(boot).observe(document.documentElement,{childList:true,subtree:true});
})();
