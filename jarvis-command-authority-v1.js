(()=>{
'use strict';
if(window.__JARVIS_COMMAND_AUTHORITY_V2__)return;
window.__JARVIS_COMMAND_AUTHORITY_V2__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const route=q=>{
 const s=clean(q).toLowerCase().replace(/[.!?]+$/,'').trim();
 if(!s)return {type:'EMPTY',owner:null};
 if(/\b(?:tell|give|make)\s+me\s+(?:a\s+)?joke\b|\bmake\s+me\s+laugh\b/.test(s))return {type:'CONVERSATION',owner:'jarvis-conversational-choice-authority-v1.js'};
 if(/^(?:nice|good|great|awesome|cool|perfect|brilliant|haha+|lol+|lmao+|thanks|thank you|thx)$/.test(s))return {type:'CONVERSATION',owner:'jarvis-context-intelligence-v2.js'};
 if(/^(?:please\s+)?(?:take me to|take me|navigate me to|navigate to|directions? to|go to|open maps? for)\s+.+/.test(s))return {type:'MAP_NAV',owner:'jarvis-command-deterministic-fix-v1.js'};
 if(/\b(?:show\s+me|show|find|locate|where are|look for)\b[\s\S]*\b(?:restaurants?|resturants?|restaraunts?|restaurents?|restuarants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\s+stations?)?|fuel|gyms?|supermarkets?|temples?)\b[\s\S]*\b(?:in|near|around|at|to)\b/.test(s))return {type:'MAP_POI',owner:'jarvis-command-final-routing-v2.js'};
 if(/\b(?:youtube|yt)\b[\s\S]*\b(?:search|find|look up|play|watch|show|open|video|videos|news|music|song)\b|\b(?:search|find|look up|play|watch)\b[\s\S]*\b(?:youtube|yt)\b/.test(s))return {type:'YOUTUBE',owner:'jarvis-youtube-command-authority-v1.js'};
 if(/\b(?:ebook|ebooks|book|books|novel|novels|gutenberg|standard ebooks|reading)\b/.test(s)&&!/^read\s+(?:my\s+)?notes?$/.test(s))return {type:'BOOKS',owner:'jarvis-ebook-command-authority-v1.js'};
 if(/\b(?:game|games|arcade|snake|tetris|2048|tic tac toe|minesweeper|memory)\b/.test(s))return {type:'GAMES',owner:'jarvis-games-mobile-fix.js'};
 if(/\b(?:weather|temperature|forecast|how hot|how cold)\b/.test(s))return {type:'WEATHER',owner:'jarvis-weather-intent-fix.js'};
 if(/\b(?:search|look up|find|browse|google|bing|internet|web|search for)\b/.test(s))return {type:'SEARCH',owner:'search-runtime'};
 if(/^(?:please\s+)?(?:what(?:'s| is|s)\s+)?(?:the\s+)?(?:time|clock)\b|\bwhat time is it\b/.test(s))return {type:'TIME',owner:'jarvis-command-deterministic-fix-v1.js'};
 if(/\b(?:pick|choose|select)\b[\s\S]*\b(?:or|versus|vs\.?|\/)\b/.test(s)||/^.{1,48}\s+(?:or|versus|vs\.?|\/)\s+.{1,48}$/.test(s))return {type:'CHOICE',owner:'jarvis-command-intelligence-v1.js'};
 if(/\b(?:play|watch|video|music|song|movie)\b/.test(s))return {type:'MEDIA',owner:'jarvis-youtube-command-authority-v1.js'};
 if(/\b(?:news|headlines)\b/.test(s))return {type:'NEWS',owner:'news-runtime'};
 return {type:'CONVERSATION_OR_INTELLIGENCE',owner:'intelligence-runtime'};
};
const snapshot=q=>{const r=route(q);window.__JARVIS_COMMAND_ROUTE__={...r,text:clean(q),at:Date.now()};return window.__JARVIS_COMMAND_ROUTE__};
const observe=e=>{const text=clean(e.detail?.text);if(text)snapshot(text)};
window.jarvisCommandAuthority=Object.freeze({version:'2.0.0',route:snapshot,get:()=>({...window.__JARVIS_COMMAND_ROUTE__})});
window.addEventListener('jarvis:voice-command',observe,true);
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const i=f.querySelector('#commandInput');if(i instanceof HTMLInputElement)snapshot(i.value)},true);
})();
