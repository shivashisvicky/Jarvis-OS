(()=>{
'use strict';
if(window.__JARVIS_COMMAND_SUBMIT_RECOVERY_V1__)return;
window.__JARVIS_COMMAND_SUBMIT_RECOVERY_V1__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const reply=text=>{const el=document.querySelector('#jarvisReply');if(el){el.textContent=text;el.classList.add('visible')}try{window.jarvisSpeak?.(text)}catch{}};
const time=q=>/^(?:please\s+)?(?:time(?:\s+now)?|what(?:'s| is|s)\s+(?:the\s+)?(?:local\s+)?time(?:\s+now)?|tell\s+me(?:\s+the)?(?:\s+local)?\s*time(?:\s+now)?)$/i.test(clean(q).replace(/[?.!]+$/,''));
const name=q=>/^(?:what(?:'s| is|s)\s+my\s+name|who\s+am\s+i)$/i.test(clean(q).replace(/[?.!]+$/,''));
const note=q=>/^(?:please\s+)?(?:make\s+(?:me\s+)?a\s+note|make\s+note|write\s+(?:me\s+)?a\s+note|remember\s+to|remind\s+me)\s+.+/i.test(clean(q));
const noteText=q=>clean(q).replace(/^\s*(?:please\s+)?(?:make\s+(?:me\s+)?a\s+note|make\s+note|write\s+(?:me\s+)?a\s+note|remember\s+to|remind\s+me)\s*/i,'').trim();
const mapNav=q=>{try{return window.jarvisCommandAuthority?.route(q)?.type==='MAP_NAV'}catch{return false}};
const destination=q=>clean(q).replace(/^\s*(?:please\s+)?(?:give me directions? to|take me to|take me|navigate me to|directions? to|navigate to|go to|open maps? for)\s+/i,'');
const openMap=place=>{const target=clean(place);if(!target)return;try{window.jarvisContextEngine?.set?.({domain:'MAPS',location:target,query:target,results:null,selected:null},'merge')}catch{}const nav=document.querySelector('.nav[data-app="maps"]');if(nav instanceof HTMLElement&&!nav.classList.contains('selected'))nav.click();let tries=0;const go=()=>{const input=document.querySelector('#mapQuery');if(input instanceof HTMLInputElement){input.value=target;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));try{window.dispatchEvent(new CustomEvent('jarvis:map-intent',{detail:{place:target,query:target,source:'command-submit-recovery-v1'},cancelable:true}))}catch{}reply(`Opening Maps for ${target}.`);return}if(++tries<100)window.setTimeout(go,50)};window.setTimeout(go,0)};
const handle=q=>{q=clean(q);if(!q)return false;if(time(q)){reply(`The local time is ${new Intl.DateTimeFormat([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())}.`);return true}if(name(q)){reply('Your name is Shivashis.');return true}if(note(q)){const text=noteText(q);const nav=document.querySelector('.nav[data-app="notes"]');if(nav instanceof HTMLElement&&!nav.classList.contains('selected'))nav.click();window.setTimeout(()=>window.dispatchEvent(new CustomEvent('jarvis:create-note',{detail:{text,source:'command-submit-recovery-v1'}})),0);reply(`Saved note: ${text}`);return true}if(mapNav(q)){openMap(destination(q));return true}return false};
const submit=e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const i=f.querySelector('#commandInput');const q=i instanceof HTMLInputElement?i.value:'';if(!handle(q))return;e.preventDefault();e.stopImmediatePropagation()};
const voice=e=>{const q=clean(e.detail?.text);if(!handle(q))return;e.preventDefault?.();e.stopImmediatePropagation?.()};
window.addEventListener('submit',submit,true);document.addEventListener('submit',submit,true);window.addEventListener('jarvis:voice-command',voice,true);
})();
