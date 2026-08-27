(()=>{
'use strict';
if(window.__JARVIS_BOOK_CONTEXT_PERSISTENCE_V1__)return;
window.__JARVIS_BOOK_CONTEXT_PERSISTENCE_V1__=true;
const KEY='JARVIS_LAST_BOOK_CONTEXT_V1';
const TTL=30*60*1000;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const read=()=>{try{const x=JSON.parse(sessionStorage.getItem(KEY)||'null');if(!x||!Array.isArray(x.results)||!x.results.length)return null;if(Date.now()-Number(x.savedAt||0)>TTL){sessionStorage.removeItem(KEY);return null}return x}catch{return null}};
const save=ctx=>{try{if(!ctx||ctx.domain!=='BOOKS'||!Array.isArray(ctx.results)||!ctx.results.length)return;sessionStorage.setItem(KEY,JSON.stringify({domain:'BOOKS',query:clean(ctx.query||''),results:ctx.results.slice(0,20),savedAt:Date.now()}))}catch{}};
const rememberOpen=()=>{const engine=window.jarvisContextEngine?.get?.();const memory=window.jarvisContextMemory?.get?.();const ctx=engine?.active&&engine?.domain==='BOOKS'?engine:memory?.domain==='BOOKS'?memory:null;if(ctx)save(ctx)};
window.jarvisBookContextPersistence={version:'1.1.0',get:read,save};
window.addEventListener('jarvis:ebook-context',e=>save(e.detail||{}),true);
const wrap=()=>{const fn=window.jarvisEbookReaderOpen;if(typeof fn!=='function'||fn.__jarvisBookPersist)return false;const wrapped=function(id,title){rememberOpen();return fn.apply(this,arguments)};wrapped.__jarvisBookPersist=true;window.jarvisEbookReaderOpen=wrapped;return true};
const watch=()=>{wrap();const panel=document.querySelector('#jbe6Panel');if(!panel)return;panel.querySelectorAll('[data-rel-read],[data-final-read],[data-read],[data-native-read]').forEach(b=>{if(b.__jarvisBookPersistClick)return;b.__jarvisBookPersistClick=true;b.addEventListener('click',rememberOpen,true)})};
watch();new MutationObserver(watch).observe(document.documentElement,{childList:true,subtree:true});setInterval(watch,700);
})();
