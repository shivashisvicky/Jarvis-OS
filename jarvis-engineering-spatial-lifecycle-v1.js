(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_LIFECYCLE_V1__)return;
window.__JARVIS_SPATIAL_LIFECYCLE_V1__=true;
const trace=(step,data={})=>{try{window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{stage:'SPATIAL_LIFECYCLE',step,...data}}))}catch{}};
let loading=false,loaded=false,retried=false;
// Compatibility guard for the current Spatial planner's finally-scope timer reference.
if(typeof window.timer==='undefined')window.timer=0;
const init=()=>{
 const bay=document.getElementById('jarvisEngineeringBay');
 const pane=bay?.querySelector('[data-pane="spatial"]');
 if(!bay||!pane||loaded||loading)return;
 loading=true;trace('BAY_SPATIAL_READY');
 const s=document.createElement('script');
 s.src='./jarvis-engineering-spatial-ai-v1.js?v=20260912-engineering-spatial-ai-v6';
 s.async=false;
 const runtimeError=e=>{
  const file=String(e?.filename||'');
  if(file&&!/jarvis-engineering-spatial-ai-v1\.js/i.test(file))return;
  trace('SPATIAL_AI_RUNTIME_ERROR',{message:String(e?.message||e||'unknown'),line:Number(e?.lineno||0),column:Number(e?.colno||0)});
 };
 const rejection=e=>{trace('SPATIAL_AI_UNHANDLED_REJECTION',{message:String(e?.reason?.message||e?.reason||'unknown')})};
 window.addEventListener('error',runtimeError);
 window.addEventListener('unhandledrejection',rejection);
 const cleanup=()=>{window.removeEventListener('error',runtimeError);window.removeEventListener('unhandledrejection',rejection)};
 const check=()=>{
  if(typeof window.jarvisSpatial?.run==='function'){
   loaded=true;cleanup();trace('SPATIAL_AI_SCRIPT_LOADED');trace('SPATIAL_ENGINE_READY');return;
  }
  if(!retried){
   retried=true;
   try{delete window.__JARVIS_SPATIAL_AI_V1__}catch{}
   trace('SPATIAL_AI_INIT_RETRY');
   setTimeout(init,0);
   return;
  }
  loaded=true;cleanup();trace('SPATIAL_AI_INIT_FAILED');
 };
 s.onload=()=>{loading=false;setTimeout(check,0)};
 s.onerror=()=>{loading=false;cleanup();loaded=true;trace('SPATIAL_AI_SCRIPT_ERROR')};
 document.head.appendChild(s);
};
new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});
init();
})();
