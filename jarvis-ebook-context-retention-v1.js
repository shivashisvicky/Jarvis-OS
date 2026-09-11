(()=>{
'use strict';
if(window.__JARVIS_EBOOK_CONTEXT_RETENTION_V1__)return;
window.__JARVIS_EBOOK_CONTEXT_RETENTION_V1__=true;
const KEY='JARVIS_BEST_BOOK_CONTEXT_V1',TTL=30*60*1000;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim().toLowerCase();
const valid=d=>d&&['BOOKS','BOOK','BOOK_AUTHOR'].includes(String(d.domain||'').toUpperCase())&&Array.isArray(d.results)&&d.results.length;
const read=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'null');return x&&valid(x)&&Date.now()-Number(x.savedAt||0)<=TTL?x:null}catch{return null}};
const save=d=>{if(!valid(d))return;try{localStorage.setItem(KEY,JSON.stringify({domain:'BOOKS',active:true,entity:d.entity||null,query:d.query||'',results:d.results.slice(0,20),selected:d.selected||null,savedAt:Date.now()}))}catch{}};
const bestFor=(d,results)=>{const old=read();const same=old&&clean(old.query)===clean(d.query);if(same&&old.results.length>results.length)return old;return {...d,domain:'BOOKS',results};};
const apply=d=>{try{window.jarvisContextEngine?.set?.({domain:'BOOKS',active:true,entity:d.entity||{type:'BOOK',title:d.results?.[0]?.title||''},query:d.query||'',results:d.results||[],selected:d.selected||null},'merge');window.dispatchEvent(new CustomEvent('jarvis:ebook-context-retained',{detail:d}))}catch{}};
const handle=d=>{if(!valid(d))return;const chosen=bestFor(d,d.results);save(chosen);if(chosen.results.length>d.results.length)apply(chosen)};
window.addEventListener('jarvis:ebook-context',e=>handle(e.detail||{}),true);
const captureDom=()=>{const panel=document.querySelector('#jbe6Panel'),box=panel?.querySelector('#jbe6Results');if(!box)return;const cards=[...box.querySelectorAll('.jbe6-book')];if(!cards.length)return;const results=cards.map((c,index)=>({index,id:c.getAttribute('data-book-id')||'',title:(c.querySelector('.jbe6-name')?.textContent||'').trim(),author:(c.querySelector('.jbe6-author')?.textContent||'').trim(),type:'BOOK'})).filter(x=>x.id);const query=panel.querySelector('#jbe6Query')?.value?.trim()||'';if(results.length)handle({domain:'BOOKS',active:true,query,results,selected:null})};
new MutationObserver(captureDom).observe(document.body,{childList:true,subtree:true});setTimeout(captureDom,500);
const old=read();if(old){try{const live=window.jarvisContextEngine?.get?.();if(!valid(live)||clean(live.query)===clean(old.query)&&live.results.length<old.results.length)apply(old)}catch{}}
})();