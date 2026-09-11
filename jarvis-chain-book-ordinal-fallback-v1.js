(()=>{
'use strict';
if(window.__JARVIS_CHAIN_BOOK_ORDINAL_FALLBACK_V1__)return;
window.__JARVIS_CHAIN_BOOK_ORDINAL_FALLBACK_V1__=true;
const clean=s=>String(s??'').replace(/[.!?]+\s*$/,'').replace(/\s+/g,' ').trim();
const bookContextReady=()=>{try{const c=window.jarvisContextEngine?.get?.()||{};return String(c.domain||'').toUpperCase()==='BOOKS'&&Array.isArray(c.results)&&c.results.length>0}catch{return false}};
const waitForBooks=async(timeout=10000)=>{if(bookContextReady())return true;return await new Promise(resolve=>{let done=false,timer=0,poll=0;const finish=ok=>{if(done)return;done=true;clearTimeout(timer);clearInterval(poll);window.removeEventListener('jarvis:ebook-context',on);resolve(ok)};const on=()=>{if(bookContextReady())finish(true)};window.addEventListener('jarvis:ebook-context',on);poll=setInterval(on,50);timer=setTimeout(()=>finish(bookContextReady()),timeout)})};
const trace=(event,data={})=>{try{console.info('[JARVIS:BOOK_CHAIN_ORDINAL_FALLBACK]',event,data);window.dispatchEvent(new CustomEvent('jarvis:ebook-reader-trace',{detail:{event:'BOOK_CHAIN_ORDINAL_FALLBACK_'+event,...data,at:Date.now()}}))}catch{}};
window.addEventListener('jarvis:command-chain',e=>{
  const d=e.detail||{},parts=Array.isArray(d.parts)?d.parts:[],routes=Array.isArray(d.routes)?d.routes:[];
  if(parts.length<2||String(routes[0]?.type||'').toUpperCase()!=='BOOKS'||routes[1]?.type)return;
  const clause=clean(parts[1]);
  if(!/^(?:please\s+)?(?:open|read|show)\s+(?:the\s+)?(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|\d+(?:st|nd|rd|th)?)(?:\s+(?:one|result))?$/i.test(clause))return;
  trace('ARMED',{clause,parts,routes});
  void (async()=>{
    const ready=await waitForBooks(10000);
    trace(ready?'CONTEXT_READY':'CONTEXT_TIMEOUT',{clause});
    if(!ready)return;
    try{
      const run=window.jarvisContextReferenceAuthority?.run;
      if(typeof run==='function'){const ok=run(clause);trace('DIRECT_REFERENCE',{clause,ok:!!ok})}
    }catch(error){trace('ERROR',{clause,error:String(error?.message||error)})}
  })();
},false);
})();
