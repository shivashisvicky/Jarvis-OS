(()=>{
'use strict';
if(window.__JARVIS_COMMAND_AUTHORITY_V14__)return;
window.__JARVIS_COMMAND_AUTHORITY_V14__=true;
const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const route=q=>{
 const s=clean(q).toLowerCase().replace(/[.!?]+$/,'').trim();
 const entity=window.__JARVIS_ENTITY__;
 const ctx=window.jarvisContextEngine?.get?.();
 const ref=(()=>{try{const d=window.jarvisContextEngine?.resolveReference?.(s);if(d?.matched)return d;const x=s.replace(/^(?:open|read|show|select|choose|play|watch)\s+/,'').trim();return x!==s?window.jarvisContextEngine?.resolveReference?.(x):d}catch{return null}})();
 if(!s)return {type:'EMPTY',owner:null};
 if(/\b(?:what(?:'s| is|s)\s+my\s+name|who\s+am\s+i)\b/.test(s))return {type:'NAME',owner:'command-runtime'};
 if(/\b(?:make\s+(?:me\s+)?a\s+note|make\s+note|write\s+(?:me\s+)?a\s+note|remember\s+to|remind\s+me)\b/.test(s))return {type:'NOTES',owner:'notes-runtime'};
 if(/\b(?:search|find|look\s+up|lookup|show(?:\s+me)?|open)\b[\s\S]*\b(?:ebook|ebooks|book|books|novel|novels|gutenberg|standard\s+ebooks?)\b|\b(?:ebook|ebooks|book|books|novel|novels|gutenberg|standard\s+ebooks?)\b[\s\S]*\b(?:search|find|look\s+up|lookup)\b/.test(s))return {type:'BOOKS',owner:'jarvis-ebook-command-authority-v1.js'};
 const poiWords='restaurants?|resturants?|restaraunts?|restaurents?|restuarants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|atms?|banks?|petrol(?:\\s+stations?)?|fuel|gyms?|supermarkets?|temples?';
 const explicitPoi=new RegExp('\\b(?:show\\s+me|show|find|locate|where\\s+are|look\\s+for)\\b[\\s\\S]*\\b(?:'+poiWords+')\\b[\\s\\S]*\\b(?:in|near|around|at|to)\\b').test(s);
 const contextualPoi=new RegExp('^(?:please\\s+)?(?:show\\s+me|show|find|locate|where\\s+are|look\\s+for)\\s+(?:'+poiWords+')\\s+(?:there|here|nearby|around\\s+there)$').test(s);
 if(explicitPoi||(contextualPoi&&ctx?.active&&ctx?.location))return {type:'MAP_POI',owner:'jarvis-command-final-routing-v2.js',context:ctx?.location||null};
 if(/^(?:please\s+)?(?:give me directions? to|take me to|take me|navigate me to|directions? to|navigate to|go to|open maps? for)\s+.+/.test(s))return {type:'MAP_NAV',owner:'jarvis-command-deterministic-fix-v1.js'};
 const geographicPlace=/^(?:find|locate|where is|where's|show me)\s+(?:the\s+)?[a-z0-9][a-z0-9 .'-]{1,80}\b(?:nagar|nagara|road|street|st|lane|avenue|ave|colony|layout|sector|phase|chowk|square|market|bazaar|bazar|vihar|puram|pally|palli|gaon|guda|town|city|village|district|junction|jct|temple|mandir|park|airport|station)\s*$/i.test(s);
 const bareGeographicPlace=/^[a-z0-9][a-z0-9 .'-]{1,80}\b(?:nagar|nagara|road|street|st|lane|avenue|ave|colony|layout|sector|phase|chowk|square|market|bazaar|bazar|vihar|puram|pally|palli|gaon|guda|town|city|village|district|junction|jct|temple|mandir|park|airport|station)\s*$/i.test(s);
 if(geographicPlace||bareGeographicPlace)return {type:'MAP_NAV',owner:'jarvis-command-deterministic-fix-v1.js',entity};
 /* PLAY/WATCH is intrinsically a media command even when the user does not say YouTube. */
 if(/^(?:please\s+)?(?:play|watch)\s+.+/.test(s))return {type:'YOUTUBE',owner:'jarvis-youtube-command-authority-v1.js'};
 if(/\b(?:youtube|yt)\b[\s\S]*\b(?:search|find|look up|play|watch|show|open|video|videos|news|music|song)\b|\b(?:search|find|look up|play|watch)\b[\s\S]*\b(?:youtube|yt)\b/.test(s))return {type:'YOUTUBE',owner:'jarvis-youtube-command-authority-v1.js'};
 if(/\b(?:news|headlines)\b/.test(s))return {type:'NEWS',owner:'news-runtime'};
 if(/^(?:what(?:'s| is|s)\s+)?(?:the\s+)?(?:current\s+|local\s+)?time(?:\s+now)?$/.test(s)||/^(?:tell|give|show)\s+(?:me\s+)?(?:the\s+)?(?:current\s+|local\s+)?time(?:\s+now)?$/.test(s))return {type:'TIME',owner:'jarvis-command-deterministic-fix-v1.js'};
 if(/\b(?:weather|temperature|forecast|how hot|how cold)\b/.test(s))return {type:'WEATHER',owner:'jarvis-weather-intent-fix.js'};
 if(/\b(?:date|today|day)\b/.test(s)&&(/^(?:what|tell|give|show|current|today)/.test(s)))return {type:'DATE',owner:'command-runtime'};
 if(/\b(?:calculator|calculate|math|compute)\b/.test(s))return {type:'CALCULATOR',owner:'command-runtime'};
 if(/\b(?:game|games|arcade|snake|tetris|2048|tic tac toe|minesweeper|memory)\b/.test(s))return {type:'GAMES',owner:'jarvis-games-mobile-fix.js'};
 if(/\b(?:media|movie)\b/.test(s))return {type:'MEDIA',owner:'jarvis-youtube-command-authority-v1.js'};
 if(ref?.matched&&ctx?.active){const owner=ctx.domain==='BOOKS'?'jarvis-ebook-command-authority-v1.js':ctx.domain==='MAPS'?'jarvis-command-final-routing-v2.js':ctx.domain==='SEARCH'?'search-runtime':ctx.domain==='MEDIA'?'jarvis-youtube-command-authority-v1.js':'context-runtime';return {type:'CONTEXT_FOLLOWUP',owner,contextDomain:ctx.domain||null,reference:ref};}
 const entityTarget=s.replace(/^(?:open|read|show|select|choose|play|watch)\s+/,'').trim();
 const exactEntity=Boolean(entity?.name&&entityTarget===clean(entity.name).toLowerCase());
 if(exactEntity&&entity.type==='PLACE'&&entity.score>=0.8)return {type:'MAP_NAV',owner:'jarvis-command-deterministic-fix-v1.js',entity};
 if(exactEntity&&entity&&(entity.type==='BOOK'||entity.type==='BOOK_AUTHOR')&&entity.score>=0.88)return {type:'BOOKS',owner:'jarvis-ebook-command-authority-v1.js',entity};
 if(/\b(?:ebook|ebooks|book|books|novel|novels|gutenberg|standard ebooks|reading)\b/.test(s)&&!/^read\s+(?:my\s+)?notes?$/.test(s))return {type:'BOOKS',owner:'jarvis-ebook-command-authority-v1.js'};
 if(/^\s*(?:search|look\s*up|lookup|google|bing|web\s+search)\b/.test(s)||/\b(?:search|look\s+up|browse|google|bing|internet|web|search\s+for)\b[\s\S]*\b(?:internet|web|online)\b/.test(s)||/\b(?:search|look up|browse|google|bing|internet|web|search for)\b/.test(s))return {type:'SEARCH',owner:'search-runtime'};
 if(/\b(?:pick|choose|select)\b[\s\S]*\b(?:or|versus|vs\.?|\/)\b/.test(s)||/^.{1,48}\s+(?:or|versus|vs\.?|\/)\s+.{1,48}$/.test(s))return {type:'CHOICE',owner:'jarvis-command-intelligence-v1.js'};
 return {type:'CONVERSATION_OR_INTELLIGENCE',owner:'intelligence-runtime',entity};
};
const snapshot=q=>{const r=route(q);window.__JARVIS_COMMAND_ROUTE__={...r,text:clean(q),at:Date.now()};return window.__JARVIS_COMMAND_ROUTE__};
window.jarvisCommandAuthority=Object.freeze({version:'14.0.0',route:snapshot,get:()=>({...window.__JARVIS_COMMAND_ROUTE__})});
window.addEventListener('jarvis:voice-command',e=>{const text=clean(e.detail?.text);if(text)snapshot(text)},true);
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const i=f.querySelector('#commandInput');if(i instanceof HTMLInputElement)snapshot(i.value)},true);
})();
