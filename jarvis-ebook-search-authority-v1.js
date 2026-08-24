(() => {
  'use strict';
  if (window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V1__) return;
  window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V1__ = true;

  const API = 'https://gutendex.com/books/';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const authors = (b) => (b.authors || []).map(a => a.name).join(', ') || 'Unknown author';
  const cover = (b) => b.formats?.['image/jpeg'] || '';
  const epub = (b) => b.formats?.['application/epub+zip'] || '';

  async function search(q) {
    const query = String(q || '').trim();
    if (!query) return;
    const results = document.querySelector('#jbe6Results');
    const status = document.querySelector('#jbe6StatusLine');
    if (!results) return;
    results.innerHTML = '<div class="jbe6-status">SEARCHING GUTENBERG…</div>';
    if (status) status.textContent = 'SEARCHING';
    try {
      const r = await fetch(`${API}?search=${encodeURIComponent(query)}&languages=en&mime_type=text%2Fplain`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`Gutendex HTTP ${r.status}`);
      const data = await r.json();
      let books = Array.isArray(data.results) ? data.results : [];
      if (!books.length) {
        const fallback = await fetch(`${API}?search=${encodeURIComponent(query)}`, { cache: 'no-store' });
        if (fallback.ok) books = (await fallback.json()).results || [];
      }
      if (!books.length) {
        results.innerHTML = '<div class="jbe6-status">NO GUTENBERG BOOKS FOUND.</div>';
        if (status) status.textContent = '0 RESULTS';
        return;
      }
      results.innerHTML = books.slice(0, 20).map((b, i) => {
        const img = cover(b) ? `<img class="jbe6-cover" src="${esc(cover(b))}" alt="">` : '<div class="jbe6-cover"></div>';
        const e = epub(b);
        return `<article class="jbe6-book"><div>${img}</div><div><div class="jbe6-name">${i + 1}. ${esc(b.title)}</div><div class="jbe6-author">${esc(authors(b))}</div><div class="jbe6-desc">${esc((b.subjects || []).slice(0, 3).join(' · '))}</div></div><div class="jbe6-actions"><button class="jbe6-link primary" data-rel-read="${esc(b.id)}" data-title="${esc(b.title)}" data-epub="${esc(e)}">READ IN JARVIS</button><a class="jbe6-link" href="https://www.gutenberg.org/ebooks/${encodeURIComponent(b.id)}" target="_blank" rel="noopener">OPEN GUTENBERG</a></div></article>`;
      }).join('');
      if (status) status.textContent = `${Math.min(20, books.length)} RESULTS · GUTENBERG`;
    } catch (e) {
      results.innerHTML = `<div class="jbe6-status">SEARCH FAILED. <button class="jbe6-link" id="jbe6RetrySearch">RETRY</button></div>`;
      document.querySelector('#jbe6RetrySearch')?.addEventListener('click', () => search(query));
      if (status) status.textContent = 'SEARCH ERROR';
      console.warn('[JARVIS ebook search authority]', e);
    }
  }

  const intercept = (e) => {
    const btn = e.target?.closest?.('#jbe6Search');
    if (!btn) return;
    const input = document.querySelector('#jbe6Query');
    if (!input) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    search(input.value);
  };
  document.addEventListener('click', intercept, true);
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const input = e.target?.closest?.('#jbe6Query');
    if (!input) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    search(input.value);
  }, true);
})();
