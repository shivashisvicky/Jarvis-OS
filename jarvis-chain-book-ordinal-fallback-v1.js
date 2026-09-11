(()=>{
'use strict';
if(window.__JARVIS_CHAIN_BOOK_ORDINAL_FALLBACK_V1__)return;
window.__JARVIS_CHAIN_BOOK_ORDINAL_FALLBACK_V1__=true;
const clean=s=>String(s??'').replace(/[.!?]+\s*$/,'').replace(/\s+/g,' ').trim();
const ordinalIndex=q=>{const s=clean(q).toLowerCase().replace(/^please\s+/,'').replace(/^(?:open|read|show)\s+/,'').replace(/^the\s+/,'').replace(/\s+(?:one|result)$/,'').trim();const n={first:1,second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10,eleventh:11,twelfth:12,thirteenth:13,fourteenth:14,fifteenth:15,sixteenth:16,seventeenth:17,eighteenth:18,nineteenth:19,twentieth:20,thirtieth:30,fortieth:40,fiftieth:50,sixtieth:60,seventieth:70,eightieth:80,ninetieth:90};if(/^\d+$/.test(s))return Number(s)-1;const m=s.match(/^(\d+)(?:st|nd|rd|th)$/);if(m)return Number(m[1])-1;return Number.isInteger(n[s])?n[s]-1:null};
const bookContext=()=>{try{const c=window.jarvisContextEngine?.get?.()||{};return String(c.domain||'').toUpperCase()==='BOOKS'&&Array.isArray(c.results)&&c.results.length?c:null}catch{return null}};
const waitForBooks=async(timeout=10000)=>{const initial=bookContext();if(initial)return initial;return await new Promise(resolve=>{let done=false,timer=0,poll=0;const finish=c=>{if(done)return;done=true;clearTimeout(timer);clearInterval(poll);window.removeEventListener('jarvis:ebook-context',on);resolve(c||bookContext())};const on=()=>{const c=bookContext();if(c)finish(c)};window.addEventListener('jarvis:ebook-context',on);poll=setInterval(on,50);timer=setTimeout(()=>finish(bookContext()),timeout)})};
const trace=(event,data={})=>{try{console.info('[JARVIS:BOOK_CHAIN_ORDINAL_FALLBACK]',event,data);window.dispatchEvent(new CustomEvent('jarvis:ebook-reader-trace',{detail:{event:'BOOK_CHAIN_ORDINAL_FALLBACK_'+event,...data,at:Date.now()}}))}catch{}};
window.addEventListener('jarvis:command-chain',e=>{
  const d=e.detail||{},parts=Array.isArray(d.parts)?d.parts:[],routes=Array.isArray(d.routes)?d.routes:[];
  if(parts.length<2||String(routes[0]?.type||'').toUpperCase()!=='BOOKS'||routes[1]?.type)return;
  const clause=clean(parts[1]);
  if(!/^(?:please\s+)?(?:open|read|show)\s+(?:the\s+)?(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth|\d+(?:st|nd|rd|th)?)(?:\s+(?:one|result))?$/i.test(clause))return;
  trace('ARMED',{clause,parts,routes});
  void (async()=>{
    const ctx=await waitForBooks(10000);
    trace(ctx?'CONTEXT_READY':'CONTEXT_TIMEOUT',{clause});
    if(!ctx)return;
    const index=ordinalIndex(clause),item=Number.isInteger(index)?ctx.results?.[index]:null;
    if(!item){trace('INDEX_REJECTED',{clause,index,count:ctx.results?.length||0});return}
    const title=clean(item.title||'').replace(/^\d+\.\s*/,'');
    trace('READER_HANDOFF_START',{clause,index,id:item.id,title});
    try{
      const openAfterRender=window.jarvisEbookOrdinalReaderRaceFix?.openAfterRender;
      if(typeof openAfterRender==='function'){
        const ok=await openAfterRender({context:ctx,resolved:{matched:true,index,value:item,domain:'BOOKS'},source:'book-chain-fallback'});
        trace('READER_HANDOFF_RESULT',{clause,index,ok:!!ok});
        return;
      }
      const reader=window.jarvisEbookReaderOpen;
      if(typeof reader==='function'&&item.id!=null){reader(item.id,title);trace('READER_DIRECT_FALLBACK',{clause,index,ok:true});return}
      trace('READER_UNAVAILABLE',{clause,index});
    }catch(error){trace('ERROR',{clause,index,error:String(error?.message||error)})}
  })();
},false);
})();
