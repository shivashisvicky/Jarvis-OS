(()=>{
'use strict';
if(window.__JARVIS_MAP_CONTEXT_NAV_FIX_V1__)return;
window.__JARVIS_MAP_CONTEXT_NAV_FIX_V1__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const ctx=()=>{try{return window.jarvisContextEngine?.get?.()||null}catch{return null}};
const nearest=()=>{try{return window.jarvisMapAuthority?.nearest?.()||null}catch{return null}};
const resolveTarget=raw=>{
 const q=clean(raw);
 if(!/^(?:please\s+)?(?:take me|take me to|navigate me|navigate me to|navigate to|directions? to|go to|open maps? for)\s+(?:there|here|that one|that place|it)$/i.test(q))return null;
 const c=ctx();
 const n=nearest();
 const selected=c?.selected||null;
 const target=selected?.name||n?.name||null;
 return target?{target,source:selected?'selected':'nearest'}:null;
};
const openMap=target=>{
 const nav=document.querySelector('.nav[data-app="maps"]');
 if(nav instanceof HTMLElement&&!nav.classList.contains('selected'))nav.click();
 let tries=0;
 const apply=()=>{
  const input=document.querySelector('#mapQuery');
  if(!(input instanceof HTMLInputElement)){if(++tries<100)window.setTimeout(apply,40);return}
  input.value=target;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
  try{window.jarvisContextEngine?.set?.({domain:'MAPS',location:target,query:target,results:null,selected:null},'merge')}catch{}
  try{window.dispatchEvent(new CustomEvent('jarvis:map-intent',{detail:{place:target,query:target,source:'contextual-navigation'},cancelable:true}))}catch{}
 };
 window.setTimeout(apply,0);
};
const reply=text=>{try{const el=document.querySelector('#jarvisReply');if(el){el.textContent=text;el.classList.add('visible')}}catch{}try{window.jarvisSpeak?.(text)}catch{}};
const handle=raw=>{const r=resolveTarget(raw);if(!r)return false;try{window.speechSynthesis?.cancel();window.jarvisStopIOSVoice?.();window.jarvisStopAllVoiceSessions?.()}catch{}openMap(r.target);reply(`Taking you to ${r.target}.`);return true};
const intercept=e=>{const raw=clean(e.detail?.text);if(!handle(raw))return;try{e.preventDefault();e.stopImmediatePropagation()}catch{}};
window.addEventListener('jarvis:voice-command',intercept,true);
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const i=f.querySelector('#commandInput');if(i instanceof HTMLInputElement&&handle(i.value)){e.preventDefault();e.stopImmediatePropagation()}},true);
})();
