(()=>{
'use strict';
if(window.__JARVIS_CONTEXT_REFERENCE_AUTHORITY_V1__)return;
window.__JARVIS_CONTEXT_REFERENCE_AUTHORITY_V1__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const lower=s=>clean(s).toLowerCase().replace(/[?.!]+$/,'');
const reference=/^(?:please\s+)?(?:open|read|show)\s+(?:the\s+)?(?:first|second|third|1(?:st)?|2(?:nd)?|3(?:rd)?|one|two|three)(?:\s+(?:one|result))?$/i;
const numberRef=/^(?:please\s+)?(?:open|read|show)\s+(?:result|number|no\.?)\s+\d+$/i;
const run=(raw)=>{
 const q=clean(raw); if(!reference.test(q)&&!numberRef.test(q))return false;
 const engine=window.jarvisContextEngine;
 const ctx=engine?.get?.();
 if(!ctx?.active||ctx.domain!=='BOOKS'||!Array.isArray(ctx.results)||!ctx.results.length)return false;
 const target=clean(q.replace(/^(?:please\s+)?(?:open|read|show)\s+/i,''));
 const resolved=engine.resolveReference?.(target);
 if(!resolved?.matched)return false;
 window.dispatchEvent(new CustomEvent('jarvis:context-followup',{detail:{type:'SELECT',text:target,context:ctx}}));
 return true;
};
const intercept=e=>{const raw=clean(e.detail?.text);if(!run(raw))return;e.preventDefault?.();e.stopImmediatePropagation?.()};
window.addEventListener('jarvis:voice-command',intercept,true);
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const input=f.querySelector('#commandInput');const raw=input instanceof HTMLInputElement?input.value:'';if(!run(raw))return;e.preventDefault();e.stopImmediatePropagation();if(input instanceof HTMLInputElement)input.value=''},true);
window.jarvisContextReferenceAuthority={version:'1.0.0',run};
})();
