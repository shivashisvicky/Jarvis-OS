(()=>{
'use strict';
if(window.__JARVIS_BOOK_CHAIN_FINAL_AUTHORITY_V1__)return;
window.__JARVIS_BOOK_CHAIN_FINAL_AUTHORITY_V1__=true;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const trace=(event,data={})=>{try{console.info('[JARVIS:BOOK_CHAIN_FINAL]',event,data);window.dispatchEvent(new CustomEvent('jarvis:ebook-reader-trace',{detail:{event:'BOOK_CHAIN_FINAL_'+event,...data,at:Date.now()}}))}catch{}};
const install=()=>{
 const a=window.jarvisEntityAuthority;
 const s=window.jarvisEbookSearchAuthority;
 if(!a||typeof a.handle!=='function'||!s||typeof s.search!=='function')return false;
 if(a.handle.__jarvisBookChainFinal)return true;
 const original=a.handle;
 const wrapped=async raw=>{
   if(!window.__JARVIS_COMMAND_CHAIN_RUNNING__)return original(raw);
   const q=clean(raw);
   if(!q)return original(raw);
   trace('FIRST_BOOK_START',{query:q});
   let ok=false;
   try{ok=!!(await original(q))}catch(e){trace('FIRST_BOOK_ERROR',{query:q,error:String(e?.message||e)})}
   try{
     const count=await s.search(q);
     const c=window.jarvisContextEngine?.get?.();
     const rows=Array.isArray(c?.results)?c.results:[];
     const valid=String(c?.domain||'').toUpperCase()==='BOOKS'&&rows.length>0;
     trace('FIRST_BOOK_FINALIZED',{query:q,originalOk:ok,count:Number(count)||0,contextCount:rows.length,valid});
     return valid||ok;
   }catch(e){trace('FINAL_SEARCH_ERROR',{query:q,error:String(e?.message||e)});return ok}
 };
 wrapped.__jarvisBookChainFinal=true;
 window.jarvisEntityAuthority=Object.freeze({...a,handle:wrapped});
 trace('INSTALLED',{entityVersion:a.version||'unknown'});
 return true;
};
if(!install()){let n=0;const t=setInterval(()=>{if(install()||++n>160)clearInterval(t)},50)}
})();
