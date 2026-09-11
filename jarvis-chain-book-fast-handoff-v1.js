(()=>{
'use strict';
if(window.__JARVIS_CHAIN_BOOK_FAST_HANDOFF_V1__)return;
window.__JARVIS_CHAIN_BOOK_FAST_HANDOFF_V1__=true;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const trace=(event,data={})=>{try{console.info('[JARVIS:BOOK_CHAIN_FAST]',event,data);window.dispatchEvent(new CustomEvent('jarvis:ebook-reader-trace',{detail:{event:'BOOK_CHAIN_FAST_'+event,...data,at:Date.now()}}))}catch{}};
const install=()=>{
  const entity=window.jarvisEntityAuthority;
  if(!entity||typeof entity.handle!=='function'||entity.handle.__jarvisChainBookAuthority)return false;
  const original=entity.handle;
  const wrapped=async raw=>{
    if(!window.__JARVIS_COMMAND_CHAIN_RUNNING__)return original(raw);
    const input=document.querySelector('#commandInput');
    if(!(input instanceof HTMLInputElement))return original(raw);
    const started=Date.now();
    input.value=clean(raw);
    trace('COMMAND_AUTHORITY_START',{raw});
    try{
      window.dispatchEvent(new CustomEvent('jarvis:voice-command',{detail:{text:clean(raw),source:'chain-book-handoff'}}));
      trace('COMMAND_AUTHORITY_DISPATCHED',{raw,ms:Date.now()-started,mode:'VOICE_AUTHORITY'});
      return true;
    }catch(error){
      trace('COMMAND_AUTHORITY_ERROR',{raw,error:String(error?.message||error)});
      return original(raw);
    }
  };
  wrapped.__jarvisChainBookAuthority=true;
  window.jarvisEntityAuthority=Object.freeze({...entity,handle:wrapped});
  trace('INSTALLED',{entityVersion:entity.version||'unknown',mode:'ebook-command-authority'});
  return true;
};
if(!install()){
  let n=0;
  const timer=setInterval(()=>{if(install()||++n>100)clearInterval(timer)},50);
}
})();
