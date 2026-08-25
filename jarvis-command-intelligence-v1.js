(()=>{
'use strict';
if(window.__JARVIS_COMMAND_INTELLIGENCE_V4__)return;
window.__JARVIS_COMMAND_INTELLIGENCE_V4__=true;
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const strip=s=>normalize(s).replace(/^["'“”‘’]+|["'“”‘’]+$/g,'').replace(/[.!?]+$/,'').trim();
let lastChoice=null;
const owned=q=>{try{return window.jarvisCommandAuthority?.route(q)?.type==='CHOICE'}catch{return false}};
const speak=text=>{const el=document.querySelector('#jarvisReply');if(el){el.textContent=text;el.classList.add('visible')}window.setTimeout(()=>{try{(window.jarvisVoiceAuthoritySpeak||window.jarvisCinematicSpeak||window.jarvisSpeak)?.(text)}catch{}},140)};
const hasSearchIntent=q=>{const s=normalize(q).toLowerCase();return /\b(search|look\s+up|find|show\s+me|browse|browser|internet|web|google|bing|search\s+for)\b/i.test(s)||/\b(?:on|from)\s+the\s+(?:internet|web)\b/i.test(s)};
const choice=q=>{if(!owned(q)||hasSearchIntent(q))return false;const clean=normalize(q).replace(/[.!?]+$/,'');const m=clean.match(/^(?:please\s+)?(?:pick|choose|select)(?:\s+one|\s+one of|\s+between)?\s+(.+?)\s+(?:or|versus|vs\.?|\/)\s+(.+)$/i)||clean.match(/^([^,]{1,48}?)\s+(?:or|versus|vs\.?|\/)\s+([^,]{1,48})$/i);if(!m)return false;const a=strip(m[1]),b=strip(m[2]);if(!a||!b||a.length>80||b.length>80)return false;const picked=Math.random()<.5?a:b;lastChoice={picked,other:picked===a?b:a};speak(`I choose ${picked}.`);return true};
const isChoiceFollowUp=q=>{const s=normalize(q).toLowerCase().replace(/[.!?]+$/,'');if(!lastChoice||!s||hasSearchIntent(s))return false;if(/^(why|why did you|why have you|what made you|what was your reason|was there a reason|any (specific )?reason|what(?:'s| is) the reason|how did you decide|how did you choose|why that one|why this one|why (?:the )?(?:one|choice))\b/.test(s))return true;return new RegExp(`\\b${lastChoice.picked.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`,'i').test(s)&&/\b(why|reason|decid|choose|pick|made)\b/i.test(s)};
const why=q=>{if(!isChoiceFollowUp(q))return false;speak(`I chose ${lastChoice.picked}. There is no special reason, I simply picked it this time.`);return true};
const handle=q=>{q=normalize(q);if(!q)return false;if(!owned(q))return false;if(choice(q))return true;if(why(q))return true;return false};
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const i=f.querySelector('#commandInput');const q=i instanceof HTMLInputElement?i.value:'';if(handle(q)){e.preventDefault();e.stopImmediatePropagation();if(i instanceof HTMLInputElement)i.value='';i?.dispatchEvent(new Event('input',{bubbles:true}))}},true);
window.addEventListener('jarvis:voice-command',e=>{if(handle(e.detail?.text)){e.preventDefault?.();e.stopImmediatePropagation?.()}},true);
})();
