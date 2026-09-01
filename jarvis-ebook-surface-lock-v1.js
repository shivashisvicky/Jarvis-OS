(()=>{'use strict';
if(window.__JARVIS_EBOOK_SURFACE_LOCK_V1__)return;
window.__JARVIS_EBOOK_SURFACE_LOCK_V1__=true;
const API='https://gutendex.com/books/';
const clean=s=>String(s||'').replace(/\s+/g,' ').trim().replace(/[?!.]+$/,'').replace(/\b(?:search|find|look up|show me|show|open|read|reading|book|books|ebook|ebooks|gutenberg|standard ebooks|library|for|on)\b/gi,' ').replace(/\s+/g,' ').trim();
const set=q=>{q=clean(q);if(!q)return;window.__JARVIS_EBOOK_HANDOFF_QUERY__=q;window.__JARVIS_EBOOK_HANDOFF_UNTIL__=Date.now()+30000;try{console.info('[JARVIS:EBOOK_SURFACE_LOCK] HANDOFF',{query:q})}catch{}};
const entity=e=>{const d=e.detail||{},t=String(d.entity?.type||'').toUpperCase();if(d.resolutionMode==='bare'&&['BOOK','BOOK_AUTHOR'].includes(t)&&Number(d.entity?.score||0)>=0.9)set(d.text)};
window.addEventListener('jarvis:entity-resolved',entity,true);
window.addEventListener('jarvis:voice-command',e=>{const d=e.detail||{},t=String(d.entity?.type||'').toUpperCase();if(d.resolved&&d.resolutionMode==='bare'&&['BOOK','BOOK_AUTHOR'].includes(t)&&Number(d.entity?.score||0)>=0.9)set(d.text)},true);
if(!window.__JARVIS_EBOOK_FETCH_LOCK_V1__){
 const originalFetch=window.fetch.bind(window);
 window.fetch=async(input,init)=>{
  let url='';try{url=typeof input==='string'?input:input?.url||''}catch{}
  const q=String(window.__JARVIS_EBOOK_HANDOFF_QUERY__||'');
  const until=Number(window.__JARVIS_EBOOK_HANDOFF_UNTIL__||0);
  if(q&&Date.now()<until&&url.startsWith(API)&&!/[?&]search=/i.test(url)){
   const u=new URL(url);u.searchParams.set('search',q);u.searchParams.set('languages','en');u.searchParams.set('page','1');
   try{console.info('[JARVIS:EBOOK_SURFACE_LOCK] REWRITE_DEFAULT',{query:q})}catch{}
   return originalFetch(u.toString(),init);
  }
  return originalFetch(input,init);
 };
 window.__JARVIS_EBOOK_FETCH_LOCK_V1__=true;
}
setInterval(()=>{const until=Number(window.__JARVIS_EBOOK_HANDOFF_UNTIL__||0);if(until&&Date.now()>until){delete window.__JARVIS_EBOOK_HANDOFF_QUERY__;delete window.__JARVIS_EBOOK_HANDOFF_UNTIL__}},1000);
})();
