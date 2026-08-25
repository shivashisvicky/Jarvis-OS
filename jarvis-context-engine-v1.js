(()=>{
'use strict';
if(window.__JARVIS_CONTEXT_ENGINE_V1__)return;
window.__JARVIS_CONTEXT_ENGINE_V1__=true;
const TTL=10*60*1000;
const state={domain:null,intent:null,entity:null,query:null,location:null,results:null,selected:null,updatedAt:0,turn:0};
const now=()=>Date.now();
const active=()=>!!state.updatedAt&&now()-state.updatedAt<TTL;
const clone=v=>{try{return structuredClone(v)}catch{return v}};
const reset=()=>{Object.assign(state,{domain:null,intent:null,entity:null,query:null,location:null,results:null,selected:null,updatedAt:now(),turn:state.turn+1})};
const setContext=(patch={},policy='merge')=>{
 if(policy==='replace') reset();
 const next={...patch};
 if(policy==='inherit'&&!active()) return false;
 Object.keys(next).forEach(k=>{if(next[k]!==undefined)state[k]=clone(next[k])});
 state.updatedAt=now(); state.turn+=1; return true;
};
const snapshot=()=>({...clone(state),active:active()});
const resolveReference=(text)=>{
 const q=String(text||'').trim().toLowerCase();
 if(!active())return {matched:false,reason:'no_context'};
 if(/^(?:the\s+)?first(?:\s+one)?$/.test(q))return {matched:!!state.results?.[0],type:'RESULT',index:0,value:state.results?.[0]||null};
 if(/^(?:the\s+)?second(?:\s+one)?$/.test(q))return {matched:!!state.results?.[1],type:'RESULT',index:1,value:state.results?.[1]||null};
 if(/^(?:the\s+)?third(?:\s+one)?$/.test(q))return {matched:!!state.results?.[2],type:'RESULT',index:2,value:state.results?.[2]||null};
 if(/^(?:the\s+)?last(?:\s+one)?$/.test(q)){const i=(state.results?.length||0)-1;return {matched:i>=0,type:'RESULT',index:i,value:i>=0?state.results[i]:null}};
 if(/^(?:there|that place|that location)$/.test(q)&&state.location)return {matched:true,type:'LOCATION',value:state.location};
 if(/^(?:it|that|this)$/.test(q)&&state.entity)return {matched:true,type:'ENTITY',value:state.entity};
 return {matched:false,reason:'unresolved'};
};
const nextPage=()=>{if(!active()||!Array.isArray(state.results))return false;state.selected=null;state.updatedAt=now();return true};
window.jarvisContextEngine={get:snapshot,set:setContext,clear:reset,resolveReference,nextPage,isActive:active};
window.addEventListener('jarvis:entity-resolved',e=>{const d=e.detail||{};setContext({domain:d.type||d.domain||null,entity:d.entity||null,query:d.query||null},'merge')});
window.addEventListener('jarvis:map-context',e=>{const d=e.detail||{};setContext({domain:'MAPS',location:d.location||d.place||null,query:d.query||null,results:d.results||null,selected:d.selected||null},'merge')});
window.addEventListener('jarvis:search-context',e=>{const d=e.detail||{};setContext({domain:'SEARCH',query:d.query||null,results:d.results||null,selected:d.selected||null},'merge')});
window.addEventListener('jarvis:ebook-context',e=>{const d=e.detail||{};setContext({domain:'BOOKS',entity:d.entity||null,query:d.query||null,results:d.results||null,selected:d.selected||null},'merge')});
window.addEventListener('jarvis:context-reset',reset);
})();
