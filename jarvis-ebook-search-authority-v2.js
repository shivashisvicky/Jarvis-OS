(() => {
  'use strict';
  if (window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V11__) return;
  window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V11__ = true;

  const API = 'https://gutendex.com/books/';
  const JINA = 'https://r.jina.ai/http://gutendex.com/books/';
  const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const normalize = (s) => clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const authors = (b) => (b.authors || []).map(a => a.name).join(', ') || 'Unknown author';
  const cover = (b) => b.formats?.['image/jpeg'] || '';
  const epub = (b) => b.formats?.['application/epub+zip'] || '';
  const esc = (s) => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const isTextBook = (b) => String(b?.media_type || '').toLowerCase() === 'text' || Object.keys(b?.formats || {}).some(k => /^text\/(plain|html)/i.test(k));
  const authorMatches = (b, query) => {
    const wanted = normalize(query).split(' ').filter(Boolean);
    const names = (b.authors || []).map(a => normalize(a.name || ''));
    return wanted.length > 0 && names.some(name => wanted.every(token => name.split(' ').some(part => part === token || part.startsWith(token))));
  };

  const trace = (event, detail = {}) => {
    try { console.info('[JARVIS:GUTENBERG_TRACE]', event, detail); } catch {}
    try { window.dispatchEvent(new CustomEvent('jarvis:gutenberg-trace', { detail: { event, ...detail, at: Date.now() } })); } catch {}
  };

  const fetchJson = async (url, ms = 9000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
      const r = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data || !Array.isArray(data.results)) throw new Error('Invalid Gutenberg response');
      return data.results;
    } finally { clearTimeout(timer); }
  };

  const stableRank = (results, query) => {
    const nq = normalize(query);
    if (!nq) return results;
    const scored = results.map((b, original) => {
      const title = normalize(b.title || '');
      const author = normalize(authors(b));
      let score = 0;
      if (title === nq) score += 1000;
      if (author === nq) score += 900;
      if (title.startsWith(nq)) score += 300;
      if (title.includes(nq)) score += 180;
      if (author.includes(nq)) score += 220;
      if (authorMatches(b, query)) score += 260;
      const words = nq.split(' ').filter(Boolean);
      score += words.reduce((n, w) => n + (title.includes(w) ? 12 : 0) + (author.includes(w) ? 10 : 0), 0);
      return { b, original, score };
    });
    return scored.sort((a, b) => b.score - a.score || a.original - b.original).map(x => x.b);
  };

  const warmCache = (query, results) => {
    try { sessionStorage.setItem(`jarvis:gutenberg:warm:${normalize(query)}`, JSON.stringify({ at: Date.now(), results })); } catch {}
  };
  const readWarmCache = (query) => {
    try {
      const x = JSON.parse(sessionStorage.getItem(`jarvis:gutenberg:warm:${normalize(query)}`) || '');
      if (x && Array.isArray(x.results) && Date.now() - x.at < 30 * 60 * 1000) return x.results;
    } catch {}
    return null;
  };

  const searchRemote = async (query) => {
    const cleanQuery = clean(query);
    const q = encodeURIComponent(cleanQuery);
    const surname = encodeURIComponent(cleanQuery.split(/\s+/).filter(Boolean).slice(-1)[0] || cleanQuery);
    const cached = readWarmCache(query);
    if (cached?.length) {
      const usable = cached.filter(isTextBook);
      trace('WARM_CACHE_HIT', { query: cleanQuery, count: usable.length });
      if (usable.length) return stableRank(usable, query);
    }

    const candidates = [
      `${API}?search=${q}&languages=en&mime_type=text%2F`,
      `${API}?search=${q}&mime_type=text%2F`,
      `${JINA}?search=${q}&languages=en&mime_type=text%2F`,
      `${JINA}?search=${q}&mime_type=text%2F`
    ];
    trace('REMOTE_SEARCH_START', { query: cleanQuery, candidates: candidates.length });

    const collect = async (urls) => {
      const byId = new Map();
      for (const url of urls) {
        try {
          const results = await fetchJson(url);
          const usable = results.filter(isTextBook);
          trace('REMOTE_SEARCH_RESULT', { query: cleanQuery, url, count: usable.length, firstTitle: usable[0]?.title || '' });
          usable.forEach(b => { if (!byId.has(b.id)) byId.set(b.id, b); });
          if (byId.size >= 20) break;
        } catch (error) {
          trace('REMOTE_SEARCH_ERROR', { query: cleanQuery, url, error: String(error?.message || error) });
        }
      }
      return [...byId.values()];
    };

    for (let round = 0; round < 2; round++) {
      const results = await collect(candidates);
      if (results.length) return stableRank(results, query);
      await new Promise(r => setTimeout(r, 300));
    }

    if (surname && surname !== q) {
      trace('AUTHOR_SURNAME_FALLBACK', { query: cleanQuery, surname: decodeURIComponent(surname) });
      const authorCandidates = [
        `${API}?search=${surname}&languages=en&mime_type=text%2F`,
        `${JINA}?search=${surname}&languages=en&mime_type=text%2F`
      ];
      const results = (await collect(authorCandidates)).filter(b => authorMatches(b, cleanQuery) || normalize(authors(b)).includes(normalize(decodeURIComponent(surname))));
      if (results.length) return stableRank(results, query);
    }

    trace('REMOTE_SEARCH_EMPTY', { query: cleanQuery });
    return [];
  };

  const remember = (results, query) => {
    const compact = results.slice(0, 20).map((b, index) => ({ index, id: b.id, title: b.title || '', author: authors(b), type: 'BOOK' }));
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
      resultsEl.innerHTML = '<div class="jbe6-status">NO READABLE GUTENBERG EDITIONS FOUND. TRY ANOTHER TITLE OR AUTHOR.</div>';
      if (line) line.textContent = 'NO RESULTS';
      trace('RENDER_EMPTY', { query: clean(query) });
      return;
    }
    const ranked = stableRank(results.filter(isTextBook), query);
    resultsEl.innerHTML = ranked.slice(0, 20).map((b, i) => {
      const image = cover(b) ? `<img class="jbe6-cover" src="${esc(cover(b))}" alt="">` : '<div class="jbe6-cover"></div>';
      const e = epub(b);
      return `<article class="jbe6-book" data-book-id="${esc(b.id)}" data-book-query="${esc(query)}"><div>${image}</div><div><div class="jbe6-name">${i + 1}. ${esc(b.title)}</div><div class="jbe6-author">${esc(authors(b))}</div><div class="jbe6-desc">${esc((b.subjects || []).slice(0, 3).join(' · '))}</div></div><div class="jbe6-actions"><button type="button" class="jbe6-link primary" data-rel-read="${esc(b.id)}" data-title="${esc(b.title)}" data-epub="${esc(e)}">READ IN JARVIS</button><a class="jbe6-link" href="https://www.gutenberg.org/ebooks/${encodeURIComponent(b.id)}" target="_blank" rel="noopener">OPEN GUTENBERG</a></div></article>`;
    }).join('');
    if (line) line.textContent = `${Math.min(20, ranked.length)} RESULTS · GUTENBERG TEXT`;
    trace('RENDER_RESULTS', { query: clean(query), count: ranked.length, firstTitle: ranked[0]?.title || '' });
    remember(ranked, query);
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
    trace('SEARCH_START', { query, seq: mySeq });
    resultsEl.innerHTML = '<div class="jbe6-status">SEARCHING GUTENBERG TEXT EDITIONS…</div>';
    if (line) line.textContent = 'SEARCHING TEXT';
    const results = await searchRemote(query);
    if (mySeq !== seq || normalize(input.value) !== normalize(query)) { trace('SEARCH_STALE', { query, seq: mySeq, currentSeq: seq, input: input.value }); return; }
    render(results, query);
  };

  const searchResolved = async (raw, resolvedResults) => {
    const query = clean(raw);
    const results = Array.isArray(resolvedResults) ? stableRank(resolvedResults.filter(isTextBook), query) : [];
    if (!query || !results.length) return false;
    const input = document.querySelector('#jbe6Query');
    const resultsEl = document.querySelector('#jbe6Results');
    if (!input || !resultsEl) return false;
    ++seq;
    input.value = query;
    render(results, query);
    trace('RESOLVED_RENDER', { query, count: results.length, firstTitle: results[0]?.title || '' });
    return true;
  };

  const handleSearchClick = (event) => {
    const target = event.target?.closest?.('#jbe6Search'); if (!target) return;
    const panel = target.closest('#jbe6Panel'); const input = panel?.querySelector?.('#jbe6Query') || document.querySelector('#jbe6Query'); if (!input) return;
    event.preventDefault(); event.stopImmediatePropagation(); trace('DOCUMENT_SEARCH_INTERCEPT', { query: clean(input.value) }); search(input.value);
  };
  const handleSearchKeydown = (event) => {
    if (event.key !== 'Enter') return; const input = event.target?.closest?.('#jbe6Query'); if (!input) return;
    event.preventDefault(); event.stopImmediatePropagation(); trace('DOCUMENT_SEARCH_ENTER_INTERCEPT', { query: clean(input.value) }); search(input.value);
  };
  document.addEventListener('click', handleSearchClick, true);
  document.addEventListener('keydown', handleSearchKeydown, true);

  const wirePanel = (panel) => {
    if (!panel || panel.__jarvisSearchV11) return;
    panel.__jarvisSearchV11 = true;
    const input = panel.querySelector('#jbe6Query'); const button = panel.querySelector('#jbe6Search'); if (!input || !button) return;
    const submit = (event) => { event?.preventDefault?.(); event?.stopImmediatePropagation?.(); search(input.value); };
    button.addEventListener('click', submit, true); input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(e); }, true); input.addEventListener('input', () => { input.dataset.jarvisUserQuery = '1'; }, true);
  };
  const scan = () => wirePanel(document.querySelector('#jbe6Panel'));
  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scan(); setInterval(scan, 500);

  // Reconcile the ebook panel after other UI layers mount or replace the
  // default catalogue. This preserves voice-resolved searches such as
  // "John Henry Newman" without touching other domains.
  let reconciledQuery = '';
  let reconcileTimer = null;
  const reconcile = () => {
    const input = document.querySelector('#jbe6Query');
    const results = document.querySelector('#jbe6Results');
    if (!input || !results) return false;
    const query = clean(input.value);
    if (!query || query.length < 2) return false;
    const normalizedQuery = normalize(query);
    if (normalizedQuery === reconciledQuery) return false;

    const books = [...results.querySelectorAll('.jbe6-book')];
    const line = document.querySelector('#jbe6StatusLine')?.textContent || '';
    const searching = /SEARCHING/i.test(line) || !!results.querySelector('.jbe6-status');
    if (searching) return false;

    const matchingBook = books.some((el) => {
      const title = normalize(el.querySelector('.jbe6-name')?.textContent || '');
      const author = normalize(el.querySelector('.jbe6-author')?.textContent || '');
      return title.includes(normalizedQuery) || author.includes(normalizedQuery);
    });
    if (matchingBook) {
      reconciledQuery = normalizedQuery;
      return false;
    }

    reconciledQuery = normalizedQuery;
    trace('RECONCILE_DEFAULT_CATALOGUE', { query, displayedBooks: books.length });
    search(query);
    return true;
  };
  const scheduleReconcile = () => {
    clearTimeout(reconcileTimer);
    reconcileTimer = setTimeout(() => {
      reconcile();
      setTimeout(reconcile, 150);
      setTimeout(reconcile, 450);
      setTimeout(reconcile, 1000);
    }, 0);
  };
  document.addEventListener('input', (event) => {
    if (event.target?.id === 'jbe6Query') {
      reconciledQuery = '';
      scheduleReconcile();
    }
  }, true);
  const reconcileObserver = new MutationObserver(scheduleReconcile);
  reconcileObserver.observe(document.documentElement, { childList: true, subtree: true });
  scheduleReconcile();

  window.jarvisEbookSearchAuthority = { version: '11.0.0', search, searchResolved, rank: stableRank };
  window.__JARVIS_GUTENBERG_WARM__ = async (query='Beowulf') => { try { const results = await fetchJson(`${API}?search=${encodeURIComponent(query)}&languages=en&mime_type=text%2F`, 12000); if(results.length) warmCache(query, results.filter(isTextBook)); trace('WARM_FETCH_COMPLETE', { query, count: results.length }); return results; } catch(error) { trace('WARM_FETCH_ERROR', { query, error:String(error) }); return []; } };
})();
