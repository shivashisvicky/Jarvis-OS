(()=>{
'use strict';
if(window.__JARVIS_BOOK_CHAIN_LIFECYCLE_FIX_V1__)return;
window.__JARVIS_BOOK_CHAIN_LIFECYCLE_FIX_V1__=true;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const norm=s=>clean(s).toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const trace=(event,data={})=>{try{console.info('[JARVIS:BOOK_CHAIN_LIFECYCLE]',event,data);window.dispatchEvent(new CustomEvent('jarvis:ebook-reader-trace',{detail:{event:'BOOK_CHAIN_LIFECYCLE_'+event,...data,at:Date.now()}}))}catch{}};
const install=()=>{
 const runtime=window.jarvisCommandChainRuntime;
 if(!runtime||typeof runtime.run!=='function')return false;
 if(runtime.run.__jarvisBookLifecycle)return true;
 const original=runtime.run;
 const wrapped=async function(raw,...rest){
   const text=clean(raw);
   const match=text.match(/^(.*?)\s+and\s+open\s+(?:the\s+)?(\d+|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)\s+(?:one|book|result)\s*$/i);
   if(match&&window.jarvisEbookSearchAuthority?.search){
     const q=clean(match[1]);
     const words={first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10};
     const index=Number(words[String(match[2]).toLowerCase()]||match[2]);
     trace('PREPARE',{query:q,index});
     try{
       await window.jarvisEbookSearchAuthority.search(q);
       const c=window.jarvisContextEngine?.get?.();
       const rows=Array.isArray(c?.results)?c.results:[];
       trace('SEARCH_READY',{query:q,index,count:rows.length});
     }catch(e){trace('SEARCH_ERROR',{query:q,error:String(e?.message||e)})}
   }
   return original.apply(this,[raw,...rest]);
 };
 wrapped.__jarvisBookLifecycle=true;
 try{window.jarvisCommandChainRuntime={...runtime,run:wrapped};trace('INSTALLED')}catch(e){trace('INSTALL_ERROR',{error:String(e?.message||e)});return false}
 return true;
};
if(!install()){let n=0;const t=setInterval(()=>{if(install()||++n>160)clearInterval(t)},50)}
})();
