(()=>{
'use strict';
if(window.__JARVIS_CHAIN_BOOK_FAST_HANDOFF_V1__)return;
window.__JARVIS_CHAIN_BOOK_FAST_HANDOFF_V1__=true;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const bookTitle=s=>clean(s).replace(/^(?:book\s+)+/i,'').trim();
const trace=(event,data={})=>{try{console.info('[JARVIS:BOOK_CHAIN_FAST]',event,data);window.dispatchEvent(new CustomEvent('jarvis:ebook-reader-trace',{detail:{event:'BOOK_CHAIN_FAST_'+event,...data,at:Date.now()}}))}catch{}};
const bookContextReady=()=>{try{const c=window.jarvisContextEngine?.get?.()||{};return String(c.domain||'').toUpperCase()==='BOOKS'&&Array.isArray(c.results)&&c.results.length>0}catch{return false}};
const waitForBookContext=async(timeout=10000)=>{if(bookContextReady())return true;return await new Promise(resolve=>{let done=false;let timer=0;let poll=0;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);clearInterval(poll);window.removeEventListener('jarvis:ebook-context',on);resolve(ok)};const on=()=>{if(bookContextReady())finish(true)};window.addEventListener('jarvis:ebook-context',on);poll=setInterval(on,50);timer=setTimeout(()=>finish(bookContextReady()),timeout)});};
const runAuthorityOnce=async(raw)=>{
  const title=bookTitle(raw);
  const key=title.toLowerCase();
  const active=window.__JARVIS_CHAIN_BOOK_AUTHORITY_INFLIGHT__;
  if(active?.key===key&&active.promise){trace('COMMAND_AUTHORITY_REUSE',{raw,title});return await active.promise}
  const promise=(async()=>{
    const started=Date.now();
    trace('COMMAND_AUTHORITY_START',{raw,title});
    trace('COMMAND_AUTHORITY_WAIT_START',{raw,title});
    const authorityText=`book ${title}`;
    window.dispatchEvent(new CustomEvent('jarvis:voice-command',{detail:{text:authorityText,source:'chain-book-handoff',chainBookHandoff:true}}));
    trace('COMMAND_AUTHORITY_DISPATCHED',{raw,title,authorityText,ms:Date.now()-started,mode:'VOICE_AUTHORITY'});
    const ready=await waitForBookContext(10000);
    trace(ready?'COMMAND_AUTHORITY_CONTEXT_READY':'COMMAND_AUTHORITY_CONTEXT_TIMEOUT',{raw,title,ms:Date.now()-started});
    return ready;
  })();
  window.__JARVIS_CHAIN_BOOK_AUTHORITY_INFLIGHT__={key,promise};
  try{return await promise}finally{if(window.__JARVIS_CHAIN_BOOK_AUTHORITY_INFLIGHT__?.promise===promise)delete window.__JARVIS_CHAIN_BOOK_AUTHORITY_INFLIGHT__}
};
const install=()=>{
  const entity=window.jarvisEntityAuthority;
  if(!entity||typeof entity.handle!=='function')return false;
  if(entity.handle.__jarvisChainBookAuthority)return true;
  const original=entity.handle;
  const wrapped=async raw=>{
    if(!window.__JARVIS_COMMAND_CHAIN_RUNNING__)return original(raw);
    const input=document.querySelector('#commandInput');
    if(!(input instanceof HTMLInputElement))return original(raw);
    const title=bookTitle(raw);
    if(!title)return false;
    input.value=title;
    try{return await runAuthorityOnce(raw)}catch(error){
      trace('COMMAND_AUTHORITY_ERROR',{raw,title,error:String(error?.message||error)});
      return original(title);
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
