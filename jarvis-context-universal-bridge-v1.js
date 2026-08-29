(()=>{
'use strict';
if(window.__JARVIS_CONTEXT_UNIVERSAL_BRIDGE_V1__)return;
window.__JARVIS_CONTEXT_UNIVERSAL_BRIDGE_V1__=true;
const valid=c=>c&&c.active&&Array.isArray(c.results)&&c.results.length;
const memory=()=>{try{return window.jarvisContextMemory?.get?.()||null}catch{return null}};
const engine=window.jarvisContextEngine;
if(!engine)return;
const originalGet=engine.get,originalResolve=engine.resolveReference;
engine.get=()=>{let live=null;try{live=originalGet()}catch{};if(valid(live))return live;const saved=memory();if(saved?.domain&&Array.isArray(saved.results)&&saved.results.length)return {...saved,active:true,updatedAt:saved.savedAt||Date.now()};return live};
engine.resolveReference=text=>{const live=engine.get();if(valid(live)){const q=String(text||'').trim().toLowerCase().replace(/[?.!]+$/,'');const idx=/^(?:the\s+)?(?:first|1(?:st)?|one)(?:\s+(?:one|result|place|book|video))?$/.test(q)?0:/^(?:the\s+)?(?:second|2(?:nd)?|two)(?:\s+(?:one|result|place|book|video))?$/.test(q)?1:/^(?:the\s+)?(?:third|3(?:rd)?|three)(?:\s+(?:one|result|place|book|video))?$/.test(q)?2:/^(?:the\s+)?last(?:\s+(?:one|result|place|book|video))?$/.test(q)?live.results.length-1:null;if(idx!==null)return {matched:Boolean(live.results[idx]),type:'RESULT',index:idx,value:live.results[idx]||null,domain:live.domain};}try{return originalResolve.call(engine,text)}catch{return {matched:false,reason:'unresolved'}}};
})();
