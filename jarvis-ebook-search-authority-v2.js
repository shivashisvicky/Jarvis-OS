(()=>{
  'use strict';
  if (window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V10__) return;
  window.__JARVIS_EBOOK_SEARCH_AUTHORITY_V10__ = true;

  const API = 'https://gutendex.com/books/';
  const JINA = 'https://r.jina.ai/http://gutendex.com/books/';
  const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const normalize = (s) => clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const authors = (b) => {
    const people = Array.isArray(b?.authors) ? b.authors : [];
    if (people.length) return people.map(a => a.name).filter(Boolean).join(', ');
    const translators = Array.isArray(b?.translators) ? b.translators : [];
    if (translators.length) return translators.map(a => a.name).filter(Boolean).join(', ');
    return 'Unknown author';
  };
  const cover = (b) => b.formats?.['image/jpeg'] || '';
  const epub = (b) => b.formats?.['application/epub+zip'] || '';
  const esc = (s) => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const audio = /\.(?:mp3|ogg|m4b|spx|wav)(?:$|[?#])/i;
  const isReadable = (b) => {
    if (!b || String(b.media_type || '').toLowerCase() !== 'text') return false;
    const f = b.formats || {};
    const keys = Object.keys(f);
    if (!keys.some(k => /^text\/(plain|html)/i.test(k))) return false;
    if (keys.some(k => audio.test(k) || audio.test(f[k] || ''))) return false;
    if (/\b(?:audiobook|audio book)\b/i.test(String(b.title || ''))) return false;
    return true;
  };
  const readableResults = (results) => Array.isArray(results) ? results.filter(isReadable) : [];

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
    return results.map((b, original) => {
      const title = normalize(b.title || ''), author = normalize(authors(b));
      let score = 0;
      if (title === nq) score += 1000;
      if (author === nq) score += 900;
      if (title.startsWith(nq)) score += 300;
      if (title.includes(nq)) score += 180;
      if (author.includes(nq)) score += 160;
      const words = nq.split(' ').filter(Boolean);
      score += words.reduce((n, w) => n + (title.includes(w) ? 12 : 0) + (author.includes(w) ? 10 : 0), 0);
      return { b, original, score };
    }).sort((a,b) => b.score-a.score || a.original-b.original).map(x => x.b);
  };
  const warmCache = (query, results) => { try { sessionStorage.setItem(`jarvis:gutenberg:warm:v2:${normalize(query)}`, JSON.stringify({ at: Date.now(), results })); } catch {} };
  const readWarmCache = (query) => { try { const x = JSON.parse(sessionStorage.getItem(`jarvis:gutenberg:warm:v2:${normalize(query)}`) || ''); if (x && Array.isArray(x.results) && Date.now()-x.at < 30*60*1000) return x.results; } catch {} return null; };

  const searchRemote = async (query) => {
    const q = encodeURIComponent(clean(query));
    const cached = readWarmCache(query);
    if (cached?.length) { trace('WARM_CACHE_HIT', { query: clean(query), count: cached.length }); return stableRank(readableResults(cached), query); }
    const candidates = [
      `${API}?search=${q}&mime_type=text%2F`,
      `${API}?search=${q}&languages=en&mime_type=text%2F`,
      `${JINA}?search=${q}&mime_type=text%2F`,
      `${JINA}?search=${q}&languages=en&mime_type=text%2F`
    ];
    trace('REMOTE_SEARCH_START', { query: clean(query), candidates: candidates.length });
    for (let round=0; round<2; round++) {
      for (const url of candidates) {
        try {
          const results = await fetchJson(url);
          const readable = readableResults(results);
          trace('REMOTE_SEARCH_RESULT', { query: clean(query), round, url, count: results.length, readableCount: readable.length, firstTitle: results[0]?.title || '' });
          if (readable.length) return stableRank(readable, query);
        } catch (error) { trace('REMOTE_SEARCH_ERROR', { query: clean(query), round, url, error: String(error?.message || error) }); }
      }
      await new Promise(r => setTimeout(r,300));
    }
    trace('REMOTE_SEARCH_EMPTY', { query: clean(query) });
    return [];
  };

  const remember = (results, query) => {
    const compact = readableResults(results).slice(0,20).map((b,index) => ({ index, id:b.id, title:b.title||'', author:authors(b), type:'BOOK' }));
    try {
      window.jarvisContextEngine?.set({ domain:'BOOKS', active:true, entity:{type:'BOOK',title:compact[0]?.title||''}, query, results:compact, selected:null },'merge');
      window.dispatchEvent(new CustomEvent('jarvis:ebook-context',{detail:{domain:'BOOKS',active:true,entity:{type:'BOOK',title:compact[0]?.title||''},query,results:compact,selected:null}}));
    } catch {}
  };

  const render = (results, query) => {
    const resultsEl=document.querySelector('#jbe6Results'), line=document.querySelector('#jbe6StatusLine'); if(!resultsEl)return;
    const readable=readableResults(results), ranked=stableRank(readable,query);
    if(!ranked.length){resultsEl.innerHTML='<div class="jbe6-status">NO READABLE GUTENBERG TEXT EDITIONS FOUND.</div>';if(line)line.textContent='NO RESULTS';trace('RENDER_EMPTY',{query:clean(query),rawCount:results?.length||0});return;}
    resultsEl.innerHTML=ranked.slice(0,20).map((b,i)=>{const image=cover(b)?`<img class="jbe6-cover" src="${esc(cover(b))}" alt="">`:'<div class="jbe6-cover"></div>';const e=epub(b);return `<article class="jbe6-book" data-book-id="${esc(b.id)}" data-book-query="${esc(query)}"><div>${image}</div><div><div class="jbe6-name">${i+1}. ${esc(b.title)}</div><div class="jbe6-author">${esc(authors(b))}</div><div class="jbe6-desc">${esc((b.subjects||[]).slice(0,3).join(' · '))}</div></div><div class="jbe6-actions"><button type="button" class="jbe6-link primary" data-rel-read="${esc(b.id)}" data-title="${esc(b.title)}" data-epub="${esc(e)}">READ IN JARVIS</button><a class="jbe6-link" href="https://www.gutenberg.org/ebooks/${encodeURIComponent(b.id)}" target="_blank" rel="noopener">OPEN GUTENBERG</a></div></article>`;}).join('');
    if(line)line.textContent=`${Math.min(20,ranked.length)} RESULTS · GUTENBERG`;
    trace('RENDER_RESULTS',{query:clean(query),count:ranked.length,firstTitle:ranked[0]?.title||'',firstId:ranked[0]?.id||''}); remember(ranked,query);
  };

  let seq=0;
  const search=async(raw)=>{const query=clean(raw);if(!query||query.length<2)return;const mySeq=++seq,input=document.querySelector('#jbe6Query'),resultsEl=document.querySelector('#jbe6Results'),line=document.querySelector('#jbe6StatusLine');if(!input||!resultsEl)return;input.value=query;trace('SEARCH_START',{query,seq:mySeq});resultsEl.innerHTML='<div class="jbe6-status">SEARCHING GUTENBERG…</div>';if(line)line.textContent='SEARCHING';const results=await searchRemote(query);if(mySeq!==seq||normalize(input.value)!==normalize(query)){trace('SEARCH_STALE',{query,seq:mySeq,currentSeq:seq,input:input.value});return;}render(results,query);};
  const searchResolved=async(raw,resolvedResults)=>{const query=clean(raw),results=stableRank(readableResults(resolvedResults),query);if(!query||!results.length)return false;const input=document.querySelector('#jbe6Query'),resultsEl=document.querySelector('#jbe6Results');if(!input||!resultsEl)return false;++seq;input.value=query;render(results,query);trace('RESOLVED_RENDER',{query,count:results.length,firstTitle:results[0]?.title||'',firstId:results[0]?.id||''});return true;};
  const handleSearchClick=(event)=>{const target=event.target?.closest?.('#jbe6Search');if(!target)return;const panel=target.closest('#jbe6Panel'),input=panel?.querySelector?.('#jbe6Query')||document.querySelector('#jbe6Query');if(!input)return;event.preventDefault();event.stopImmediatePropagation();trace('DOCUMENT_SEARCH_INTERCEPT',{query:clean(input.value)});search(input.value);};
  const handleSearchKeydown=(event)=>{if(event.key!=='Enter')return;const input=event.target?.closest?.('#jbe6Query');if(!input)return;event.preventDefault();event.stopImmediatePropagation();trace('DOCUMENT_SEARCH_ENTER_INTERCEPT',{query:clean(input.value)});search(input.value);};
  document.addEventListener('click',handleSearchClick,true); document.addEventListener('keydown',handleSearchKeydown,true);
  const wirePanel=(panel)=>{if(!panel||panel.__jarvisSearchV10)return;panel.__jarvisSearchV10=true;const input=panel.querySelector('#jbe6Query'),button=panel.querySelector('#jbe6Search');if(!input||!button)return;const submit=(event)=>{event?.preventDefault?.();event?.stopImmediatePropagation?.();search(input.value);};button.addEventListener('click',submit,true);input.addEventListener('keydown',e=>{if(e.key==='Enter')submit(e);},true);input.addEventListener('input',()=>{input.dataset.jarvisUserQuery='1';},true);};
  const scan=()=>wirePanel(document.querySelector('#jbe6Panel')); const observer=new MutationObserver(scan);observer.observe(document.documentElement,{childList:true,subtree:true});scan();setInterval(scan,500);
  window.jarvisEbookSearchAuthority={version:'10.0.0',search,searchResolved,rank:stableRank};
  window.__JARVIS_GUTENBERG_WARM__=async(query='Beowulf')=>{try{const results=await fetchJson(`${API}?search=${encodeURIComponent(query)}&languages=en&mime_type=text%2F`,12000);if(results.length)warmCache(query,results);trace('WARM_FETCH_COMPLETE',{query,count:results.length});return results;}catch(error){trace('WARM_FETCH_ERROR',{query,error:String(error)});return[];}};
})();
