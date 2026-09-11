(()=>{
'use strict';
if(window.__JARVIS_CHAIN_BOOK_FAST_HANDOFF_V1__)return;
window.__JARVIS_CHAIN_BOOK_FAST_HANDOFF_V1__=true;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const bookTitle=s=>clean(s).replace(/^(?:book\s+)+/i,'').trim();
const trace=(event,data={})=>{try{console.info('[JARVIS:BOOK_CHAIN_FAST]',event,data);window.dispatchEvent(new CustomEvent('jarvis:ebook-reader-trace',{detail:{event:'BOOK_CHAIN_FAST_'+event,...data,at:Date.now()}}))}catch{}};
const install=()=>{const entity=window.jarvisEntityAuthority;if(!entity||typeof entity.handle!=='function')return false;if(entity.handle.__jarvisChainBookAuthority)return true;const original=entity.handle;const wrapped=async raw=>{if(!window.__JARVIS_COMMAND_CHAIN_RUNNING__)return original(raw);const title=bookTitle(raw);if(!title)return false;const started=Date.now();trace('ENTITY_AUTHORITY_START',{raw,title});try{const ok=await original(raw);trace('ENTITY_AUTHORITY_RESULT',{raw,title,ok:!!ok,ms:Date.now()-started});return !!ok}catch(error){trace('ENTITY_AUTHORITY_ERROR',{raw,title,error:String(error?.message||error)});return false}};wrapped.__jarvisChainBookAuthority=true;window.jarvisEntityAuthority=Object.freeze({...entity,handle:wrapped});trace('INSTALLED',{entityVersion:entity.version||'unknown',mode:'semantic-entity-authority'});return true};
if(!install()){let n=0;const timer=setInterval(()=>{if(install()||++n>100)clearInterval(timer)},50)}
})();
