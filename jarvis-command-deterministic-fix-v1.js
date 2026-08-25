(()=>{
'use strict';
if(window.__JARVIS_COMMAND_DETERMINISTIC_FIX_V3__)return;
window.__JARVIS_COMMAND_DETERMINISTIC_FIX_V3__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const authority=q=>{try{return window.jarvisCommandAuthority?.route(q)?.type||'UNKNOWN'}catch{return 'UNKNOWN'}};
const reply=text=>{const el=document.querySelector('#jarvisReply');if(el){el.textContent=text;el.classList.add('visible')}try{if(typeof window.jarvisSpeak==='function')window.jarvisSpeak(text);else if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=1.05;u.pitch=.54;speechSynthesis.speak(u)}}catch{}};
const timeCommand=q=>authority(q)==='TIME';
const mapCommand=q=>authority(q)==='MAP_NAV';
const destination=q=>q.replace(/^\s*(?:please\s+)?(?:take me to|take me|navigate me to|directions? to|navigate to|go to|open maps? for)\s+/i,'').trim();
const openMap=async place=>{try{window.speechSynthesis?.cancel();window.jarvisStopIOSVoice?.();window.jarvisStopAllVoiceSessions?.()}catch{}const nav=document.querySelector('.nav[data-app="maps"]');if(nav instanceof HTMLElement&&!nav.classList.contains('selected'))nav.click();let tries=0;const wait=()=>{const input=document.querySelector('#mapQuery');if(input instanceof HTMLInputElement){input.value=place;input.dispatchEvent(new Event('input',{bubbles:true}));window.setTimeout(()=>window.dispatchEvent(new CustomEvent('jarvis:map-intent',{detail:{place,query:place,source:'deterministic-map-fix'},cancelable:true})),60);return}if(++tries<80)window.setTimeout(wait,50)};window.setTimeout(wait,50);reply(`Opening Maps for ${place}.`)};
const handle=q=>{q=clean(q);if(!q)return false;if(timeCommand(q)){reply(`The local time is ${new Intl.DateTimeFormat([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())}.`);return true}if(mapCommand(q)){void openMap(destination(q));return true}return false};
document.addEventListener('submit',event=>{const form=event.target;if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;const input=form.querySelector('#commandInput');const q=input instanceof HTMLInputElement?input.value:'';if(!handle(q))return;event.preventDefault();event.stopImmediatePropagation()},true);
window.addEventListener('jarvis:voice-command',event=>{const q=clean(event.detail?.text);if(!handle(q))return;event.preventDefault();event.stopImmediatePropagation()},true);
})();