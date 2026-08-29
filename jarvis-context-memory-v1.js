(()=>{
'use strict';
if(window.__JARVIS_CONTEXT_MEMORY_V2__)return;
window.__JARVIS_CONTEXT_MEMORY_V2__=true;
const KEY='JARVIS_CONTEXT_MEMORY_V1';
const TTL=30*60*1000;
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const canon=v=>clean(String(v??'').split('|')[0]);
const clone=v=>{try{return structuredClone(v)}catch{return v}};
const load=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch{return {}}};
const save=x=>{try{sessionStorage.setItem(KEY,JSON.stringify(x))}catch{}};
const state=load();
const expired=x=>!x?.savedAt||Date.now()-Number(x.savedAt)>TTL;
if(expired(state)){Object.keys(state).forEach(k=>delete state[k]);save(state)}
const normalizeResult=r=>{if(!r)return null;const name=canon(r.name||r.title||r.display_name);if(!name)return null;return {...clone(r),name,type:clean(r.type||r.category||''),address:clean(r.address||r.display||r.display_name||'')};};
const normalizeEntity=e=>{if(!e)return null;const name=canon(e.name||e.title||e.display_name);return name?{...clone(e),name,type:clean(e.type||e.category||''),address:clean(e.address||e.display||e.display_name||'')}:null};
const snapshot=()=>({...clone(state),selected:normalizeResult(state.selected),results:Array.isArray(state.results)?state.results.map(normalizeResult).filter(Boolean):[]});
const emit=()=>window.dispatchEvent(new CustomEvent('jarvis:context-memory-updated',{detail:snapshot()}));
const persistContext=ctx=>{if(!ctx||!ctx.domain)return snapshot();state.domain=clean(ctx.domain);state.intent=clean(ctx.intent||'');state.entity=normalizeEntity(ctx.entity);state.query=clean(ctx.query||'');state.location=clone(ctx.location||null);state.results=Array.isArray(ctx.results)?ctx.results.map(normalizeResult).filter(Boolean):[];state.selected=normalizeResult(ctx.selected);state.savedAt=Date.now();save(state);emit();return snapshot()};
const api={
 get:snapshot,
 clear:()=>{Object.keys(state).forEach(k=>delete state[k]);save(state);emit()},
 set:(patch,mode='replace')=>{const next=mode==='merge'?{...state,...patch}:{...patch};Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,next,{savedAt:Date.now()});save(state);emit();return snapshot()},
 rememberResult:r=>{const x=normalizeResult(r);if(!x)return snapshot();state.selected=x;state.savedAt=Date.now();save(state);emit();return snapshot()},
 rememberResults:(results,meta={})=>persistContext({domain:meta.domain||state.domain,query:meta.query||state.query,location:meta.location||state.location,results,selected:Array.isArray(results)?results[0]:null}),
 rememberSpeech:text=>{const t=clean(text);if(t){state.lastSpeech=t;state.savedAt=Date.now();save(state)}return snapshot()},
 resolveReference:text=>{const q=clean(text).toLowerCase().replace(/[?.!]+$/,'');if(expired(state))return {matched:false,reason:'expired'};const list=Array.isArray(state.results)?state.results:[];const idx=/^(?:the\s+)?(?:first|1(?:st)?|one)(?:\s+(?:one|result|place|book|video))?$/.test(q)?0:/^(?:the\s+)?(?:second|2(?:nd)?|two)(?:\s+(?:one|result|place|book|video))?$/.test(q)?1:/^(?:the\s+)?(?:third|3(?:rd)?|three)(?:\s+(?:one|result|place|book|video))?$/.test(q)?2:null;if(idx!==null)return {matched:!!list[idx],type:'RESULT',index:idx,value:list[idx]||null,domain:state.domain};if(/^(?:there|here|that place|that location)$/.test(q)&&state.location)return {matched:true,type:'LOCATION',value:clone(state.location),domain:state.domain};if(/^(?:it|that|this|that one|this one)$/.test(q)&&state.selected)return {matched:true,type:'ENTITY',value:normalizeResult(state.selected),domain:state.domain};return {matched:false,reason:'unresolved'};}
};
window.jarvisContextMemory=api;
const engine=window.jarvisContextEngine;
if(engine&&!engine.__JARVIS_CONTEXT_MEMORY_BRIDGED__){
 engine.__JARVIS_CONTEXT_MEMORY_BRIDGED__=true;
 const originalSet=engine.set,originalClear=engine.clear,originalGet=engine.get,originalResolve=engine.resolveReference;
 engine.set=(patch,mode='merge')=>{const result=originalSet.call(engine,patch,mode);persistContext(engine.get());return result};
 engine.clear=()=>{const result=originalClear.call(engine);api.clear();return result};
 engine.get=()=>{let live=null;try{live=originalGet.call(engine)}catch{};if(live?.active&&Array.isArray(live.results)&&live.results.length)return live;const saved=api.get();if(saved?.domain&&Array.isArray(saved.results)&&saved.results.length)return {...saved,active:true,updatedAt:saved.savedAt||Date.now()};return live};
 engine.resolveReference=text=>{const live=engine.get();if(live?.active&&Array.isArray(live.results)&&live.results.length){const q=clean(text).toLowerCase().replace(/[?.!]+$/,'');const idx=/^(?:the\s+)?(?:first|1(?:st)?|one)(?:\s+(?:one|result|place|book|video))?$/.test(q)?0:/^(?:the\s+)?(?:second|2(?:nd)?|two)(?:\s+(?:one|result|place|book|video))?$/.test(q)?1:/^(?:the\s+)?(?:third|3(?:rd)?|three)(?:\s+(?:one|result|place|book|video))?$/.test(q)?2:/^(?:the\s+)?last(?:\s+(?:one|result|place|book|video))?$/.test(q)?live.results.length-1:null;if(idx!==null)return {matched:!!live.results[idx],type:'RESULT',index:idx,value:live.results[idx]||null,domain:live.domain};}try{return originalResolve.call(engine,text)}catch{return {matched:false,reason:'unresolved'}}};
 if(!engine.isActive?.()&&state.domain&&!expired(state)){try{originalSet.call(engine,{domain:state.domain,intent:state.intent||null,entity:state.entity,query:state.query||null,location:state.location||null,results:state.results||null,selected:state.selected||null},'replace')}catch{}}
}
window.addEventListener('jarvis:map-context',e=>{const d=e.detail||{};persistContext({domain:'MAPS',query:d.query||'',location:d.location||d.place||'',results:d.results||[],selected:d.selected||null})});
window.addEventListener('jarvis:search-context',e=>{const d=e.detail||{};persistContext({domain:'SEARCH',query:d.query||'',results:d.results||[],selected:d.selected||null})});
window.addEventListener('jarvis:ebook-context',e=>{const d=e.detail||{};persistContext({domain:'BOOKS',entity:d.entity||null,query:d.query||'',results:d.results||[],selected:d.selected||null})});
window.addEventListener('jarvis:entity-resolved',e=>{const d=e.detail||{};persistContext({domain:d.type||d.domain||state.domain,entity:d.entity||null,query:d.query||state.query,results:state.results||[],selected:state.selected||null,location:state.location||null})});
window.addEventListener('jarvis:assistant-response',e=>api.rememberSpeech(e.detail?.text||e.detail?.response||''));
})();
