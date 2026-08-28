(()=>{
'use strict';
if(window.__JARVIS_COMMAND_AUTHORITY_HOTFIX_V14__)return;
window.__JARVIS_COMMAND_AUTHORITY_HOTFIX_V14__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
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
