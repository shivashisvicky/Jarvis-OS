(()=>{
'use strict';
if(window.__JARVIS_MAP_REFERENCE_PREFLIGHT_V1__)return;
window.__JARVIS_MAP_REFERENCE_PREFLIGHT_V1__=true;

/*
 * Maps reference preflight.
 *
 * This is intentionally narrower than command authority: it owns no intent
 * classification and no search routing. It only consumes the live Maps
 * result set for an ordinal follow-up such as "open the second one".
 * This mirrors the existing Search/Media reference pattern while avoiding
 * a second Maps search or a stale context snapshot.
 */
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const indexOf=q=>{
 const s=clean(q).toLowerCase().replace(/[?.!]+$/,'');
 if(!/^(?:please\s+)?(?:open|read|show)\s+(?:the\s+)?(?:first|second|third|last|1(?:st)?|2(?:nd)?|3(?:rd)?|one|two|three)(?:\s+(?:one|result|place))?$/.test(s))return null;
 if(/\b(?:first|1st|one)\b/.test(s))return 0;
 if(/\b(?:second|2nd|two)\b/.test(s))return 1;
 if(/\b(?:third|3rd|three)\b/.test(s))return 2;
 return -1;
};
const stop=e=>{try{e?.preventDefault?.();e?.stopImmediatePropagation?.()}catch{}};
const live=()=>{try{return window.jarvisMapAuthority?.getContext?.()||null}catch{return null}};
const speak=text=>{const el=document.querySelector('#jarvisReply');if(el){el.textContent=text;el.classList.add('visible')}try{window.jarvisVoiceAuthoritySpeak?.(text)||window.jarvisCinematicSpeak?.(text)||window.jarvisSpeak?.(text)}catch{}};
const open=q=>{
 const wanted=indexOf(q);if(wanted===null)return false;
 const ctx=live();
 if(String(ctx?.domain||'').toUpperCase()!=='MAPS'||!ctx?.active||!Array.isArray(ctx.results)||!ctx.results.length)return false;
 const index=wanted===-1?ctx.results.length-1:wanted;
 const item=ctx.results[index];if(!item)return false;
 const select=()=>{try{window.jarvisContextEngine?.set?.({domain:'MAPS',active:true,selected:{...item}},'merge')}catch{} };
 const clickCurrent=()=>{
  const nodes=[...document.querySelectorAll('#mapResults [data-jarvis-map-v26],#mapResults [data-jarvis-map-name]')];
  const node=nodes.find(x=>Number(x.getAttribute('data-jarvis-map-v26')??x.getAttribute('data-jarvis-map-name'))===index);
  if(node instanceof HTMLElement){select();node.click();speak(`Opening ${clean(item.name||item.title||'that result')}.`);return true}
  return false;
 };
 stop();
 if(clickCurrent())return true;
 const next=()=>document.querySelector('#mapNext');
 let attempts=0;
 const advance=()=>{
  if(clickCurrent())return;
  ++attempts;
  if(attempts>20){speak('I could not open that map result.');return}
  /* Results 1-6 are already on the current page. Wait for Maps to finish
     rendering instead of incorrectly treating a missing NEXT button as a
     pagination failure. */
  if(index<6){window.setTimeout(advance,100);return}
  const n=next();
  if(!(n instanceof HTMLButtonElement)||n.disabled){window.setTimeout(advance,100);return}
  n.click();window.setTimeout(advance,120);
 };
 window.setTimeout(advance,80);
 return true;
};
const voice=e=>{if(open(e.detail?.text))stop(e)};
const submit=e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const q=f.querySelector('#commandInput')?.value;if(open(q))stop(e)};
window.addEventListener('jarvis:voice-command',voice,true);
document.addEventListener('submit',submit,true);
window.jarvisMapReferencePreflight={version:'1.1.0',run:open};
})();
