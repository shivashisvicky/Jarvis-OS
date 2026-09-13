(()=>{
'use strict';
if(window.__JARVIS_SPATIAL_LIFECYCLE_V1__)return;
window.__JARVIS_SPATIAL_LIFECYCLE_V1__=true;
const trace=(step,data={})=>{try{window.dispatchEvent(new CustomEvent('jarvis:command-chain-trace',{detail:{stage:'SPATIAL_LIFECYCLE',step,...data}}))}catch{}};
let loading=false,loaded=false,started=false,waitTimer=null,waitUntil=0;
const init=()=>{
 const bay=document.getElementById('jarvisEngineeringBay');
 const pane=bay?.querySelector('[data-pane="spatial"]');
 if(!bay||!pane||loaded)return;
 if(typeof window.jarvisSpatial?.run==='function'){
  loaded=true;if(waitTimer)clearTimeout(waitTimer);trace('SPATIAL_AI_SCRIPT_LOADED');trace('SPATIAL_ENGINE_READY');return;
 }
 if(loading)return;
 loading=true;started=true;waitUntil=Date.now()+8000;trace('BAY_SPATIAL_READY');
 const s=document.createElement('script');
 s.src='./jarvis-engineering-spatial-ai-v1-safe-loader.js?v=20260913-spatial-v1-safe-loader-v2';
 s.async=false;
 const runtimeError=e=>{
  const file=String(e?.filename||'');
  if(file&&!/jarvis-engineering-spatial-ai-v1(?:-safe-loader)?\.js/i.test(file))return;
  trace('SPATIAL_AI_RUNTIME_ERROR',{message:String(e?.message||e||'unknown'),line:Number(e?.lineno||0),column:Number(e?.colno||0)});
 };
 const rejection=e=>{trace('SPATIAL_AI_UNHANDLED_REJECTION',{message:String(e?.reason?.message||e?.reason||'unknown')})};
 window.addEventListener('error',runtimeError);
 window.addEventListener('unhandledrejection',rejection);
 const cleanup=()=>{window.removeEventListener('error',runtimeError);window.removeEventListener('unhandledrejection',rejection)};
 const check=()=>{
  if(typeof window.jarvisSpatial?.run==='function'){
   loading=false;loaded=true;cleanup();trace('SPATIAL_AI_SCRIPT_LOADED');trace('SPATIAL_ENGINE_READY');return;
  }
  if(Date.now()<waitUntil){waitTimer=setTimeout(check,100);return}
  loading=false;cleanup();loaded=true;trace('SPATIAL_AI_INIT_FAILED');
 };
 s.onload=()=>{loading=false;check()};
 s.onerror=()=>{loading=false;cleanup();loaded=true;trace('SPATIAL_AI_SCRIPT_ERROR')};
 document.head.appendChild(s);
};
new MutationObserver(init).observe(document.documentElement,{childList:true,subtree:true});
init();
})();
