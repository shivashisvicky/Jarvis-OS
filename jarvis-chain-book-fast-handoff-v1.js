(()=>{
'use strict';
if(window.__JARVIS_CHAIN_BOOK_FAST_HANDOFF_V1__)return;
window.__JARVIS_CHAIN_BOOK_FAST_HANDOFF_V1__=true;
const trace=(event,data={})=>{try{console.info('[JARVIS:BOOK_CHAIN_FAST]',event,data);window.dispatchEvent(new CustomEvent('jarvis:ebook-reader-trace',{detail:{event:'BOOK_CHAIN_FAST_'+event,...data,at:Date.now()}}))}catch{}};
const install=()=>{
  const fast=window.jarvisEbookBookFastResolver;
  const entity=window.jarvisEntityAuthority;
  if(!fast||typeof fast.run!=='function'||!entity||typeof entity.handle!=='function'||entity.__jarvisChainWrapped)return false;
  const original=entity.handle;
  const wrapped=async raw=>{
    if(!window.__JARVIS_COMMAND_CHAIN_RUNNING__)return original(raw);
    const started=Date.now();
    trace('START',{raw});
    try{
      const ok=!!(await fast.run(raw));
      trace('RESULT',{raw,ok,ms:Date.now()-started});
      if(ok)return true;
    }catch(error){
      trace('ERROR',{raw,error:String(error?.message||error),ms:Date.now()-started});
    }
    trace('FALLBACK_ENTITY',{raw,ms:Date.now()-started});
    try{return !!(await original(raw))}catch(error){trace('FALLBACK_ERROR',{raw,error:String(error?.message||error)});return false}
  };
  wrapped.__jarvisChainWrapped=true;
  entity.handle=wrapped;
  trace('INSTALLED',{fastVersion:fast.version||'unknown',entityVersion:entity.version||'unknown'});
  return true;
};
if(!install()){
  let n=0;
  const timer=setInterval(()=>{if(install()||++n>100)clearInterval(timer)},50);
}
})();
