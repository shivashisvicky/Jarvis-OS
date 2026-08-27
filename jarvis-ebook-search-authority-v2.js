(() => {
  'use strict';
  if (window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V8__) return;
  window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V8__ = true;

  const API = 'https://gutendex.com/books/';
  const JINA = 'https://r.jina.ai/http://gutendex.com/books/';
  const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const normalize = (s) => clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const authors = (b) => (b.authors || []).map(a => a.name).join(', ') || 'Unknown author';
  const cover = (b) => b.formats?.['image/jpeg'] || '';
  const epub = (b) => b.formats?.['application/epub+zip'] || '';
  const esc = (s) => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  const fetchJson = async (url, ms = 9000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const r = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data || !Array.isArray(data.results)) throw new Error('Invalid Gutenberg response');
      if (!data.results.length) throw new Error('Empty Gutenberg response');
      return data.results;
    } finally { clearTimeout(timer); }
  };

  const searchRemote = async (query) => {
    const q = encodeURIComponent(clean(query));
    const candidates = [
      `${API}?search=${q}`,
      `${API}?search=${q}&languages=en`,
      `${JINA}?search=${q}`,
      `${JINA}?search=${q}&languages=en`
    ];
    for (let round = 0; round < 2; round++) {
      for (const url of candidates) {
        try {
          const results = await fetchJson(url);
          if (results.length) return results;
        } catch {}
      }
      await new Promise(r => setTimeout(r, 300));
    }
    return [];
  };

  const remember = (results, query) => {
    const compact = results.slice(0, 20).map((b, index) => ({
      index,
      id: b.id,
      title: b.title || '',
      author: authors(b),
      type: 'BOOK'
    }));
    try {
      window.jarvisContextEngine?.set({ domain: 'BOOKS', active: true, entity: { type: 'BOOK', title: compact[0]?.title || '' }, query, results: compact, selected: null }, 'merge');
      window.dispatchEvent(new CustomEvent('jarvis:ebook-context', { detail: { domain: 'BOOKS', active: true, entity: { type: 'BOOK', title: compact[0]?.title || '' }, query, results: compact, selected: null } }));
    } catch {}
  };

  const render = (results, query) => {
    const resultsEl = document.querySelector('#jbe6Results');
    const line = document.querySelector('#jbe6StatusLine');
    if (!resultsEl) return;
    if (!results.length) {
      resultsEl.innerHTML = '<div class="jbe6-status">GUTENBERG SEARCH TEMPORARILY UNAVAILABLE. TAP BROWSE TO RETRY.</div>';
      if (line) line.textContent = 'SEARCH ERROR';
      return;
    }
    resultsEl.innerHTML = results.slice(0, 20).map((b, i) => {
      const image = cover(b) ? `<img class="jbe6-cover" src="${esc(cover(b))}" alt="">` : '<div class="jbe6-cover"></div>';
      const e = epub(b);
      return `<article class="jbe6-book" data-book-id="${esc(b.id)}" data-book-query="${esc(query)}"><div>${image}</div><div><div class="jbe6-name">${i + 1}. ${esc(b.title)}</div><div class="jbe6-author">${esc(authors(b))}</div><div class="jbe6-desc">${esc((b.subjects || []).slice(0, 3).join(' · '))}</div></div><div class="jbe6-actions"><button type="button" class="jbe6-link primary" data-rel-read="${esc(b.id)}" data-title="${esc(b.title)}" data-epub="${esc(e)}">READ IN JARVIS</button><a class="jbe6-link" href="https://www.gutenberg.org/ebooks/${encodeURIComponent(b.id)}" target="_blank" rel="noopener">OPEN GUTENBERG</a></div></article>`;
    }).join('');
    if (line) line.textContent = `${Math.min(20, results.length)} RESULTS · GUTENBERG`;
    remember(results, query);
  };

  let seq = 0;
  const search = async (raw) => {
    const query = clean(raw);
    if (!query || query.length < 2) return;
    const mySeq = ++seq;
    const input = document.querySelector('#jbe6Query');
    const resultsEl = document.querySelector('#jbe6Results');
    const line = document.querySelector('#jbe6StatusLine');
    if (!input || !resultsEl) return;
    input.value = query;
    resultsEl.innerHTML = '<div class="jbe6-status">SEARCHING GUTENBERG…</div>';
    if (line) line.textContent = 'SEARCHING';
    const results = await searchRemote(query);
    if (mySeq !== seq || normalize(input.value) !== normalize(query)) return;
    render(results, query);
  };

  const wirePanel = (panel) => {
    if (!panel || panel.__jarvisSearchV8) return;
    panel.__jarvisSearchV8 = true;
    const input = panel.querySelector('#jbe6Query');
    const button = panel.querySelector('#jbe6Search');
    if (!input || !button) return;

    const submit = (event) => {
      event?.preventDefault?.();
      event?.stopImmediatePropagation?.();
      search(input.value);
    };
    button.addEventListener('click', submit, true);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') submit(e);
    }, true);
    input.addEventListener('input', () => {
      input.dataset.jarvisUserQuery = '1';
    }, true);

    if (clean(input.value).length >= 2 && input.dataset.jarvisUserQuery === '1') {
      search(input.value);
    }
  };

  const scan = () => wirePanel(document.querySelector('#jbe6Panel'));
  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan();
  setInterval(scan, 500);

  window.jarvisEbookSearchAuthority = { version: '8.0.0', search };
})();
