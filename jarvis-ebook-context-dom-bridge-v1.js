(()=>{
'use strict';
if(window.__JARVIS_EBOOK_CONTEXT_DOM_BRIDGE_V1__)return;
window.__JARVIS_EBOOK_CONTEXT_DOM_BRIDGE_V1__=true;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const sync=()=>{try{
  const panel=document.querySelector('#jbe6Panel');
  const cards=[...document.querySelectorAll('#jbe6Results .jbe6-book')];
  if(!panel||!cards.length)return false;
  const results=cards.map((card,index)=>({
    index,
    id:card.getAttribute('data-book-id')||card.querySelector('[data-rel-read],[data-read]')?.getAttribute('data-rel-read')||card.querySelector('[data-rel-read],[data-read]')?.getAttribute('data-read')||'',
    title:clean(card.querySelector('.jbe6-name')?.textContent||''),
    author:clean(card.querySelector('.jbe6-author')?.textContent||''),
    type:'BOOK'
  })).filter(x=>x.id||x.title);
  if(!results.length)return false;
  const query=clean(panel.querySelector('#jbe6Query')?.value||'');
  const ctx={domain:'BOOKS',active:true,intent:'BOOK_SEARCH',entity:{type:'BOOK',title:results[0]?.title||''},query,results,selected:null};
  window.jarvisContextEngine?.set?.(ctx,'replace');
  window.dispatchEvent(new CustomEvent('jarvis:ebook-context',{detail:ctx}));
  return true;
}catch{return false}};
const observe=()=>{const box=document.querySelector('#jbe6Results');if(!box||box.dataset.jarvisEbookContext==='1')return;box.dataset.jarvisEbookContext='1';new MutationObserver(()=>sync()).observe(box,{childList:true,subtree:true});sync()};
new MutationObserver(observe).observe(document.body,{childList:true,subtree:true});
setInterval(sync,500);
window.addEventListener('jarvis:ebook-context',e=>{const d=e.detail||{};if(!Array.isArray(d.results)||!d.results.length)return;try{window.jarvisContextEngine?.set?.({domain:'BOOKS',active:true,intent:d.intent||'BOOK_SEARCH',entity:d.entity||null,query:d.query||'',results:d.results,selected:d.selected||null},'replace')}catch{}});
})();
