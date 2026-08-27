(()=>{
'use strict';
if(window.__JARVIS_CONTEXT_REFERENCE_AUTHORITY_V1__)return;
window.__JARVIS_CONTEXT_REFERENCE_AUTHORITY_V1__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const isBookDomain=d=>d==='BOOKS'||d==='BOOK'||d==='BOOK_AUTHOR';
const reference=/^(?:please\s+)?(?:open|read|show)\s+(?:the\s+)?(?:first|second|third|1(?:st)?|2(?:nd)?|3(?:rd)?|one|two|three)(?:\s+(?:one|result))?$/i;
const numberRef=/^(?:please\s+)?(?:open|read|show)\s+(?:result|number|no\.?)\s+\d+$/i;
const isRef=q=>reference.test(q)||numberRef.test(q);
const getBooksContext=()=>{
 const engine=window.jarvisContextEngine;
 const live=engine?.get?.();
 if(live?.active){
   if(isBookDomain(live.domain)&&Array.isArray(live.results)&&live.results.length)return {ctx:live,source:'live'};
   return null;
 }
 const memory=window.jarvisContextMemory;
 const saved=memory?.get?.();
 if(isBookDomain(saved?.domain)&&Array.isArray(saved.results)&&saved.results.length)return {ctx:saved,source:'memory'};
 return null;
};
const explainNoContext=()=>{
 const text='I do not have a current book result list to read from. Search for a book first, then ask me to read a result.';
 const el=document.querySelector('#jarvisReply');
 if(el){el.textContent=text;el.classList.add('visible')}
 try{window.jarvisVoiceAuthoritySpeak?.(text)||window.jarvisCinematicSpeak?.(text)||window.jarvisSpeak?.(text)}catch{}
};
const resolve=(target,ctx,source)=>{
 const engine=window.jarvisContextEngine;
 if(source==='live'){
   const resolved=engine?.resolveReference?.(target);
   if(resolved?.matched)return resolved;
 }
 const memory=window.jarvisContextMemory;
 const resolved=memory?.resolveReference?.(target);
 if(resolved?.matched&&isBookDomain(resolved.domain))return resolved;
 const list=Array.isArray(ctx?.results)?ctx.results:[];
 const q=clean(target).toLowerCase().replace(/[?.!]+$/,'');
 const idx=/^(?:the\s+)?(?:first|1(?:st)?|one)(?:\s+(?:one|result))?$/.test(q)?0:/^(?:the\s+)?(?:second|2(?:nd)?|two)(?:\s+(?:one|result))?$/.test(q)?1:/^(?:the\s+)?(?:third|3(?:rd)?|three)(?:\s+(?:one|result))?$/.test(q)?2:null;
 return idx!==null&&list[idx]?{matched:true,type:'RESULT',index:idx,value:list[idx],domain:'BOOKS'}:{matched:false,reason:'unresolved'};
};
const run=(raw)=>{
 const q=clean(raw);if(!isRef(q))return false;
 const target=clean(q.replace(/^(?:please\s+)?(?:open|read|show)\s+/i,''));
 const hit=getBooksContext();
 if(!hit){explainNoContext();return true}
 const resolved=resolve(target,hit.ctx,hit.source);
 if(!resolved?.matched){explainNoContext();return true}
 window.dispatchEvent(new CustomEvent('jarvis:context-followup',{detail:{type:'SELECT',text:target,context:hit.ctx,source:hit.source,resolved}}));
 return true;
};
const intercept=e=>{const raw=clean(e.detail?.text);if(!run(raw))return;e.preventDefault?.();e.stopImmediatePropagation?.()};
window.addEventListener('jarvis:voice-command',intercept,true);
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const input=f.querySelector('#commandInput');const raw=input instanceof HTMLInputElement?input.value:'';if(!run(raw))return;e.preventDefault();e.stopImmediatePropagation();if(input instanceof HTMLInputElement)input.value=''},true);
window.jarvisContextReferenceAuthority={version:'2.2.0',run};
})();
