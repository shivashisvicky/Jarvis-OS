(() => {
  'use strict';
  if (window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V2__) return;
  window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V2__ = true;

  const API = 'https://gutendex.com/books/';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const authors = (b) => (b.authors || []).map(a => a.name).join(', ') || 'Unknown author';
  const cover = (b) => b.formats?.['image/jpeg'] || '';
  const epub = (b) => b.formats?.['application/epub+zip'] || '';

  const request = async (url, ms = 9000) => {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms);
    try {
      const r = await fetch(url, { signal: c.signal, cache: 'no-store', headers: { Accept: 'application/json,text/plain;q=.8,*/*;q=.1' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const text = await r.text();
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.results)) throw new Error('Invalid Gutenberg response');
      return data.results;
    } finally { clearTimeout(t); }
  };

  const search = async (q) => {
    const query = String(q || '').trim();
    if (!query) return;
    const results = document.querySelector('#jbe6Results');
    const status = document.querySelector('#jbe6StatusLine');
    if (!results) return;
    results.innerHTML = '<div class="jbe6-status">SEARCHING GUTENBERG…</div>';
    if (status) status.textContent = 'SEARCHING';

    const direct = `${API}?search=${encodeURIComponent(query)}&languages=en&mime_type=text%2Fplain`;
    const plain = `${API}?search=${encodeURIComponent(query)}`;
    const jina = `https://r.jina.ai/${direct}`;
    const jinaHttp = `https://r.jina.ai/http://gutendex.com/books/?search=${encodeURIComponent(query)}`;
    const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`;

    let books = [];
    for (let round = 0; round < 3 && !books.length; round++) {
      try {
        books = await Promise.any([direct, jina, jinaHttp, proxy].map(u => request(u, 9000)));
      } catch {}
      if (!books.length) {
        try { books = await request(plain, 9000); } catch {}
      }
      if (!books.length && round < 2) await new Promise(r => setTimeout(r, 600));
    }

    if (!books.length) {
      results.innerHTML = '<div class="jbe6-status">GUTENBERG SEARCH TEMPORARILY UNAVAILABLE. <button class="jbe6-link" id="jbe6RetrySearch">RETRY</button></div>';
      if (status) status.textContent = 'SEARCH ERROR';
      results.querySelector('#jbe6RetrySearch')?.addEventListener('click', () => search(query));
      return;
    }

    results.innerHTML = books.slice(0, 20).map((b, i) => {
      const img = cover(b) ? `<img class="jbe6-cover" src="${esc(cover(b))}" alt="">` : '<div class="jbe6-cover"></div>';
      const e = epub(b);
      return `<article class="jbe6-book"><div>${img}</div><div><div class="jbe6-name">${i + 1}. ${esc(b.title)}</div><div class="jbe6-author">${esc(authors(b))}</div><div class="jbe6-desc">${esc((b.subjects || []).slice(0, 3).join(' · '))}</div></div><div class="jbe6-actions"><button class="jbe6-link primary" data-rel-read="${esc(b.id)}" data-title="${esc(b.title)}" data-epub="${esc(e)}">READ IN JARVIS</button><a class="jbe6-link" href="https://www.gutenberg.org/ebooks/${encodeURIComponent(b.id)}" target="_blank" rel="noopener">OPEN GUTENBERG</a></div></article>`;
    }).join('');
    if (status) status.textContent = `${Math.min(20, books.length)} RESULTS · GUTENBERG`;
  };

  const intercept = (e) => {
    const btn = e.target?.closest?.('#jbe6Search');
    if (!btn) return;
    const input = document.querySelector('#jbe6Query');
    if (!input) return;
    e.preventDefault(); e.stopImmediatePropagation(); search(input.value);
  };
  document.addEventListener('click', intercept, true);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const input = e.target?.closest?.('#jbe6Query');
    if (!input) return;
    e.preventDefault(); e.stopImmediatePropagation(); search(input.value);
  }, true);
})();
