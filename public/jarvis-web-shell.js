(() => {
  'use strict';
  if (window.__JARVIS_IN_SHELL_WEB_V1__) return;
  window.__JARVIS_IN_SHELL_WEB_V1__ = true;
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const state = { generation: 0, cache: new Map() };
  const providers = {
    brave: q => `https://search.brave.com/search?q=${encodeURIComponent(q)}`,
    bing: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}`,
  };
  const fetchText = async (url, ms = 10000) => {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
    try { const r = await fetch(url, {signal:c.signal, cache:'no-store', headers:{Accept:'text/html,application/xhtml+xml,*/*'}}); if(!r.ok) throw Error(`HTTP ${r.status}`); return await r.text(); }
    finally { clearTimeout(t); }
  };
  const jina = url => `https://r.jina.ai/http://${url.replace(/^https?:\/\//,'')}`;
  function parseLinks(html, engine) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const out = [], seen = new Set();
    const add = (title, url, snippet='') => {
      try { const u = new URL(url); if (!/^https?:$/.test(u.protocol)) return; if (u.hostname.includes('brave.com') || u.hostname.includes('bing.com')) return; if(seen.has(u.href)) return; seen.add(u.href); out.push({title: title.trim() || u.hostname, url:u.href, snippet:snippet.trim(), source:engine.toUpperCase()}); } catch {}
    };
    if (engine === 'bing') {
      doc.querySelectorAll('li.b_algo').forEach(li => { const a=li.querySelector('h2 a'); if(a) add(a.textContent, a.href, li.querySelector('.b_caption p')?.textContent || ''); });
    } else {
      doc.querySelectorAll('a').forEach(a => { const h=(a.querySelector('h3')||a).textContent||''; const href=a.getAttribute('href')||''; if(h.trim() && /^https?:/i.test(href)) add(h, href, a.parentElement?.textContent?.replace(h,'')||''); });
    }
    return out.slice(0,20);
  }
  async function search(q, engine) {
    const query = String(q||'').trim(); if(!query) return;
    const token = ++state.generation; const results=$('#jwsResults'), status=$('#jwsStatus');
    if(!results||!status) return;
    status.textContent = `SEARCHING ${engine.toUpperCase()} · ${query}`;
    results.innerHTML = '<div class="empty">JARVIS is searching the live web inside this shell…</div>';
    try {
      const key = `${engine}:${query}`; let items=state.cache.get(key);
      if(!items){ const target=providers[engine](query); const html=await fetchText(jina(target)); items=parseLinks(html,engine); state.cache.set(key,items); }
      if(token!==state.generation)return;
      if(!items.length) throw Error('NO_RESULTS');
      results.innerHTML = items.map(x=>`<article class="jws-card"><div class="jws-source">${esc(x.source)}</div><h3><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a></h3><p>${esc(x.snippet||'Live web result')}</p><small>${esc(new URL(x.url).hostname)}</small></article>`).join('');
      status.textContent = `${items.length} LIVE RESULTS · ${engine.toUpperCase()}`;
    } catch(e) {
      if(token!==state.generation)return;
      results.innerHTML = '<div class="empty">Live in-shell search is temporarily unavailable. JARVIS did not redirect your tab.</div>';
      status.textContent = `DEGRADED · ${String(e?.message||'SEARCH FAILED')}`;
    }
  }
  function mount(){
    const input=$('#webQuery'), provider=$('#webProvider'), button=$('#webSearch');
    if(!input||!provider||!button) return;
    if(!$('#jwsStatus')){
      const box=document.createElement('div'); box.id='jwsStatus'; box.className='jws-status';
      const results=document.createElement('div'); results.id='jwsResults'; results.className='jws-results';
      const boundary=document.querySelector('.search-boundary'); if(boundary){ boundary.innerHTML='<span>SEARCH EXECUTION</span><strong>Results stay inside JARVIS.</strong><small>Brave and Bing are queried through a read-only relay. Result links open only when you choose one.</small>'; boundary.insertAdjacentElement('afterend',box); box.insertAdjacentElement('afterend',results); }
    }
  }
  window.addEventListener('click', e => {
    const target = e.target instanceof Element ? e.target.closest('#webSearch,[data-provider],[data-search]') : null;
    if(!target) return;
    const input=$('#webQuery'), provider=$('#webProvider'); if(!input||!provider) return;
    let engine=provider.value;
    if(target.matches('[data-provider]')) engine=target.dataset.provider || engine;
    if(engine!=='brave' && engine!=='bing') return;
    if(target.matches('[data-provider]')) provider.value=engine;
    e.preventDefault(); e.stopImmediatePropagation();
    void search(input.value, engine);
  }, true);
  window.addEventListener('keydown', e => { if(e.key==='Enter' && e.target?.matches?.('#webQuery')){ e.preventDefault(); e.stopImmediatePropagation(); const p=$('#webProvider'); void search(e.target.value,p?.value||'brave'); } }, true);
  const obs=new MutationObserver(mount); obs.observe(document.documentElement,{childList:true,subtree:true}); mount();
})();
