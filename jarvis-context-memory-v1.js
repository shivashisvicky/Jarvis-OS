(()=>{
'use strict';
if(window.__JARVIS_CONTEXT_MEMORY_V1__)return;
window.__JARVIS_CONTEXT_MEMORY_V1__=true;
const KEY='JARVIS_CONTEXT_MEMORY_V1';
const clean=s=>String(s??'').replace(/\s+/g,' ').trim();
const canon=v=>clean(String(v??'').split('|')[0]);
const load=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'{}')}catch{return {}}};
const save=x=>{try{sessionStorage.setItem(KEY,JSON.stringify(x))}catch{}};
const state=load();
const api={
 get:()=>({...state,selected:state.selected?{...state.selected}:null,results:Array.isArray(state.results)?state.results.slice():[]}),
 clear:()=>{Object.keys(state).forEach(k=>delete state[k]);save(state)},
 set:(patch,mode='replace')=>{const next=mode==='merge'?{...state,...patch}:{...patch};Object.keys(state).forEach(k=>delete state[k]);Object.assign(state,next);save(state);window.dispatchEvent(new CustomEvent('jarvis:context-updated',{detail:api.get()}));return api.get()},
 rememberResult:(result)=>{if(!result)return api.get();const entity={name:canon(result.name||result.title||result.display_name),type:clean(result.type||result.category||''),address:clean(result.address||result.display_name||'')};if(!entity.name)return api.get();state.selected=entity;save(state);window.dispatchEvent(new CustomEvent('jarvis:context-updated',{detail:api.get()}));return api.get()},
 rememberResults:(results,meta={})=>{const list=(Array.isArray(results)?results:[]).map(r=>({name:canon(r?.name||r?.title||r?.display_name),type:clean(r?.type||r?.category||''),address:clean(r?.address||r?.display_name||''),lat:r?.lat??r?.latitude??null,lon:r?.lon??r?.lng??r?.longitude??null})).filter(r=>r.name);state.domain=clean(meta.domain||state.domain||'');state.query=clean(meta.query||state.query||'');state.location=clean(meta.location||state.location||'');state.results=list;state.selected=list[0]||state.selected||null;save(state);window.dispatchEvent(new CustomEvent('jarvis:context-updated',{detail:api.get()}));return api.get()},
 rememberSpeech:(text)=>{const t=clean(text);if(t)state.lastSpeech=t;save(state);return api.get()}
};
window.jarvisContextMemory=api;
window.jarvisContextEngine=window.jarvisContextEngine||api;
window.addEventListener('jarvis:map-results',e=>{const d=e.detail||{};api.rememberResults(d.results||[],{domain:'MAPS',query:d.query||d.keyword||'',location:d.location||''})});
window.addEventListener('jarvis:map-selected',e=>{api.rememberResult(e.detail?.result||e.detail)});
window.addEventListener('jarvis:assistant-response',e=>{api.rememberSpeech(e.detail?.text||e.detail?.response||'')});
})();
