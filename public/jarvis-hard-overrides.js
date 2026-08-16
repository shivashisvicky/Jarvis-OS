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
  function command() {
    const form=$('#commandForm'); if(!form || form.dataset.jlfHard==='1')return;
    const n=clone(form); n.dataset.jlfHard='1'; n.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();const q=$('#commandInput')?.value?.trim();if(q){log('command intercepted',{query:q});window.jarvisCentralSearch?.(q,$('#jarvisReply'));}},true);
  }
  function web() {
    armButton('#webSearch',()=>window.jarvisCentralSearch?.($('#webQuery')?.value||'', $('#jv3SearchAnswer')||null));
    armInput('#webQuery',()=>window.jarvisCentralSearch?.($('#webQuery')?.value||'', $('#jv3SearchAnswer')||null));
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
