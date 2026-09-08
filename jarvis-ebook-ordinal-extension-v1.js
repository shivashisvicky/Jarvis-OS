(()=>{
'use strict';
if(window.__JARVIS_EBOOK_ORDINAL_EXTENSION_V1__)return;
window.__JARVIS_EBOOK_ORDINAL_EXTENSION_V1__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const words=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth','fifteenth','sixteenth','seventeenth','eighteenth','nineteenth','twentieth'];
const wordIndex=new Map(words.map((w,i)=>[w,i]));
const ordinalIndex=q=>{const s=clean(q).toLowerCase().replace(/[?.!]+$/,'');const m=s.match(/^(?:the\s+)?(first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth)(?:\s+(?:one|result))?$/);if(m)return wordIndex.get(m[1]);const n=s.match(/^(?:the\s+)?(\d+)(?:st|nd|rd|th)(?:\s+(?:one|result))?$/);return n?Number(n[1])-1:null};
const isOrdinalCommand=q=>/^(?:please\s+)?(?:open|read|show)\s+(?:the\s+)?(?:(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth|thirteenth|fourteenth|fifteenth|sixteenth|seventeenth|eighteenth|nineteenth|twentieth)(?:\s+(?:one|result))?|\d+(?:st|nd|rd|th)(?:\s+(?:one|result))?)$/i.test(clean(q));
const isBooks=ctx=>ctx?.active&&['BOOKS','BOOK','BOOK_AUTHOR'].includes(String(ctx.domain||'').toUpperCase())&&Array.isArray(ctx.results)&&ctx.results.length>0;
const run=raw=>{const q=clean(raw);if(!isOrdinalCommand(q))return false;const ctx=window.jarvisContextEngine?.get?.()||window.jarvisContextMemory?.get?.();if(!isBooks(ctx))return false;const target=q.replace(/^(?:please\s+)?(?:open|read|show)\s+/i,'');const idx=ordinalIndex(target);if(!Number.isInteger(idx)||idx<0||!ctx.results[idx])return false;const resolved={matched:true,type:'RESULT',index:idx,value:ctx.results[idx],domain:'BOOKS'};window.dispatchEvent(new CustomEvent('jarvis:context-followup',{detail:{type:'SELECT',text:target,context:ctx,source:'ordinal-extension',resolved}}));return true};
const interceptVoice=e=>{if(run(e.detail?.text)){e.preventDefault?.();e.stopImmediatePropagation?.()}};
const interceptSubmit=e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const input=f.querySelector('#commandInput');const q=input instanceof HTMLInputElement?input.value:'';if(!run(q))return;e.preventDefault();e.stopImmediatePropagation();if(input instanceof HTMLInputElement)input.value=''};
window.addEventListener('jarvis:voice-command',interceptVoice,true);
document.addEventListener('submit',interceptSubmit,true);
window.jarvisEbookOrdinalExtension={version:'1.0.0',run};
})();
