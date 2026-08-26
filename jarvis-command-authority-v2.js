(()=>{
'use strict';
if(window.__JARVIS_COMMAND_AUTHORITY_V10__)return;
window.__JARVIS_COMMAND_AUTHORITY_V10__=true;

const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
const route=q=>{
 const s=clean(q).toLowerCase().replace(/[.!?]+$/,'').trim();
 const entity=window.__JARVIS_ENTITY__;
 const ctx=window.jarvisContextEngine?.get?.();
 const ref=(()=>{try{
   const direct=window.jarvisContextEngine?.resolveReference?.(s);
   if(direct?.matched)return direct;
   const stripped=s.replace(/^(?:open|read|show|select|choose|play|watch)\s+/,'').trim();
   return stripped!==s?window.jarvisContextEngine?.resolveReference?.(stripped):direct;
 }catch{return null}})();
 if(!s)return {type:'EMPTY',owner:null};

 // 1. Explicit commands own the route before broad semantic fallbacks.
 if(/^(?:please\s+)?(?:search|look\s*up|lookup|google|bing|web\s+search)\b[\s\S]*/.test(s)||/\b(?:search|look\s+up|browse|google|bing|internet|web|search\s+for)\b[\s\S]*\b(?:internet|web|online)\b/.test(s))return {type:'SEARCH',owner:'search-runtime'};
 if(/\b(?:tell|give|make)\s+me\s+(?:a\s+)?joke\b|\bmake\s+me\s+laugh\b/.test(s))return {type:'CONVERSATION',owner:'jarvis-conversational-choice-authority-v1.js'};
 if(/^(?:nice|good|great|awesome|cool|perfect|brilliant|haha+|lol+|lmao+|thanks|thank you|thx)$/.test(s))return {type:'CONVERSATION',owner:'jarvis-context-intelligence-v2.js'};

 // Maps: explicit POI/search and navigation commands outrank generic place semantics.
 const poiWords='restaurants?|resturants?|restaraunts?|restaurents?|restuarants?|caf(?:e|es)|hospitals?|pharmacies?|hotels?|schools?|banks?|atms?|petrol(?:\\s+stations?)?|fuel|gyms?|supermarkets?|temples?';
 const explicitPoi=new RegExp('\\b(?:show\\s+me|show|find|locate|where\\s+are|look\\s+for)\\b[\\s\\S]*\\b(?:'+poiWords+')\\b[\\s\\S]*\\b(?:in|near|around|at|to)\\b').test(s);
 const contextualPoi=new RegExp('^(?:please\\s+)?(?:show\\s+me|show|find|locate|where\\s+are|look\\s+for)\\s+(?:'+poiWords+')\\s+(?:there|here|nearby|around\\s+there)$').test(s);
 if(explicitPoi||(contextualPoi&&ctx?.active&&ctx?.location))return {type:'MAP_POI',owner:'jarvis-command-final-routing-v2.js',context:ctx?.location||null};
 if(/^(?:please\s+)?(?:give me directions? to|take me to|take me|navigate me to|navigate to|directions? to|go to|open maps? for)\s+.+/.test(s))return {type:'MAP_NAV',owner:'jarvis-command-deterministic-fix-v1.js'};
 const geographicPlace=/^(?:find|locate|where is|where's|show me)\s+(?:the\s+)?[a-z0-9][a-z0-9 .'-]{1,80}\b(?:nagar|nagara|road|street|st|lane|avenue|ave|colony|layout|sector|phase|chowk|square|market|bazaar|bazar|vihar|puram|pally|palli|gaon|guda|town|city|village|district|junction|jct|temple|mandir|park|airport|station)\s*$/i.test(s);
 const bareGeographicPlace=/^[a-z0-9][a-z0-9 .'-]{1,80}\b(?:nagar|nagara|road|street|st|lane|avenue|ave|colony|layout|sector|phase|chowk|square|market|bazaar|bazar|vihar|puram|pally|palli|gaon|guda|town|city|village|district|junction|jct|temple|mandir|park|airport|station)\s*$/i.test(s);
 if(geographicPlace||bareGeographicPlace)return {type:'MAP_NAV',owner:'jarvis-command-deterministic-fix-v1.js',entity};

 // Media/news explicit ownership before generic media language.
 if(/\b(?:youtube|yt)\b[\s\S]*\b(?:search|find|look up|play|watch|show|open|video|videos|news|music|song)\b|\b(?:search|find|look up|play|watch)\b[\s\S]*\b(?:youtube|yt)\b/.test(s))return {type:'YOUTUBE',owner:'jarvis-youtube-command-authority-v1.js'};
 if(/\b(?:news|headlines)\b/.test(s))return {type:'NEWS',owner:'news-runtime'};

 // Contextual references are resolved before generic domain routing.
 if(ref?.matched&&ctx?.active){
   const owner=ctx.domain==='BOOKS'?'jarvis-ebook-command-authority-v1.js':ctx.domain==='MAPS'?'jarvis-command-final-routing-v2.js':ctx.domain==='SEARCH'?'search-runtime':ctx.domain==='MEDIA'?'jarvis-youtube-command-authority-v1.js':'context-runtime';
   return {type:'CONTEXT_FOLLOWUP',owner,contextDomain:ctx.domain||null,reference:ref};
 }

 // High-confidence entities may claim their specialized authority.
 if(entity?.name&&entity.type==='PLACE'&&entity.score>=0.8)return {type:'MAP_NAV',owner:'jarvis-command-deterministic-fix-v1.js',entity};
 if(entity?.name&&(entity.type==='BOOK'||entity.type==='BOOK_AUTHOR')&&entity.score>=0.88)return {type:'BOOKS',owner:'jarvis-ebook-command-authority-v1.js',entity};

 // Specialized domain phrases.
 if(/\b(?:ebook|ebooks|book|books|novel|novels|gutenberg|standard ebooks|reading)\b/.test(s)&&!/^read\s+(?:my\s+)?notes?$/.test(s))return {type:'BOOKS',owner:'jarvis-ebook-command-authority-v1.js'};
 if(/\b(?:game|games|arcade|snake|tetris|2048|tic tac toe|minesweeper|memory)\b/.test(s))return {type:'GAMES',owner:'jarvis-games-mobile-fix.js'};
 if(/\b(?:weather|temperature|forecast|how hot|how cold)\b/.test(s))return {type:'WEATHER',owner:'jarvis-weather-intent-fix.js'};
 if(/\b(?:time|clock)\b/.test(s)&&(/^(?:what|tell|give|show|current|local)/.test(s)||/\bwhat time is it\b/.test(s)))return {type:'TIME',owner:'jarvis-command-deterministic-fix-v1.js'};
 if(/\b(?:pick|choose|select)\b[\s\S]*\b(?:or|versus|vs\.?|\/)\b/.test(s)||/^.{1,48}\s+(?:or|versus|vs\.?|\/)\s+.{1,48}$/.test(s))return {type:'CHOICE',owner:'jarvis-command-intelligence-v1.js'};
 if(/\b(?:play|watch|video|music|song|movie)\b/.test(s))return {type:'MEDIA',owner:'jarvis-youtube-command-authority-v1.js'};
 if(/\b(?:search|look up|browse|google|bing|internet|web|search for)\b/.test(s))return {type:'SEARCH',owner:'search-runtime'};

 // Deliberately do not guess BOOKS for arbitrary "find/open/read" commands.
 // Ambiguous commands fall through to the intelligence layer, where entity/context
 // resolution can make a more informed decision instead of hijacking the request.
 return {type:'CONVERSATION_OR_INTELLIGENCE',owner:'intelligence-runtime',entity};
};

const snapshot=q=>{const r=route(q);window.__JARVIS_COMMAND_ROUTE__={...r,text:clean(q),at:Date.now()};return window.__JARVIS_COMMAND_ROUTE__};
const observe=e=>{const text=clean(e.detail?.text);if(text)snapshot(text)};
window.jarvisCommandAuthority=Object.freeze({version:'10.0.0',route:snapshot,get:()=>({...window.__JARVIS_COMMAND_ROUTE__})});
window.addEventListener('jarvis:voice-command',observe,true);
document.addEventListener('submit',e=>{const f=e.target;if(!(f instanceof HTMLFormElement)||f.id!=='commandForm')return;const i=f.querySelector('#commandInput');if(i instanceof HTMLInputElement)snapshot(i.value)},true);
})();
