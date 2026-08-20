(() => {
  'use strict';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const ensure = () => {
    const input = document.querySelector('#webQuery');
    const btn = document.querySelector('#webSearch');
    if (!input || !btn) return null;
    let status = document.querySelector('#jwsStatus');
    let results = document.querySelector('#jwsResults');
    if (!status) { status = document.createElement('div'); status.id='jwsStatus'; status.className='jws-runtime-status'; status.textContent='READY'; btn.parentElement?.after(status); }
    if (!results) { results = document.createElement('div'); results.id='jwsResults'; results.className='jws-runtime-results'; status.after(results); }
    return {input, btn, status, results};
  };
  const parse = text => {
    const out=[]; const seen=new Set();
    const md=/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
    let m;
    while ((m=md.exec(text)) && out.length<8) {
      const url=m[2].replace(/[),.;]+$/,'');
      if (seen.has(url) || /s\.jina\.ai|google\.com\/search|bing\.com\/search/i.test(url)) continue;
      seen.add(url); out.push({title:m[1].replace(/\s+/g,' ').trim(),url});
    }
    if (!out.length) {
      const urls=[...text.matchAll(/https?:\/\/[^\s)]+/g)];
      for (const u of urls) { const url=u[0].replace(/[),.;]+$/,''); if(seen.has(url)||/s\.jina\.ai|google\.com\/search|bing\.com\/search/i.test(url)) continue; seen.add(url); out.push({title:url.replace(/^https?:\/\//,'').split('/')[0],url}); if(out.length>=8) break; }
    }
    return out;
  };
  const search = async q => {
    const x=ensure(); if(!x) return;
    const query=String(q||'').trim(); if(!query){x.status.textContent='READY';x.results.innerHTML='<div class="empty">Enter a search query.</div>';return;}
    x.status.textContent='SEARCHING'; x.results.innerHTML='<div class="empty">JARVIS IS SEARCHING THE WEB…</div>';
    try {
      const r=await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`,{headers:{Accept:'text/plain'}});
      if(!r.ok) throw new Error(`search ${r.status}`);
      const text=await r.text(); const items=parse(text);
      if(!items.length) throw new Error('no parsed results');
      x.status.textContent=`${items.length} RESULTS · LIVE WEB`;
      x.results.innerHTML=items.map((a,i)=>`<article class="jws-runtime-card"><div class="jws-runtime-index">${String(i+1).padStart(2,'0')}</div><div class="jws-runtime-copy"><strong>${esc(a.title)}</strong><small>${esc(new URL(a.url).hostname)}</small></div><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">OPEN ↗</a></article>`).join('');
    } catch {
      x.status.textContent='DEGRADED';
      x.results.innerHTML='<div class="empty">Live search is temporarily unavailable. Try again in a moment.</div>';
    }
  };
  const bind=()=>{
    const x=ensure(); if(!x || x.btn.dataset.jwsRuntime==='1') return;
    x.btn.dataset.jwsRuntime='1';
    x.btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();search(x.input.value);},true);
    x.input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search(x.input.value);}},true);
  };
  const style=()=>{if(document.querySelector('#jws-runtime-style'))return;const s=document.createElement('style');s.id='jws-runtime-style';s.textContent=`#jwsStatus.jws-runtime-status{margin:10px 0 8px;padding:8px 10px;border:1px solid rgba(100,220,255,.16);background:rgba(2,10,15,.5);color:#73d9ee;font-size:8px;letter-spacing:.14em}.jws-runtime-results{display:grid;gap:7px;margin:8px 0 16px}.jws-runtime-card{display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:10px;padding:11px 12px;border:1px solid rgba(100,220,255,.15);background:linear-gradient(135deg,rgba(8,22,30,.86),rgba(2,8,12,.72));clip-path:polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)}.jws-runtime-index{color:#55dcff;font-size:8px}.jws-runtime-copy{min-width:0;display:grid;gap:4px}.jws-runtime-copy strong{font-size:11px;color:#dffbff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.jws-runtime-copy small{font-size:7px;color:#638894}.jws-runtime-card a{font-size:7px;letter-spacing:.12em;color:#70e7ff;text-decoration:none;border:1px solid rgba(100,220,255,.22);padding:6px 8px}.jws-runtime-card a:hover{background:rgba(50,210,255,.1)}@media(max-width:600px){.jws-runtime-card{grid-template-columns:24px 1fr}.jws-runtime-card a{grid-column:2;justify-self:start}}`;document.head.appendChild(s)};
  style(); new MutationObserver(()=>{style();bind();}).observe(document.documentElement,{childList:true,subtree:true}); if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true}); else bind();
})();