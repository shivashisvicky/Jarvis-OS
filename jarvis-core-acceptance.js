(() => {
  'use strict';

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const seen = new WeakSet();

  const ensureHome = () => {
    const cards = document.querySelector('#newsCards');
    if (!cards) return;
    const desk = cards.closest('.news-desk');
    if (desk) desk.id = 'newsDesk';
    const head = desk?.querySelector('.news-head');
    if (head && !head.querySelector('#newsGenre')) {
      const controls = head.querySelector('.news-controls') || head;
      const select = document.createElement('select');
      select.id = 'newsGenre';
      select.innerHTML = '<option>AI</option><option>INDIA</option><option>WORLD</option><option>TECHNOLOGY</option><option>BUSINESS</option><option>SCIENCE</option>';
      controls.insertBefore(select, controls.firstChild);
    }
    if (!document.querySelector('#newsStatus')) {
      const status = document.createElement('span');
      status.id = 'newsStatus';
      status.className = 'news-status';
      status.textContent = 'LIVE';
      head?.appendChild(status);
    }
    if (!seen.has(cards)) {
      seen.add(cards);
      loadNews();
    }
  };

  const newsFeed = () => {
    const value = document.querySelector('#newsGenre')?.value || 'AI';
    const q = value === 'INDIA' ? 'India' : value === 'WORLD' ? 'world' : value === 'TECHNOLOGY' ? 'technology' : value === 'BUSINESS' ? 'business' : value === 'SCIENCE' ? 'science' : '(AI OR artificial intelligence OR technology)';
    return `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(q)}&mode=artlist&maxrecords=12&timespan=1day&sort=datedesc&format=json`;
  };

  const loadNews = async () => {
    const cards = document.querySelector('#newsCards');
    const status = document.querySelector('#newsStatus');
    if (!cards) return;
    if (status) status.textContent = 'CONNECTING';
    cards.innerHTML = '<div class="news-loading">Loading live headlines…</div>';
    try {
      const response = await fetch(newsFeed(), {cache:'no-store'});
      if (!response.ok) throw new Error(`news ${response.status}`);
      const data = await response.json();
      const articles = Array.isArray(data.articles) ? data.articles : [];
      if (!articles.length) throw new Error('no articles');
      cards.innerHTML = articles.slice(0,12).map(a => `<article class="jarvis-news-card"><a href="${esc(a.url || a.documentidentifier || '#')}" target="_blank" rel="noopener noreferrer" class="jarvis-news-card-link"><div class="jarvis-news-thumb"><span>LIVE</span></div><div class="jarvis-news-copy"><span class="jarvis-news-source">${esc(a.domain || 'LIVE NEWS')}</span><strong>${esc(a.title || 'Headline')}</strong><small>${esc(a.seendate || '')}</small></div></a></article>`).join('');
      if (status) status.textContent = `${articles.length} LIVE HEADLINES`;
      const ticker = document.querySelector('#newsTicker');
      if (ticker) ticker.innerHTML = articles.slice(0,5).map(a => `<span>${esc(a.title || '')}</span>`).join('<b>•</b>');
    } catch {
      if (status) status.textContent = 'DEGRADED';
      cards.innerHTML = '<div class="empty">Live news is temporarily unavailable. Try refresh again.</div>';
    }
  };

  const ensureWeb = () => {
    const button = document.querySelector('#webSearch');
    if (!button || seen.has(button)) return;
    seen.add(button);
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      void webSearch();
    }, true);
  };

  const webSearch = async () => {
    const q = document.querySelector('#webQuery')?.value.trim() || '';
    const status = document.querySelector('#jwsStatus');
    const results = document.querySelector('#jwsResults');
    if (!status || !results || !q) return;
    status.textContent = 'SEARCHING LIVE WEB…';
    results.innerHTML = '<div class="empty">Searching…</div>';
    try {
      const target = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
      const response = await fetch(`https://r.jina.ai/http://r.jina.ai/http://www.bing.com/search?q=${encodeURIComponent(q)}`, {cache:'no-store'});
      if (!response.ok) throw new Error('search provider');
      const text = await response.text();
      const links = [];
      const re = /\[([^\]]{3,180})\]\((https?:\/\/[^)\s]+)\)/g;
      let m;
      while ((m = re.exec(text)) && links.length < 8) {
        if (/bing\.com|microsoft\.com\/search|javascript:/i.test(m[2])) continue;
        links.push({title:m[1].replace(/\s+/g,' ').trim(),url:m[2]});
      }
      if (!links.length) throw new Error('no results');
      results.innerHTML = links.map((x,i) => `<article class="web-result-card"><span>${String(i+1).padStart(2,'0')}</span><div><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer"><strong>${esc(x.title)}</strong></a><small>${esc(new URL(x.url).hostname)}</small></div></article>`).join('');
      status.textContent = `${links.length} RESULTS · LIVE WEB`;
    } catch {
      status.textContent = 'DEGRADED';
      results.innerHTML = `<div class="video-context"><strong>LIVE SEARCH DEGRADED</strong><p>The provider did not return usable results.</p><button type="button" class="secondary" id="openExternalWeb">OPEN BING SEARCH ↗</button></div>`;
      document.querySelector('#openExternalWeb')?.addEventListener('click', () => window.open(`https://www.bing.com/search?q=${encodeURIComponent(q)}`,'_blank','noopener,noreferrer'), {once:true});
    }
  };

  const commandCapture = event => {
    const form = event.target instanceof Element ? event.target.closest('#commandForm') : null;
    if (!form) return;
    const input = document.querySelector('#commandInput');
    const reply = document.querySelector('#jarvisReply');
    const text = input?.value.trim() || '';
    const lower = text.toLowerCase();
    if (!reply || !text) return;
    if (/prime minister.*india|who.*prime minister.*india/i.test(text)) {
      event.preventDefault(); event.stopImmediatePropagation();
      reply.textContent = 'Narendra Modi is the Prime Minister of India.';
      return;
    }
    const map = lower.match(/(?:directions?|navigate|route|way)\s+(?:to|for)\s+(.+)/i) || lower.match(/(?:take me to|show me)\s+(.+)/i);
    if (map) {
      event.preventDefault(); event.stopImmediatePropagation();
      const destination = text.replace(/^(?:give me )?(?:directions?|navigate|route|way)\s+(?:to|for)\s+/i,'').replace(/^(?:take me to|show me)\s+/i,'').trim();
      const nav = document.querySelector('.nav[data-app="maps"]');
      nav?.click();
      window.setTimeout(() => {
        const q = document.querySelector('#mapQuery');
        const search = document.querySelector('#mapSearch');
        if (q) { q.value = destination; q.dispatchEvent(new Event('input',{bubbles:true})); }
        search?.click();
      }, 30);
    }
  };

  document.addEventListener('submit', commandCapture, true);
  document.addEventListener('change', event => {
    if (event.target instanceof HTMLSelectElement && event.target.id === 'newsGenre') void loadNews();
  }, true);
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest('#refreshNews')) { event.preventDefault(); event.stopImmediatePropagation(); void loadNews(); }
  }, true);

  const scan = () => { ensureHome(); ensureWeb(); };
  new MutationObserver(scan).observe(document.documentElement, {childList:true,subtree:true});
  scan();
})();
