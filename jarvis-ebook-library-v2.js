(() => {
  'use strict';
  if (window.__JARVIS_EBOOK_LIBRARY_V6__) return;
  window.__JARVIS_EBOOK_LIBRARY_V6__ = true;

  const API = 'https://gutendex.com/books/';
  const JINA = 'https://r.jina.ai/';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
  const norm = (s) => String(s ?? '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

  const css = () => {
    if (document.querySelector('#jbe6Css')) return;
    const s = document.createElement('style');
    s.id = 'jbe6Css';
    s.textContent = `
      .jbe6{border:1px solid var(--line);border-radius:14px;background:linear-gradient(145deg,rgba(8,20,28,.96),rgba(3,9,14,.94));padding:14px;display:grid;gap:12px}
      .jbe6-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
      .jbe6-title{font-size:11px;font-weight:900;letter-spacing:.12em;color:#dffaff}
      .jbe6-sub{font-size:8px;color:#69858d;margin-top:4px}
      .jbe6-search{display:grid;grid-template-columns:1fr auto;gap:8px}
      .jbe6-search input{min-width:0;background:rgba(2,9,14,.85);border:1px solid var(--line);color:var(--text);border-radius:9px;padding:11px}
      .jbe6-btn{border:1px solid #b9f3ff;background:linear-gradient(180deg,#9deeff,#3ebddd);color:#041116;border-radius:9px;padding:0 14px;font-size:8px;font-weight:900;letter-spacing:.1em}
      .jbe6-results{display:grid;gap:8px;max-height:460px;overflow:auto}
      .jbe6-book{display:grid;grid-template-columns:58px minmax(0,1fr) auto;gap:10px;align-items:center;padding:10px;border:1px solid rgba(135,221,245,.12);border-radius:10px;background:rgba(4,13,19,.55)}
      .jbe6-cover{width:58px;height:76px;object-fit:cover;border-radius:5px;background:#0b171e;border:1px solid var(--line)}
      .jbe6-name{font-size:10px;font-weight:800;color:#dffaff}.jbe6-author{font-size:8px;color:#7d9ba3;margin-top:4px}
      .jbe6-desc{font-size:7px;line-height:1.45;color:#63818a;margin-top:5px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
      .jbe6-actions{display:flex;flex-direction:column;gap:6px}.jbe6-link{border:1px solid var(--line);background:rgba(5,14,20,.9);color:#a6c5cc;border-radius:7px;padding:8px 9px;font-size:7px;text-decoration:none;text-align:center;white-space:nowrap}.jbe6-link.primary{border-color:#8fe9fa;color:#dffaff}
      .jbe6-status{font-size:8px;color:#78959d;padding:8px 2px}
      .jbe6-reader{position:fixed;inset:0;z-index:5200;background:rgba(1,5,8,.98);backdrop-filter:blur(12px);display:flex;flex-direction:column;padding:10px}
      .jbe6-card{width:100%;height:100%;background:#061018;border:1px solid var(--line-strong);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
      .jbe6-bar{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line);background:#061018;color:#dffaff;min-height:48px}
      .jbe6-titlebar{flex:1;min-width:0;font-size:10px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.jbe6-meta{font-size:7px;color:#78959d}
      .jbe6-bar button,.jbe6-foot button{border:1px solid var(--line);background:rgba(4,13,19,.95);color:#c8e4e9;border-radius:7px;padding:8px 10px;font-size:7px;font-weight:900;white-space:nowrap}
      .jbe6-content{flex:1;min-height:0;overflow:auto;background:#fff;color:#172126}.jbe6-page{max-width:820px;margin:0 auto;padding:28px 22px 80px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}
      .jbe6-statusbox{height:100%;display:grid;place-items:center;text-align:center;padding:30px;font-family:system-ui,sans-serif;color:#65747a;font-size:12px}.jbe6-statusbox strong{display:block;color:#15252a;font-size:16px;margin-bottom:8px}.jbe6-statusbox button{margin-top:14px}
      .jbe6-foot{display:flex;align-items:center;justify-content:center;gap:10px;padding:10px;border-top:1px solid var(--line);background:#061018}.jbe6-foot span{font:9px system-ui;color:#78959d;min-width:100px;text-align:center}
      @media(max-width:700px){.jbe6-search{grid-template-columns:1fr}.jbe6-btn{height:40px}.jbe6-book{grid-template-columns:48px minmax(0,1fr)}.jbe6-cover{width:48px;height:66px}.jbe6-actions{grid-column:2;flex-direction:row;flex-wrap:wrap}.jbe6-reader{padding:0}.jbe6-card{border-radius:0;border-left:0;border-right:0}.jbe6-meta{display:none}.jbe6-page{padding:22px 18px 70px;font-size:17px}}
    `;
    document.head.appendChild(s);
  };

  const isFiles = () => document.querySelector('.workspace h1')?.textContent?.trim() === 'Files';
  const timeoutFetch = async (url, init = {}, ms = 20000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try { return await fetch(url, { ...init, signal: controller.signal }); }
    finally { clearTimeout(timer); }
  };
  const proxyCandidates = (url) => {
    try {
      const u = new URL(url);
      return [
        url,
        JINA + `https://${u.host}${u.pathname}${u.search || ''}`,
        JINA + `http://${u.host}${u.pathname}${u.search || ''}`,
      ];
    } catch { return []; }
  };

  const fetchText = async (url) => {
    if (!url) return '';
    let lastErr;
    for (const candidate of proxyCandidates(url)) {
      try {
        const r = await timeoutFetch(candidate, { cache: 'no-store', headers: { Accept: 'text/plain,text/html;q=0.9,*/*;q=0.1' } }, 20000);
        if (!r.ok) { lastErr = new Error(`HTTP ${r.status}`); continue; }
        const text = await r.text();
        if (text && text.trim().length > 200) return text;
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('No ebook content returned');
  };

  const extractHtmlText = (raw, baseUrl) => {
    const doc = new DOMParser().parseFromString(raw, 'text/html');
    doc.querySelectorAll('script,style,noscript,iframe,object,embed,form,nav').forEach((x) => x.remove());
    const root = doc.body || doc.documentElement;
    if (!root) return '';
    const title = doc.title?.trim();
    const body = root.innerText || root.textContent || '';
    const header = title ? `${title}\n\n` : '';
    const cleaned = `${header}${body}`.replace(/\n{3,}/g, '\n\n').trim();
    if (baseUrl && cleaned.length > 200) return cleaned;
    return '';
  };

  const splitPages = (text) => {
    let t = String(text || '').replace(/\r/g, '').trim();
    const start = t.match(/\*\*\* START OF (?:THE )?PROJECT GUTENBERG EBOOK[^\n]*\n/i);
    if (start) t = t.slice((start.index || 0) + start[0].length);
    t = t.replace(/\n\*\*\* END OF (?:THE )?PROJECT GUTENBERG EBOOK[^\n]*[\s\S]*$/i, '').trim();
    const paragraphs = t.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
    const pages = [];
    let current = '';
    for (const paragraph of paragraphs) {
      const next = current ? `${current}\n\n${paragraph}` : paragraph;
      if (next.length > 6500 && current) { pages.push(current.trim()); current = paragraph; }
      else current = next;
    }
    if (current) pages.push(current.trim());
    return pages.length ? pages : ['No readable text was returned for this book.'];
  };

  const reader = async (book, epub) => {
    css();
    const modal = document.createElement('div');
    modal.className = 'jbe6-reader';
    modal.innerHTML = `<div class="jbe6-card"><div class="jbe6-bar"><strong class="jbe6-titlebar" id="jbe6Title">${esc(book.title)}</strong><span class="jbe6-meta" id="jbe6Meta">Loading…</span><button id="jbe6Minus">A−</button><button id="jbe6Plus">A+</button><button id="jbe6Download">DOWNLOAD EPUB</button><button id="jbe6Official">OPEN GUTENBERG</button><button id="jbe6Close">CLOSE</button></div><div class="jbe6-content" id="jbe6Content"><div class="jbe6-statusbox" id="jbe6Status">Loading book text inside JARVIS…</div><div class="jbe6-page" id="jbe6Page" hidden></div></div><div class="jbe6-foot"><button id="jbe6Prev">PREVIOUS</button><span id="jbe6Counter">1 / 1</span><button id="jbe6Next">NEXT</button></div></div>`;
    document.body.appendChild(modal);

    let pages = [];
    let page = 0;
    let size = 18;
    const pageEl = modal.querySelector('#jbe6Page');
    const statusEl = modal.querySelector('#jbe6Status');
    const meta = modal.querySelector('#jbe6Meta');
    const counter = modal.querySelector('#jbe6Counter');
    const prev = modal.querySelector('#jbe6Prev');
    const next = modal.querySelector('#jbe6Next');
    const titleEl = modal.querySelector('#jbe6Title');

    const draw = () => {
      pageEl.style.fontSize = `${size}px`;
      pageEl.textContent = pages[page] || 'No readable text.';
      pageEl.hidden = false;
      statusEl.hidden = true;
      counter.textContent = `${page + 1} / ${Math.max(1, pages.length)}`;
      prev.disabled = page <= 0;
      next.disabled = page >= pages.length - 1;
      meta.textContent = pages.length ? `${page + 1} of ${pages.length}` : 'Loading…';
      modal.querySelector('#jbe6Content').scrollTop = 0;
    };
    const official = () => window.open(`https://www.gutenberg.org/ebooks/${encodeURIComponent(book.id)}`, '_blank', 'noopener');
    modal.querySelector('#jbe6Close').onclick = () => modal.remove();
    modal.querySelector('#jbe6Official').onclick = official;
    modal.querySelector('#jbe6Download').onclick = () => { if (epub) window.location.href = epub; };
    modal.querySelector('#jbe6Minus').onclick = () => { size = Math.max(14, size - 1); draw(); };
    modal.querySelector('#jbe6Plus').onclick = () => { size = Math.min(28, size + 1); draw(); };
    prev.onclick = () => { if (page > 0) { page -= 1; draw(); } };
    next.onclick = () => { if (page < pages.length - 1) { page += 1; draw(); } };

    const load = async () => {
      statusEl.hidden = false;
      pageEl.hidden = true;
      statusEl.innerHTML = 'Loading book text inside JARVIS…';
      try {
        const metaResponse = await timeoutFetch(`${API}${encodeURIComponent(book.id)}`, { cache: 'no-store', headers: { Accept: 'application/json' } }, 15000);
        if (!metaResponse.ok) throw new Error(`Catalog HTTP ${metaResponse.status}`);
        const current = await metaResponse.json();
        titleEl.textContent = current.title || book.title || 'JARVIS READER';
        const formats = current.formats || {};
        const plainUrl = formats['text/plain; charset=utf-8'] || formats['text/plain'] || '';
        const htmlUrl = formats['text/html; charset=utf-8'] || formats['text/html'] || '';
        let raw = '';
        if (plainUrl) {
          try { raw = await fetchText(plainUrl); } catch { raw = ''; }
        }
        if (!raw && htmlUrl) {
          const htmlRaw = await fetchText(htmlUrl);
          raw = extractHtmlText(htmlRaw, htmlUrl);
        }
        if (!raw || raw.trim().length < 200) throw new Error('No readable text format');
        pages = splitPages(raw);
        draw();
      } catch (error) {
        statusEl.hidden = false;
        pageEl.hidden = true;
        meta.textContent = 'Unavailable';
        statusEl.innerHTML = `<strong>JARVIS could not load this ebook.</strong><div>The source format could not be fetched in this browser session.</div><button id="jbe6Retry">RETRY</button><button id="jbe6Fallback">OPEN GUTENBERG</button>`;
        statusEl.querySelector('#jbe6Retry').onclick = load;
        statusEl.querySelector('#jbe6Fallback').onclick = official;
        console.warn('[JARVIS ebook reader]', error);
      }
    };
    load();
  };

  const render = () => {
    if (!isFiles()) return;
    const root = document.querySelector('#jarvisFilesV4');
    if (!root) return;
    const tab = root.querySelector('.jf4-opt.active')?.dataset.tab;
    if (tab !== 'ebooks') { root.querySelector('#jbe6Panel')?.remove(); return; }
    root.querySelector('#jbe6Panel')?.remove();
    css();
    const panel = document.createElement('section');
    panel.id = 'jbe6Panel';
    panel.className = 'jbe6';
    panel.innerHTML = '<div class="jbe6-head"><div><div class="jbe6-title">PUBLIC-DOMAIN EBOOKS</div><div class="jbe6-sub">Browse Project Gutenberg books and read them entirely inside JARVIS.</div></div><span class="jbe6-status" id="jbe6StatusLine">READY</span></div><div class="jbe6-search"><input id="jbe6Query" placeholder="Search books, authors, subjects…"><button class="jbe6-btn" id="jbe6Search">BROWSE</button></div><div class="jbe6-results" id="jbe6Results"></div>';
    root.querySelector('.jf4-toolbar')?.after(panel);

    const q = panel.querySelector('#jbe6Query');
    const btn = panel.querySelector('#jbe6Search');
    const results = panel.querySelector('#jbe6Results');
    const status = panel.querySelector('#jbe6StatusLine');
    let current = [];

    const fields = (b) => norm([
      b.title,
      ...(b.authors || []).map((a) => a.name),
      ...(b.subjects || []),
      ...(b.bookshelves || [])
    ].join(' '));
    const score = (b, tokens) => {
      const title = norm(b.title);
      const author = norm((b.authors || []).map((a) => a.name).join(' '));
      const meta = fields(b);
      let value = 0;
      tokens.forEach((t) => { if (title.includes(t)) value += 12; else if (author.includes(t)) value += 10; else if (meta.includes(t)) value += 4; });
      return value;
    };

    const show = async () => {
      const query = q.value.trim();
      status.textContent = 'SEARCHING…';
      results.innerHTML = '';
      try {
        const url = query
          ? `${API}?search=${encodeURIComponent(query)}&languages=en&page=1`
          : `${API}?languages=en&page=1`;
        const r = await timeoutFetch(url, { headers: { Accept: 'application/json' }, cache: 'no-store' }, 15000);
        if (!r.ok) throw new Error(`Catalog HTTP ${r.status}`);
        const data = await r.json();
        const raw = data.results || [];
        const tokens = norm(query).split(' ').filter(Boolean);
        const books = tokens.length
          ? raw.map((b) => ({ b, s: score(b, tokens) })).filter(({ b }) => tokens.every((t) => fields(b).includes(t))).sort((a, b) => b.s - a.s).map(({ b }) => b)
          : raw;
        current = books.slice(0, 8);
        status.textContent = `${current.length} BOOKS`;
        if (!current.length) { results.innerHTML = `<div class="jbe6-status">No matching books found for “${esc(query)}”.</div>`; return; }
        results.innerHTML = current.map((b, i) => {
          const cover = b.formats?.['image/jpeg'] || '';
          const author = (b.authors || []).map((a) => a.name).join(', ') || 'Unknown author';
          const desc = (b.subjects || []).slice(0, 2).join(' · ');
          const epub = b.formats?.['application/epub+zip'] || '';
          return `<article class="jbe6-book"><img class="jbe6-cover" src="${esc(cover)}" alt=""><div><div class="jbe6-name">${i + 1}. ${esc(b.title)}</div><div class="jbe6-author">${esc(author)}</div><div class="jbe6-desc">${esc(desc || 'Public-domain ebook available to read online.')}</div></div><div class="jbe6-actions"><button class="jbe6-link primary" data-read="${b.id}">READ IN JARVIS</button><a class="jbe6-link" target="_blank" rel="noopener" href="https://www.gutenberg.org/ebooks/${encodeURIComponent(b.id)}">OPEN GUTENBERG</a></div><span hidden data-epub="${esc(epub)}"></span></article>`;
        }).join('');
        results.querySelectorAll('[data-read]').forEach((button) => {
          const id = String(button.getAttribute('data-read'));
          const b = current.find((book) => String(book.id) === id);
          const card = button.closest('.jbe6-book');
          const meta = card?.querySelector('[data-epub]');
          if (b) button.onclick = () => reader(b, meta?.getAttribute('data-epub') || '');
        });
      } catch (error) {
        status.textContent = 'OFFLINE';
        results.innerHTML = '<div class="jbe6-status">The public catalogue could not be reached. Try again in a moment.</div>';
        console.warn('[JARVIS ebook catalog]', error);
      }
    };
    btn.onclick = show;
    q.onkeydown = (e) => { if (e.key === 'Enter') show(); };
    show();
  };

  let last = false;
  const tick = () => {
    if (!isFiles()) return;
    const active = document.querySelector('#jarvisFilesV4 .jf4-opt.active')?.dataset.tab;
    const now = active === 'ebooks';
    if (now && !last) render();
    if (!now && (last || document.querySelector('#jbe6Panel'))) render();
    last = now;
  };
  new MutationObserver(tick).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  setInterval(tick, 500);
  tick();
})();
