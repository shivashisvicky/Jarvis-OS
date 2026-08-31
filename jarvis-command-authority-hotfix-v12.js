(()=>{
'use strict';
if(window.__JARVIS_COMMAND_AUTHORITY_HOTFIX_V14__)return;
window.__JARVIS_COMMAND_AUTHORITY_HOTFIX_V14__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
/* Context bridge: Maps may expose its live result list only when the
   canonical context has no competing explicit surface. Never overwrite a
   current SEARCH/BOOKS/MEDIA context with stale Maps state. */
try{
 const engine=window.jarvisContextEngine;
 const map=window.jarvisMapAuthority;
 if(engine&&map&&typeof engine.get==='function'&&typeof map.getContext==='function'&&!engine.__JARVIS_MAP_LIVE_CONTEXT_BRIDGED__){
  const originalGet=engine.get.bind(engine);
  engine.get=()=>{
   const base=originalGet()||{};
   const live=map.getContext()||{};
   const baseDomain=String(base.domain||'').toUpperCase();
   const liveDomain=String(live.domain||'').toUpperCase();
   const baseResults=Array.isArray(base.results)?base.results:[];
   const liveResults=Array.isArray(live.results)?live.results:[];
   if(baseDomain&&baseDomain!=='UNKNOWN')return base;
   if(liveDomain==='MAPS'&&liveResults.length){
    return {...base,...live,domain:'MAPS',active:true,results:liveResults};
   }
   return base;
  };
  engine.__JARVIS_MAP_LIVE_CONTEXT_BRIDGED__=true;
 }
}catch{}

const reply=text=>{
 const el=document.querySelector('#jarvisReply');
 if(el){el.textContent=text;el.classList.add('visible')}
 try{
  if(typeof window.jarvisSpeak==='function')window.jarvisSpeak(text);
  else if('speechSynthesis'in window){const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=1.05;u.pitch=.54;speechSynthesis.speak(u)}
 }catch{}
};
const localTime=()=>new Intl.DateTimeFormat([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date());
const isTime=q=>/^(?:please\s+)?(?:time(?:\s+now)?|what(?:'s| is|s)\s+(?:the\s+)?(?:local\s+)?time(?:\s+now)?|tell\s+me(?:\s+the)?(?:\s+local)?\s*time(?:\s+now)?)$/i.test(clean(q).replace(/[?.!]+$/,''));
const noteText=q=>clean(q).replace(/^\s*(?:please\s+)?(?:make\s+(?:me\s+)?a\s+note|make\s+note|write\s+(?:me\s+)?a\s+note|remember\s+to|remind\s+me)\s*/i,'').trim();
const handleMapFollowup=q=>{
 const s=clean(q).replace(/[?.!]+$/,'').trim();
 if(!/^(?:what(?:'s|s| is)\s+(?:the\s+)?(?:nearest|closest)(?:\s+(?:one|restaurant|place|option))?|which\s+is\s+(?:the\s+)?(?:nearest|closest)(?:\s+(?:one|restaurant|place|option))?|what\s+is\s+(?:the\s+)?(?:nearest|closest)(?:\s+(?:one|restaurant|place|option))?|(?:which|what)\s+(?:one|restaurant|place|option)(?:\s+of\s+(?:these|them))?\s+(?:is\s+)?(?:the\s+)?(?:nearest|closest)(?:\s+(?:one|restaurant|place|option))?|(?:which|what)\s+(?:restaurant|place|option)\s+(?:is\s+)?(?:the\s+)?(?:nearest|closest)|(?:which|what)\s+(?:one|restaurant|place|option)\s+is\s+(?:the\s+)?(?:nearest|closest)|(?:which|what)\s+(?:of\s+(?:these|them)\s+)?(?:the\s+)?(?:nearest|closest)\s+(?:one|restaurant|place|option)?|(?:the\s+)?(?:nearest|closest)\s+(?:one|restaurant|place|option)\s+to\s+(?:me|here))$/i.test(s))return false;
 const mc=(()=>{try{return window.jarvisMapAuthority?.getContext?.()||null}catch{return null}})();
 if(mc?.domain!=='MAPS'||!mc?.active)return false;
 const results=Array.isArray(mc.results)?mc.results:[];
 if(!results.length){reply('I have not got a restaurant result to compare yet.');return true}
 const best=results.reduce((a,b)=>Number(b?.distance)<Number(a?.distance)?b:a,results[0]);
 try{window.jarvisContextEngine?.set?.({domain:'MAPS',active:true,selected:{...best}},'merge')}catch{}
 const distance=Number(best?.distance),distanceText=Number.isFinite(distance)?`, ${distance<1?(distance*1000).toFixed(0)+' metres':distance.toFixed(1)+' kilometres'} away`:'';
 reply(`The nearest option is ${clean(best?.name||best?.title||best?.display_name)}${distanceText}.`);return true;
};
const handle=q=>{
 const s=clean(q);if(!s)return false;
 if(isTime(s)){reply(`The local time is ${localTime()}.`);return true}
 if(handleMapFollowup(s))return true;
 if(/^(?:what(?:'s| is|s)\s+my\s+name|who\s+am\s+i)$/i.test(s)){reply('Your name is Shivashis.');return true}
 if(/^(?:please\s+)?(?:make\s+(?:me\s+)?a\s+note|make\s+note|write\s+(?:me\s+)?a\s+note|remember\s+to|remind\s+me)\s+.+/i.test(s)){
  const text=noteText(s);const nav=document.querySelector('.nav[data-app="notes"]);
  if(nav instanceof HTMLElement&&!nav.classList.contains('selected'))nav.click();
  window.setTimeout(()=>window.dispatchEvent(new CustomEvent('jarvis:create-note',{detail:{text}})),0);reply(`Saved note: ${text}`);return true;
 }
 return false;
};
const intercept=e=>{const q=clean(e.detail?.text);if(!handle(q))return;e.preventDefault?.();e.stopImmediatePropagation?.()};
window.addEventListener('jarvis:voice-command',intercept,true);
const submit=e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const i=f.querySelector('#commandInput');const q=i instanceof HTMLInputElement?i.value:'';if(!handle(q))return;e.preventDefault();e.stopImmediatePropagation()};
window.addEventListener('submit',submit,true);document.addEventListener('submit',submit,true);
})();

(()=>{'use strict';
if(window.__JARVIS_EBOOK_RESILIENCE_V1__)return;window.__JARVIS_EBOOK_RESILIENCE_V1__=true;
const trace=(event,detail={})=>{try{console.info('[JARVIS:EBOOK_RESILIENCE]',event,detail)}catch{};try{window.dispatchEvent(new CustomEvent('jarvis:ebook-resilience',{detail:{event,...detail,at:Date.now()}}))}catch{}};
const norm=s=>String(s??'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const isEbooks=()=>document.querySelector('#jarvisFilesV4 .jf4-opt.active')?.dataset.tab==='ebooks';
let restoring=false,lastQuery='';
const restore=()=>{
 if(restoring||!isEbooks())return;
 const panel=document.querySelector('#jbe6Panel');if(!panel)return;
 const input=panel.querySelector('#jbe6Query');const results=panel.querySelector('#jbe6Results');
 let q=String(input?.value||'').trim();
 if(q.length<2){try{q=String(sessionStorage.getItem('jarvis:ebook:last-query')||'').trim();if(q.length>=2&&input)input.value=q}catch{}}
 if(q.length<2)return;
 const text=String(results?.textContent||'').trim();
 const wrongDefault=/^Moby Dick: Or, The Whale/i.test(text)||/1\. Moby Dick/i.test(text);
 const empty=!text||/SEARCHING GUTENBERG|SEARCH ERROR|TEMPORARILY UNAVAILABLE/i.test(text);
 if(!empty&&!wrongDefault&&norm(q)===norm(lastQuery))return;
 const auth=window.jarvisEbookSearchAuthority;if(!auth?.search)return;
 lastQuery=q;restoring=true;trace('RESTORE_SEARCH',{query:q,empty,wrongDefault});
 Promise.resolve(auth.search(q)).finally(()=>setTimeout(()=>{restoring=false},300));
};
document.addEventListener('input',e=>{const q=e.target?.closest?.('#jbe6Query')?.value?.trim();if(q){try{sessionStorage.setItem('jarvis:ebook:last-query',q)}catch{}}},true);
const obs=new MutationObserver(()=>{if(!restoring)setTimeout(restore,80)});obs.observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{if(isEbooks())restore()},1200);
let readerRetries=0,readerKey='';
const watchReader=()=>{
 const r=document.querySelector('.jbe11.jarvis-ebook-reader');if(!r)return;
 const title=norm(r.querySelector('.jbe11-title')?.textContent||'');
 if(title!==readerKey){readerKey=title;readerRetries=0;trace('READER_OPEN',{title})}
 const page=r.querySelector('#jbe11Page'),status=r.querySelector('#jbe11Status');if(!page||!status)return;
 const visible=page.offsetParent!==null&&String(page.textContent||'').trim().length>100;if(visible)return;
 if(status.dataset.resilienceTimer)return;
 status.dataset.resilienceTimer='1';
 setTimeout(()=>{
  status.removeAttribute('data-resilience-timer');
  const nowPage=r.querySelector('#jbe11Page');
  const loaded=nowPage&&nowPage.offsetParent!==null&&String(nowPage.textContent||'').trim().length>100;
  if(loaded||!r.isConnected)return;
  if(readerRetries>=2)return;
  readerRetries++;const retry=r.querySelector('#jbe11Retry');
  trace('READER_RETRY',{title,attempt:readerRetries,hasRetry:!!retry});
  if(retry)retry.click();
 },7000);
};
setInterval(watchReader,500);trace('READY');
})();
