(() => {
  'use strict';
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const log = (...a) => window.jarvisLog?.('override', ...a);
  const clone = (el) => { const n = el.cloneNode(true); el.replaceWith(n); return n; };
  const armButton = (selector, handler) => {
    const el = $(selector); if (!el || el.dataset.jlfHard === '1') return;
    const n = clone(el); n.dataset.jlfHard='1'; n.addEventListener('click', e => { e.preventDefault(); e.stopImmediatePropagation(); void handler(e); }, true);
  };
  const armInput = (selector, handler) => {
    const el = $(selector); if (!el || el.dataset.jlfHard === '1') return;
    const n = clone(el); n.dataset.jlfHard='1'; n.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); e.stopImmediatePropagation(); void handler(e); } }, true);
  };
  async function command() {
    const form=$('#commandForm'); if(!form || form.dataset.jlfHard==='1')return;
    const n=clone(form); n.dataset.jlfHard='1'; n.addEventListener('submit',async e=>{e.preventDefault();e.stopImmediatePropagation();const q=$('#commandInput')?.value?.trim();if(!q)return;log('command intercepted',{query:q});const target=$('#jarvisReply');try{await window.jarvisCentralSearch?.(q,target)}catch{}if(target&&!/IN-HOUSE/i.test(target.textContent||'')){target.insertAdjacentHTML('beforeend','<small class="jv4-authority-badge">IN-HOUSE · JARVIS KNOWLEDGE AUTHORITY</small>');}},true);
  }
  function ensureSearchControls() {
    const host=$('.search-workspace'); if(!host)return;
    const bar=$('.search-bar',host); if(bar&&!$('#webProvider',bar)){
      const select=document.createElement('select');select.id='webProvider';select.setAttribute('aria-label','Search provider');select.innerHTML='<option value="brave">BRAVE</option><option value="bing">BING</option>';bar.prepend(select);
    }
    let actions=$('.search-actions',host);if(!actions){actions=document.createElement('div');actions.className='search-actions';actions.innerHTML='<button type="button" data-provider="brave">BRAVE</button><button type="button" data-provider="bing">BING</button>';bar?.insertAdjacentElement('afterend',actions)}
    if(!actions.querySelector('[data-provider="brave"]'))actions.insertAdjacentHTML('beforeend','<button type="button" data-provider="brave">BRAVE</button>');
    if(!actions.querySelector('[data-provider="bing"]'))actions.insertAdjacentHTML('beforeend','<button type="button" data-provider="bing">BING</button>');
    if(!actions.querySelector('[data-provider="youtube"]'))actions.insertAdjacentHTML('beforeend','<button type="button" data-provider="youtube">YOUTUBE</button>');
    if(!actions.querySelector('[data-provider="news"]'))actions.insertAdjacentHTML('beforeend','<button type="button" data-provider="news">NEWS</button>');
  }
  async function webSearch(){
    ensureSearchControls();
    const q=$('#webQuery')?.value?.trim()||'';if(!q)return;
    const host=$('.search-workspace');if(!host)return;
    let target=$('#jv4SearchAnswer')||$('#jv3SearchAnswer');if(!target){target=document.createElement('section');target.id='jv4SearchAnswer';target.className='jv4-answer';host.insertAdjacentElement('afterend',target)}
    try{await window.jarvisCentralSearch?.(q,target)}catch{}
    if(target.textContent?.trim()&&!/IN-HOUSE/i.test(target.textContent||''))target.insertAdjacentHTML('beforeend','<small class="jv4-authority-badge">IN-HOUSE · JARVIS SEARCH AUTHORITY</small>');
  }
  function web() {
    ensureSearchControls();
    armButton('#webSearch',webSearch);
    armInput('#webQuery',webSearch);
    $$('.search-actions [data-provider]').forEach(b=>{if(b.dataset.jlfHard==='1')return;const n=clone(b);n.dataset.jlfHard='1';n.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const p=n.dataset.provider;if(p==='youtube'){const q=$('#webQuery')?.value||'';window.open?.(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,'_blank','noopener,noreferrer');return}if(p==='news'){const q=$('#webQuery')?.value||'';window.open?.(`https://www.google.com/search?tbm=nws&q=${encodeURIComponent(q)}`,'_blank','noopener,noreferrer');return}const sel=$('#webProvider');if(sel)sel.value=p;void webSearch()},true)});
  }
  function maps() {
    armButton('#mapSearch',()=>window.jarvisMapSearch?.($('#mapQuery')?.value||''));
    armInput('#mapQuery',()=>window.jarvisMapSearch?.($('#mapQuery')?.value||''));
  }
  function media() {
    armButton('#videoSearch',()=>window.jarvisVideoSearch?.($('#videoQuery')?.value||''));
    armInput('#videoQuery',()=>window.jarvisVideoSearch?.($('#videoQuery')?.value||''));
    $$('.media-search-links [data-video-provider]').forEach(b=>{
      if(b.dataset.jlfHard==='1')return;
      const n=clone(b);n.dataset.jlfHard='1';n.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const q=n.dataset.videoProvider==='trending'?'trending videos India':($('#videoQuery')?.value||'');const input=$('#videoQuery');if(input)input.value=q;window.jarvisVideoSearch?.(q)},true);
    });
    armButton('#playVideo',()=>{
      const raw=$('#videoUrl')?.value?.trim()||'';
      const id=raw.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/)?.[1] || (/^[A-Za-z0-9_-]{11}$/.test(raw)?raw:null);
      if(id) window.jarvisVideoSearch?.('__PLAY__:'+id);
    });
  }
  function mission() {
    $$('.jmc-action').forEach(b=>{
      if(b.dataset.jlfHard==='1')return;
      const n=clone(b);n.dataset.jlfHard='1';n.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();const intent=n.dataset.jv3Intent;if(intent==='media'){const nav=$('button.nav[data-app="media"]');nav?.click();setTimeout(()=>{const input=$('#videoQuery');if(input){input.value='trending videos India';window.jarvisVideoSearch?.(input.value)}},250);}else if(intent==='research'){const nav=$('button.nav[data-app="web"]');nav?.click();}else if(intent==='api'){const nav=$('button.nav[data-app="api"]');nav?.click();}else if(intent==='news'){window.jarvisNewsLoad?.('AI OR technology',$('#newsDesk'));}},true);
    });
  }
  function install(){command();web();maps();media();mission();}
  const o=new MutationObserver(install); o.observe(document.body,{childList:true,subtree:true}); install();
})();
