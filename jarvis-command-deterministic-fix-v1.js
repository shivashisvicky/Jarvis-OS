(()=>{
'use strict';
if(window.__JARVIS_COMMAND_DETERMINISTIC_FIX_V1__)return;
window.__JARVIS_COMMAND_DETERMINISTIC_FIX_V1__=true;

const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const reply=text=>{
  const el=document.querySelector('#jarvisReply');
  if(el){el.textContent=text;el.classList.add('visible');}
  try{if(typeof window.jarvisSpeak==='function')window.jarvisSpeak(text);else if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-GB';u.rate=1.05;u.pitch=.54;speechSynthesis.speak(u)}}catch{}
};
const timeCommand=q=>/^(?:please\s+)?(?:what(?:'s| is|s)\s+)?(?:the\s+)?(?:time|clock)(?:\s+(?:is it|right now|now))?[?.!]*$/i.test(q)||/^what time is it[?.!]*$/i.test(q);
const choiceCommand=q=>/^(?:please\s+)?(?:pick|choose)\s+(?:one|one of)?\s*(?:the\s+)?(?:red|blue)\s*(?:or|\/|and)\s*(?:the\s+)?(?:red|blue)[?.!]*$/i.test(q);
const mapCommand=q=>/^(?:please\s+)?(?:take me to|take me|navigate me to|navigate to|directions? to|go to|open maps? for)\s+.+$/i.test(q);
const destination=q=>q.replace(/^\s*(?:please\s+)?(?:take me to|take me|navigate me to|navigate to|directions? to|go to|open maps? for)\s+/i,'').trim();
const speakTime=()=>{const text=`The local time is ${new Intl.DateTimeFormat([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date())}.`;reply(text)};
const choose=q=>{const m=q.match(/\b(red|blue)\b/gi)||[];const options=[...new Set(m.map(x=>x.toLowerCase()))];const pick=options.includes('blue')?'Blue':options[0]?options[0][0].toUpperCase()+options[0].slice(1):'Blue';reply(`I pick ${pick}.`)};
const openMap=async q=>{
 const place=destination(q);
 try{window.speechSynthesis?.cancel();window.jarvisStopIOSVoice?.();window.jarvisStopAllVoiceSessions?.()}catch{}
 const nav=document.querySelector('.nav[data-app="maps"]');
 if(nav instanceof HTMLElement&&!nav.classList.contains('selected'))nav.click();
 let tries=0;
 const wait=()=>{const input=document.querySelector('#mapQuery');if(input instanceof HTMLInputElement){input.value=place;input.dispatchEvent(new Event('input',{bubbles:true}));window.setTimeout(()=>window.dispatchEvent(new CustomEvent('jarvis:map-intent',{detail:{place,query:place,source:'deterministic-map-fix'},cancelable:true})),60);return}if(++tries<80)window.setTimeout(wait,50)};
 window.setTimeout(wait,50);
 reply(`Opening Maps for ${place}.`);
};
const handle=q=>{q=clean(q);if(!q)return false;if(timeCommand(q)){speakTime();return true}if(choiceCommand(q)){choose(q);return true}if(mapCommand(q)){void openMap(q);return true}return false};

document.addEventListener('submit',event=>{const form=event.target;if(!(form instanceof HTMLFormElement)||form.id!=='commandForm')return;const input=form.querySelector('#commandInput');const q=input instanceof HTMLInputElement?input.value:'';if(!handle(q))return;event.preventDefault();event.stopImmediatePropagation()},true);
window.addEventListener('jarvis:voice-command',event=>{const q=clean(event.detail?.text);if(!handle(q))return;event.preventDefault();event.stopImmediatePropagation()},true);
})();
